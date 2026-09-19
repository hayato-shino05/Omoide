import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase, isServerSupabaseConfigured } from '@/lib/supabase/server'
import { createHash } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const { roomId, hostId, hostToken, requestId, action } = await request.json()

    if (
      !roomId ||
      typeof roomId !== 'string' ||
      !hostId ||
      typeof hostId !== 'string' ||
      !requestId ||
      typeof requestId !== 'string' ||
      !action ||
      (action !== 'approve' && action !== 'reject')
    ) {
      return NextResponse.json({ error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    const hostTokenHash =
      typeof hostToken === 'string' && hostToken.trim()
        ? createHash('sha256').update(hostToken.trim()).digest('hex')
        : null

    // オフライン・ローカル開発用フォールバック
    if (!isServerSupabaseConfigured()) {
      return NextResponse.json(
        { success: true, song_requests: [], queue: action === 'approve' ? ['sample-track'] : [] },
        { status: 200 }
      )
    }

    const supabase = getServiceSupabase()

    const { data, error } = await supabase.rpc('respond_study_room_song_request', {
      p_room_id: roomId,
      p_host_id: hostId.trim(),
      p_host_token_hash: hostTokenHash,
      p_request_id: requestId.trim(),
      p_action: action,
    })

    if (error) {
      if (error.message === 'ROOM_NOT_FOUND') {
        return NextResponse.json({ error: '勉強部屋が見つかりません' }, { status: 404 })
      }
      if (error.message === 'UNAUTHORIZED_HOST') {
        return NextResponse.json({ error: 'ホスト権限の認証に失敗しました' }, { status: 403 })
      }
      console.error('[API study/respond-song-request] RPC Error:', error)
      return NextResponse.json({ error: 'リクエストの処理に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(data || { success: true }, { status: 200 })
  } catch (err) {
    console.error('[API study/respond-song-request] Server Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
