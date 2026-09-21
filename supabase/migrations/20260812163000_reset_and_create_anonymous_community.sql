begin;

delete from auth.users;

drop schema if exists public cascade;
create schema public;

grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

create table public.birthdays (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  month integer not null check (month between 1 and 12),
  day integer not null check (day between 1 and 31),
  year integer check (year between 1900 and 2100),
  message text check (char_length(message) <= 1000),
  created_at timestamptz not null default now()
);

create table public.messages (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  birthday_person text check (char_length(btrim(birthday_person)) between 1 and 100),
  media_object_path text check (char_length(media_object_path) <= 500),
  created_at timestamptz not null default now()
);

create table public.media_submissions (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  object_path text not null unique check (char_length(object_path) between 1 and 500),
  media_kind text not null check (media_kind in ('image', 'video', 'audio')),
  mime_type text not null check (char_length(mime_type) between 1 and 255),
  original_name text not null check (char_length(btrim(original_name)) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  width integer check (width > 0),
  height integer check (height > 0),
  duration_seconds integer check (duration_seconds between 0 and 3600),
  birthday_person text check (char_length(btrim(birthday_person)) between 1 and 100),
  description text check (char_length(description) <= 1000),
  created_at timestamptz not null default now()
);

create table public.virtual_gifts (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  gift_emoji text not null check (char_length(gift_emoji) between 1 and 32),
  gift_name text not null check (char_length(btrim(gift_name)) between 1 and 100),
  birthday_person text check (char_length(btrim(birthday_person)) between 1 and 100),
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.bulletin_posts (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  media_object_path text check (char_length(media_object_path) <= 500),
  birthday_person text check (char_length(btrim(birthday_person)) between 1 and 100),
  created_at timestamptz not null default now()
);

create table public.post_replies (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.bulletin_posts(id) on delete cascade,
  sender text not null check (char_length(btrim(sender)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index birthdays_month_day_idx on public.birthdays (month, day);
create index messages_birthday_person_created_at_idx on public.messages (birthday_person, created_at desc);
create index media_submissions_media_kind_created_at_idx on public.media_submissions (media_kind, created_at desc);
create index media_submissions_birthday_person_created_at_idx on public.media_submissions (birthday_person, created_at desc);
create index virtual_gifts_birthday_person_created_at_idx on public.virtual_gifts (birthday_person, created_at desc);
create index chat_messages_created_at_idx on public.chat_messages (created_at desc);
create index bulletin_posts_created_at_idx on public.bulletin_posts (created_at desc);
create index post_replies_post_id_created_at_idx on public.post_replies (post_id, created_at);

alter table public.birthdays enable row level security;
alter table public.messages enable row level security;
alter table public.media_submissions enable row level security;
alter table public.virtual_gifts enable row level security;
alter table public.chat_messages enable row level security;
alter table public.bulletin_posts enable row level security;
alter table public.post_replies enable row level security;

grant select on public.birthdays, public.messages, public.media_submissions, public.virtual_gifts, public.chat_messages, public.bulletin_posts, public.post_replies to anon;
grant insert on public.messages, public.media_submissions, public.virtual_gifts, public.chat_messages, public.bulletin_posts, public.post_replies to anon;
grant usage, select on all sequences in schema public to anon;

create policy "匿名閲覧: 誕生日" on public.birthdays for select to anon using (true);
create policy "匿名閲覧: メッセージ" on public.messages for select to anon using (true);
create policy "匿名作成: メッセージ" on public.messages for insert to anon with check (true);
create policy "匿名閲覧: メディア投稿" on public.media_submissions for select to anon using (true);
create policy "匿名作成: メディア投稿" on public.media_submissions for insert to anon with check (true);
create policy "匿名閲覧: ギフト" on public.virtual_gifts for select to anon using (true);
create policy "匿名作成: ギフト" on public.virtual_gifts for insert to anon with check (true);
create policy "匿名閲覧: チャット" on public.chat_messages for select to anon using (true);
create policy "匿名作成: チャット" on public.chat_messages for insert to anon with check (true);
create policy "匿名閲覧: 掲示板" on public.bulletin_posts for select to anon using (true);
create policy "匿名作成: 掲示板" on public.bulletin_posts for insert to anon with check (true);
create policy "匿名閲覧: 返信" on public.post_replies for select to anon using (true);
create policy "匿名作成: 返信" on public.post_replies for insert to anon with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']
);

create policy "匿名閲覧: コミュニティメディア" on storage.objects for select to anon using (bucket_id = 'community-media');
create policy "匿名作成: コミュニティメディア" on storage.objects for insert to anon with check (bucket_id = 'community-media');

alter publication supabase_realtime add table public.chat_messages;

commit;
