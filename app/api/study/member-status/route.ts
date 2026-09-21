import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'
import { createHash } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const { roomId, userIdentifier, memberToken, focusStatus, streakMinutes } = await request.json()

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

    const supabase = getServiceSupabase()

    const { data, error } = await supabase.rpc('update_study_room_member_status', {
      p_room_id: roomId,
      p_user_identifier: userIdentifier.trim(),
      p_member_token_hash: memberTokenHash,
      p_focus_status: focusStatus ? String(focusStatus).trim() : 'focusing',
      p_streak_minutes: typeof streakMinutes === 'number' ? streakMinutes : 0,
    })

    if (error) {
      if (error.message === 'MEMBER_NOT_FOUND') {
        return NextResponse.json({ error: 'メンバーが見つかりません' }, { status: 404 })
      }
      if (error.message === 'UNAUTHORIZED_MEMBER') {
        return NextResponse.json({ error: 'メンバーの操作権限がありません' }, { status: 403 })
      }
      return NextResponse.json({ error: 'ステータスの更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    console.error('[API study/member-status] Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
