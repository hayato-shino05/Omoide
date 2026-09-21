begin;

create table if not exists public.time_capsule_access_attempt_buckets (
  bucket_fingerprint text primary key,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint time_capsule_access_attempt_buckets_fingerprint_check check (length(bucket_fingerprint) = 64),
  constraint time_capsule_access_attempt_buckets_failed_attempts_check check (failed_attempts >= 0)
);

alter table public.time_capsule_access_attempt_buckets enable row level security;

revoke all on public.time_capsule_access_attempt_buckets from anon, authenticated;
grant select, insert, update on public.time_capsule_access_attempt_buckets to service_role;

drop function if exists public.consume_time_capsule_access_code(text);

create or replace function public.consume_time_capsule_access_code(
  input_code_hash text,
  input_attempt_bucket text
)
returns table (capsule_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  access_row public.time_capsule_access_codes%rowtype;
  bucket_row public.time_capsule_access_attempt_buckets%rowtype;
begin
  insert into public.time_capsule_access_attempt_buckets (bucket_fingerprint)
  values (input_attempt_bucket)
  on conflict (bucket_fingerprint) do nothing;

  select * into bucket_row
  from public.time_capsule_access_attempt_buckets
  where bucket_fingerprint = input_attempt_bucket
  for update;

  if bucket_row.locked_until is not null and bucket_row.locked_until > now() then
    return;
  end if;

  if bucket_row.locked_until is not null and bucket_row.locked_until <= now() then
    update public.time_capsule_access_attempt_buckets
    set failed_attempts = 0,
        locked_until = null,
        updated_at = now()
    where bucket_fingerprint = input_attempt_bucket;
  end if;

  select ac.* into access_row
  from public.time_capsule_access_codes ac
  join public.time_capsules tc on tc.id = ac.capsule_id
  where ac.code_hash = input_code_hash
    and ac.revoked_at is null
    and (ac.locked_until is null or ac.locked_until <= now())
    and tc.invite_revoked_at is null
  for update;

  if not found then
    update public.time_capsule_access_attempt_buckets
    set failed_attempts = failed_attempts + 1,
        locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end,
        updated_at = now()
    where bucket_fingerprint = input_attempt_bucket;
    return;
  end if;

  update public.time_capsule_access_attempt_buckets
  set failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where bucket_fingerprint = input_attempt_bucket;

  update public.time_capsule_access_codes
  set failed_attempts = 0,
      locked_until = null,
      last_used_at = now()
  where id = access_row.id;

  return query select access_row.capsule_id;
end;
$$;

revoke all on function public.consume_time_capsule_access_code(text, text) from public;
grant execute on function public.consume_time_capsule_access_code(text, text) to service_role;

commit;
