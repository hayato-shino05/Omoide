'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useMusicPlayer } from '@/lib/hooks/useMusicPlayer'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icon'
import Modal from '@/components/ui/Modal'
import { JAPAN_PRESET_TRACKS } from '@/lib/music/presets'
import type { LegacySearchTrack, SearchTrack } from '@/lib/music/types'
import type { TranslationKey } from '@/lib/i18n/types'

interface SongPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reference: string) => void
  initialValue?: string
  isConfirming?: boolean
}

type Track = LegacySearchTrack | SearchTrack
type PreviewState = { reference: string; status: 'loading' | 'playing' | 'error' }

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '--:--'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

const isSafeHttpsUrl = (value: string | undefined): value is string => {
  if (!value) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

const providerLabel = (provider: Track['provider'], t: (key: TranslationKey) => string): string => {
  if (provider === 'omoide') return '想い出・BGM'
  return t(provider === 'jamendo' ? 'provider_jamendo' : 'provider_soundcloud')
}

const licenseLabel = (track: Track, t: (key: TranslationKey) => string): string => {
  if (track.provider === 'omoide') return '想い出・Selected'
  const license = track.license ?? (track.licenseUrl?.includes('by-sa') ? 'CC BY-SA' : 'CC BY')
  return `${t('license')}: ${license}`
}

export default function SongPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialValue,
  isConfirming = false,
}: SongPickerModalProps) {
  const { t } = useLanguage()
  const { previewReference, pause, isLoading: playbackLoading, isPlaying, playbackError } = useMusicPlayer()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchTrack[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selected, setSelected] = useState<string | null>(initialValue ?? null)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [curatedTracks, setCuratedTracks] = useState<Track[] | null>(null)
  const listboxId = useId()
  const listRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const previewRequestRef = useRef(0)

  useEffect(() => {
    let isCancelled = false
    fetch('/api/music/curated')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: Track[] } | null) => {
        if (!isCancelled && payload && Array.isArray(payload.data) && payload.data.length > 0) {
          setCuratedTracks(payload.data)
        }
      })
      .catch(() => {})

    return () => {
      isCancelled = true
    }
  }, [])

  const previewRef = useRef<PreviewState | null>(null)

  useEffect(() => {
    previewRef.current = preview
  }, [preview])

  const stopPreview = useCallback(() => {
    previewRequestRef.current += 1
    if (previewRef.current !== null) {
      pause()
      setPreview(null)
    }
  }, [pause])

  useEffect(() => {
    if (!isOpen) {
      if (previewRef.current !== null) {
        stopPreview()
      }
      return
    }
    setSelected(initialValue ?? null)
    setQuery('')
    setResults(null)
    setError(null)
    setActiveIndex(-1)
  }, [initialValue, isOpen, stopPreview])

  useEffect(() => {
    return () => {
      if (previewRef.current !== null) {
        stopPreview()
      }
    }
  }, [stopPreview])

  useEffect(() => {
    if (!preview || preview.status !== 'loading') return
    if (playbackError) {
      setPreview((current) => (current?.reference === preview.reference ? { reference: preview.reference, status: 'error' } : current))
    } else if (!playbackLoading && isPlaying) {
      setPreview((current) => (current?.reference === preview.reference ? { reference: preview.reference, status: 'playing' } : current))
    }
  }, [isPlaying, playbackError, playbackLoading, preview])

  const normalizedQuery = query.trim().toLowerCase()
  const localMatches = useMemo(() => {
    if (!normalizedQuery) return null
    const pool = curatedTracks ?? JAPAN_PRESET_TRACKS
    return pool.filter((track) => {
      const nameMatch = track.name.toLowerCase().includes(normalizedQuery)
      const artistMatch = track.artistName?.toLowerCase().includes(normalizedQuery)
      const albumMatch = 'albumName' in track && typeof track.albumName === 'string' && track.albumName.toLowerCase().includes(normalizedQuery)
      return nameMatch || artistMatch || albumMatch
    })
  }, [normalizedQuery, curatedTracks])

  const tracks: Track[] = results ?? localMatches ?? curatedTracks ?? JAPAN_PRESET_TRACKS
  const sectionLabel = results !== null || normalizedQuery.length > 0 ? t('searchResultsTitle') : t('presetSongsHint')
  const selectedTrack = tracks.find((track) => track.reference === selected)
  const optionId = (reference: string) => `${listboxId}-option-${reference.replace(/[^a-zA-Z0-9_-]/g, '_')}`
  const activeTrack = activeIndex >= 0 ? tracks[activeIndex] : undefined

  const searchTracks = async (term: string) => {
    const trimmed = term.trim().slice(0, 100)
    if (!trimmed) return
    setIsLoading(true)
    setError(null)
    setActiveIndex(-1)
    stopPreview()

    const normalizedTerm = trimmed.toLowerCase()
    const pool = curatedTracks ?? JAPAN_PRESET_TRACKS
    const currentLocalMatches = pool.filter((track) => {
      const nameMatch = track.name.toLowerCase().includes(normalizedTerm)
      const artistMatch = track.artistName?.toLowerCase().includes(normalizedTerm)
      const albumMatch = 'albumName' in track && typeof track.albumName === 'string' && track.albumName.toLowerCase().includes(normalizedTerm)
      return nameMatch || artistMatch || albumMatch
    })

    setResults(currentLocalMatches)

    try {
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(trimmed)}&limit=30`)
      const payload: unknown = await response.json().catch(() => null)
      const data = payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data) ? (payload.data as SearchTrack[]) : null
      if (!response.ok || !data) {
        if (currentLocalMatches.length === 0) {
          throw new Error('music search failed')
        }
        return
      }

      // Merge local matches and remote API results without duplicates
      const seen = new Set(currentLocalMatches.map((t) => t.reference))
      const combined = [...currentLocalMatches]
      for (const item of data) {
        if (!seen.has(item.reference)) {
          seen.add(item.reference)
          combined.push(item)
        }
      }
      setResults(combined)
    } catch {
      if (currentLocalMatches.length === 0) {
        setError(t('songSearchFailed'))
        setResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const runSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void searchTracks(query)
  }

  const handleClearQuery = () => {
    setQuery('')
    setResults(null)
    setError(null)
    searchInputRef.current?.focus()
  }

  const startPreview = (track: Track) => {
    if (preview?.reference === track.reference && preview.status === 'playing') {
      stopPreview()
      return
    }
    stopPreview()
    previewRequestRef.current += 1
    setPreview({ reference: track.reference, status: 'loading' })
    void previewReference(track.reference)
  }

  const selectTrack = (reference: string) => {
    setSelected(reference)
    if (preview?.reference !== reference) stopPreview()
  }

  const focusOption = (index: number) => {
    setActiveIndex(index)
    requestAnimationFrame(() => {
      const option = document.getElementById(optionId(tracks[index].reference))
      if (!option || !listRef.current?.contains(option)) return
      option.focus()
      option.scrollIntoView({ block: 'nearest' })
    })
  }

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (tracks.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption((index + 1) % tracks.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption((index - 1 + tracks.length) % tracks.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusOption(tracks.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectTrack(tracks[index].reference)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopPreview()
        onClose()
      }}
      title={
        <span className="inline-flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-[var(--music-accent)] flex items-center justify-center border border-amber-600/20" aria-hidden="true">
            <Icon name="Music" size={18} useSvg />
          </span>
          <span>{t('selectSong')}</span>
        </span>
      }
      description={
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-900/80 dark:text-amber-200/80 font-medium">
          <span>{t('selectSongSubtitle')}</span>
        </span>
      }
      size="widescreen"
      variant="music"
      initialFocusRef={searchInputRef}
    >
      <div className="relative w-full max-w-6xl rounded-xl transition-all duration-200 ease-out pointer-events-auto opacity-100 scale-100 translate-y-0 flex flex-col gap-4 text-[var(--music-text)] font-body">
        {/* 検索バー */}
        <form id={`${listboxId}-search-form`} className="flex items-center gap-2" onSubmit={runSearch}>
          <label htmlFor={`${listboxId}-input`} className="sr-only">
            {t('songSearchPlaceholder')}
          </label>
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-950/40 dark:text-amber-100/40 pointer-events-none flex items-center justify-center" aria-hidden="true">
              <Icon name="Search" size={18} useSvg />
            </span>
            <input
              ref={searchInputRef}
              id={`${listboxId}-input`}
              className="w-full min-h-[44px] pl-10 pr-12 py-2.5 rounded-xl border border-[var(--music-border)] bg-[var(--music-surface-elevated)] text-[var(--music-text)] placeholder:text-[var(--music-text-muted)] outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--music-accent)] text-sm transition-all duration-150 shadow-2xs hover:border-[var(--music-accent)]/50 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-ms-clear]:hidden"
              type="search"
              value={query}
              maxLength={100}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('songSearchPlaceholder')}
              aria-controls={listboxId}
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[var(--music-text-muted)] hover:text-[var(--music-text)] hover:bg-[var(--music-surface)] active:scale-95 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[var(--music-accent)]"
                aria-label={t('songClear')}
              >
                <Icon name="X" size={16} useSvg />
              </button>
            )}
          </div>
          <button
            className="min-h-[44px] px-3.5 sm:px-5 py-2.5 rounded-xl bg-[var(--music-accent)] text-white font-bold text-sm inline-flex items-center justify-center gap-1.5 shrink-0 hover:brightness-105 active:translate-y-0.5 active:scale-[0.98] cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--music-accent)] transition-all duration-150"
            type="submit"
            disabled={isLoading || !query.trim()}
            aria-busy={isLoading}
          >
            {isLoading && (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin motion-reduce:animate-none" aria-hidden="true" />
            )}
            <span>{isLoading ? t('loading') : t('songSearchButton')}</span>
          </button>
        </form>

        {/* エラーメッセージ */}
        {error && (
          <div
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--music-error)] bg-[color-mix(in_srgb,var(--music-error)_8%,var(--music-surface))] text-[var(--music-error)] text-sm"
            role="alert"
          >
            <Icon name="CircleAlert" size={18} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
              type="submit"
              form={`${listboxId}-search-form`}
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* セクションタイトル */}
        <div className="flex justify-between items-center gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--music-accent)]" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[var(--music-text)] tracking-tight">{sectionLabel}</h3>
          </div>
          {results !== null && !isLoading && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface))] text-[var(--music-accent)] border border-[color-mix(in_srgb,var(--music-accent)_20%,transparent)]">
              {results.length}
            </span>
          )}
        </div>

        {/* 楽曲リスト */}
        <div
          ref={listRef}
          id={listboxId}
          role="list"
          aria-label={t('selectSong')}
          className="flex-1 min-h-[220px] sm:min-h-[380px] max-h-[46vh] sm:max-h-[55vh] overflow-y-auto rounded-2xl border border-[var(--music-border)]/70 bg-[var(--music-surface-elevated)] p-1.5 sm:p-2 space-y-1.5 shadow-inner omoide-music-scrollbar"
        >
          {isLoading && (
            <div role="status" aria-live="polite" className="p-4 space-y-3">
              <div className="flex items-center justify-center gap-2.5 py-4 text-xs font-semibold text-[var(--music-text-muted)]">
                <span className="w-4 h-4 rounded-full border-2 border-[var(--music-border)] border-t-[var(--music-accent)] animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span>{t('loading')}</span>
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[color-mix(in_srgb,var(--music-border)_15%,transparent)] bg-[color-mix(in_srgb,var(--music-surface)_40%,transparent)] animate-pulse" aria-hidden="true">
                  <div className="w-[48px] h-[48px] rounded-xl bg-[color-mix(in_srgb,var(--music-border)_25%,transparent)] flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-[color-mix(in_srgb,var(--music-border)_30%,transparent)] rounded-md" />
                    <div className="h-3 w-1/4 bg-[color-mix(in_srgb,var(--music-border)_18%,transparent)] rounded-md" />
                    <div className="flex gap-2">
                      <div className="h-3 w-14 bg-[color-mix(in_srgb,var(--music-border)_18%,transparent)] rounded-full" />
                      <div className="h-3 w-10 bg-[color-mix(in_srgb,var(--music-border)_18%,transparent)] rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading &&
            tracks.map((track, index) => {
              const isSelected = track.reference === selected
              const isActive = index === activeIndex
              const currentPreview = preview?.reference === track.reference ? preview : null
              const isPreviewing = currentPreview?.status === 'playing'
              const isPreviewBusy = currentPreview?.status === 'loading'
              const isPreviewError = currentPreview?.status === 'error'
              const artworkUrl = isSafeHttpsUrl(track.albumImage) ? track.albumImage : null

              return (
                <div
                  key={track.reference}
                  role="listitem"
                  className={`group/row relative flex items-center justify-between gap-3 p-2 sm:p-3 rounded-xl border transition-all duration-150 ${
                    isSelected
                      ? 'border-amber-700/40 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-600/40 shadow-xs ring-1 ring-amber-600/20'
                      : isPreviewing
                        ? 'border-sky-600/30 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-500/30'
                        : isPreviewError
                          ? 'border-red-500/30 bg-red-50/50 dark:bg-red-950/20'
                          : 'border-transparent hover:border-amber-700/20 hover:bg-amber-50/60 dark:hover:bg-slate-800/60 hover:shadow-xs'
                  } ${isActive && !isSelected ? 'ring-2 ring-[var(--music-accent)]/50 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {/* 左端のアクセントライン */}
                  {isSelected && (
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[var(--music-accent)] rounded-r-full"
                      aria-hidden="true"
                    />
                  )}
                  {isPreviewing && !isSelected && (
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-sky-500 rounded-r-full"
                      aria-hidden="true"
                    />
                  )}

                  <button
                    id={optionId(track.reference)}
                    type="button"
                    className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--music-accent)] rounded-lg p-0.5"
                    onClick={() => selectTrack(track.reference)}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                    aria-label={`${t('selectSong')}: ${track.name}`}
                    aria-pressed={isSelected}
                    tabIndex={isActive || (activeIndex < 0 && index === 0) ? 0 : -1}
                  >
                    {/* アートワーク */}
                    <div
                      className="w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-lg overflow-hidden border border-[var(--music-border)]/60 bg-[color-mix(in_srgb,var(--music-accent)_8%,var(--music-surface))] flex items-center justify-center text-[var(--music-accent)] relative flex-shrink-0 shadow-2xs group-hover/row:scale-[1.02] transition-transform duration-200"
                      aria-hidden="true"
                    >
                      {artworkUrl ? (
                        <Image
                          src={artworkUrl}
                          alt=""
                          width={48}
                          height={48}
                          unoptimized
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.hidden = true
                            event.currentTarget.parentElement?.querySelector('[data-artwork-fallback]')?.removeAttribute('hidden')
                          }}
                        />
                      ) : null}
                      <span data-artwork-fallback hidden={Boolean(artworkUrl)}>
                        <Icon name="Music" size={20} useSvg />
                      </span>
                    </div>

                    {/* 楽曲情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <strong className="text-xs sm:text-sm font-bold text-[var(--music-text)] truncate group-hover/row:text-[var(--music-accent)] transition-colors">
                          {track.name}
                        </strong>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--music-accent)] text-white shadow-2xs flex-shrink-0">
                            <Icon name="CheckCircle2" size={12} useSvg aria-hidden="true" />
                            <span>{t('songSelected')}</span>
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] sm:text-xs text-[var(--music-text-muted)] truncate mt-0.5">
                        {track.artistName || t('music')}
                      </span>
                      {/* メタデータバッジ群 */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-1 text-[11px] text-[var(--music-text-muted)]">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                          track.provider === 'jamendo'
                            ? 'border-amber-600/30 text-amber-800 dark:text-amber-300 bg-amber-500/10'
                            : 'border-orange-500/30 text-orange-800 dark:text-orange-300 bg-orange-500/10'
                        }`}>
                          {providerLabel(track.provider, t)}
                        </span>
                        <span className="font-mono tabular-nums text-[10px] tracking-tight text-[var(--music-text-muted)] bg-[var(--music-surface)]/60 px-1.5 py-0.5 rounded-md border border-[var(--music-border)]/40">
                          {formatDuration(track.duration)}
                        </span>
                        <span className="text-[10px] text-[var(--music-text-muted)]/80 truncate max-w-[140px] sm:max-w-none hidden sm:inline">
                          {licenseLabel(track, t)}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* プレビューボタン ＆ 音波アニメーション */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 pl-1">
                    {isPreviewing && (
                      <div className="flex items-end gap-0.5 h-4 px-1" aria-hidden="true">
                        <span className="w-0.5 bg-[var(--music-accent)] rounded-full animate-soundbar-1" />
                        <span className="w-0.5 bg-[var(--music-accent)] rounded-full animate-soundbar-2" />
                        <span className="w-0.5 bg-[var(--music-accent)] rounded-full animate-soundbar-3" />
                      </div>
                    )}
                    <button
                      type="button"
                      className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-[var(--music-accent)] shadow-2xs active:scale-95 ${
                        isPreviewing
                          ? 'bg-[var(--music-accent)] text-white border border-[var(--music-accent)] hover:brightness-105 shadow-xs'
                          : 'bg-[var(--music-surface)] text-slate-700 dark:text-slate-300 border border-[var(--music-border)]/60 hover:text-[var(--music-accent)] hover:border-[var(--music-accent)] hover:bg-[color-mix(in_srgb,var(--music-accent)_8%,var(--music-surface))]'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        startPreview(track)
                      }}
                      disabled={isPreviewBusy}
                      aria-label={`${isPreviewing ? t('pausePreview') : isPreviewError ? t('retry') : t('playPreview')}: ${track.name}`}
                      aria-busy={isPreviewBusy}
                    >
                      {isPreviewBusy ? (
                        <span className="w-4 h-4 rounded-full border-2 border-current/40 border-t-current animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      ) : (
                        <Icon name={isPreviewing ? 'Pause' : 'Play'} size={16} useSvg aria-hidden="true" />
                      )}
                    </button>
                    {isPreviewBusy && <span className="sr-only" role="status">{t('loading')}</span>}
                    {isPreviewError && (
                      <span className="text-xs font-bold text-[var(--music-error)]" role="status">
                        {t('retry')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

          {!isLoading && tracks.length === 0 && (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-4 text-[var(--music-text-muted)] min-h-[280px]">
              <div className="w-16 h-16 rounded-2xl bg-[color-mix(in_srgb,var(--music-accent)_8%,var(--music-surface))] border border-[color-mix(in_srgb,var(--music-accent)_20%,transparent)] flex items-center justify-center text-[var(--music-accent)] shadow-xs">
                <Icon name="Music" size={28} aria-hidden="true" />
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-sm font-bold text-[var(--music-text)]">{t('songNotFound')}</p>
                <p className="text-xs text-[var(--music-text-muted)]">
                  {t('songSearchPlaceholder')}
                </p>
              </div>
              <button
                className="min-h-[44px] px-5 py-2 rounded-xl border border-[var(--music-border)] bg-[var(--music-surface)] text-xs font-bold text-[var(--music-text)] hover:bg-[color-mix(in_srgb,var(--music-accent)_8%,var(--music-surface))] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--music-accent)]"
                type="button"
                onClick={handleClearQuery}
              >
                {t('retry')}
              </button>
            </div>
          )}
        </div>

        <div className="sr-only" aria-live="polite">
          {activeTrack ? `${t('selectSong')}: ${activeTrack.name}` : ''}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[var(--music-border)]/60">
          <div className="flex-1 min-w-[180px] text-xs font-semibold text-[var(--music-text)] truncate" aria-live="polite">
            {selectedTrack ? (
              <span className="inline-flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--music-accent)] flex-shrink-0" aria-hidden="true" />
                <strong className="text-[var(--music-accent)] font-bold truncate">{selectedTrack.name}</strong>
                <span className="text-[var(--music-text-muted)] truncate">· {selectedTrack.artistName || t('music')}</span>
              </span>
            ) : selected ? (
              <span>{t('songSelected')}: {selected}</span>
            ) : (
              <span className="text-[var(--music-text-muted)]">{t('selectSongHint')}</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--music-border)] bg-transparent text-xs font-bold text-[var(--music-text)] hover:bg-[var(--music-surface)] active:scale-95 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[var(--music-accent)]"
              onClick={() => {
                stopPreview()
                onClose()
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="min-h-[44px] px-6 py-2 rounded-xl bg-[var(--music-accent)] text-white text-xs font-bold shadow-xs hover:shadow-sm hover:brightness-105 active:translate-y-0.5 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--music-accent)]"
              onClick={() => {
                if (selected) {
                  stopPreview()
                  onConfirm(selected)
                }
              }}
              disabled={!selected || isConfirming}
              aria-busy={isConfirming}
            >
              {isConfirming ? t('loading') : t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
