begin;

revoke execute on function public.create_time_capsule_with_access_code(uuid, text, text, text, text, date, text, text, timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.create_time_capsule_with_access_code(uuid, text, text, text, text, date, text, text, timestamptz, text[]) to service_role;

revoke execute on function public.consume_time_capsule_access_code(text, text) from public, anon, authenticated;
grant execute on function public.consume_time_capsule_access_code(text, text) to service_role;

commit;
