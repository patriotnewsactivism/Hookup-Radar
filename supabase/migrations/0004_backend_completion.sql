-- Surge backend completion.
-- Consolidates the production repairs applied on 2026-09-20.
-- Additive/idempotent so a fresh Supabase environment matches the current frontend.

alter table public.surge_users
  add column if not exists role text not null default 'user',
  add column if not exists email_confirmed_at timestamptz,
  add column if not exists right_now_until timestamptz,
  add column if not exists referrer_id uuid references public.surge_users(id) on delete set null,
  add column if not exists total_invites_sent integer not null default 0,
  add column if not exists total_referrals integer not null default 0,
  add column if not exists total_free_days_earned numeric not null default 0,
  add column if not exists current_streak integer not null default 0,
  add column if not exists last_active_date date,
  add column if not exists milestone_checked_at timestamptz,
  add column if not exists boost_expires_at timestamptz,
  add column if not exists badges text[] not null default '{}';

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname='surge_users_role_check'
      and conrelid='public.surge_users'::regclass
  ) then
    alter table public.surge_users
      add constraint surge_users_role_check
      check (role in ('user','moderator','admin'));
  end if;
end $$;

create table if not exists public.surge_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.surge_users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  from_user_id uuid references public.surge_users(id) on delete set null,
  entity_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists surge_notifications_user_created_idx
  on public.surge_notifications(user_id, created_at desc);
create index if not exists surge_notifications_user_read_idx
  on public.surge_notifications(user_id, is_read);

create table if not exists public.surge_ratings (
  id uuid primary key default gen_random_uuid(),
  rater_id uuid not null references public.surge_users(id) on delete cascade,
  rated_user_id uuid not null references public.surge_users(id) on delete cascade,
  meetup_happened boolean not null default false,
  reliability_score integer not null check (reliability_score between 1 and 5),
  vibe_score integer check (vibe_score is null or vibe_score between 1 and 5),
  tags text[] not null default '{}',
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rater_id, rated_user_id),
  check (rater_id <> rated_user_id)
);
create index if not exists surge_ratings_rated_user_idx
  on public.surge_ratings(rated_user_id);

create table if not exists public.surge_albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.surge_users(id) on delete cascade,
  name text not null,
  description text,
  cover_storage_id text,
  photo_count integer not null default 0 check (photo_count >= 0),
  video_count integer not null default 0 check (video_count >= 0),
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists surge_albums_user_created_idx
  on public.surge_albums(user_id, created_at desc);

create table if not exists public.surge_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.surge_users(id) on delete cascade,
  storage_id text not null,
  url text not null,
  type text not null check (type in ('image','video')),
  filename text,
  size bigint check (size is null or size >= 0),
  is_profile_photo boolean not null default false,
  album_id uuid references public.surge_albums(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists surge_media_user_created_idx
  on public.surge_media(user_id, created_at desc);
create index if not exists surge_media_album_sort_idx
  on public.surge_media(album_id, sort_order);

create table if not exists public.surge_strikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.surge_users(id) on delete cascade,
  issued_by uuid references public.surge_users(id) on delete set null,
  reason text not null,
  report_id uuid references public.surge_reports(id) on delete set null,
  is_ban boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists surge_strikes_user_created_idx
  on public.surge_strikes(user_id, created_at desc);

alter table public.surge_notifications enable row level security;
alter table public.surge_ratings enable row level security;
alter table public.surge_albums enable row level security;
alter table public.surge_media enable row level security;
alter table public.surge_strikes enable row level security;

drop policy if exists "Users read own notifications" on public.surge_notifications;
create policy "Users read own notifications" on public.surge_notifications
for select to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_notifications.user_id and me.auth_id=auth.uid()
));
drop policy if exists "Users update own notifications" on public.surge_notifications;
create policy "Users update own notifications" on public.surge_notifications
for update to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_notifications.user_id and me.auth_id=auth.uid()
))
with check (exists (
  select 1 from public.surge_users me
  where me.id=surge_notifications.user_id and me.auth_id=auth.uid()
));
drop policy if exists "Users delete own notifications" on public.surge_notifications;
create policy "Users delete own notifications" on public.surge_notifications
for delete to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_notifications.user_id and me.auth_id=auth.uid()
));
drop policy if exists "Authenticated create valid notifications" on public.surge_notifications;
create policy "Authenticated create valid notifications" on public.surge_notifications
for insert to authenticated
with check (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid()
    and (
      surge_notifications.from_user_id=me.id
      or surge_notifications.user_id=me.id
      or me.role in ('moderator','admin')
    )
));

