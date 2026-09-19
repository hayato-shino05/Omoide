import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { roomId, passcode } = await request.json()

    if (!roomId || typeof roomId !== 'string' || typeof passcode !== 'string') {
      return NextResponse.json({ valid: false, error: '無効なリクエストです' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // パスコードを含む非公開部屋の検証（サーバーサイドでのみ検証し、クライアントには結果のみ返却）
    const { data: room, error } = await supabase
      .from('study_rooms')
      .select('id, is_private, passcode')
      .eq('id', roomId)
      .maybeSingle()

    if (error || !room) {
      return NextResponse.json({ valid: false, error: '部屋が見つかりません' }, { status: 404 })
    }

    if (!room.is_private) {
      return NextResponse.json({ valid: true }, { status: 200 })
    }

    const isMatch = room.passcode === passcode.trim()
    return NextResponse.json({ valid: isMatch }, { status: 200 })
  } catch (err) {
    console.error('[API verify-passcode] Error:', err)
    return NextResponse.json({ valid: false, error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
