import { NextRequest, NextResponse } from 'next/server'
import { resolveMusicTrack } from '@/lib/music/server'
import { parseMusicTrackReference, toMusicTrackReference } from '@/lib/music/reference'

export async function GET(request: NextRequest) {
  const reference = parseMusicTrackReference(request.nextUrl.searchParams.get('ref'))
  if (!reference) return NextResponse.json({ error: '楽曲参照が無効です' }, { status: 400 })

  try {
    const track = await resolveMusicTrack(toMusicTrackReference(reference))
    if (!track) return NextResponse.json({ error: '楽曲を再生できません' }, { status: 404 })
    return NextResponse.json({ data: track }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: '楽曲を再生できません' }, { status: 502 })
  }
}
