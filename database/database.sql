-- ==============================================================================
-- OMOIDE BAKO (想い出箱) — Complete Unified Database Schema
-- ==============================================================================
--
-- This file contains the complete consolidated schema, RLS policies, Storage
-- buckets, and RPC helper functions for the Omoide application.
--
-- Migration history is maintained incrementally under `supabase/migrations/`.
-- ==============================================================================

begin;

-- ------------------------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------------------------

-- Birthdays
create table if not exists public.birthdays (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  month integer not null check (month between 1 and 12),
  day integer not null check (day between 1 and 31),
  year integer check (year is null or year between 1900 and 2100),
  message text check (message is null or char_length(message) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists birthdays_month_day_idx on public.birthdays (month, day);

-- Messages
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  birthday_person text check (birthday_person is null or char_length(btrim(birthday_person)) between 1 and 100),
  media_object_path text check (media_object_path is null or char_length(media_object_path) <= 500),
  music_track_id text check (music_track_id is null or music_track_id ~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$'),
  created_at timestamptz not null default now()
);
create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_music_track_id_idx on public.messages (music_track_id) where music_track_id is not null;
create unique index if not exists messages_music_track_sender_birthday_unique
  on public.messages (sender, birthday_person)
  where music_track_id is not null;

-- Media Submissions
create table if not exists public.media_submissions (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  object_path text not null unique check (char_length(object_path) between 1 and 500),
  media_kind text not null check (media_kind in ('image', 'video', 'audio')),
  mime_type text not null check (char_length(mime_type) between 1 and 255),
  original_name text not null check (char_length(btrim(original_name)) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric check (duration_seconds is null or duration_seconds >= 0),
  birthday_person text check (birthday_person is null or char_length(btrim(birthday_person)) between 1 and 100),
  description text check (description is null or char_length(description) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists media_submissions_kind_created_idx on public.media_submissions (media_kind, created_at desc);
create index if not exists media_submissions_birthday_created_idx on public.media_submissions (birthday_person, created_at desc);

-- Virtual Gifts
create table if not exists public.virtual_gifts (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  gift_emoji text not null check (char_length(btrim(gift_emoji)) between 1 and 32),
  gift_name text not null check (char_length(btrim(gift_name)) between 1 and 100),
  birthday_person text check (birthday_person is null or char_length(btrim(birthday_person)) between 1 and 100),
  created_at timestamptz not null default now()
);
create index if not exists virtual_gifts_created_at_idx on public.virtual_gifts (created_at desc);

-- Chat Messages
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_at_idx on public.chat_messages (created_at desc);

-- Bulletin Posts (Message Board & System Birthday Threads)
create table if not exists public.bulletin_posts (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  media_object_path text check (media_object_path is null or char_length(media_object_path) <= 500),
  birthday_person text check (birthday_person is null or char_length(btrim(birthday_person)) between 1 and 100),
  likes bigint not null default 0 check (likes >= 0),
  celebration_date date,
  timezone text not null default 'Asia/Tokyo' check (char_length(btrim(timezone)) between 1 and 100),
  is_system_generated boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists bulletin_posts_created_at_idx on public.bulletin_posts (created_at desc);
create unique index if not exists bulletin_posts_birthday_thread_unique
  on public.bulletin_posts (birthday_person, celebration_date)
  where is_system_generated = true;

-- Post Replies (Bulletin Replies & Birthday Thread Replies)
create table if not exists public.post_replies (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.bulletin_posts (id) on delete cascade,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  message text check (message is null or char_length(btrim(message)) between 1 and 1000),
  music_track_id text check (music_track_id is null or music_track_id ~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$'),
  moderation_status text not null default 'visible' check (moderation_status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  constraint post_replies_message_or_music_check check (message is not null or music_track_id is not null)
);
create index if not exists post_replies_post_created_idx on public.post_replies (post_id, created_at asc, id asc);

-- Curated & Custom Music Tracks
create table if not exists public.music_tracks (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  title text,
  artist text,
  duration integer default 0,
  url text not null check (char_length(url) between 1 and 1000),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  cover_url text,
  lyrics_url text,
  lyrics_lrc text,
  is_preset boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists music_tracks_created_at_idx on public.music_tracks (created_at desc);
create index if not exists music_tracks_sort_order_idx on public.music_tracks (sort_order asc, id asc);

-- Time Capsules
create table if not exists public.time_capsules (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 80),
  recipient text check (recipient is null or char_length(btrim(recipient)) between 1 and 80),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  photo_url text check (photo_url is null or char_length(photo_url) <= 1000),
  photo_object_path text check (photo_object_path is null or char_length(btrim(photo_object_path)) between 1 and 500),
  unlock_date date not null,
  owner_id uuid references auth.users (id) on delete set null,
  idempotency_key text check (idempotency_key is null or char_length(btrim(idempotency_key)) between 1 and 128),
  invite_token_hash text check (invite_token_hash is null or char_length(btrim(invite_token_hash)) between 1 and 128),
  invite_token_expires_at timestamptz,
  invite_revoked_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists time_capsules_unlock_date_idx on public.time_capsules (unlock_date);
create index if not exists time_capsules_owner_unlock_date_idx on public.time_capsules (owner_id, unlock_date asc);
create unique index if not exists time_capsules_owner_idempotency_key_uidx on public.time_capsules (owner_id, idempotency_key) where owner_id is not null and idempotency_key is not null;
create unique index if not exists time_capsules_invite_token_hash_uidx on public.time_capsules (invite_token_hash) where invite_token_hash is not null;
create index if not exists time_capsules_invite_token_expires_at_idx on public.time_capsules (invite_token_hash, invite_token_expires_at) where invite_token_hash is not null and invite_revoked_at is null;

-- Time Capsule Access Codes
create table if not exists public.time_capsule_access_codes (
  id bigint generated by default as identity primary key,
  capsule_id bigint not null references public.time_capsules (id) on delete cascade,
  code_hash text not null unique check (char_length(code_hash) between 16 and 128),
  derivation_attempt integer not null default 0 check (derivation_attempt >= 0),
  revoked_at timestamptz,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists time_capsule_access_codes_capsule_id_idx on public.time_capsule_access_codes (capsule_id);

-- Time Capsule Access Attempt Buckets (Rate Limiting)
create table if not exists public.time_capsule_access_attempt_buckets (
  bucket_fingerprint text primary key check (char_length(bucket_fingerprint) = 64),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- Notification Logs (Scheduled Email / Push Worker Tasks)
create table if not exists public.notification_logs (
  id bigint generated always as identity primary key,
  event_id text not null,
  event_type text not null check (event_type in ('birthday', 'capsule_unlock')),
  recipient_ref text not null check (char_length(btrim(recipient_ref)) between 1 and 255),
  channel text not null default 'in_app' check (channel in ('in_app')),
  scheduled_at timestamptz not null,
  timezone text not null default 'UTC' check (char_length(btrim(timezone)) between 1 and 100),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 128),
  opted_in boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'retryable', 'failed', 'cancelled', 'expired')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error_code text,
  next_attempt_at timestamptz,
  expires_at timestamptz,
  sent_at timestamptz,
  leased_by text,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notification_logs_status_scheduled_idx on public.notification_logs (status, scheduled_at asc);

-- ------------------------------------------------------------------------------
-- 2. STORAGE BUCKETS
-- ------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photo-album', 'photo-album', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'video/mp4', 'video/webm', 'video/quicktime', 'image/svg+xml']),
  ('community-media', 'community-media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']),
  ('music', 'music', true, 15728640, array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/flac', 'audio/aac']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('time-capsules', 'time-capsules', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']),
  ('time-capsules-private', 'time-capsules-private', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) & GRANTS
-- ------------------------------------------------------------------------------

alter table public.birthdays enable row level security;
alter table public.messages enable row level security;
alter table public.media_submissions enable row level security;
alter table public.virtual_gifts enable row level security;
alter table public.chat_messages enable row level security;
alter table public.bulletin_posts enable row level security;
alter table public.post_replies enable row level security;
alter table public.music_tracks enable row level security;
alter table public.time_capsules enable row level security;
alter table public.time_capsule_access_codes enable row level security;
alter table public.time_capsule_access_attempt_buckets enable row level security;
alter table public.notification_logs enable row level security;

-- Public table permissions
grant select on public.birthdays to anon, authenticated;
grant select, insert on public.messages to anon, authenticated;
grant select, insert on public.media_submissions to anon, authenticated;
grant select, insert on public.virtual_gifts to anon, authenticated;
grant select, insert on public.chat_messages to anon, authenticated;
grant select, insert on public.bulletin_posts to anon, authenticated;
grant select, insert on public.post_replies to anon, authenticated;
grant select on public.music_tracks to anon, authenticated;

-- Revoke direct permissions for private auth/service tables
revoke all on public.time_capsules from anon, authenticated;
revoke all on public.time_capsule_access_codes from anon, authenticated;
revoke all on public.time_capsule_access_attempt_buckets from anon, authenticated;
revoke all on public.notification_logs from anon, authenticated;

-- Policies for Anonymous & Authenticated Read/Insert
create policy "allow_select_birthdays" on public.birthdays for select using (true);
create policy "allow_select_messages" on public.messages for select using (true);
create policy "allow_insert_messages" on public.messages for insert with check (true);
create policy "allow_select_media_submissions" on public.media_submissions for select using (true);
create policy "allow_insert_media_submissions" on public.media_submissions for insert with check (true);
create policy "allow_select_virtual_gifts" on public.virtual_gifts for select using (true);
create policy "allow_insert_virtual_gifts" on public.virtual_gifts for insert with check (true);
create policy "allow_select_chat_messages" on public.chat_messages for select using (true);
create policy "allow_insert_chat_messages" on public.chat_messages for insert with check (true);
create policy "allow_select_bulletin_posts" on public.bulletin_posts for select using (true);
create policy "allow_insert_bulletin_posts" on public.bulletin_posts for insert with check (true);
create policy "allow_select_post_replies" on public.post_replies for select using (true);
create policy "allow_insert_post_replies" on public.post_replies for insert with check (true);
create policy "allow_select_music_tracks" on public.music_tracks for select using (true);

-- ------------------------------------------------------------------------------
-- 4. FUNCTIONS & STORED PROCEDURES (RPC)
-- ------------------------------------------------------------------------------

-- 1) Like Increment RPC
create or replace function public.increment_bulletin_post_likes(p_post_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_likes bigint;
begin
  update public.bulletin_posts
  set likes = likes + 1
  where id = p_post_id
  returning likes into updated_likes;

  return updated_likes;
end;
$$;
grant execute on function public.increment_bulletin_post_likes(bigint) to anon, authenticated;

-- 2) Community Submission RPC
create or replace function public.create_community_submission(
  p_kind text,
  p_sender text,
  p_content text,
  p_birthday_person text default null,
  p_description text default null,
  p_object_path text default null,
  p_media_kind text default null,
  p_mime_type text default null,
  p_original_name text default null,
  p_size_bytes bigint default null,
  p_music_track_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_media public.media_submissions;
  v_message public.messages;
  v_post public.bulletin_posts;
begin
  if p_kind is null or p_kind not in ('message', 'post') then
    raise exception using errcode = '22023', message = 'invalid community submission kind';
  end if;
  if p_sender is null or char_length(btrim(p_sender)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid sender';
  end if;
  if p_content is null or char_length(btrim(p_content)) not between 1 and 1000 then
    raise exception using errcode = '22023', message = 'invalid content';
  end if;
  if p_birthday_person is not null and char_length(btrim(p_birthday_person)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid birthday person';
  end if;
  if p_description is not null and char_length(p_description) > 1000 then
    raise exception using errcode = '22023', message = 'invalid description';
  end if;
  if p_music_track_id is not null and p_music_track_id !~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$' then
    raise exception using errcode = '22023', message = 'invalid music track reference';
  end if;
  if p_music_track_id is not null and p_kind <> 'message' then
    raise exception using errcode = '22023', message = 'music track is only supported for messages';
  end if;

  if p_object_path is not null then
    insert into public.media_submissions (
      sender, object_path, media_kind, mime_type, original_name, size_bytes,
      birthday_person, description
    ) values (
      btrim(p_sender), p_object_path, p_media_kind, p_mime_type, btrim(p_original_name), p_size_bytes,
      nullif(btrim(p_birthday_person), ''), nullif(btrim(p_description), '')
    )
    returning * into v_media;
  end if;

  if p_kind = 'message' then
    if p_music_track_id is not null then
      insert into public.messages (sender, message, birthday_person, media_object_path, music_track_id)
      values (
        btrim(p_sender), btrim(p_content), nullif(btrim(p_birthday_person), ''),
        case when v_media.id is not null then v_media.object_path else null end,
        p_music_track_id
      )
      on conflict (sender, birthday_person) where music_track_id is not null
      do update set
        message = excluded.message,
        media_object_path = excluded.media_object_path,
        music_track_id = excluded.music_track_id,
        created_at = now()
      returning * into v_message;
    else
      insert into public.messages (sender, message, birthday_person, media_object_path, music_track_id)
      values (
        btrim(p_sender), btrim(p_content), nullif(btrim(p_birthday_person), ''),
        case when v_media.id is not null then v_media.object_path else null end,
        null
      )
      returning * into v_message;
    end if;

    return jsonb_build_object(
      'kind', 'message',
      'message', to_jsonb(v_message),
      'media_submission', case when v_media.id is not null then to_jsonb(v_media) else null end
    );
  else
    insert into public.bulletin_posts (sender, message, birthday_person, media_object_path)
    values (
      btrim(p_sender), btrim(p_content), nullif(btrim(p_birthday_person), ''),
      case when v_media.id is not null then v_media.object_path else null end
    )
    returning * into v_post;

    return jsonb_build_object(
      'kind', 'post',
      'post', to_jsonb(v_post),
      'media_submission', case when v_media.id is not null then to_jsonb(v_media) else null end
    );
  end if;
end;
$$;
revoke execute on function public.create_community_submission from public, anon, authenticated;
grant execute on function public.create_community_submission to service_role;

-- 3) Birthday Reply RPC
create or replace function public.create_birthday_reply(
  p_post_id bigint,
  p_sender text,
  p_content text default null,
  p_music_track_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_post public.bulletin_posts;
  v_reply public.post_replies;
begin
  select * into v_post
  from public.bulletin_posts
  where id = p_post_id and is_system_generated = true;

  if not found then
    raise exception using errcode = '22023', message = 'invalid birthday thread';
  end if;

  if p_sender is null or char_length(btrim(p_sender)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid sender';
  end if;

  if (p_content is null or char_length(btrim(p_content)) = 0) and (p_music_track_id is null or char_length(btrim(p_music_track_id)) = 0) then
    raise exception using errcode = '22023', message = 'message or music track is required';
  end if;

  if p_content is not null and char_length(btrim(p_content)) > 1000 then
    raise exception using errcode = '22023', message = 'invalid message length';
  end if;

  if p_music_track_id is not null and p_music_track_id !~ '^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$' then
    raise exception using errcode = '22023', message = 'invalid music track reference';
  end if;

  insert into public.post_replies (post_id, sender, message, music_track_id)
  values (p_post_id, btrim(p_sender), nullif(btrim(p_content), ''), nullif(btrim(p_music_track_id), ''))
  returning * into v_reply;

  return jsonb_build_object('reply', to_jsonb(v_reply));
end;
$$;
revoke execute on function public.create_birthday_reply from public, anon, authenticated;
grant execute on function public.create_birthday_reply to service_role;

-- 4) Time Capsule Creation RPC
create or replace function public.create_time_capsule_with_access_code(
  input_owner_id uuid,
  input_idempotency_key text,
  input_sender text,
  input_recipient text,
  input_message text,
  input_unlock_date date,
  input_photo_object_path text,
  input_invite_token_hash text,
  input_invite_token_expires_at timestamptz,
  input_access_code_hashes text[]
)
returns table (capsule_id bigint, derivation_attempt integer, idempotent boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  capsule_row public.time_capsules%rowtype;
  attempt integer;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  insert into public.time_capsules (
    owner_id,
    idempotency_key,
    sender,
    recipient,
    message,
    unlock_date,
    photo_object_path,
    invite_token_hash,
    invite_token_expires_at
  )
  values (
    input_owner_id,
    input_idempotency_key,
    input_sender,
    input_recipient,
    input_message,
    input_unlock_date,
    input_photo_object_path,
    input_invite_token_hash,
    input_invite_token_expires_at
  )
  on conflict (owner_id, idempotency_key)
    where owner_id is not null and idempotency_key is not null
    do nothing
  returning * into capsule_row;

  if not found then
    select * into capsule_row
    from public.time_capsules
    where owner_id = input_owner_id
      and idempotency_key = input_idempotency_key
    for update;

    if not found or capsule_row.invite_token_hash is distinct from input_invite_token_hash then
      raise exception 'idempotency_replay_unavailable';
    end if;

    select access.derivation_attempt into attempt
    from public.time_capsule_access_codes as access
    where access.capsule_id = capsule_row.id
    order by access.id
    limit 1;

    if not found then
      raise exception 'idempotency_replay_unavailable';
    end if;

    return query select capsule_row.id, attempt, true;
    return;
  end if;

  for attempt in 1..coalesce(array_length(input_access_code_hashes, 1), 0) loop
    begin
      insert into public.time_capsule_access_codes (capsule_id, code_hash, derivation_attempt)
      values (capsule_row.id, input_access_code_hashes[attempt], attempt - 1);
      return query select capsule_row.id, attempt - 1, false;
      return;
    exception when unique_violation then
      null;
    end;
  end loop;

  raise exception 'access_code_collision_exhausted';
end;
$$;
revoke execute on function public.create_time_capsule_with_access_code from public, anon, authenticated;
grant execute on function public.create_time_capsule_with_access_code(uuid, text, text, text, text, date, text, text, timestamptz, text[]) to service_role;

-- 5) Time Capsule Consumption RPC
create or replace function public.consume_time_capsule_access_code(
  input_code_hash text,
  input_attempt_bucket text
)
returns table (capsule_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  access_row public.time_capsule_access_codes%rowtype;
  bucket_row public.time_capsule_access_attempt_buckets%rowtype;
begin
  insert into public.time_capsule_access_attempt_buckets (bucket_fingerprint)
  values (input_attempt_bucket)
  on conflict (bucket_fingerprint) do nothing;

  select * into bucket_row
  from public.time_capsule_access_attempt_buckets
  where bucket_fingerprint = input_attempt_bucket
  for update;

  if bucket_row.locked_until is not null and bucket_row.locked_until > now() then
    return;
  end if;

  if bucket_row.locked_until is not null and bucket_row.locked_until <= now() then
    update public.time_capsule_access_attempt_buckets
    set failed_attempts = 0,
        locked_until = null,
        updated_at = now()
    where bucket_fingerprint = input_attempt_bucket;
  end if;

  select ac.* into access_row
  from public.time_capsule_access_codes ac
  join public.time_capsules tc on tc.id = ac.capsule_id
  where ac.code_hash = input_code_hash
    and ac.revoked_at is null
  for update;

  if not found then
    update public.time_capsule_access_attempt_buckets
    set failed_attempts = failed_attempts + 1,
        locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end,
        updated_at = now()
    where bucket_fingerprint = input_attempt_bucket;
    return;
  end if;

  update public.time_capsule_access_codes
  set last_used_at = now()
  where id = access_row.id;

  update public.time_capsule_access_attempt_buckets
  set failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where bucket_fingerprint = input_attempt_bucket;

  return query select access_row.capsule_id;
end;
$$;
revoke execute on function public.consume_time_capsule_access_code from public, anon, authenticated;
grant execute on function public.consume_time_capsule_access_code(text, text) to service_role;

-- 6) Notification Logs Claim RPC
create or replace function public.claim_notification_logs(
  input_worker_id text,
  input_now timestamptz,
  input_limit integer default 50
)
returns setof public.notification_logs
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select id
    from public.notification_logs
    where (
      status in ('pending', 'retryable')
      and scheduled_at <= input_now
      and (next_attempt_at is null or next_attempt_at <= input_now)
      and (lease_until is null or lease_until <= input_now)
    ) or (
      status = 'processing'
      and lease_until <= input_now
    )
    order by scheduled_at asc, id asc
    for update skip locked
    limit greatest(1, least(coalesce(input_limit, 50), 100))
  )
  update public.notification_logs log
  set status = 'processing',
      leased_by = input_worker_id,
      lease_until = input_now + interval '5 minutes',
      updated_at = input_now
  from candidates
  where log.id = candidates.id
  returning log.*;
$$;
revoke execute on function public.claim_notification_logs from public, anon, authenticated;
grant execute on function public.claim_notification_logs(text, timestamptz, integer) to service_role;

-- ------------------------------------------------------------------------------
-- 5. REALTIME CONFIGURATION
-- ------------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$$;

commit;