drop policy if exists "Authenticated read ratings" on public.surge_ratings;
create policy "Authenticated read ratings" on public.surge_ratings
for select to authenticated using (true);
drop policy if exists "Users insert own ratings" on public.surge_ratings;
create policy "Users insert own ratings" on public.surge_ratings
for insert to authenticated
with check (exists (
  select 1 from public.surge_users me
  where me.id=surge_ratings.rater_id and me.auth_id=auth.uid()
));
drop policy if exists "Users update own ratings" on public.surge_ratings;
create policy "Users update own ratings" on public.surge_ratings
for update to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_ratings.rater_id and me.auth_id=auth.uid()
))
with check (exists (
  select 1 from public.surge_users me
  where me.id=surge_ratings.rater_id and me.auth_id=auth.uid()
));
drop policy if exists "Users delete own ratings" on public.surge_ratings;
create policy "Users delete own ratings" on public.surge_ratings
for delete to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_ratings.rater_id and me.auth_id=auth.uid()
));

drop policy if exists "Albums visible to owner or public" on public.surge_albums;
create policy "Albums visible to owner or public" on public.surge_albums
for select to authenticated
using (
  not is_private
  or exists (
    select 1 from public.surge_users me
    where me.id=surge_albums.user_id and me.auth_id=auth.uid()
  )
);
drop policy if exists "Users insert own albums" on public.surge_albums;
create policy "Users insert own albums" on public.surge_albums
for insert to authenticated
with check (exists (
  select 1 from public.surge_users me
  where me.id=surge_albums.user_id and me.auth_id=auth.uid()
));
drop policy if exists "Users update own albums" on public.surge_albums;
create policy "Users update own albums" on public.surge_albums
for update to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_albums.user_id and me.auth_id=auth.uid()
))
with check (exists (
  select 1 from public.surge_users me
  where me.id=surge_albums.user_id and me.auth_id=auth.uid()
));
drop policy if exists "Users delete own albums" on public.surge_albums;
create policy "Users delete own albums" on public.surge_albums
for delete to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_albums.user_id and me.auth_id=auth.uid()
));

drop policy if exists "Media visible to owner or public album" on public.surge_media;
create policy "Media visible to owner or public album" on public.surge_media
for select to authenticated
using (
  exists (
    select 1 from public.surge_users me
    where me.id=surge_media.user_id and me.auth_id=auth.uid()
  )
  or album_id is null
  or exists (
    select 1 from public.surge_albums a
    where a.id=surge_media.album_id and not a.is_private
  )
);
drop policy if exists "Users insert own media" on public.surge_media;
create policy "Users insert own media" on public.surge_media
for insert to authenticated
with check (exists (
  select 1 from public.surge_users me
  where me.id=surge_media.user_id and me.auth_id=auth.uid()
));
drop policy if exists "Users update own media" on public.surge_media;
create policy "Users update own media" on public.surge_media
for update to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_media.user_id and me.auth_id=auth.uid()
))
with check (exists (
  select 1 from public.surge_users me
  where me.id=surge_media.user_id and me.auth_id=auth.uid()
));
drop policy if exists "Users delete own media" on public.surge_media;
create policy "Users delete own media" on public.surge_media
for delete to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.id=surge_media.user_id and me.auth_id=auth.uid()
));

drop policy if exists "Users or staff read strikes" on public.surge_strikes;
create policy "Users or staff read strikes" on public.surge_strikes
for select to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid()
    and (me.id=surge_strikes.user_id or me.role in ('moderator','admin'))
));
drop policy if exists "Staff insert strikes" on public.surge_strikes;
create policy "Staff insert strikes" on public.surge_strikes
for insert to authenticated
with check (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
));
drop policy if exists "Staff update strikes" on public.surge_strikes;
create policy "Staff update strikes" on public.surge_strikes
for update to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
))
with check (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
));
drop policy if exists "Staff delete strikes" on public.surge_strikes;
create policy "Staff delete strikes" on public.surge_strikes
for delete to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
));

