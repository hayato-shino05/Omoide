begin;

do $$
begin
  if to_regclass('public.time_capsules') is null then
    raise exception 'public.time_capsules must exist before expanding Time Capsule security';
  end if;
  if not exists (select 1 from storage.buckets where id = 'time-capsules') then
    raise exception 'storage bucket time-capsules must exist before hardening Time Capsule storage';
  end if;
end
$$;

alter table public.time_capsules
  add column if not exists owner_id uuid,
  add column if not exists idempotency_key text,
  add column if not exists invite_token_hash text,
  add column if not exists invite_token_expires_at timestamptz,
  add column if not exists invite_revoked_at timestamptz,
  add column if not exists photo_object_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'time_capsules_owner_id_fkey'
      and conrelid = 'public.time_capsules'::regclass
  ) then
    alter table public.time_capsules
      add constraint time_capsules_owner_id_fkey
      foreign key (owner_id) references auth.users(id) on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'time_capsules_idempotency_key_length'
      and conrelid = 'public.time_capsules'::regclass
  ) then
    alter table public.time_capsules
      add constraint time_capsules_idempotency_key_length
      check (idempotency_key is null or char_length(btrim(idempotency_key)) between 1 and 128);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'time_capsules_invite_token_hash_length'
      and conrelid = 'public.time_capsules'::regclass
  ) then
    alter table public.time_capsules
      add constraint time_capsules_invite_token_hash_length
      check (invite_token_hash is null or char_length(btrim(invite_token_hash)) between 1 and 128);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'time_capsules_photo_object_path_length'
      and conrelid = 'public.time_capsules'::regclass
  ) then
    alter table public.time_capsules
      add constraint time_capsules_photo_object_path_length
      check (photo_object_path is null or char_length(btrim(photo_object_path)) between 1 and 500);
  end if;
end
$$;

create unique index if not exists time_capsules_owner_idempotency_key_uidx
  on public.time_capsules (owner_id, idempotency_key)
  where owner_id is not null and idempotency_key is not null;

create unique index if not exists time_capsules_invite_token_hash_uidx
  on public.time_capsules (invite_token_hash)
  where invite_token_hash is not null;

create index if not exists time_capsules_owner_unlock_date_idx
  on public.time_capsules (owner_id, unlock_date asc);

create index if not exists time_capsules_invite_token_expires_at_idx
  on public.time_capsules (invite_token_hash, invite_token_expires_at)
  where invite_token_hash is not null and invite_revoked_at is null;

grant select, insert on public.time_capsules to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "認証済み閲覧: タイムカプセル" on public.time_capsules;
drop policy if exists "認証済み作成: タイムカプセル" on public.time_capsules;
create policy "認証済み閲覧: タイムカプセル"
  on public.time_capsules for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "認証済み作成: タイムカプセル"
  on public.time_capsules for insert to authenticated
  with check (owner_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'time-capsules-private',
  'time-capsules-private',
  false,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'time-capsules'
on conflict (id) do update set
  public = false;

drop policy if exists "認証済み閲覧: タイムカプセルストレージ"
  on storage.objects;
drop policy if exists "認証済み作成: タイムカプセルストレージ"
  on storage.objects;
create policy "認証済み閲覧: タイムカプセルストレージ"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'time-capsules-private'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "認証済み作成: タイムカプセルストレージ"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'time-capsules-private'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
