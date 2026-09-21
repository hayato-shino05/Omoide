import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const birthdayPerson = searchParams.get('birthdayPerson')
    const limit = Number(searchParams.get('limit'))

    let query = getSupabase()
      .from('media_submissions')
      .select('*', { count: 'exact' })
      .eq('media_kind', 'video')
      .order('created_at', { ascending: false })

    if (birthdayPerson) query = query.eq('birthday_person', birthdayPerson)
    if (Number.isInteger(limit) && limit > 0) query = query.limit(limit)

    const { data, error, count } = await query
    if (error) {
      return NextResponse.json({ error: 'ビデオを読み込めません' }, { status: 500 })
    }

    return NextResponse.json({ data, count })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
