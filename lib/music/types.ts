export const MUSIC_PROVIDERS = ['soundcloud', 'jamendo', 'omoide'] as const

export type MusicProvider = (typeof MUSIC_PROVIDERS)[number]
export type MusicAccess = 'playable' | 'preview' | 'blocked' | 'unavailable'

export interface MusicTrackReference {
  provider: MusicProvider
  trackId: string
}

export interface SearchTrack extends MusicTrackReference {
  reference: string
  access: MusicAccess
  name: string
  artistName: string
  albumName?: string
  duration: number
  licenseUrl?: string
  license?: string
  sourceUrl?: string
  source?: string
  attribution?: string
  albumImage?: string
  lyricsLrc?: string
  id?: string
  audioUrl?: string
}

export interface LegacySearchTrack extends SearchTrack {
  id: string
  audioUrl: string
  licenseUrl: string
}

export interface ResolvedTrack extends SearchTrack {
  streamUrl: string
}
