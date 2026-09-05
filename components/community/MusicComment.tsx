'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import type { ResolvedTrack } from '@/lib/music/types'

interface MusicCommentProps {
  trackReference: string
}

const sectionStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '12px',
  border: '1px solid rgba(212, 176, 140, 0.55)',
  borderRadius: '6px',
  background: 'linear-gradient(135deg, rgba(255, 249, 243, 0.85), rgba(212, 176, 140, 0.18))',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minWidth: 0,
}

const playButtonStyle: React.CSSProperties = {
  flexShrink: 0,
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: '2px solid #854D27',
  background: '#854D27',
  color: '#FFF9F3',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '2px 2px 0 #D4B08C',
}

const disabledPlayButtonStyle: React.CSSProperties = {
  ...playButtonStyle,
  cursor: 'wait',
  opacity: 0.75,
}

const trackMetaStyle: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#2C1810',
  fontSize: '0.9rem',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const artistStyle: React.CSSProperties = {
  margin: '2px 0 0',
  color: '#6b4a2f',
  fontSize: '0.75rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const pendingTitleStyle: React.CSSProperties = {
  ...titleStyle,
  color: '#854D27',
  opacity: 0.75,
  fontWeight: 500,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  marginBottom: '4px',
  borderRadius: '999px',
  background: 'rgba(133, 77, 39, 0.12)',
  color: '#854D27',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.02em',
}

const errorStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#a52a2a',
  fontSize: '0.78rem',
}

const sourceLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  marginTop: '6px',
  color: '#854D27',
  fontSize: '0.72rem',
  textDecoration: 'underline',
}

const retryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  marginTop: '6px',
  padding: '4px 10px',
  border: '1px solid #a52a2a',
  borderRadius: '4px',
  background: 'transparent',
  color: '#a52a2a',
  fontSize: '0.72rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

function isResolvedTrack(value: unknown): value is ResolvedTrack {
  if (!value || typeof value !== 'object') return false
  const track = value as Record<string, unknown>
  return typeof track.streamUrl === 'string' && track.streamUrl.startsWith('https://')
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '--:--'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

type SoundCardState =
  | { kind: 'idle'; track: null }
  | { kind: 'resolving'; track: null }
  | { kind: 'ready'; track: ResolvedTrack; isPlaying: boolean }
  | { kind: 'error'; track: null }

export function MusicComment({ trackReference }: MusicCommentProps) {
  const { t } = useLanguage()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<SoundCardState>({ kind: 'idle', track: null })

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (state.kind === 'ready' && state.isPlaying) {
      audio.play().catch(() => setState({ kind: 'ready', track: state.track, isPlaying: false }))
    } else {
      audio.pause()
    }
  }, [state])

  useEffect(() => () => {
    audioRef.current?.pause()
  }, [])

  const resolve = useCallback(async () => {
    setState({ kind: 'resolving', track: null })
    try {
      const response = await fetch(`/api/music/resolve?ref=${encodeURIComponent(trackReference)}`)
      const payload = (await response.json().catch(() => null)) as { data?: unknown } | null
      if (!response.ok || !isResolvedTrack(payload?.data)) throw new Error('music resolution failed')
      setState({ kind: 'ready', track: payload.data, isPlaying: true })
    } catch {
      setState({ kind: 'error', track: null })
    }
  }, [trackReference])

  const handleToggle = useCallback(() => {
    if (state.kind === 'resolving') return
    if (state.kind === 'ready') {
      setState({ kind: 'ready', track: state.track, isPlaying: !state.isPlaying })
      return
    }
    void resolve()
  }, [state, resolve])

  const handleRetry = useCallback(() => {
    void resolve()
  }, [resolve])

  const buttonLabel =
    state.kind === 'resolving' ? t('loading')
    : state.kind === 'ready' && state.isPlaying ? t('pause')
    : t('play')
  const isBusy = state.kind === 'resolving'
  const buttonStyle = isBusy ? disabledPlayButtonStyle : playButtonStyle

  return (
    <section aria-label={t('music')} style={sectionStyle}>
      <div style={rowStyle}>
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={isBusy}
          aria-busy={isBusy}
          aria-label={buttonLabel}
          aria-pressed={state.kind === 'ready' ? state.isPlaying : undefined}
          className="focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFF9F3]"
          style={buttonStyle}
        >
          <Icon
            name={isBusy ? 'Volume' : state.kind === 'ready' && state.isPlaying ? 'Pause' : 'Play'}
            size={18}
          />
        </button>
        <div style={trackMetaStyle}>
          <span style={badgeStyle}>
            <Icon name="Music" size={12} />
            {t('music')}
          </span>
          {state.kind === 'ready' ? (
            <>
              <p style={titleStyle} title={state.track.name}>{state.track.name}</p>
              {state.track.artistName && (
                <p style={artistStyle} title={state.track.artistName}>
                  {state.track.artistName}
                  {state.track.duration ? ` · ${formatDuration(state.track.duration)}` : ''}
                </p>
              )}
              {state.track.sourceUrl && (
                <a
                  href={state.track.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={sourceLinkStyle}
                >
                  {t('attributionSource')}
                </a>
              )}
            </>
          ) : (
            <p style={pendingTitleStyle} title={trackReference}>
              {trackReference}
            </p>
          )}
        </div>
      </div>
      {state.kind === 'ready' && (
        <audio
          ref={audioRef}
          preload="none"
          src={state.track.streamUrl}
          onPlay={() => setState((current) => current.kind === 'ready' ? { ...current, isPlaying: true } : current)}
          onPause={() => setState((current) => current.kind === 'ready' ? { ...current, isPlaying: false } : current)}
          onEnded={() => setState((current) => current.kind === 'ready' ? { ...current, isPlaying: false } : current)}
          onError={() => setState({ kind: 'error', track: null })}
        >
          <track kind="captions" />
        </audio>
      )}
      {state.kind === 'error' && (
        <div role="alert" aria-live="assertive" style={errorStyle}>
          <p style={{ margin: 0 }}>{t('songSearchFailed')}</p>
          <button type="button" onClick={handleRetry} style={retryButtonStyle}>
            <Icon name="Volume" size={12} />
            {t('retry')}
          </button>
        </div>
      )}
      {state.kind === 'resolving' && (
        <p role="status" aria-live="polite" style={{ margin: '8px 0 0', color: '#854D27', fontSize: '0.72rem' }}>
          {t('loading')}
        </p>
      )}
    </section>
  )
}
