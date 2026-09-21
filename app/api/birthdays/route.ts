import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = Number(searchParams.get('month'))
    const requestedLimit = Number(searchParams.get('limit'))
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : undefined
    const supabase = getSupabase()
    let query = supabase.from('birthdays').select('id, name, month, day, year, message, created_at').order('month').order('day')

    if (Number.isInteger(month) && month >= 1 && month <= 12) query = query.eq('month', month)
    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: '誕生日リストを読み込めません' }, { status: 500 })

    return NextResponse.json({ data, count: data?.length || 0 })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
