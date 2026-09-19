import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { roomId, hostId, payload } = await request.json()

    if (!roomId || typeof roomId !== 'string' || !hostId || typeof hostId !== 'string' || !payload) {
      return NextResponse.json({ error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Security Definer RPC でホスト権限の検証および再生状態の更新を実行
    const { data, error } = await supabase.rpc('update_study_room_playback', {
      p_room_id: roomId,
      p_host_id: hostId.trim(),
      p_current_track_id: payload.current_track_id ?? null,
      p_epoch_started_at: payload.epoch_started_at ?? new Date().toISOString(),
      p_playback_state: payload.playback_state ?? 'playing',
    })

    if (error) {
      if (error.message === 'ROOM_NOT_FOUND') {
        return NextResponse.json({ error: '勉強部屋が見つかりません' }, { status: 404 })
      }
      if (error.message === 'UNAUTHORIZED_HOST') {
        return NextResponse.json({ error: 'BGMの操作権限がありません（ホスト限定）' }, { status: 403 })
      }
      return NextResponse.json({ error: '再生状態の更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    console.error('[API study/playback] Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
