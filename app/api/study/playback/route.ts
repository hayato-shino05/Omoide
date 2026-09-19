import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { roomId, hostId, payload } = await request.json()

    if (!roomId || typeof roomId !== 'string' || !hostId || typeof hostId !== 'string' || !payload) {
      return NextResponse.json({ error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    const supabase = getSupabase()

    // 部屋情報の取得とホスト権限のサーバーサイド検証
    const { data: room, error: roomError } = await supabase
      .from('study_rooms')
      .select('id, host_id')
      .eq('id', roomId)
      .maybeSingle()

    if (roomError || !room) {
      return NextResponse.json({ error: '勉強部屋が見つかりません' }, { status: 404 })
    }

    if (room.host_id !== hostId) {
      return NextResponse.json({ error: 'BGMの操作権限がありません（ホスト限定）' }, { status: 403 })
    }

    // 再生状態の更新
    const { error: updateError } = await supabase
      .from('study_rooms')
      .update({
        current_track_id: payload.current_track_id !== undefined ? payload.current_track_id : undefined,
        epoch_started_at: payload.epoch_started_at !== undefined ? payload.epoch_started_at : undefined,
        playback_state: payload.playback_state !== undefined ? payload.playback_state : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId)
      .eq('host_id', hostId)

    if (updateError) {
      return NextResponse.json({ error: '再生状態の更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[API study/playback] Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
