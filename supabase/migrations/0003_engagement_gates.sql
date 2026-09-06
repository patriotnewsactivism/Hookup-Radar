-- Surge — Phase 4: premium gates, Right Now limits, boosts, streaks.
-- Applies after 0002 (referral economy). Additive; re-defines
-- surge_grant_premium with server-fixed reward amounts.
--
-- * Right Now: free users get 1 activation/24h, premium get 5/24h — enforced
--   server-side in surge_set_right_now (the client can not bypass the limit).
-- * Boosts: surge_record_boost gives +12h visibility; requires an active
--   profile (avg reliability >= 4 from met meetups) and no active boost.
-- * Rewards: surge_grant_premium now computes amounts server-side per type —
--   verified_email = 1 day, profile_complete = 3 days (verified against the
--   profile), streak = handled by surge_record_streak.

create table if not exists surge_right_now_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references surge_users(id) on delete cascade,
  started_at timestamptz not null default now()
);

create index if not exists surge_right_now_log_user_day_idx
  on surge_right_now_log (user_id, started_at);

alter table surge_right_now_log enable row level security;
create policy "users select their own right-now log"
  on surge_right_now_log for select
  using (
    exists (
      select 1 from surge_users su
      where su.id = surge_right_now_log.user_id and su.auth_id = auth.uid()
    )
  );
-- No insert/update policies: writes happen only through surge_set_right_now.

-- ─────────────────────────────────────────────────────────────
-- surge_admin_log_right_now — SECURITY INVOKER
-- ─────────────────────────────────────────────────────────────

create or replace function surge_admin_log_right_now(p_user_id uuid, p_started_at timestamptz)
returns void
language plpgsql
security invoker
as $$
begin
  insert into surge_right_now_log (user_id, started_at)
  values (p_user_id, p_started_at);
end;
$$;

revoke execute on function surge_admin_log_right_now(uuid, timestamptz) from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- surge_set_right_now — one-tap "Right Now" signal with daily limits.
-- Free: 1 activation / 24h. Premium: 5 / 24h. Timer always 2h.
-- ─────────────────────────────────────────────────────────────

create or replace function surge_set_right_now(p_active boolean)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_used bigint;
  v_limit integer;
  v_is_premium boolean;
  v_until timestamptz;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_set_right_now: profile not found';
  end if;

  v_is_premium := v_me.is_premium or (coalesce(v_me.premium_until, now()) > now());

  if not p_active then
    update surge_users set right_now_until = null where id = v_me.id;
    return jsonb_build_object('ok', true, 'active', false);
  end if;

  if v_me.right_now_until is not null and v_me.right_now_until > now() then
    return jsonb_build_object(
      'ok', true, 'active', true,
      'until', v_me.right_now_until
    );
  end if;

  select count(*) into v_used
  from surge_right_now_log
  where user_id = v_me.id and started_at >= date_trunc('day', now());

  v_limit := case when v_is_premium then 5 else 1 end;
  if v_used >= v_limit then
    return jsonb_build_object(
      'ok', false, 'reason', 'daily limit',
      'used', v_used, 'limit', v_limit
    );
  end if;

  v_until := now() + interval '2 hours';
  update surge_users
  set right_now_until = v_until, is_online = true, last_seen = now()
  where id = v_me.id;

  select surge_admin_log_right_now(v_me.id, now());

  return jsonb_build_object(
    'ok', true, 'active', true,
    'until', v_until,
    'used', v_used + 1, 'limit', v_limit
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_record_boost — +12h visibility blast.
-- Requirement: no active boost AND avg reliability >= 4 from
-- meetups that happened (the "show up" gate).
-- ─────────────────────────────────────────────────────────────

create or replace function surge_record_boost()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_avg numeric;
  v_until timestamptz;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_record_boost: profile not found';
  end if;

  if coalesce(v_me.boost_expires_at, now()) > now() then
    return jsonb_build_object(
      'ok', false, 'reason', 'already boosted',
      'boost_expires_at', v_me.boost_expires_at
    );
  end if;

  select avg(reliability_score) into v_avg
  from surge_ratings
  where rated_user_id = v_me.id and meetup_happened = true;

  if v_avg is null or v_avg < 4 then
    return jsonb_build_object('ok', false, 'reason', 'rating below 4.0');
  end if;

  v_until := now() + interval '12 hours';
  update surge_users
  set boost_expires_at = v_until,
      badges = case
        when not ('Boosted' = any (v_me.badges)) then v_me.badges || 'Boosted'
        else v_me.badges
      end
  where id = v_me.id;

  insert into surge_reward_ledger (user_id, type, value_days, reason)
  values (v_me.id, 'boost', 0, '12h profile boost');

  return jsonb_build_object('ok', true, 'boost_expires_at', v_until);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_premium_status — one RPC for the premium hub.
-- ─────────────────────────────────────────────────────────────

create or replace function surge_premium_status()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_used bigint;
  v_limit integer;
  v_is_premium boolean;
  v_boost_ok boolean;
  v_avg numeric;
  v_complete boolean;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_premium_status: profile not found';
  end if;

  v_is_premium := v_me.is_premium or (coalesce(v_me.premium_until, now()) > now());
  v_limit := case when v_is_premium then 5 else 1 end;

  select count(*) into v_used
  from surge_right_now_log
  where user_id = v_me.id and started_at >= date_trunc('day', now());

  select avg(reliability_score) into v_avg
  from surge_ratings
  where rated_user_id = v_me.id and meetup_happened = true;

  v_boost_ok := (coalesce(v_me.boost_expires_at, now()) <= now())
    and v_avg is not null and v_avg >= 4;

  v_complete := coalesce(v_me.photo_url, '') <> ''
    and coalesce(v_me.bio, '') <> ''
    and coalesce(array_length(v_me.looking_for, 1), 0) > 0;

  return jsonb_build_object(
    'is_premium', v_is_premium,
    'premium_until', v_me.premium_until,
    'current_streak', v_me.current_streak,
    'last_active_date', v_me.last_active_date,
    'boost_expires_at', v_me.boost_expires_at,
    'boost_available', v_boost_ok,
    'profile_complete', v_complete,
    'right_now_used', v_used,
    'right_now_limit', v_limit
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_grant_premium — redefined with server-fixed amounts.
-- Client-supplied days are IGNORED for server-fixed types, so a
-- caller can never inflate a reward.
-- ─────────────────────────────────────────────────────────────

create or replace function surge_grant_premium(p_days numeric, p_type text, p_reason text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_fixed_days numeric;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_grant_premium: profile not found';
  end if;

  if p_type = 'verified_email' then
    v_fixed_days := 1;
  elsif p_type = 'profile_complete' then
    if coalesce(v_me.photo_url, '') = '' or coalesce(v_me.bio, '') = ''
       or coalesce(array_length(v_me.looking_for, 1), 0) = 0 then
      return jsonb_build_object('ok', false, 'reason', 'incomplete profile');
    end if;
    v_fixed_days := 3;
  elsif p_type = 'streak' then
    return jsonb_build_object('ok', false, 'reason', 'handled by surge_record_streak');
  else
    raise exception 'surge_grant_premium: invalid reward type';
  end if;

  select surge_admin_apply_reward(v_me.id, v_fixed_days, p_type, p_reason);
  return jsonb_build_object('ok', true, 'days', v_fixed_days);
end;
$$;