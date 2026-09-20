import { NextResponse } from 'next/server'
import { listTodaysBirthdayThreads } from '@/lib/birthday/thread'
import { getServiceSupabase, isServerSupabaseConfigured } from '@/lib/supabase/server'

export async function GET() {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ data: [] }, { status: 200 })
  }
  const client = getServiceSupabase()
  try {
    const threads = await listTodaysBirthdayThreads(client)
    return NextResponse.json({ data: threads }, { status: 200 })
  } catch {
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
