export const MUSIC_PROVIDERS = ['soundcloud', 'jamendo'] as const

export type MusicProvider = (typeof MUSIC_PROVIDERS)[number]
export type MusicAccess = 'playable' | 'preview' | 'blocked'

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
  sourceUrl?: string
  albumImage?: string
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
