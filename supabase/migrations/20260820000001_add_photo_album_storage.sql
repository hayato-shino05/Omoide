begin;

-- フォトアルバム・ギャラリー専用 Storage バケットの追加（50MB上限、HEIC/HEIF/QuickTime対応）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photo-album',
  'photo-album',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS ポリシー
create policy "匿名閲覧: アルバムストレージ" on storage.objects for select to anon using (bucket_id = 'photo-album');
create policy "匿名作成: アルバムストレージ" on storage.objects for insert to anon with check (bucket_id = 'photo-album');

commit;
