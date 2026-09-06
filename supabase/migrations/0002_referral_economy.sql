-- Surge — Phase 3: referral economy + reward ledger + profile views.
-- Applies after 0001 (right_now_until). Additive only.
--
-- Security model:
--   * Client-facing RPCs are SECURITY DEFINER — they execute with RLS and
--     always resolve the acting user from auth.uid(). They never trust
--     caller-supplied user ids for authorization.
--   * Cross-user writes (crediting a referrer, marking invites) go through
--     surge_admin_apply_reward / surge_admin_mark_invite_signed_up, which are
--     SECURITY INVOKER (bypass RLS) and have EXECUTE revoked from
--     anon/authenticated so only definer functions can call them.

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists surge_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references surge_users(id) on delete cascade,
  invite_code text not null,
  recipient_email text,
  channel text not null check (channel in ('share', 'sms', 'whatsapp', 'mailto', 'email')),
  status text not null default 'sent' check (status in ('sent', 'signed_up')),
  reward_granted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists surge_invites_inviter_created_idx
  on surge_invites (inviter_id, created_at desc);

alter table surge_invites enable row level security;
create policy "inviters select their own invites"
  on surge_invites for select
  using (
    exists (
      select 1 from surge_users su
      where su.id = surge_invites.inviter_id and su.auth_id = auth.uid()
    )
  );
create policy "inviters insert their own invites"
  on surge_invites for insert
  with check (
    exists (
      select 1 from surge_users su
      where su.id = surge_invites.inviter_id and su.auth_id = auth.uid()
    )
  );
-- No update/delete policies: status flips happen via the admin invoker.

create table if not exists surge_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references surge_users(id) on delete cascade,
  type text not null check (
    type in ('invite_send', 'referral_signup', 'referral_30d', 'streak', 'verified_email', 'profile_complete', 'boost')
  ),
  value_days numeric not null default 0 check (value_days >= 0 and value_days <= 366),
  reason text,
  granted_at timestamptz not null default now()
);

create index if not exists surge_reward_ledger_user_idx
  on surge_reward_ledger (user_id, granted_at desc);

alter table surge_reward_ledger enable row level security;
create policy "users select their own rewards"
  on surge_reward_ledger for select
  using (
    exists (
      select 1 from surge_users su
      where su.id = surge_reward_ledger.user_id and su.auth_id = auth.uid()
    )
  );

