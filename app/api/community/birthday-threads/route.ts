import { NextResponse } from 'next/server'
import { listTodaysBirthdayThreads } from '@/lib/birthday/thread'
import { createServiceClient } from '@/lib/time-capsule/server'

export async function GET() {
  try {
    const threads = await listTodaysBirthdayThreads(createServiceClient())
    return NextResponse.json({ data: threads }, { status: 200 })
  } catch {
    return NextResponse.json({ error: '誕生日スレッドを取得できません' }, { status: 500 })
  }
}
