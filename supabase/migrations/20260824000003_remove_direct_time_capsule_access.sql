begin;

do $$
begin
  if to_regclass('public.time_capsules') is null then
    raise exception 'public.time_capsules must exist before removing direct Time Capsule access';
  end if;
  if not exists (select 1 from storage.buckets where id = 'time-capsules-private') then
    raise exception 'storage bucket time-capsules-private must exist before removing direct Time Capsule storage access';
  end if;
end
$$;

revoke all on public.time_capsules from authenticated;
revoke usage, select on all sequences in schema public from authenticated;
drop policy if exists "認証済み閲覧: タイムカプセル" on public.time_capsules;
drop policy if exists "認証済み作成: タイムカプセル" on public.time_capsules;

revoke select, insert on storage.objects from authenticated;
drop policy if exists "認証済み閲覧: タイムカプセルストレージ" on storage.objects;
drop policy if exists "認証済み作成: タイムカプセルストレージ" on storage.objects;

commit;
