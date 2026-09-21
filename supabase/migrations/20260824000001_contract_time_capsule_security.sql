begin;

do $$
begin
  if to_regclass('public.time_capsules') is null then
    raise exception 'public.time_capsules must exist before contracting Time Capsule access';
  end if;
  if not exists (select 1 from storage.buckets where id = 'time-capsules') then
    raise exception 'storage bucket time-capsules must exist before contracting Time Capsule storage';
  end if;
  if not exists (select 1 from storage.buckets where id = 'time-capsules-private') then
    raise exception 'storage bucket time-capsules-private must exist before contracting Time Capsule storage';
  end if;
end
$$;

revoke select, insert on public.time_capsules from anon;
drop policy if exists "匿名閲覧: タイムカプセル" on public.time_capsules;
drop policy if exists "匿名作成: タイムカプセル" on public.time_capsules;

update storage.buckets
set public = false
where id = 'time-capsules';

drop policy if exists "匿名閲覧: タイムカプセルストレージ" on storage.objects;
drop policy if exists "匿名作成: タイムカプセルストレージ" on storage.objects;

commit;
