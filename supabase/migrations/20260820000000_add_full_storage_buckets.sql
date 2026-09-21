begin;

-- 1. カスタム音楽トラックテーブルの作成
create table if not exists public.music_tracks (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  url text not null check (char_length(url) between 1 and 1000),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  file_size bigint not null check (file_size > 0 and file_size <= 15728640),
  created_at timestamptz not null default now()
);

create index if not exists music_tracks_created_at_idx on public.music_tracks (created_at desc);

alter table public.music_tracks enable row level security;
grant select, insert on public.music_tracks to anon;
grant usage, select on all sequences in schema public to anon;

create policy "匿名閲覧: 音楽トラック" on public.music_tracks for select to anon using (true);
create policy "匿名作成: 音楽トラック" on public.music_tracks for insert to anon with check (true);

-- 2. Storage バケットの追加（music, avatars, time-capsules）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'music',
  'music',
  true,
  15728640,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/flac', 'audio/aac']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'time-capsules',
  'time-capsules',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. Storage RLS ポリシー
create policy "匿名閲覧: 音楽ストレージ" on storage.objects for select to anon using (bucket_id = 'music');
create policy "匿名作成: 音楽ストレージ" on storage.objects for insert to anon with check (bucket_id = 'music');

create policy "匿名閲覧: アバターストレージ" on storage.objects for select to anon using (bucket_id = 'avatars');
create policy "匿名作成: アバターストレージ" on storage.objects for insert to anon with check (bucket_id = 'avatars');

create policy "匿名閲覧: タイムカプセルストレージ" on storage.objects for select to anon using (bucket_id = 'time-capsules');
create policy "匿名作成: タイムカプセルストレージ" on storage.objects for insert to anon with check (bucket_id = 'time-capsules');

commit;
