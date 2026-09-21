import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'

export interface MusicTrack {
  id: string
  name: string
  url: string
  duration?: number
  category: string
}

export const DEFAULT_MUSIC_TRACKS: MusicTrack[] = JAPAN_PRESET_TRACKS.map((track) => ({
  id: track.id,
  name: track.name,
  url: track.audioUrl,
  duration: track.duration,
  category: 'Birthday',
}))

export const MUSIC_CATEGORIES = ['Birthday']

export function getCuratedMusicTrack(trackId: string): MusicTrack | null {
  return DEFAULT_MUSIC_TRACKS.find((track) => track.id === trackId) ?? null
}
