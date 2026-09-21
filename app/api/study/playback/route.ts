import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase, isServerSupabaseConfigured } from '@/lib/supabase/server'
import { createHash, createHmac } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const { roomId, hostId, hostToken, payload } = await request.json()

    if (!roomId || typeof roomId !== 'string' || !hostId || typeof hostId !== 'string' || !payload) {
      return NextResponse.json({ error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    const hostTokenHash =
      typeof hostToken === 'string' && hostToken.trim()
        ? createHash('sha256').update(hostToken.trim()).digest('hex')
        : null

    // オフライン・ローカル開発用のフォールバック処理（Supabase環境変数が未設定の場合）
    if (!isServerSupabaseConfigured()) {
      const secretKey = hostTokenHash || 'omoide-study-secret'
      const signPayload = `${roomId}:${payload.current_track_id || ''}:${payload.playback_state || 'playing'}`
      const signature = createHmac('sha256', secretKey).update(signPayload).digest('hex')

      return NextResponse.json({ success: true, signature }, { status: 200 })
    }

    const supabase = getServiceSupabase()

    // Security Definer RPC でホスト権限およびホストトークンの検証、再生状態およびキュー・シャッフル・リピート状態の更新を実行
    const { data, error } = await supabase.rpc('update_study_room_playback', {
      p_room_id: roomId,
      p_host_id: hostId.trim(),
      p_host_token_hash: hostTokenHash,
      p_current_track_id: payload.current_track_id ?? null,
      p_epoch_started_at: payload.epoch_started_at ?? new Date().toISOString(),
      p_playback_state: payload.playback_state ?? 'playing',
      p_queue: payload.queue ? payload.queue : null,
      p_current_track_index: typeof payload.current_track_index === 'number' ? payload.current_track_index : null,
      p_is_shuffle: typeof payload.is_shuffle === 'boolean' ? payload.is_shuffle : null,
      p_repeat_mode: payload.repeat_mode ? String(payload.repeat_mode).trim() : null,
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

    // ブロードキャスト検証用の暗号署名を生成
    const secretKey = hostTokenHash || 'omoide-study-secret'
    const signPayload = `${roomId}:${payload.current_track_id || ''}:${payload.playback_state || 'playing'}`
    const signature = createHmac('sha256', secretKey).update(signPayload).digest('hex')

    return NextResponse.json({ success: true, data, signature }, { status: 200 })
  } catch (err) {
    console.error('[API study/playback] Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
