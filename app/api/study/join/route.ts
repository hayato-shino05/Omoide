import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'
import type { StudyRoomMember } from '@/types/study'

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

    // 部屋情報およびパスコード・最大収容人数の取得（サーバーサイド検証）
    const { data: room, error: roomError } = await supabase
      .from('study_rooms')
      .select('id, is_private, passcode, max_members')
      .eq('id', roomId)
      .maybeSingle()

    if (roomError || !room) {
      return NextResponse.json({ error: '勉強部屋が見つかりません' }, { status: 404 })
    }

    // 非公開部屋の場合はパスコードを検証
    if (room.is_private) {
      if (!passcode || typeof passcode !== 'string' || room.passcode !== passcode.trim()) {
        return NextResponse.json({ error: 'パスコードが正しくありません' }, { status: 403 })
      }
    }

    const maxMembers = room.max_members || 20
    const activeThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // 既存のアクティブメンバー一覧を取得し、上限チェック
    const { data: existingMembers, error: membersError } = await supabase
      .from('study_room_members')
      .select('user_identifier, last_heartbeat_at')
      .eq('room_id', roomId)

    if (membersError) {
      return NextResponse.json({ error: 'メンバー情報の確認に失敗しました' }, { status: 500 })
    }

    const activeMembers = ((existingMembers as StudyRoomMember[]) || []).filter(
      (m) => m.last_heartbeat_at && m.last_heartbeat_at >= activeThreshold
    )
    const isAlreadyMember = ((existingMembers as StudyRoomMember[]) || []).some(
      (m) => m.user_identifier === member.user_identifier
    )

    // 満席かつ新規入室の場合は拒絶
    if (!isAlreadyMember && activeMembers.length >= maxMembers) {
      return NextResponse.json({ error: '部屋が満席のため参加できません' }, { status: 409 })
    }

    // メンバーの参加（upsert）
    const { data: savedMember, error: upsertError } = await supabase
      .from('study_room_members')
      .upsert(
        {
          room_id: roomId,
          user_identifier: member.user_identifier.trim(),
          display_name: member.display_name.trim(),
          avatar_url: member.avatar_url || null,
          focus_status: 'focusing',
          last_heartbeat_at: new Date().toISOString(),
        },
        { onConflict: 'room_id,user_identifier' }
      )
      .select()
      .single()

    if (upsertError || !savedMember) {
      return NextResponse.json({ error: '部屋への参加処理に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ data: savedMember }, { status: 200 })
  } catch (err) {
    console.error('[API study/join] Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
