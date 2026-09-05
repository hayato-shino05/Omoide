import { NextRequest, NextResponse } from 'next/server'
import { searchMusicTracks } from '@/lib/music/server'

const MAX_QUERY_LENGTH = 100
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim()
  const rawLimit = request.nextUrl.searchParams.get('limit') ?? ''
  const limit = /^\d{1,3}$/.test(rawLimit) ? Math.min(Number(rawLimit), MAX_LIMIT) : DEFAULT_LIMIT
  if (!query) return NextResponse.json({ data: [], total: 0 })
  if (query.length > MAX_QUERY_LENGTH) return NextResponse.json({ error: '検索語が長すぎます' }, { status: 400 })

  try {
    const data = await searchMusicTracks(query, limit)
    return NextResponse.json({ data, total: data.length })
  } catch {
    return NextResponse.json({ error: '音楽検索に失敗しました' }, { status: 502 })
  }
}
