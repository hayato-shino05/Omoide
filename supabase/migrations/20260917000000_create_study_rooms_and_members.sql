begin;

-- 1. Bảng phòng học chung (study_rooms)
create table if not exists public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  host_id text not null check (char_length(btrim(host_id)) between 1 and 100),
  current_track_id text check (current_track_id is null or char_length(current_track_id) <= 200),
  epoch_started_at timestamptz not null default now(),
  playback_state text not null default 'playing' check (playback_state in ('playing', 'paused', 'stopped')),
  theme_override text check (theme_override is null or char_length(theme_override) <= 50),
  is_private boolean not null default false,
  passcode text check (passcode is null or char_length(passcode) <= 20),
  max_members integer not null default 20 check (max_members between 2 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Bảng thành viên trong phòng (study_room_members)
create table if not exists public.study_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_identifier text not null check (char_length(btrim(user_identifier)) between 1 and 100),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 50),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  focus_status text not null default 'focusing' check (focus_status in ('focusing', 'short_break', 'long_break', 'idle')),
  current_streak_minutes integer not null default 0 check (current_streak_minutes >= 0),
  joined_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  unique(room_id, user_identifier)
);

-- Indexes
create index if not exists study_rooms_updated_at_idx on public.study_rooms (updated_at desc);
create index if not exists study_rooms_is_private_idx on public.study_rooms (is_private) where not is_private;
create index if not exists study_room_members_room_id_idx on public.study_room_members (room_id);
create index if not exists study_room_members_heartbeat_idx on public.study_room_members (last_heartbeat_at desc);

-- RLS Enablement
alter table public.study_rooms enable row level security;
alter table public.study_room_members enable row level security;

-- RLS Policies
create policy "Allow read study_rooms"
  on public.study_rooms for select
  using (true);

create policy "Allow insert study_rooms"
  on public.study_rooms for insert
  with check (true);

create policy "Allow update study_rooms"
  on public.study_rooms for update
  using (true)
  with check (true);

create policy "Allow delete study_rooms"
  on public.study_rooms for delete
  using (true);

create policy "Allow read study_room_members"
  on public.study_room_members for select
  using (true);

create policy "Allow insert study_room_members"
  on public.study_room_members for insert
  with check (true);

create policy "Allow update study_room_members"
  on public.study_room_members for update
  using (true)
  with check (true);

create policy "Allow delete study_room_members"
  on public.study_room_members for delete
  using (true);

-- Realtime Publication
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    alter publication supabase_realtime add table public.study_rooms;
    alter publication supabase_realtime add table public.study_room_members;
  end if;
exception
  when duplicate_object then
    null;
end $$;

commit;
