begin;

alter table public.time_capsules
  add column if not exists opened_at timestamptz;

create index if not exists time_capsules_opened_at_idx
  on public.time_capsules (opened_at)
  where opened_at is not null;

commit;
