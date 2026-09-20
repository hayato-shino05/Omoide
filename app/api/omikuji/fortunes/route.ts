import { NextResponse } from 'next/server'
import { getDailyFortunes } from '@/lib/omikuji/server'

export const runtime = 'nodejs'
export const revalidate = 3600

export async function GET() {
  const fortunes = await getDailyFortunes()
  return NextResponse.json(fortunes, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
