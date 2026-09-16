import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listTodaysBirthdayThreads } from '@/lib/birthday/thread'
import { createServiceClient } from '@/lib/time-capsule/server'

function getClient() {
  try {
    return createServiceClient()
  } catch {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvtioiriavbgpavkkuqx.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
}

export async function GET() {
  const client = getClient()
  try {
    const threads = await listTodaysBirthdayThreads(client)
    return NextResponse.json({ data: threads }, { status: 200 })
  } catch {
    // 権限制約やオフライン時は既存のシステムスレッドまたは空配列を安全にフォールバック返却
    try {
      const { data: posts } = await client
        .from('bulletin_posts')
        .select('id, sender, message, birthday_person, celebration_date, timezone, created_at')
        .eq('is_system_generated', true)
        .order('created_at', { ascending: false })
        .limit(10)
      const fallbackThreads = (posts ?? []).map((post) => ({
        ...post,
        birthday_event_key: null,
        coverUrl: null,
      }))
      return NextResponse.json({ data: fallbackThreads }, { status: 200 })
    } catch {
      return NextResponse.json({ data: [] }, { status: 200 })
    }
  }
}
