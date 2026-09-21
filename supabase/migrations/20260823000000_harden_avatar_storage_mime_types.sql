begin;

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'avatars'
  ) then
    raise exception 'storage bucket avatars does not exist';
  end if;
end
$$;

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]::text[]
where id = 'avatars';

commit;
