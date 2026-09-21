begin;

drop policy if exists "time_capsules_private_deny_public_access" on public.time_capsules;
drop policy if exists "time_capsule_access_codes_private_deny_public_access" on public.time_capsule_access_codes;
drop policy if exists "time_capsule_access_attempt_buckets_private_deny_public_access" on public.time_capsule_access_attempt_buckets;

commit;
