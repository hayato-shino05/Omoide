begin;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'time_capsule_photo_object_path_length'
      and conrelid = 'public.time_capsules'::regclass
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'time_capsules_photo_object_path_length'
      and conrelid = 'public.time_capsules'::regclass
  ) then
    alter table public.time_capsules
      rename constraint time_capsule_photo_object_path_length
      to time_capsules_photo_object_path_length;
  end if;
end
$$;

commit;
