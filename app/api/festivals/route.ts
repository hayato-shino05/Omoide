import { NextResponse } from 'next/server'
import { getFestivalPacks } from '@/lib/festivals/server'

export const runtime = 'nodejs'
export const revalidate = 86400

export async function GET() {
  const packs = await getFestivalPacks()
  return NextResponse.json(packs, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
