import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const { data, error } = await getSupabase().from('birthdays').select('*').eq('id', id).single()

    if (error || !data) return NextResponse.json({ error: '誕生日が見つかりません' }, { status: 404 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
