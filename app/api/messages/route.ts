import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const birthdayPerson = searchParams.get('birthdayPerson')
    const limit = Number(searchParams.get('limit'))
    const offset = Number(searchParams.get('offset'))
    const validLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : undefined
    const supabase = getSupabase()
    let query = supabase.from('messages').select('*', { count: 'exact' }).order('created_at', { ascending: false })

    if (birthdayPerson) query = query.eq('birthday_person', birthdayPerson)
    if (validLimit) query = query.limit(validLimit)
    if (Number.isInteger(offset) && offset >= 0) query = query.range(offset, offset + (validLimit ?? 10) - 1)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: 'メッセージを読み込めません' }, { status: 500 })

    return NextResponse.json({ data, count })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sender, message, birthday_person: birthdayPerson, media_object_path: mediaObjectPath } = await request.json()

    if (typeof sender !== 'string' || !sender.trim() || sender.trim().length > 100 || typeof message !== 'string' || !message.trim() || message.trim().length > 1000) {
      return NextResponse.json({ error: '送信者名またはメッセージが無効です' }, { status: 400 })
    }

    const { data, error } = await getSupabase()
      .from('messages')
      .insert({
        sender: sender.trim(),
        message: message.trim(),
        birthday_person: typeof birthdayPerson === 'string' && birthdayPerson.trim() ? birthdayPerson.trim() : null,
        media_object_path: typeof mediaObjectPath === 'string' && mediaObjectPath.trim() ? mediaObjectPath.trim() : null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'メッセージを送信できません' }, { status: 500 })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
