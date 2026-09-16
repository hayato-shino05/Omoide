'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { SearchTrack } from '@/lib/music/types'

interface MusicCommentProps {
  trackReference: string
}

type DisplayTrack = SearchTrack & { streamUrl?: string }

type SoundCardState =
  | { kind: 'idle'; track: null }
  | { kind: 'resolving'; track: null }
  | { kind: 'ready'; track: DisplayTrack; isPlaying: boolean }
  | { kind: 'error'; track: DisplayTrack | null }

function isSafeHttpsUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('https://')
}

function isResolvedTrack(value: unknown): value is DisplayTrack {
  if (!value || typeof value !== 'object') return false
  const track = value as Record<string, unknown>
  return typeof track.name === 'string' && typeof track.artistName === 'string' && (track.streamUrl === undefined || isSafeHttpsUrl(track.streamUrl))
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '--:--'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export function MusicComment({ trackReference }: MusicCommentProps) {
  const { t } = useLanguage()
  const audioRef = useRef<HTMLAudioElement>(null)
  const requestRef = useRef<{ controller: AbortController; timeoutId: ReturnType<typeof setTimeout> } | null>(null)
  const [state, setState] = useState<SoundCardState>({ kind: 'idle', track: null })
  const [artworkFailedFor, setArtworkFailedFor] = useState<string | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (state.kind === 'ready' && state.isPlaying && isSafeHttpsUrl(state.track.streamUrl)) {
      void audio.play().catch(() => setState({ kind: 'error', track: state.track }))
    } else {
      audio.pause()
    }
  }, [state])

  useEffect(() => () => {
    const request = requestRef.current
    request?.controller.abort('unmount')
    if (request) clearTimeout(request.timeoutId)
    audioRef.current?.pause()
  }, [])

  const resolve = useCallback(async () => {
    requestRef.current?.controller.abort('cancelled')
    if (requestRef.current) clearTimeout(requestRef.current.timeoutId)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('timeout'), 10000)
    requestRef.current = { controller, timeoutId }
    setState({ kind: 'resolving', track: null })
    try {
      const response = await fetch(`/api/music/resolve?ref=${encodeURIComponent(trackReference)}`, { signal: controller.signal })
      const payload = (await response.json().catch(() => null)) as { data?: unknown } | null
      if (!response.ok || !isResolvedTrack(payload?.data)) throw new Error('music resolution failed')
      setState({ kind: 'ready', track: payload.data, isPlaying: false })
    } catch {
      if (controller.signal.reason !== 'cancelled' && controller.signal.reason !== 'unmount') {
        setState({ kind: 'error', track: null })
      }
    } finally {
      clearTimeout(timeoutId)
      if (requestRef.current?.controller === controller) requestRef.current = null
    }
  }, [trackReference])

  const handleToggle = useCallback(() => {
    if (state.kind === 'resolving') return
    if (state.kind === 'ready') {
      if (!isSafeHttpsUrl(state.track.streamUrl) || state.track.access === 'blocked' || state.track.access === 'unavailable') {
        setState({ kind: 'error', track: state.track })
      } else {
        setState({ kind: 'ready', track: state.track, isPlaying: !state.isPlaying })
      }
    } else {
      void resolve()
    }
  }, [resolve, state])

  const resolvedTrack = state.kind === 'ready' || state.kind === 'error' ? state.track : null
  const isBusy = state.kind === 'resolving'
  const accessMessage = resolvedTrack?.access === 'blocked' || resolvedTrack?.access === 'unavailable' ? t('soundLoadError') : null
  const isPlaying = state.kind === 'ready' && state.isPlaying
  const provider = resolvedTrack?.provider ?? trackReference.split(':', 1)[0]
  const providerLabel = provider === 'jamendo'
    ? t('provider_jamendo')
    : provider === 'soundcloud'
      ? t('provider_soundcloud')
      : t('music')
  const buttonLabel = isBusy ? t('loading') : isPlaying ? t('pause') : t('play')

  return (
    <section
      aria-label={t('music')}
      className="mt-4 overflow-hidden rounded-2xl border border-[var(--music-border)] bg-[var(--music-surface)] text-[var(--music-text)] shadow-[0_4px_6px_-1px_color-mix(in_srgb,var(--music-text)_10%,transparent),0_2px_4px_-2px_color-mix(in_srgb,var(--music-text)_8%,transparent)]"
    >
      <div className="p-4 shadow-[inset_1px_0_0_var(--music-accent)] sm:p-5">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--music-border)] bg-[var(--music-surface-elevated)] text-[var(--music-accent)]">
            {resolvedTrack && isSafeHttpsUrl(resolvedTrack.albumImage) && artworkFailedFor !== (resolvedTrack.reference || trackReference) ? <img src={resolvedTrack.albumImage} alt="" className="h-full w-full object-cover" onError={() => setArtworkFailedFor(resolvedTrack.reference || trackReference)} /> : <Icon name="Music" size={20} />}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isBusy}
            aria-busy={isBusy}
            aria-label={buttonLabel}
            aria-pressed={state.kind === 'ready' ? state.isPlaying : undefined}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--music-accent)] bg-[var(--music-accent)] text-[var(--music-surface)] outline-none transition-colors hover:bg-[var(--music-text)] focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--music-surface)] disabled:cursor-wait disabled:opacity-75 motion-reduce:transition-none"
          >
            <Icon name={isBusy ? 'Volume' : isPlaying ? 'Pause' : 'Play'} size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold leading-6 text-[var(--music-accent)]">
              <Icon name="Music" size={14} aria-hidden="true" />
              <span className="truncate rounded-full border border-[var(--music-border)] bg-[var(--music-surface-elevated)] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[var(--music-text-muted)]">
                {providerLabel}
              </span>
              {resolvedTrack && (
                <span className="truncate text-[0.72rem] font-normal text-[var(--music-text-muted)]" aria-live="polite">
                  {isPlaying ? t('play') : t('soundReady')}
                </span>
              )}
            </div>
            {resolvedTrack ? (
              <>
                <p className="m-0 truncate font-serif text-lg font-semibold leading-6 text-[var(--music-text)]" title={resolvedTrack.name}>{resolvedTrack.name}</p>
                <p className="m-0 mt-1 truncate text-sm leading-6 text-[var(--music-text-muted)]" title={resolvedTrack.artistName ?? undefined}>
                  {resolvedTrack.artistName || t('music')}
                  {resolvedTrack.duration ? ` · ${formatDuration(resolvedTrack.duration)}` : ''}
                </p>
                {(resolvedTrack.attribution || resolvedTrack.source || resolvedTrack.license) && (
                  <p className="m-0 mt-3 border-t border-[var(--music-border)] pt-2 text-xs leading-5 text-[var(--music-text-muted)]">
                    {[resolvedTrack.attribution, resolvedTrack.source, resolvedTrack.license].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {isSafeHttpsUrl(resolvedTrack.sourceUrl) && <a className="inline-flex min-h-11 items-center text-xs font-medium text-[var(--music-accent)] underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]" href={resolvedTrack.sourceUrl} target="_blank" rel="noopener noreferrer">{t('attributionSource')}</a>}
                  {isSafeHttpsUrl(resolvedTrack.licenseUrl) && <a className="inline-flex min-h-11 items-center text-xs font-medium text-[var(--music-accent)] underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]" href={resolvedTrack.licenseUrl} target="_blank" rel="noopener noreferrer">{t('license')}</a>}
                </div>
              </>
            ) : (
              <p className="m-0 truncate text-sm leading-6 text-[var(--music-text-muted)]" title={trackReference}>{trackReference}</p>
            )}
          </div>
        </div>
        {state.kind === 'ready' && isSafeHttpsUrl(state.track.streamUrl) && (
          <audio
            ref={audioRef}
            preload="none"
            src={state.track.streamUrl}
            onPlay={() => setState((current) => current.kind === 'ready' ? { ...current, isPlaying: true } : current)}
            onPause={() => setState((current) => current.kind === 'ready' ? { ...current, isPlaying: false } : current)}
            onEnded={() => setState((current) => current.kind === 'ready' ? { ...current, isPlaying: false } : current)}
            onError={() => setState((current) => current.kind === 'ready' ? { kind: 'error', track: current.track } : current)}
          />
        )}
        {state.kind === 'resolving' && <p role="status" aria-live="polite" className="m-0 mt-3 border-t border-[var(--music-border)] pt-2 text-xs leading-5 text-[var(--music-text-muted)]">{t('loading')}</p>}
        {accessMessage && <p role="status" className="m-0 mt-3 border-t border-[var(--music-border)] pt-2 text-xs leading-5 text-[var(--music-error)]">{accessMessage}</p>}
        {state.kind === 'error' && (
          <div role="alert" aria-live="assertive" className="mt-3 border-t border-[var(--music-error)] pt-2 text-xs leading-5 text-[var(--music-error)]">
            <p className="m-0">{resolvedTrack?.access === 'blocked' || resolvedTrack?.access === 'unavailable' ? t('soundLoadError') : resolvedTrack ? t('soundPlaybackError') : t('songSearchFailed')}</p>
            <button type="button" onClick={() => void resolve()} className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-[var(--music-error)] bg-transparent px-3 text-xs font-medium text-[var(--music-error)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--music-surface)]">{t('retry')}</button>
          </div>
        )}
      </div>
    </section>
  )
}
