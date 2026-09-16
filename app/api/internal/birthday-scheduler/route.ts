import { randomUUID, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { listTodaysBirthdayThreads } from '@/lib/birthday/thread'
import { createServiceClient } from '@/lib/time-capsule/server'

function hasValidSchedulerSecret(request: NextRequest): boolean {
  const configuredSecret = process.env.BIRTHDAY_SCHEDULER_SECRET?.trim()
  const providedSecret = request.headers.get('x-birthday-scheduler-secret')?.trim()
  if (!configuredSecret || !providedSecret) return false

  const expected = Buffer.from(configuredSecret, 'utf8')
  const actual = Buffer.from(providedSecret, 'utf8')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidSchedulerSecret(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const correlationId = randomUUID()
  const now = new Date()
  try {
    const threads = await listTodaysBirthdayThreads(createServiceClient(), now)
    return NextResponse.json({ data: { processed: threads.length } }, { status: 200 })
  } catch {
    console.error(JSON.stringify({ event: 'birthday_scheduler_failed', correlationId }))
    return NextResponse.json({ error: '誕生日スレッドを生成できません' }, { status: 500 })
  }
}