drop policy if exists "Staff read reports" on public.surge_reports;
create policy "Staff read reports" on public.surge_reports
for select to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
));
drop policy if exists "Staff update reports" on public.surge_reports;
create policy "Staff update reports" on public.surge_reports
for update to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
))
with check (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
));

drop policy if exists "Staff read all spots" on public.surge_spots;
create policy "Staff read all spots" on public.surge_spots
for select to authenticated
using (
  is_approved=true
  or exists (
    select 1 from public.surge_users me
    where me.auth_id=auth.uid() and me.role in ('moderator','admin')
  )
);
drop policy if exists "Staff update spots" on public.surge_spots;
create policy "Staff update spots" on public.surge_spots
for update to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
))
with check (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
));
drop policy if exists "Staff delete spots" on public.surge_spots;
create policy "Staff delete spots" on public.surge_spots
for delete to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
));

drop policy if exists "Users delete own profile" on public.surge_users;
create policy "Users delete own profile" on public.surge_users
for delete to authenticated using (auth.uid()=auth_id);

drop policy if exists "Staff update user profiles" on public.surge_users;
create policy "Staff update user profiles" on public.surge_users
for update to authenticated
using (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
))
with check (exists (
  select 1 from public.surge_users me
  where me.auth_id=auth.uid() and me.role in ('moderator','admin')
));

drop policy if exists "Users delete own messages" on public.surge_messages;
create policy "Users delete own messages" on public.surge_messages
for delete to authenticated
using (
  sender_id in (select id from public.surge_users where auth_id=auth.uid())
  or receiver_id in (select id from public.surge_users where auth_id=auth.uid())
);

alter table public.surge_reports drop constraint if exists surge_reports_reporter_id_fkey;
alter table public.surge_reports
  add constraint surge_reports_reporter_id_fkey
  foreign key (reporter_id) references public.surge_users(id) on delete set null;
alter table public.surge_reports drop constraint if exists surge_reports_reported_id_fkey;
alter table public.surge_reports
  add constraint surge_reports_reported_id_fkey
  foreign key (reported_id) references public.surge_users(id) on delete set null;
alter table public.surge_reports drop constraint if exists surge_reports_status_check;
alter table public.surge_reports
  add constraint surge_reports_status_check
  check (status in ('pending','reviewed','dismissed','actioned','resolved'));

create or replace function public.surge_bump_profile_view_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.surge_users
  set profile_views=coalesce(profile_views,0)+1
  where id=new.viewed_id;
  return new;
end;
$$;
drop trigger if exists surge_profile_view_count_trg on public.surge_profile_views;
create trigger surge_profile_view_count_trg
after insert on public.surge_profile_views
for each row execute function public.surge_bump_profile_view_count();

create or replace function public.surge_sync_event_attendee_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    update public.surge_spot_events
    set attendee_count=coalesce(attendee_count,0)+1
    where id=new.event_id;
    return new;
  elsif tg_op='DELETE' then
    update public.surge_spot_events
    set attendee_count=greatest(0,coalesce(attendee_count,0)-1)
    where id=old.event_id;
    return old;
  end if;
  return null;
end;
$$;
drop trigger if exists surge_rsvp_count_insert_trg on public.surge_spot_rsvps;
drop trigger if exists surge_rsvp_count_delete_trg on public.surge_spot_rsvps;
create trigger surge_rsvp_count_insert_trg
after insert on public.surge_spot_rsvps
for each row execute function public.surge_sync_event_attendee_count();
create trigger surge_rsvp_count_delete_trg
after delete on public.surge_spot_rsvps
for each row execute function public.surge_sync_event_attendee_count();

drop policy if exists "Users delete own surge media" on storage.objects;
create policy "Users delete own surge media" on storage.objects
for delete to authenticated
using (
  bucket_id='surge-media'
  and (storage.foldername(name))[1] in (
    select id::text from public.surge_users where auth_id=auth.uid()
  )
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='surge_notifications'
  ) then
    alter publication supabase_realtime add table public.surge_notifications;
  end if;
end $$;

