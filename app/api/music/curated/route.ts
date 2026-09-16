import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hvtioiriavbgpavkkuqx.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('id, name, title, artist, duration, url, cover_url, lyrics_url, lyrics_lrc, is_preset, sort_order')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const tracks = (data || []).map((track) => ({
      id: String(track.id),
      provider: 'omoide' as const,
      trackId: String(track.id),
      reference: `omoide:${track.id}`,
      access: 'playable' as const,
      name: track.title || track.name,
      artistName: track.artist || 'Unknown Artist',
      duration: track.duration || 0,
      audioUrl: track.url,
      streamUrl: track.url,
      albumImage: track.cover_url || undefined,
      lyricsLrc: track.lyrics_lrc || undefined,
      sourceUrl: track.url,
    }))

    return NextResponse.json(
      { data: tracks, total: tracks.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tracks'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
