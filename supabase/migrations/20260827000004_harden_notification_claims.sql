begin;

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
    where (
      status in ('pending', 'retryable')
      and scheduled_at <= input_now
      and (next_attempt_at is null or next_attempt_at <= input_now)
      and (lease_until is null or lease_until <= input_now)
    ) or (
      status = 'processing'
      and lease_until <= input_now
    )
    order by scheduled_at asc, id asc
    for update skip locked
    limit greatest(1, least(coalesce(input_limit, 50), 100))
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

commit;
