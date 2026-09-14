'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import { parseMusicTrackReference } from '@/lib/music/reference'
import type { LegacySearchTrack, SearchTrack } from '@/lib/music/types'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'

interface SelectedMusicTrackRowProps {
  value?: string
  onChange: (reference: string) => void
  onOpenPicker: () => void
}

type ResolveState =
  | { status: 'loading' }
  | { status: 'ready'; track: SearchTrack }
  | { status: 'error' }

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '--:--'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

const findTrack = (reference: string): LegacySearchTrack | SearchTrack | undefined =>
  JAPAN_PRESET_TRACKS.find((track) => track.reference === reference)

const isSafeHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

const isSearchTrack = (value: unknown): value is SearchTrack => {
  if (!value || typeof value !== 'object') return false
  const track = value as Record<string, unknown>
  return typeof track.reference === 'string' && (track.provider === 'jamendo' || track.provider === 'soundcloud') && typeof track.trackId === 'string' && typeof track.name === 'string' && typeof track.artistName === 'string' && typeof track.duration === 'number' && (track.access === undefined || ['playable', 'preview', 'blocked', 'unavailable'].includes(String(track.access)))
}

export function SelectedMusicTrackRow({ value, onChange, onOpenPicker }: SelectedMusicTrackRowProps) {
  const { t } = useLanguage()
  const preset = value ? findTrack(value) : undefined
  const [resolvedById, setResolvedById] = useState<Record<string, ResolveState>>({})
  const [artworkFailedFor, setArtworkFailedFor] = useState<string | null>(null)
  const resolved = value ? resolvedById[value] : undefined
  const canResolve = !!value && !preset && !!parseMusicTrackReference(value)
  const isLoading = canResolve && (!resolved || resolved.status === 'loading')

  const resolve = useCallback((reference: string) => {
    setResolvedById((current) => ({ ...current, [reference]: { status: 'loading' } }))
    void fetch(`/api/music/resolve?ref=${encodeURIComponent(reference)}`)
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null)
        const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : null
        if (!response.ok || !isSearchTrack(data)) throw new Error('music resolve failed')
        setResolvedById((current) => ({ ...current, [reference]: { status: 'ready', track: data } }))
      })
      .catch(() => setResolvedById((current) => ({ ...current, [reference]: { status: 'error' } })))
  }, [])

  useEffect(() => {
    if (!value || preset || !parseMusicTrackReference(value) || resolvedById[value]) return
    const reference = value
    const task = window.setTimeout(() => resolve(reference), 0)
    return () => window.clearTimeout(task)
  }, [preset, resolve, resolvedById, value])

  const track = preset ?? (resolved?.status === 'ready' ? resolved.track : undefined)
  const retry = () => value && resolve(value)
  const accessMessage = track?.access === 'blocked' || track?.access === 'unavailable' ? t('soundLoadError') : null

  if (!value) {
    return (
      <section className="mb-4" aria-labelledby="selected-music-label">
        <p id="selected-music-label" className="mb-1.5 text-xs font-semibold text-[var(--music-text-muted)]">{t('selectSong')}</p>
        <button type="button" onClick={onOpenPicker} aria-label={t('chooseSong')} className="music-selection-empty flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--music-border)] bg-[color-mix(in_srgb,var(--music-accent)_6%,var(--music-surface))] px-4 py-3 font-body font-bold text-[var(--music-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--music-accent)_12%,var(--music-surface))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]">
          <Icon name="Music" size={18} aria-hidden="true" />
          {t('chooseSong')}
        </button>
      </section>
    )
  }

  if (isLoading) {
    return <section className="mb-4 rounded-2xl border border-[var(--music-border)] bg-[var(--music-surface)] p-4 text-[var(--music-text-muted)]" role="status" aria-live="polite"><span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--music-border)] border-t-[var(--music-accent)] motion-reduce:animate-none" aria-hidden="true" />{t('loading')}</span></section>
  }

  if (!track) {
    return <section className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--music-error)] bg-[color-mix(in_srgb,var(--music-error)_7%,var(--music-surface))] p-4 text-[var(--music-error)]" role="alert"><span className="min-w-0 flex-1 text-sm">{t('songSearchFailed')}</span><button type="button" onClick={retry} aria-label={t('songSearchButton')} className="min-h-11 rounded-lg border border-current px-3.5 py-2 font-body font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]">{t('songSearchButton')}</button><button type="button" onClick={() => onChange('')} aria-label={t('songClear')} className="min-h-11 rounded-lg border border-[var(--music-border)] px-3.5 py-2 font-body font-semibold text-[var(--music-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]">{t('songClear')}</button></section>
  }

  return (
    <section className="mb-4 rounded-2xl border border-[var(--music-border)] bg-[var(--music-surface)] p-3 shadow-[0_4px_6px_-1px_color-mix(in_srgb,var(--music-text)_10%,transparent),0_2px_4px_-2px_color-mix(in_srgb,var(--music-text)_8%,transparent)]" aria-labelledby="selected-music-label">
      <p id="selected-music-label" className="mb-2 text-xs font-semibold text-[var(--music-text-muted)]">{t('selectSong')}</p>
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--music-border)] bg-[color-mix(in_srgb,var(--music-accent)_12%,var(--music-surface))] text-[var(--music-accent)]">
          {isSafeHttpsUrl(track.albumImage) && artworkFailedFor !== track.reference ? <img src={track.albumImage} alt="" className="h-full w-full object-cover" onError={() => setArtworkFailedFor(track.reference)} /> : <Icon name="Music" size={24} />}
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[0.95rem] font-bold text-[var(--music-text)]">{track.name}</strong>
          <span className="mt-0.5 block truncate text-sm text-[var(--music-text-muted)]">{track.artistName || t('music')}</span>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--music-text-muted)]">
            <span className="rounded-full border border-[var(--music-border)] px-2 py-0.5">{track.provider === 'jamendo' ? t('provider_jamendo') : t('provider_soundcloud')}</span>
            <span className="tabular-nums">{formatDuration(track.duration)}</span>
          </div>
        </div>
      </div>
      {accessMessage && <p role="status" className="mt-3 border-t border-[var(--music-border)] pt-2 text-sm text-[var(--music-error)]">{accessMessage}</p>}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onOpenPicker} aria-label={t('changeSong')} className="min-h-11 rounded-lg border border-[var(--music-accent)] bg-[var(--music-accent)] px-3.5 py-2 font-body text-sm font-bold text-[var(--music-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]">{t('changeSong')}</button>
        <button type="button" onClick={() => onChange('')} aria-label={t('songClear')} className="min-h-11 rounded-lg border border-[var(--music-border)] bg-transparent px-3.5 py-2 font-body text-sm font-semibold text-[var(--music-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]">{t('songClear')}</button>
      </div>
    </section>
  )
}
