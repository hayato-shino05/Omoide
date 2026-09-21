import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    
    // 指定された日付、なければ今日の日付で確認
    const dateParam = searchParams.get('date')
    const checkDate = dateParam ? new Date(dateParam) : new Date()
    
    const month = checkDate.getMonth() + 1
    const day = checkDate.getDate()

    const { data: birthdays, error } = await supabase
      .from('birthdays')
      .select('id, name, month, day, year, message')
      .eq('month', month)
      .eq('day', day)

    if (error) {
      return NextResponse.json(
        { error: '誕生日を確認できません' },
        { status: 500 }
      )
    }

    const isBirthday = birthdays && birthdays.length > 0

    return NextResponse.json({
      isBirthday,
      date: checkDate.toISOString().split('T')[0],
      birthdays: isBirthday ? birthdays : [],
      count: birthdays?.length || 0,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
