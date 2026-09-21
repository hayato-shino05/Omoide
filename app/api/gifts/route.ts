import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    
    const birthdayPerson = searchParams.get('birthdayPerson')
    const requestedLimit = Number(searchParams.get('limit'))
    const validLimit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : undefined

    let query = supabase
      .from('virtual_gifts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (birthdayPerson) {
      query = query.eq('birthday_person', birthdayPerson)
    }

    if (validLimit) {
      query = query.limit(validLimit)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: 'ギフトを読み込めません' },
        { status: 500 }
      )
    }

    const giftStats = data?.reduce((acc, gift) => {
      const key = gift.gift_name
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({ data, count, giftStats })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await request.json()

    const { sender, gift_emoji, gift_name, birthday_person } = body

    if (!sender || !gift_emoji || !gift_name) {
      return NextResponse.json(
        { error: '必須項目が不足しています（sender, gift_emoji, gift_name）' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('virtual_gifts')
      .insert({
        sender: sender.trim(),
        gift_emoji,
        gift_name,
        birthday_person: birthday_person?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'ギフトを送信できません' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
