import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { roomId, member, passcode } = await request.json()

    if (
      !roomId ||
      typeof roomId !== 'string' ||
      !member ||
      typeof member.user_identifier !== 'string' ||
      !member.user_identifier.trim() ||
      typeof member.display_name !== 'string' ||
      !member.display_name.trim()
    ) {
      return NextResponse.json({ error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Security Definer RPC でパスコード検証・定員制限・メンバー参加をアトミックに実行
    const { data, error } = await supabase.rpc('join_study_room', {
      p_room_id: roomId,
      p_user_identifier: member.user_identifier.trim(),
      p_display_name: member.display_name.trim(),
      p_avatar_url: member.avatar_url ? member.avatar_url.trim() : null,
      p_passcode: passcode ? String(passcode).trim() : null,
    })

    if (error) {
      if (error.message === 'ROOM_NOT_FOUND') {
        return NextResponse.json({ error: '勉強部屋が見つかりません' }, { status: 404 })
      }
      if (error.message === 'INVALID_PASSCODE') {
        return NextResponse.json({ error: 'パスコードが正しくありません' }, { status: 403 })
      }
      if (error.message === 'ROOM_FULL') {
        return NextResponse.json({ error: '部屋が満席のため参加できません' }, { status: 409 })
      }
      return NextResponse.json({ error: '部屋への参加処理に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    console.error('[API study/join] Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
