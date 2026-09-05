import { NextRequest, NextResponse } from 'next/server'
import { createBirthdayReply } from '@/lib/community/reply'
import { parseMusicTrackReference, toMusicTrackReference } from '@/lib/music/reference'

function parseText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

function parseOptionalText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized) return null
  return normalized.length <= maxLength ? normalized : undefined
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '投稿内容が無効です' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '投稿内容が無効です' }, { status: 400 })
  const input = body as Record<string, unknown>

  const postIdValue = input.postId
  const postId = typeof postIdValue === 'string' && /^\d+$/.test(postIdValue) ? Number(postIdValue) : null
  const sender = parseText(input.sender, 100)
  const content = parseOptionalText(input.content, 1000)
  const musicTrackValue = input.musicTrackId
  const musicReference = musicTrackValue === null || musicTrackValue === undefined || musicTrackValue === ''
    ? null
    : parseMusicTrackReference(musicTrackValue)
  if (!postId || !sender || content === undefined || (musicReference === null && musicTrackValue !== null && musicTrackValue !== undefined && musicTrackValue !== '')) {
    return NextResponse.json({ error: '投稿内容が無効です' }, { status: 400 })
  }
  const musicTrackId = musicReference ? toMusicTrackReference(musicReference) : null
  if (content === null && !musicTrackId) {
    return NextResponse.json({ error: '投稿内容が無効です' }, { status: 400 })
  }

  try {
    const data = await createBirthdayReply({ postId, sender, content, musicTrackId })
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '返信を送信できません' }, { status: 500 })
  }
}
