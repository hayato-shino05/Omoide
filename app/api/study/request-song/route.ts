import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase, isServerSupabaseConfigured } from '@/lib/supabase/server'
import { createHash, randomUUID } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const { roomId, userIdentifier, memberToken, trackId, trackName, artistName, albumImage } =
      await request.json()

    if (
      !roomId ||
      typeof roomId !== 'string' ||
      !userIdentifier ||
      typeof userIdentifier !== 'string' ||
      !trackId ||
      typeof trackId !== 'string' ||
      !trackName ||
      typeof trackName !== 'string'
    ) {
      return NextResponse.json({ error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    const memberTokenHash =
      typeof memberToken === 'string' && memberToken.trim()
        ? createHash('sha256').update(memberToken.trim()).digest('hex')
        : null

    // オフライン・ローカル開発用フォールバック
    if (!isServerSupabaseConfigured()) {
      const mockRequest = {
        id: randomUUID(),
        track_id: trackId.trim(),
        track_name: trackName.trim(),
        artist_name: artistName ? String(artistName).trim() : 'Unknown Artist',
        album_image: albumImage ? String(albumImage).trim() : null,
        requested_by_id: userIdentifier.trim(),
        requested_by_name: 'Member',
        created_at: new Date().toISOString(),
      }
      return NextResponse.json({ success: true, song_requests: [mockRequest] }, { status: 200 })
    }

    const supabase = getServiceSupabase()

    const { data: updatedRequests, error } = await supabase.rpc('request_study_room_song', {
      p_room_id: roomId,
      p_user_identifier: userIdentifier.trim(),
      p_member_token_hash: memberTokenHash,
      p_track_id: trackId.trim(),
      p_track_name: trackName.trim(),
      p_artist_name: artistName ? String(artistName).trim() : 'Unknown Artist',
      p_album_image: albumImage ? String(albumImage).trim() : null,
    })

    if (error) {
      if (error.message === 'ROOM_NOT_FOUND') {
        return NextResponse.json({ error: '勉強部屋が見つかりません' }, { status: 404 })
      }
      if (error.message === 'MEMBER_NOT_FOUND') {
        return NextResponse.json({ error: '部屋に参加していません' }, { status: 404 })
      }
      if (error.message === 'UNAUTHORIZED_MEMBER') {
        return NextResponse.json({ error: 'メンバー認証に失敗しました' }, { status: 403 })
      }
      if (error.message === 'REQUEST_QUEUE_FULL') {
        return NextResponse.json({ error: 'リクエスト待機数が上限（10曲）に達しています' }, { status: 429 })
      }
      console.error('[API study/request-song] RPC Error:', error)
      return NextResponse.json({ error: '楽曲リクエストの送信に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, song_requests: updatedRequests }, { status: 200 })
  } catch (err) {
    console.error('[API study/request-song] Server Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
