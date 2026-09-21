import { NextResponse } from 'next/server'
import { getMemoryDecks } from '@/lib/games/memoryDecks.server'

export const runtime = 'nodejs'
export const revalidate = 3600

export async function GET() {
  const decks = await getMemoryDecks()
  return NextResponse.json(decks, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
