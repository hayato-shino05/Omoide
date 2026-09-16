import type { LegacySearchTrack } from './types'

const streamUrl = (trackId: string): string =>
  `https://mp3l.jamendo.com/?trackid=${trackId}&format=mp31&from=app-devsite`

export function getJamendoStreamUrl(trackId: string): string | null {
  return /^\d{1,12}$/.test(trackId) ? streamUrl(trackId) : null
}

/**
 * プリセットの静的フォールバック配列
 * 実際の全曲リストと優先順位は Supabase (public.music_tracks.sort_order) から動的に取得されます
 */
export const JAPAN_PRESET_TRACKS: LegacySearchTrack[] = []
