begin;

grant usage, select on sequence
  public.messages_id_seq,
  public.media_submissions_id_seq,
  public.virtual_gifts_id_seq,
  public.chat_messages_id_seq,
  public.bulletin_posts_id_seq,
  public.post_replies_id_seq,
  public.music_tracks_id_seq
  to anon;

grant select, insert on table storage.objects to anon;

drop policy if exists "匿名閲覧: コミュニティメディア" on storage.objects;
drop policy if exists "匿名作成: コミュニティメディア" on storage.objects;
drop policy if exists "匿名閲覧: 音楽ストレージ" on storage.objects;
drop policy if exists "匿名作成: 音楽ストレージ" on storage.objects;
drop policy if exists "匿名閲覧: アバターストレージ" on storage.objects;
drop policy if exists "匿名作成: アバターストレージ" on storage.objects;
drop policy if exists "匿名閲覧: アルバムストレージ" on storage.objects;
drop policy if exists "匿名作成: アルバムストレージ" on storage.objects;
drop policy if exists "匿名閲覧: タイムカプセルストレージ" on storage.objects;
drop policy if exists "匿名作成: タイムカプセルストレージ" on storage.objects;

create policy "匿名閲覧: コミュニティメディア" on storage.objects
  for select to anon using (bucket_id = 'community-media');
create policy "匿名作成: コミュニティメディア" on storage.objects
  for insert to anon with check (bucket_id = 'community-media');
create policy "匿名閲覧: 音楽ストレージ" on storage.objects
  for select to anon using (bucket_id = 'music');
create policy "匿名作成: 音楽ストレージ" on storage.objects
  for insert to anon with check (bucket_id = 'music');
create policy "匿名閲覧: アバターストレージ" on storage.objects
  for select to anon using (bucket_id = 'avatars');
create policy "匿名作成: アバターストレージ" on storage.objects
  for insert to anon with check (bucket_id = 'avatars');
create policy "匿名閲覧: アルバムストレージ" on storage.objects
  for select to anon using (bucket_id = 'photo-album');
create policy "匿名作成: アルバムストレージ" on storage.objects
  for insert to anon with check (bucket_id = 'photo-album');

commit;
