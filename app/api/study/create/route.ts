import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'
import { randomBytes, createHash } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const { name, description, host_id, is_private, passcode, current_track_id, theme_override } =
      await request.json()

    if (!name || typeof name !== 'string' || !name.trim() || !host_id || typeof host_id !== 'string') {
      return NextResponse.json({ error: '無効なリクエストパラメータです' }, { status: 400 })
    }

    // 暗号学的に安全なホストトークンを生成
    const hostToken = randomBytes(32).toString('hex')
    const hostTokenHash = createHash('sha256').update(hostToken).digest('hex')

    const supabase = getSupabase()

    const { data: roomData, error: roomError } = await supabase.rpc('create_study_room', {
      p_name: name.trim(),
      p_description: description ? String(description).trim() : null,
      p_host_id: host_id.trim(),
      p_host_token_hash: hostTokenHash,
      p_is_private: Boolean(is_private),
      p_passcode: passcode ? String(passcode).trim() : null,
      p_current_track_id: current_track_id ? String(current_track_id).trim() : null,
      p_theme_override: theme_override ? String(theme_override).trim() : null,
    })

    if (roomError || !roomData) {
      console.error('[API study/create] RPC Error:', roomError)
      return NextResponse.json({ error: '部屋の作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: roomData,
        hostToken,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[API study/create] Server Error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
