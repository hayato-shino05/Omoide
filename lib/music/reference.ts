import type { MusicProvider, MusicTrackReference } from './types'

const TRACK_ID_PATTERNS: Record<MusicProvider, RegExp> = {
  soundcloud: /^\d{1,20}$/,
  jamendo: /^\d{1,12}$/,
}

export function parseMusicTrackReference(value: unknown): MusicTrackReference | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (/^\d{1,12}$/.test(normalized)) return { provider: 'jamendo', trackId: normalized }
  const separator = normalized.indexOf(':')
  if (separator < 1 || normalized.indexOf(':', separator + 1) !== -1) return null
  const provider = normalized.slice(0, separator) as MusicProvider
  const trackId = normalized.slice(separator + 1)
  return TRACK_ID_PATTERNS[provider]?.test(trackId) ? { provider, trackId } : null
}

export function toMusicTrackReference(reference: MusicTrackReference): string {
  return `${reference.provider}:${reference.trackId}`
}
