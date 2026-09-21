import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = getSupabase()
    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()

    const { data: birthdays, error } = await supabase
      .from('birthdays')
      .select('id, name, month, day, year, message')
      .order('month', { ascending: true })
      .order('day', { ascending: true })

    if (error || !birthdays || birthdays.length === 0) {
      return NextResponse.json(
        { error: '誕生日データがありません' },
        { status: 404 }
      )
    }

    let nextBirthday = null
    let daysUntil = Infinity

    for (const birthday of birthdays) {
      const birthdayDate = new Date(today.getFullYear(), birthday.month - 1, birthday.day)
      
      // 今年すでに過ぎている場合は翌年の日付で計算
      if (birthdayDate < today) {
        birthdayDate.setFullYear(today.getFullYear() + 1)
      }

      const diff = Math.ceil((birthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diff < daysUntil) {
        daysUntil = diff
        nextBirthday = {
          ...birthday,
          nextDate: birthdayDate.toISOString(),
          daysUntil: diff,
        }
      }
    }

    const todayBirthdays = birthdays.filter(
      (b) => b.month === currentMonth && b.day === currentDay
    )

    return NextResponse.json({
      nextBirthday,
      todayBirthdays: todayBirthdays.length > 0 ? todayBirthdays : null,
      isBirthdayToday: todayBirthdays.length > 0,
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
