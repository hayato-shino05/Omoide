import 'server-only'

import { parseMusicTrackReference } from './reference'
import { JAPAN_PRESET_TRACKS, getJamendoStreamUrl } from './presets'
import type { MusicAccess, MusicTrackReference, ResolvedTrack, SearchTrack } from './types'

const ALLOWED_LICENSE_PATTERNS = [
  /creativecommons\.org\/publicdomain\//,
  /creativecommons\.org\/licenses\/by(?:\/|$)/,
  /creativecommons\.org\/licenses\/by-sa(?:\/|$)/,
]
const REQUEST_TIMEOUT_MS = 8_000
const SOUNDCLOUD_TOKEN_SKEW_MS = 60_000

interface SoundCloudTrack {
  id?: string | number
  title?: string
  user?: { username?: string; permalink_url?: string }
  metadata_artist?: string
  duration?: number
  artwork_url?: string
  permalink_url?: string
  access?: MusicAccess
  stream_url?: string
}

interface JamendoTrack {
  id?: string | number
  name?: string
  artist_name?: string
  album_name?: string
  duration?: number
  license_ccurl?: string
  shareurl?: string
  image?: string
  audio?: string
}

let soundCloudToken: { value: string; expiresAt: number } | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLicenseAllowed(licenseUrl: string): boolean {
  return ALLOWED_LICENSE_PATTERNS.some((pattern) => pattern.test(licenseUrl))
}

function toReference({ provider, trackId }: MusicTrackReference): string {
  return `${provider}:${trackId}`
}

function asSoundCloudTrack(value: unknown): SoundCloudTrack | null {
  if (!isRecord(value) || (typeof value.id !== 'string' && typeof value.id !== 'number') || typeof value.title !== 'string') return null
  return value as SoundCloudTrack
}

function asJamendoTrack(value: unknown): JamendoTrack | null {
  if (!isRecord(value) || (typeof value.id !== 'string' && typeof value.id !== 'number') || typeof value.name !== 'string') return null
  return value as JamendoTrack
}

function mapSoundCloudTrack(track: SoundCloudTrack): SearchTrack | null {
  const reference = parseMusicTrackReference(`soundcloud:${track.id}`)
  if (!reference || !track.title || track.access !== 'playable') return null
  return {
    ...reference,
    reference: toReference(reference),
    access: 'playable',
    name: track.title,
    artistName: track.metadata_artist || track.user?.username || 'Unknown artist',
    duration: typeof track.duration === 'number' && track.duration >= 0 ? Math.floor(track.duration / 1000) : 0,
    sourceUrl: track.permalink_url || track.user?.permalink_url,
    albumImage: track.artwork_url,
  }
}

function mapJamendoTrack(track: JamendoTrack): SearchTrack | null {
  const reference = parseMusicTrackReference(`jamendo:${track.id}`)
  const licenseUrl = track.license_ccurl ?? ''
  if (!reference || !track.name || !isLicenseAllowed(licenseUrl)) return null
  return {
    ...reference,
    reference: toReference(reference),
    access: 'playable',
    name: track.name,
    artistName: track.artist_name || 'Unknown artist',
    albumName: track.album_name || undefined,
    duration: typeof track.duration === 'number' && track.duration >= 0 ? track.duration : 0,
    licenseUrl,
    sourceUrl: track.shareurl,
    albumImage: track.image,
  }
}

async function getSoundCloudToken(): Promise<string | null> {
  if (soundCloudToken && soundCloudToken.expiresAt > Date.now()) return soundCloudToken.value
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const response = await fetch('https://secure.soundcloud.com/oauth/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) return null
  const payload: unknown = await response.json()
  if (!isRecord(payload) || typeof payload.access_token !== 'string' || typeof payload.expires_in !== 'number') return null
  soundCloudToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(0, payload.expires_in * 1000 - SOUNDCLOUD_TOKEN_SKEW_MS),
  }
  return soundCloudToken.value
}

async function soundCloudRequest(path: string, query?: Record<string, string>): Promise<unknown | null> {
  const token = await getSoundCloudToken()
  if (!token) return null
  const url = new URL(path, 'https://api.soundcloud.com')
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value)
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `OAuth ${token}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) return null
  return response.json()
}

async function jamendoRequest(query: Record<string, string>): Promise<unknown | null> {
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!clientId) return null
  const url = new URL('https://api.jamendo.com/v3.0/tracks/')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('format', 'json')
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) return null
  return response.json()
}

function searchResults(payload: unknown): unknown[] {
  return isRecord(payload) && Array.isArray(payload.collection) ? payload.collection : []
}

function jamendoResults(payload: unknown): unknown[] {
  return isRecord(payload) && Array.isArray(payload.results) ? payload.results : []
}

export async function searchMusicTracks(query: string, limit: number): Promise<SearchTrack[]> {
  const soundCloudPayload = await soundCloudRequest('/tracks', { q: query, access: 'playable', limit: String(limit) })
  const soundCloudTracks = searchResults(soundCloudPayload).map(asSoundCloudTrack).map((track) => track && mapSoundCloudTrack(track)).filter((track): track is SearchTrack => track !== null)
  if (soundCloudTracks.length > 0) return soundCloudTracks.slice(0, limit)

  const jamendoPayload = await jamendoRequest({ search: query, limit: String(limit) })
  return jamendoResults(jamendoPayload).map(asJamendoTrack).map((track) => track && mapJamendoTrack(track)).filter((track): track is SearchTrack => track !== null).slice(0, limit)
}

function findPresetJamendoTrack(trackId: string) {
  return JAPAN_PRESET_TRACKS.find((track) => track.trackId === trackId) ?? null
}

function presetToResolved(preset: (typeof JAPAN_PRESET_TRACKS)[number]): ResolvedTrack | null {
  const streamUrl = preset.audioUrl ?? getJamendoStreamUrl(preset.trackId)
  if (!streamUrl || !streamUrl.startsWith('https://')) return null
  return {
    provider: 'jamendo',
    trackId: preset.trackId,
    reference: `jamendo:${preset.trackId}`,
    access: 'playable',
    name: preset.name,
    artistName: preset.artistName,
    albumName: preset.albumName,
    duration: preset.duration,
    licenseUrl: preset.licenseUrl,
    sourceUrl: preset.sourceUrl,
    albumImage: preset.albumImage,
    streamUrl,
  }
}

export async function resolveMusicTrack(value: string): Promise<ResolvedTrack | null> {
  const reference = parseMusicTrackReference(value)
  if (!reference) return null

  if (reference.provider === 'soundcloud') {
    const payload = await soundCloudRequest(`/tracks/${reference.trackId}`)
    const track = asSoundCloudTrack(payload)
    const mapped = track && mapSoundCloudTrack(track)
    if (!mapped || typeof track.stream_url !== 'string' || !track.stream_url.startsWith('https://')) return null
    return { ...mapped, streamUrl: track.stream_url }
  }

  const preset = findPresetJamendoTrack(reference.trackId)
  if (preset) return presetToResolved(preset)

  const payload = await jamendoRequest({ id: reference.trackId, limit: '1' })
  const track = asJamendoTrack(jamendoResults(payload)[0])
  const mapped = track && mapJamendoTrack(track)
  if (!mapped || typeof track.audio !== 'string' || !track.audio.startsWith('https://')) return null
  return { ...mapped, streamUrl: track.audio }
}

export async function validateMusicTrackReference(value: string): Promise<string | null> {
  const track = await resolveMusicTrack(value)
  return track?.access === 'playable' ? track.reference : null
}
