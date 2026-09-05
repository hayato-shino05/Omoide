'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import Modal from '@/components/ui/Modal'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'
import type { LegacySearchTrack, SearchTrack } from '@/lib/music/types'

interface SongPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reference: string) => void
  initialValue?: string
}

const formatDuration = (seconds: number): string => {
  if (!seconds) return '--:--'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

const licenseLabel = (track: { licenseUrl?: string }): string =>
  track.licenseUrl?.includes('by-sa') ? 'CC BY-SA' : 'CC BY'

export default function SongPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialValue,
}: SongPickerModalProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchTrack[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selected, setSelected] = useState<string | null>(initialValue ?? null)
  const listboxId = useId()
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelected(initialValue ?? null)
      setQuery('')
      setResults(null)
      setError(null)
      setActiveIndex(-1)
    }
  }, [isOpen, initialValue])

  const tracks: LegacySearchTrack[] | SearchTrack[] = results ?? JAPAN_PRESET_TRACKS

  const runSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    setIsLoading(true)
    setError(null)
    setResults(null)
    setActiveIndex(-1)
    try {
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(trimmed)}&limit=20`)
      const payload = (await response.json()) as { data?: SearchTrack[]; error?: string }
      if (!response.ok || payload.error) throw new Error('music search failed')
      setResults(payload.data ?? [])
    } catch {
      setError(t('songSearchFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const optionId = (reference: string) =>
    `${listboxId}-option-${reference.replace(/[^a-zA-Z0-9_-]/g, '_')}`
  const activeOptionId =
    activeIndex >= 0 && tracks[activeIndex] ? optionId(tracks[activeIndex].reference) : undefined

  const moveActive = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        if (tracks.length === 0) return -1
        if (current < 0) return delta > 0 ? 0 : tracks.length - 1
        return (current + delta + tracks.length) % tracks.length
      })
    },
    [tracks.length]
  )

  const handleListboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (tracks.length === 0) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveActive(1)
        return
      case 'ArrowUp':
        event.preventDefault()
        moveActive(-1)
        return
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        return
      case 'End':
        event.preventDefault()
        setActiveIndex(tracks.length - 1)
        return
      case 'Enter':
      case ' ': {
        const target = activeIndex >= 0 ? tracks[activeIndex] : tracks[0]
        if (target) {
          event.preventDefault()
          setSelected(target.reference)
        }
        return
      }
      default:
        return
    }
  }

  const handleConfirm = () => {
    if (selected) {
      onConfirm(selected)
    }
  }

  const selectedTrack = tracks.find((track) => track.reference === selected)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('selectSong')}
      description={t('presetSongsHint')}
      size="widescreen"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '420px' }}>
        <form onSubmit={runSearch} style={{ display: 'flex', gap: '8px' }}>
          <label htmlFor={`${listboxId}-input`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            {t('songSearchPlaceholder')}
          </label>
          <input
            ref={searchInputRef}
            id={`${listboxId}-input`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('songSearchPlaceholder')}
            aria-controls={listboxId}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: '44px',
              padding: '10px 12px',
              border: '2px solid #D4B08C',
              background: '#FFF9F3',
              color: '#2C1810',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              padding: '10px 16px',
              border: '2px solid #D4B08C',
              background: isLoading ? '#999' : '#854D27',
              color: '#FFF9F3',
              cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '2px 2px 0 #D4B08C',
            }}
          >
            <Icon name="Search" size={16} />
            <span>{isLoading ? t('loading') : t('songSearchButton')}</span>
          </button>
        </form>

        {error && (
          <p role="alert" style={{ fontSize: '0.85rem', color: '#dc3545', margin: 0 }}>
            {error}
          </p>
        )}

        {!isLoading && results !== null && (
          <p style={{ fontSize: '0.75rem', color: '#854D27', margin: 0 }}>
            {results.length ? t('searchResultsTitle') : t('songNotFound')}
          </p>
        )}
        {!results && (
          <p style={{ fontSize: '0.72rem', color: '#8a6a4d', margin: 0 }}>
            {t('presetSongsHint')}
          </p>
        )}

        <div
          id={listboxId}
          role="listbox"
          aria-label={t('selectSong')}
          aria-activedescendant={activeOptionId}
          tabIndex={0}
          onKeyDown={handleListboxKeyDown}
          style={{
            flex: 1,
            minHeight: '260px',
            maxHeight: '420px',
            overflowY: 'auto',
            border: '2px solid rgba(212, 176, 140, 0.4)',
            background: '#FFFCF7',
          }}
        >
          {tracks.map((track, index) => {
            const isSelected = track.reference === selected
            const isActive = index === activeIndex
            return (
              <div
                key={track.reference}
                id={optionId(track.reference)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => setSelected(track.reference)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderBottom: '1px solid rgba(212, 176, 140, 0.25)',
                  background: isActive
                    ? 'rgba(133, 77, 39, 0.12)'
                    : isSelected
                      ? 'rgba(212, 176, 140, 0.18)'
                      : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {track.albumImage && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      backgroundImage: `url(${track.albumImage})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #D4B08C',
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.92rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: '#2C1810',
                    }}
                  >
                    {track.name}
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
                    {track.artistName}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#8a6a4d' }}>
                    {licenseLabel(track)} · {formatDuration(track.duration)}
                  </span>
                </div>
                {isSelected && (
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#854D27',
                    }}
                  >
                    <Icon name="CheckCircle2" size={20} />
                  </span>
                )}
              </div>
            )
          })}
          {!isLoading && tracks.length === 0 && (
            <p style={{ padding: '24px', textAlign: 'center', color: '#854D27', margin: 0 }}>
              {t('songNotFound')}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedTrack ? (
            <span
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
                color: '#854D27',
              }}
            >
              <Icon name="CheckCircle2" size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {selectedTrack.name} — {selectedTrack.artistName}
            </span>
          ) : (
            <span style={{ fontSize: '0.85rem', color: '#8a6a4d' }}>{t('songSearchPlaceholder')}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            minHeight: '44px',
            padding: '10px 18px',
            border: '2px solid #D4B08C',
            background: 'transparent',
            color: '#854D27',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
          }}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            minHeight: '44px',
            padding: '10px 22px',
            border: '2px solid #D4B08C',
            background: selected ? '#854D27' : '#999',
            color: '#FFF9F3',
            cursor: selected ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            boxShadow: selected ? '4px 4px 0 #D4B08C' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          {t('confirm')}
        </button>
      </div>
    </Modal>
  )
}