create table if not exists surge_profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references surge_users(id) on delete cascade,
  viewed_id uuid not null references surge_users(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists surge_profile_views_viewed_idx
  on surge_profile_views (viewed_id, viewed_at desc);

alter table surge_profile_views enable row level security;
create policy "users select who viewed them"
  on surge_profile_views for select
  using (
    exists (
      select 1 from surge_users su
      where su.id = surge_profile_views.viewed_id and su.auth_id = auth.uid()
    )
  );
create policy "any signed-in user records a view"
  on surge_profile_views for insert
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- surge_users — referral economy columns
-- ─────────────────────────────────────────────────────────────

alter table surge_users
  add column referral_code text,
  add column referrer_id uuid references surge_users(id) on delete set null,
  add column total_invites_sent integer not null default 0,
  add column total_referrals integer not null default 0,
  add column total_free_days_earned numeric not null default 0,
  add column current_streak integer not null default 0,
  add column last_active_date date,
  add column milestone_checked_at timestamptz,
  add column boost_expires_at timestamptz,
  add column badges text[] not null default '{}',
  add column email_confirmed_at timestamptz;

create unique index if not exists surge_users_referral_code_key
  on surge_users (referral_code)
  where referral_code is not null;

-- ─────────────────────────────────────────────────────────────
-- surge_admin_apply_reward — SECURITY INVOKER, never client-callable
-- ─────────────────────────────────────────────────────────────

create or replace function surge_admin_apply_reward(
  p_user_id uuid,
  p_days numeric,
  p_type text,
  p_reason text default null,
  p_badge text default null,
  p_bump_invites boolean default false,
  p_bump_referrals boolean default false
) returns void
language plpgsql
security invoker
as $$
declare
  v_days numeric := case
    when p_days < 0 then -p_days
    else p_days
  end;
  v_user surge_users%rowtype;
  v_dup boolean;
begin
  if v_days > 366 then
    v_days := 366;
  end if;
  if v_days = 0 then
    return;
  end if;

  select * into v_user from surge_users where id = p_user_id;
  if not found then
    raise exception 'surge_admin_apply_reward: unknown user';
  end if;

  -- One-shot reward types must never double-credit.
  if p_type in ('verified_email', 'referral_30d', 'profile_complete') then
    select exists (
      select 1 from surge_reward_ledger
      where user_id = p_user_id and type = p_type and reason is not distinct from p_reason
    ) into v_dup;
    if v_dup then
      return;
    end if;
  end if;

  update surge_users
  set premium_until = case
        when coalesce(premium_until, now()) > now() then coalesce(premium_until, now())
        else now()
      end + make_interval(days => v_days),
      is_premium = true,
      total_free_days_earned = total_free_days_earned + v_days,
      total_invites_sent = total_invites_sent + case when p_bump_invites then 1 else 0 end,
      total_referrals = total_referrals + case when p_bump_referrals then 1 else 0 end,
      badges = case
        when p_badge is not null and not (p_badge = any (v_user.badges)) then v_user.badges || p_badge
        else v_user.badges
      end
  where id = p_user_id;

  insert into surge_reward_ledger (user_id, type, value_days, reason)
  values (p_user_id, p_type, v_days, p_reason);
end;
$$;

revoke execute on function surge_admin_apply_reward(uuid, numeric, text, text, text, boolean, boolean) from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- surge_admin_mark_invite_signed_up — SECURITY INVOKER
-- ─────────────────────────────────────────────────────────────

create or replace function surge_admin_mark_invite_signed_up(p_referrer_id uuid, p_email text)
returns void
language plpgsql
security invoker
as $$
begin
  update surge_invites
  set status = 'signed_up', reward_granted = true
  where inviter_id = p_referrer_id
    and lower(coalesce(recipient_email, '')) = lower(trim(p_email))
    and status = 'sent';
end;
$$;

revoke execute on function surge_admin_mark_invite_signed_up(uuid, text) from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- surge_grant_premium — client-callable self-grant for server-guarded
-- reward types only (email verified, profile complete).
-- ─────────────────────────────────────────────────────────────

create or replace function surge_grant_premium(p_days numeric, p_type text, p_reason text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
begin
  if p_type not in ('verified_email', 'profile_complete', 'streak') then
    raise exception 'surge_grant_premium: invalid reward type';
  end if;

  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_grant_premium: profile not found';
  end if;

  select surge_admin_apply_reward(v_me.id, p_days, p_type, p_reason);
  return jsonb_build_object('ok', true, 'days', p_days);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_ensure_referral_code — lazily assigns the user's code
-- ─────────────────────────────────────────────────────────────

create or replace function surge_ensure_referral_code()
returns text
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_code text;
  v_taken boolean;
  v_suffix text;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_ensure_referral_code: profile not found';
  end if;
  if v_me.referral_code is not null then
    return v_me.referral_code;
  end if;

  v_suffix := substr(md5(v_me.id::text), 1, 4);
  v_code := lower(v_me.username);
  if length(v_code) < 4 then
    v_code := v_code || v_suffix;
  end if;

  select exists (select 1 from surge_users where referral_code = v_code) into v_taken;
  if v_taken then
    v_code := lower(v_me.username) || '_' || v_suffix;
    select exists (select 1 from surge_users where referral_code = v_code) into v_taken;
    if v_taken then
      v_code := lower(v_me.username) || substr(md5(v_me.id::text), 1, 6);
    end if;
  end if;

  update surge_users set referral_code = v_code where id = v_me.id;
  return v_code;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_record_invite — share-channel invite; grants +1 day, capped at
-- 10 total invites per day. Email invites are inserted by the edge function
-- first (channel = 'email' skips the insert here).
-- ─────────────────────────────────────────────────────────────

create or replace function surge_record_invite(p_channel text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_today_count bigint;
  v_code text;
begin
  if p_channel not in ('share', 'sms', 'whatsapp', 'mailto', 'email') then
    raise exception 'surge_record_invite: invalid channel';
  end if;

  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_record_invite: profile not found';
  end if;

  if v_me.referral_code is null then
    select surge_ensure_referral_code() into v_code;
  else
    v_code := v_me.referral_code;
  end if;

  select count(*) into v_today_count
  from surge_invites
  where inviter_id = v_me.id and created_at >= date_trunc('day', now());

  if v_today_count >= 10 then
    return jsonb_build_object('ok', false, 'reason', 'daily cap');
  end if;

  if p_channel <> 'email' then
    insert into surge_invites (inviter_id, invite_code, channel)
    values (v_me.id, v_code, p_channel);
  end if;

  select surge_admin_apply_reward(
    v_me.id, 1, 'invite_send', 'Invited a friend (' || p_channel || ')',
    null, true, false
  );

  return jsonb_build_object('ok', true, 'days', 1);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_handle_referral_signup — fires once per new profile, on the
-- new user's onboarding. Credits both sides +7 days.
-- ─────────────────────────────────────────────────────────────

create or replace function surge_handle_referral_signup(p_code text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_referrer surge_users%rowtype;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_handle_referral_signup: profile not found';
  end if;
  if v_me.referrer_id is not null then
    return jsonb_build_object('ok', false, 'reason', 'already redeemed');
  end if;

  select * into v_referrer
  from surge_users
  where referral_code = lower(trim(p_code))
  limit 1;
  if not found or v_referrer.id = v_me.id then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  update surge_users set referrer_id = v_referrer.id where id = v_me.id;

  select surge_admin_apply_reward(
    v_me.id, 7, 'referral_signup', 'Referred by ' || v_referrer.username
  );
  select surge_admin_apply_reward(
    v_referrer.id, 7, 'referral_signup', 'Referred ' || v_me.username,
    null, false, true
  );
  select surge_admin_mark_invite_signed_up(v_referrer.id, v_me.auth_email);

  return jsonb_build_object('ok', true, 'days', 7);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_record_streak — daily activity ping (consumed in Phase 4)
-- ─────────────────────────────────────────────────────────────

create or replace function surge_record_streak()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_streak integer;
  v_grant numeric;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_record_streak: profile not found';
  end if;

  if v_me.last_active_date = current_date then
    return jsonb_build_object('ok', true, 'streak', v_me.current_streak);
  end if;

  if v_me.last_active_date = current_date - 1 then
    v_streak := v_me.current_streak + 1;
  else
    v_streak := 1;
  end if;

  update surge_users
  set current_streak = v_streak, last_active_date = current_date
  where id = v_me.id;

  v_grant := case v_streak
    when 3 then 0.25
    when 7 then 1
    when 14 then 3
    when 30 then 7
    else 0
  end;
  if v_grant > 0 then
    select surge_admin_apply_reward(v_me.id, v_grant, 'streak', v_streak::text || ' day streak');
  end if;

  return jsonb_build_object('ok', true, 'streak', v_streak);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_referral_stats — hub payload; runs the lazy 30-day milestone
-- check at most once per day (guarded on milestone_checked_at; the ledger
-- dup-guard makes it idempotent regardless).
-- ─────────────────────────────────────────────────────────────

create or replace function surge_referral_stats()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_code text;
  v_sent bigint;
  v_signed_up bigint;
  v_stayed bigint;
  v_username text;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_referral_stats: profile not found';
  end if;

  if v_me.referral_code is null then
    select surge_ensure_referral_code() into v_code;
    v_me.referral_code := v_code;
  end if;

  -- Lazy 30-day milestone: friend signed up 30+ days ago and is still active.
  if v_me.milestone_checked_at is null or v_me.milestone_checked_at < now() - interval '1 day' then
    for v_username in
      select rr.username
      from surge_users rr
      where rr.referrer_id = v_me.id
        and coalesce(rr.created_at, now()) <= now() - interval '30 days'
        and rr.last_active_date is not null
        and rr.last_active_date >= rr.created_at::date + 14
    loop
      select surge_admin_apply_reward(
        v_me.id, 30, 'referral_30d', 'Friend staying 30d: ' || v_username,
        'Rebel'
      );
    end loop;
    update surge_users set milestone_checked_at = now() where id = v_me.id;
  end if;

  select count(*) into v_sent from surge_invites where inviter_id = v_me.id;
  select count(*) into v_signed_up from surge_invites
    where inviter_id = v_me.id and status = 'signed_up';
  select count(*) into v_stayed from surge_reward_ledger
    where user_id = v_me.id and type = 'referral_30d';

  return jsonb_build_object(
    'referral_code', v_me.referral_code,
    'referral_url', 'https://surgeonline-wtpnews.netlify.app/?ref=' || v_me.referral_code,
    'total_invites_sent', v_sent,
    'total_referrals', v_me.total_referrals,
    'signed_up', v_signed_up,
    'stayed_30_days', v_stayed,
    'total_free_days_earned', v_me.total_free_days_earned,
    'milestones', jsonb_build_array(
      jsonb_build_object(
        'key', 'invite_send',
        'label', 'Invite a friend',
        'reward', '1 day',
        'complete', v_sent > 0
      ),
      jsonb_build_object(
        'key', 'referral_signup',
        'label', 'Friend joins with your code',
        'reward', '7 days to you + 7 to them',
        'complete', v_signed_up > 0
      ),
      jsonb_build_object(
        'key', 'referral_30d',
        'label', 'Friend sticks around 30 days',
        'reward', '30 days + Rebel badge',
        'complete', v_stayed > 0
      )
    ),
    'recent_rewards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'type', r.type,
        'value_days', r.value_days,
        'reason', r.reason,
        'granted_at', r.granted_at
      ))
      from (
        select l.id, l.type, l.value_days, l.reason, l.granted_at
        from surge_reward_ledger l
        where l.user_id = v_me.id
        order by l.granted_at desc
        limit 10
      ) r
    ), '[]')
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- surge_get_views — "who viewed me" (premium gating lands in Phase 4)
-- ─────────────────────────────────────────────────────────────

create or replace function surge_get_views(p_limit integer default 30)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_me surge_users%rowtype;
  v_limit integer := case
    when p_limit < 1 then 1
    when p_limit > 100 then 100
    else p_limit
  end;
begin
  select * into v_me from surge_users where auth_id = auth.uid();
  if not found then
    raise exception 'surge_get_views: profile not found';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'viewed_at', r.viewed_at,
      'viewer_id', r.viewer_id
    ))
    from (
      select v.viewed_at, v.viewer_id
      from surge_profile_views v
      where v.viewed_id = v_me.id
      order by v.viewed_at desc
      limit v_limit
    ) r
  ), '[]');
end;
$$;