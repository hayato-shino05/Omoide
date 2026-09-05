'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import type { LegacySearchTrack, SearchTrack } from '@/lib/music/types'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'

interface SelectedMusicTrackRowProps {
  value?: string
  onChange: (reference: string) => void
  onOpenPicker: () => void
}

const formatDuration = (seconds: number): string => {
  if (!seconds) return '--:--'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

const findTrack = (reference: string): LegacySearchTrack | SearchTrack | undefined => {
  return JAPAN_PRESET_TRACKS.find((t) => t.reference === reference)
}

export function SelectedMusicTrackRow({
  value,
  onChange,
  onOpenPicker,
}: SelectedMusicTrackRowProps) {
  const { t } = useLanguage()
  const preset = value ? findTrack(value) : undefined
  const [fetchedById, setFetchedById] = useState<Record<string, SearchTrack | null>>({})
  const fetched = value ? fetchedById[value] : undefined
  const loading = !!value && !preset && !(value in fetchedById)

  useEffect(() => {
    if (!value || preset || value in fetchedById) return
    let cancelled = false
    fetch(`/api/music/resolve?ref=${encodeURIComponent(value)}`)
      .then((response) => response.json() as Promise<{ data?: { name: string; artistName: string; duration: number; albumImage?: string; licenseUrl?: string } | null }>)
      .then((payload) => {
        if (cancelled) return
        const data = payload.data
        setFetchedById((prev) => ({
          ...prev,
          [value]: data
            ? {
                reference: value,
                provider: 'jamendo',
                trackId: value.split(':')[1] ?? value,
                access: 'playable',
                name: data.name,
                artistName: data.artistName,
                duration: data.duration,
                albumImage: data.albumImage,
                licenseUrl: data.licenseUrl,
              }
            : null,
        }))
      })
      .catch(() => {
        if (!cancelled) setFetchedById((prev) => ({ ...prev, [value]: null }))
      })
    return () => {
      cancelled = true
    }
  }, [value, preset, fetchedById])

  if (!value) {
    return (
      <div style={{ marginBottom: '15px' }}>
        <p
          style={{
            fontSize: '0.8rem',
            color: '#854D27',
            marginBottom: '6px',
            fontWeight: 600,
          }}
        >
          {t('selectSong')}
        </p>
        <button
          type="button"
          onClick={onOpenPicker}
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '12px 16px',
            border: '2px dashed #D4B08C',
            borderRadius: '8px',
            background: 'rgba(212, 176, 140, 0.1)',
            color: '#854D27',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          aria-label={t('chooseSong')}
        >
          <Icon name="Music" size={18} />
          <span>{t('chooseSong')}</span>
        </button>
      </div>
    )
  }

  const track = preset ?? fetched

  if (loading) {
    return (
      <div
        style={{
          marginBottom: '15px',
          padding: '12px 16px',
          border: '2px solid #D4B08C',
          borderRadius: '8px',
          background: 'rgba(212, 176, 140, 0.1)',
          color: '#854D27',
          fontSize: '0.85rem',
        }}
      >
        {t('loading')}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '15px' }}>
      <p
        style={{
          fontSize: '0.8rem',
          color: '#854D27',
          marginBottom: '6px',
          fontWeight: 600,
        }}
      >
        {t('selectSong')}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          border: '2px solid #D4B08C',
          borderRadius: '8px',
          background:
            'linear-gradient(90deg, rgba(212, 176, 140, 0.18) 0%, rgba(212, 176, 140, 0.05) 100%)',
          boxShadow: '4px 4px 0 #D4B08C',
        }}
      >
        {track?.albumImage ? (
          <span
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              backgroundImage: `url(${track.albumImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              borderRadius: '6px',
              border: '1px solid #D4B08C',
            }}
          />
        ) : (
          <span
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              background: 'rgba(212, 176, 140, 0.3)',
              color: '#854D27',
            }}
          >
            <Icon name="Music" size={28} />
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#2C1810',
            }}
          >
            {track?.name ?? t('songSelected')}
          </span>
          <span
            style={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.78rem',
              color: '#6b4a2f',
            }}
          >
            {track?.artistName ?? ''}
          </span>
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#8a6a4d' }}>
            {track
              ? `${track.licenseUrl?.includes('by-sa') ? 'CC BY-SA' : 'CC BY'} · ${formatDuration(track.duration)}`
              : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenPicker}
          aria-label={t('changeSong')}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            padding: '8px 14px',
            border: '2px solid #D4B08C',
            background: '#854D27',
            color: '#FFF9F3',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '2px 2px 0 #D4B08C',
          }}
        >
          {t('changeSong')}
        </button>
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('songClear')}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            padding: '8px 14px',
            border: '2px solid #D4B08C',
            background: 'transparent',
            color: '#854D27',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {t('songClear')}
        </button>
      </div>
    </div>
  )
}
