begin;

-- タイムカプセルテーブルの作成
create table if not exists public.time_capsules (
  id bigint generated always as identity primary key,
  sender text not null check (char_length(btrim(sender)) between 1 and 80),
  recipient text check (recipient is null or char_length(btrim(recipient)) between 1 and 80),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  photo_url text check (photo_url is null or char_length(photo_url) <= 1000),
  unlock_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists time_capsules_unlock_date_idx on public.time_capsules (unlock_date asc);
create index if not exists time_capsules_created_at_idx on public.time_capsules (created_at desc);

alter table public.time_capsules enable row level security;
grant select, insert on public.time_capsules to anon;
grant usage, select on all sequences in schema public to anon;

create policy "匿名閲覧: タイムカプセル" on public.time_capsules for select to anon using (true);
create policy "匿名作成: タイムカプセル" on public.time_capsules for insert to anon with check (true);

commit;
