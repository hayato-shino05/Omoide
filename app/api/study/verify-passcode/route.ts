import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

// 非公開部屋のパスコードをサーバーサイドで安全に検証するAPIルート
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, passcode } = body || {}

    if (!roomId || typeof roomId !== 'string' || typeof passcode !== 'string') {
      return NextResponse.json({ valid: false, error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: room, error } = await supabase
      .from('study_rooms')
      .select('id, passcode')
      .eq('id', roomId)
      .maybeSingle()

    if (error || !room) {
      return NextResponse.json({ valid: false }, { status: 404 })
    }

    // パスコードの照合（クライアントへはパスコード本文を返却せず、真偽値のみ返却）
    const expectedPasscode = room.passcode ?? ''
    const isValid = expectedPasscode === passcode.trim()

    return NextResponse.json({ valid: isValid })
  } catch (err) {
    console.error('[StudyRoom] パスコード検証中にエラーが発生しました:', err)
    return NextResponse.json({ valid: false, error: 'サーバー内部エラーが発生しました' }, { status: 500 })
  }
}
