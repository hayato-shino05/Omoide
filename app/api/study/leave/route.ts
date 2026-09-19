import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'
import { createHash } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const { roomId, userIdentifier, memberToken } = await request.json()

    if (
      !roomId ||
      typeof roomId !== 'string' ||
      !userIdentifier ||
      typeof userIdentifier !== 'string' ||
      !userIdentifier.trim()
    ) {
      return NextResponse.json({ error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    const memberTokenHash =
      typeof memberToken === 'string' && memberToken.trim()
        ? createHash('sha256').update(memberToken.trim()).digest('hex')
        : null

    const supabase = getSupabase()

    const { data, error } = await supabase.rpc('leave_study_room', {
      p_room_id: roomId,
      p_user_identifier: userIdentifier.trim(),
      p_member_token_hash: memberTokenHash,
    })

    if (error) {
      if (error.message === 'UNAUTHORIZED_MEMBER') {
        return NextResponse.json({ error: '退室権限がありません' }, { status: 403 })
      }
      return NextResponse.json({ error: '退室処理に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    console.error('[API study/leave] Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