create or replace function public.surge_admin_apply_reward(
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
  v_days numeric := case when p_days < 0 then -p_days else p_days end;
  v_user surge_users%rowtype;
  v_dup boolean;
begin
  if v_days > 366 then v_days := 366; end if;
  if v_days = 0 then return; end if;
  select * into v_user from surge_users where id=p_user_id;
  if not found then raise exception 'surge_admin_apply_reward: unknown user'; end if;

  if p_type in ('verified_email','referral_30d','profile_complete') then
    select exists (
      select 1 from surge_reward_ledger
      where user_id=p_user_id
        and type=p_type
        and reason is not distinct from p_reason
    ) into v_dup;
    if v_dup then return; end if;
  end if;

  update surge_users
  set premium_until=
        (case
          when coalesce(premium_until,now()) > now()
            then coalesce(premium_until,now())
          else now()
        end) + (v_days * interval '1 day'),
      is_premium=true,
      total_free_days_earned=total_free_days_earned+v_days,
      total_invites_sent=total_invites_sent+
        case when p_bump_invites then 1 else 0 end,
      total_referrals=total_referrals+
        case when p_bump_referrals then 1 else 0 end,
      badges=case
        when p_badge is not null
          and not (p_badge=any(v_user.badges))
          then v_user.badges || p_badge
        else v_user.badges
      end
  where id=p_user_id;

  insert into surge_reward_ledger(user_id,type,value_days,reason)
  values(p_user_id,p_type,v_days,p_reason);
end;
$$;
revoke execute on function public.surge_admin_apply_reward(
  uuid,numeric,text,text,text,boolean,boolean
) from anon,authenticated;

create or replace function public.surge_referral_stats()
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
  select * into v_me from surge_users where auth_id=auth.uid();
  if not found then raise exception 'surge_referral_stats: profile not found'; end if;

  if v_me.referral_code is null then
    select surge_ensure_referral_code() into v_code;
    v_me.referral_code := v_code;
  end if;

  if v_me.milestone_checked_at is null
     or v_me.milestone_checked_at < now()-interval '1 day' then
    for v_username in
      select rr.username
      from surge_users rr
      where rr.referrer_id=v_me.id
        and coalesce(rr.created_at,now()) <= now()-interval '30 days'
        and rr.last_active_date is not null
        and rr.last_active_date >= rr.created_at::date+14
    loop
      perform surge_admin_apply_reward(
        v_me.id,30,'referral_30d',
        'Friend staying 30d: ' || v_username,'Rebel'
      );
    end loop;
    update surge_users set milestone_checked_at=now() where id=v_me.id;
  end if;

  select count(*) into v_sent
  from surge_invites where inviter_id=v_me.id;
  select count(*) into v_signed_up
  from surge_invites where inviter_id=v_me.id and status='signed_up';
  select count(*) into v_stayed
  from surge_reward_ledger
  where user_id=v_me.id and type='referral_30d';

  return jsonb_build_object(
    'referral_code',v_me.referral_code,
    'referral_url','https://surgeonline.site/?ref=' || v_me.referral_code,
    'total_invites_sent',v_sent,
    'total_referrals',v_me.total_referrals,
    'signed_up',v_signed_up,
    'stayed_30_days',v_stayed,
    'total_free_days_earned',v_me.total_free_days_earned,
    'milestones',jsonb_build_array(
      jsonb_build_object(
        'key','invite_send','label','Invite a friend',
        'reward','1 day','complete',v_sent>0
      ),
      jsonb_build_object(
        'key','referral_signup','label','Friend joins with your code',
        'reward','7 days to you + 7 to them','complete',v_signed_up>0
      ),
      jsonb_build_object(
        'key','referral_30d','label','Friend sticks around 30 days',
        'reward','30 days + Rebel badge','complete',v_stayed>0
      )
    ),
    'recent_rewards',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'type',r.type,'value_days',r.value_days,
        'reason',r.reason,'granted_at',r.granted_at
      ))
      from (
        select l.id,l.type,l.value_days,l.reason,l.granted_at
        from surge_reward_ledger l
        where l.user_id=v_me.id
        order by l.granted_at desc
        limit 10
      ) r
    ),'[]')
  );
end;
$$;
