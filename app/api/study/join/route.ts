import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase/server'
import { randomBytes, createHash } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const { roomId, member, passcode, memberToken } = await request.json()

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

    // 既存メンバートークンの検証または新規メンバートークンの生成
    let effectiveMemberToken = typeof memberToken === 'string' && memberToken.trim() ? memberToken.trim() : null
    let isNewToken = false

    if (!effectiveMemberToken) {
      effectiveMemberToken = randomBytes(32).toString('hex')
      isNewToken = true
    }

    const memberTokenHash = createHash('sha256').update(effectiveMemberToken).digest('hex')

    const supabase = getServiceSupabase()

    // Security Definer RPC でパスコード検証・トークン照合・定員制限・メンバー参加をアトミックに実行
    const { data, error } = await supabase.rpc('join_study_room', {
      p_room_id: roomId,
      p_user_identifier: member.user_identifier.trim(),
      p_display_name: member.display_name.trim(),
      p_avatar_url: member.avatar_url ? member.avatar_url.trim() : null,
      p_passcode: passcode ? String(passcode).trim() : null,
      p_member_token_hash: memberTokenHash,
    })

    if (error) {
      if (error.message === 'ROOM_NOT_FOUND') {
        return NextResponse.json({ error: '勉強部屋が見つかりません' }, { status: 404 })
      }
      if (error.message === 'INVALID_PASSCODE') {
        return NextResponse.json({ error: 'パスコードが正しくありません' }, { status: 403 })
      }
      if (error.message === 'INVALID_MEMBER_TOKEN') {
        return NextResponse.json(
          { error: 'メンバー識別子の認証に失敗しました（なりすまし防止）' },
          { status: 403 }
        )
      }
      if (error.message === 'ROOM_FULL') {
        return NextResponse.json({ error: '部屋が満席のため参加できません' }, { status: 409 })
      }
      return NextResponse.json({ error: '部屋への参加処理に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(
      {
        data,
        memberToken: effectiveMemberToken,
        isNewToken,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[API study/join] Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
