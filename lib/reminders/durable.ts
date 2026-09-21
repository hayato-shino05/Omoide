import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createReminderEngine,
  type ReminderChannel,
  type ReminderEventType,
  type ReminderProvider,
  type ReminderStatus,
} from '@/lib/reminders/engine'

export interface ReminderDeliveryRecord {
  id: string
  eventId: string
  eventType: ReminderEventType
  recipientRef: string
  channel: ReminderChannel
  scheduledAt: string
  timezone: string
  idempotencyKey: string
  optedIn: boolean
  attemptCount: number
  status: ReminderStatus
  expiresAt?: string | null
}

export interface ReminderRepository {
  claimDue(workerId: string, now: Date, limit?: number): Promise<ReminderDeliveryRecord[]>
  markSent(id: string, workerId: string, sentAt: Date): Promise<boolean>
  markRetryable(id: string, workerId: string, attemptCount: number, errorCode: string, nextAttemptAt: Date): Promise<boolean>
  markFailed(id: string, workerId: string, attemptCount: number, errorCode: string, failedAt: Date): Promise<boolean>
  markCancelled(id: string, workerId: string, cancelledAt: Date): Promise<boolean>
  markExpired(id: string, workerId: string, expiredAt: Date): Promise<boolean>
}

export interface ReminderDeliverySummary {
  claimed: number
  sent: number
  retryable: number
  failed: number
  skipped: number
}

export interface ReminderServiceOptions {
  repository: ReminderRepository
  provider: ReminderProvider
  now: () => Date
  maxAttempts?: number
  batchSize?: number
}

function parseFailure(error: unknown): { code: string; transient: boolean } {
  if (typeof error !== 'object' || error === null) return { code: 'provider_failure', transient: false }
  const value = error as Record<string, unknown>
  return {
    code: typeof value.code === 'string' ? value.code : 'provider_failure',
    transient: value.transient === true,
  }
}

function isExpired(record: ReminderDeliveryRecord, now: Date): boolean {
  return Boolean(record.expiresAt && now >= new Date(record.expiresAt))
}

export function createReminderService(options: ReminderServiceOptions) {
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 3))
  const batchSize = Math.max(1, Math.floor(options.batchSize ?? 50))

  const deliverDue = async (workerId: string, requestedBatchSize = batchSize): Promise<ReminderDeliverySummary> => {
    const now = options.now()
    const records = await options.repository.claimDue(workerId, now, requestedBatchSize)
    const summary: ReminderDeliverySummary = { claimed: records.length, sent: 0, retryable: 0, failed: 0, skipped: 0 }
    const engine = createReminderEngine({ now: options.now, provider: options.provider, maxAttempts: 1 })

    for (const record of records) {
      if (!record.optedIn) {
        if (await options.repository.markCancelled(record.id, workerId, now)) summary.skipped += 1
        continue
      }
      if (isExpired(record, now)) {
        if (await options.repository.markExpired(record.id, workerId, now)) summary.skipped += 1
        continue
      }

      try {
        const job = { ...record, expiresAt: record.expiresAt ?? undefined }
        engine.validate(job)
        await options.provider.send(job)
      } catch (error) {
        const failure = parseFailure(error)
        const attemptCount = record.attemptCount + 1
        if (failure.transient && attemptCount < maxAttempts) {
          const nextAttemptAt = new Date(now.getTime() + 2 ** (attemptCount - 1) * 1000)
          if (await options.repository.markRetryable(record.id, workerId, attemptCount, failure.code, nextAttemptAt)) summary.retryable += 1
        } else if (await options.repository.markFailed(record.id, workerId, attemptCount, failure.code, now)) summary.failed += 1
        continue
      }

      if (await options.repository.markSent(record.id, workerId, now)) summary.sent += 1
    }

    return summary
  }

  return { deliverDue }
}

export interface ReminderSchedulerService {
  deliverDue(workerId: string, batchSize?: number): Promise<ReminderDeliverySummary>
}

export interface ReminderSchedulerOptions {
  service: ReminderSchedulerService
  workerId: string
  batchSize?: number
}

export function createReminderScheduler(options: ReminderSchedulerOptions) {
  return {
    runOnce: () => options.service.deliverDue(options.workerId, options.batchSize),
  }
}

export function createSupabaseReminderRepository(client: SupabaseClient): ReminderRepository {
  const update = async (id: string, workerId: string, values: Record<string, unknown>): Promise<boolean> => {
    const { data, error } = await client.from('notification_logs').update(values).eq('id', id).eq('status', 'processing').eq('leased_by', workerId).select('id')
    if (error) throw error
    return Array.isArray(data) && data.length === 1
  }

  return {
    async claimDue(workerId, now, limit = 50) {
      const { data, error } = await client.rpc('claim_notification_logs', {
        input_worker_id: workerId,
        input_now: now.toISOString(),
        input_limit: limit,
      })
      if (error) throw error
      if (!Array.isArray(data)) return []
      return data as ReminderDeliveryRecord[]
    },
    markSent: (id, workerId, sentAt) => update(id, workerId, { status: 'sent', sent_at: sentAt.toISOString(), updated_at: sentAt.toISOString(), lease_until: null, leased_by: null }),
    markRetryable: (id, workerId, attemptCount, errorCode, nextAttemptAt) => update(id, workerId, {
      status: 'retryable', attempt_count: attemptCount, last_error_code: errorCode, next_attempt_at: nextAttemptAt.toISOString(), updated_at: new Date().toISOString(), lease_until: null, leased_by: null,
    }),
    markFailed: (id, workerId, attemptCount, errorCode, failedAt) => update(id, workerId, {
      status: 'failed', attempt_count: attemptCount, last_error_code: errorCode, updated_at: failedAt.toISOString(), lease_until: null, leased_by: null,
    }),
    markCancelled: (id, workerId, cancelledAt) => update(id, workerId, { status: 'cancelled', updated_at: cancelledAt.toISOString(), lease_until: null, leased_by: null }),
    markExpired: (id, workerId, expiredAt) => update(id, workerId, { status: 'expired', updated_at: expiredAt.toISOString(), lease_until: null, leased_by: null }),
  }
}
