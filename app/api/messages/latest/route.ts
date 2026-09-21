import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const birthdayPerson = searchParams.get('birthdayPerson')
    const requestedLimit = Number(searchParams.get('limit') || 5)
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 5
    const supabase = getSupabase()
    let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(limit)

    if (birthdayPerson) query = query.eq('birthday_person', birthdayPerson)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'メッセージを読み込めません' }, { status: 500 })

    return NextResponse.json({ data, count: data?.length || 0 })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
