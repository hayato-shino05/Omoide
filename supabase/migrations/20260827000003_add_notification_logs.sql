begin;

create table if not exists public.notification_logs (
  id bigint generated always as identity primary key,
  event_id text not null,
  event_type text not null check (event_type in ('birthday', 'capsule_unlock')),
  recipient_ref text not null,
  channel text not null check (channel in ('in_app')),
  scheduled_at timestamptz not null,
  timezone text not null,
  idempotency_key text not null unique,
  opted_in boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'retryable', 'failed', 'cancelled', 'expired')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error_code text,
  next_attempt_at timestamptz,
  expires_at timestamptz,
  sent_at timestamptz,
  leased_by text,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_logs_due_idx
  on public.notification_logs (status, scheduled_at, next_attempt_at);

alter table public.notification_logs enable row level security;

create or replace function public.claim_notification_logs(
  input_worker_id text,
  input_now timestamptz,
  input_limit integer default 50
)
returns setof public.notification_logs
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select id
    from public.notification_logs
    where status in ('pending', 'retryable')
      and scheduled_at <= input_now
      and (next_attempt_at is null or next_attempt_at <= input_now)
      and (lease_until is null or lease_until <= input_now)
    order by scheduled_at asc, id asc
    for update skip locked
    limit greatest(1, least(input_limit, 100))
  )
  update public.notification_logs log
  set status = 'processing',
      leased_by = input_worker_id,
      lease_until = input_now + interval '5 minutes',
      updated_at = input_now
  from candidates
  where log.id = candidates.id
  returning log.*;
$$;

revoke all on table public.notification_logs from anon, authenticated;
revoke all on function public.claim_notification_logs(text, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.claim_notification_logs(text, timestamptz, integer) to service_role;

grant select, update on table public.notification_logs to service_role;

grant usage, select on sequence public.notification_logs_id_seq to service_role;

commit;
