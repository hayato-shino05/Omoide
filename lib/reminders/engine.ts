export const REMINDER_EVENT_TYPES = ['birthday', 'capsule_unlock'] as const
export type ReminderEventType = (typeof REMINDER_EVENT_TYPES)[number]

export const REMINDER_CHANNELS = ['in_app', 'email', 'web_push', 'line'] as const
export const APPROVED_REMINDER_CHANNELS = ['in_app'] as const
export type ReminderChannel = (typeof REMINDER_CHANNELS)[number]

export const REMINDER_STATUSES = ['pending', 'processing', 'sent', 'retryable', 'failed', 'cancelled', 'expired'] as const
export type ReminderStatus = (typeof REMINDER_STATUSES)[number]

export interface ReminderJob {
  eventId: string
  eventType: ReminderEventType
  recipientRef: string
  channel: ReminderChannel
  scheduledAt: string
  timezone: string
  idempotencyKey: string
  optedIn: boolean
  expiresAt?: string
}

export interface ReminderProvider {
  send(job: ReminderJob): Promise<void>
}

export interface ReminderResult {
  status: Exclude<ReminderStatus, 'processing'>
  attemptCount: number
  duplicate?: boolean
  errorCode?: string
}

export interface ReminderEngineOptions {
  now: () => Date
  provider: ReminderProvider
  maxAttempts?: number
}

interface ReminderFailure {
  code?: string
  transient?: boolean
}

function isAllowed<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value)
}

function parseFailure(error: unknown): ReminderFailure {
  if (typeof error !== 'object' || error === null) return {}
  const failure = error as Record<string, unknown>
  return {
    code: typeof failure.code === 'string' ? failure.code : undefined,
    transient: failure.transient === true,
  }
}

function validateTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format()
  } catch {
    throw new Error('Invalid IANA timezone')
  }
}

function validateScheduledAt(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid scheduledAt')
  return date
}

export function createReminderEngine(options: ReminderEngineOptions) {
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 3))
  const results = new Map<string, ReminderResult>()
  const inFlight = new Map<string, Promise<ReminderResult>>()

  const validate = (job: ReminderJob): void => {
    if (!job.eventId.trim() || !job.recipientRef.trim() || !job.idempotencyKey.trim()) {
      throw new Error('Reminder identifiers are required')
    }
    if (!isAllowed(job.eventType, REMINDER_EVENT_TYPES)) throw new Error('Invalid reminder event type')
    if (!isAllowed(job.channel, REMINDER_CHANNELS)) throw new Error('Invalid reminder channel')
    if (!isAllowed(job.channel, APPROVED_REMINDER_CHANNELS)) throw new Error('Reminder channel is not approved')
    validateTimezone(job.timezone)
    validateScheduledAt(job.scheduledAt)
    if (job.expiresAt) validateScheduledAt(job.expiresAt)
  }

  const process = async (job: ReminderJob): Promise<ReminderResult> => {
    validate(job)
    const now = options.now()
    const scheduledAt = validateScheduledAt(job.scheduledAt)
    const existing = results.get(job.idempotencyKey)
    if (existing && (existing.status !== 'pending' || scheduledAt > now)) {
      return { ...existing, duplicate: true }
    }
    if (!job.optedIn) {
      const result: ReminderResult = { status: 'cancelled', attemptCount: 0 }
      results.set(job.idempotencyKey, result)
      return result
    }
    if (job.expiresAt && now >= validateScheduledAt(job.expiresAt)) {
      const result: ReminderResult = { status: 'expired', attemptCount: 0 }
      results.set(job.idempotencyKey, result)
      return result
    }
    if (scheduledAt > now) {
      const result: ReminderResult = { status: 'pending', attemptCount: 0 }
      results.set(job.idempotencyKey, result)
      return result
    }

    const existingInFlight = inFlight.get(job.idempotencyKey)
    if (existingInFlight) return { ...(await existingInFlight), duplicate: true }

    const operation = (async (): Promise<ReminderResult> => {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          await options.provider.send(job)
          const result: ReminderResult = { status: 'sent', attemptCount: attempt }
          results.set(job.idempotencyKey, result)
          return result
        } catch (error) {
          const failure = parseFailure(error)
          if (!failure.transient || attempt === maxAttempts) {
            const result: ReminderResult = {
              status: 'failed',
              attemptCount: attempt,
              errorCode: failure.code ?? 'provider_failure',
            }
            results.set(job.idempotencyKey, result)
            return result
          }
        }
      }

      throw new Error('Reminder processing did not settle')
    })()
    inFlight.set(job.idempotencyKey, operation)

    try {
      return await operation
    } finally {
      inFlight.delete(job.idempotencyKey)
    }
  }

  return { validate, process }
}
