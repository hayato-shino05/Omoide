'use client'

import { useState, useEffect, type KeyboardEvent } from 'react'
import {
  Music,
  Disc3,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  LoaderCircle,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useMusicPlayer } from '@/lib/hooks/useMusicPlayer'
import { useToast } from '@/components/ui/Toast'
import SongPickerModal from '@/components/community/SongPickerModal'
import LyricsDrawer from '@/components/ui/LyricsDrawer'

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const isSafeHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function MusicPlayer() {
  const { t } = useLanguage()
  const toast = useToast()
  const {
    isPlaying,
    currentTrack,
    tracks,
    toggle,
    selectTrack,
    commitReference,
    nextTrack,
    prevTrack,
    currentTime,
    duration,
    volume,
    setVolume,
    seekTo,
    isLoading,
    playbackError,
  } = useMusicPlayer()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isLyricsOpen, setIsLyricsOpen] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [lastAudibleVolume, setLastAudibleVolume] = useState(0.5)
  const [artworkFailedFor, setArtworkFailedFor] = useState<string | null>(null)

  useEffect(() => {
    if (playbackError) {
      toast.error(playbackError, { title: t('soundPlaybackError') })
    }
  }, [playbackError, t, toast])

  const handleConfirmTrack = (reference: string) => {
    const existingTrack = tracks.find((track) => track.reference === reference || `jamendo:${track.id}` === reference)
    if (existingTrack) {
      selectTrack(existingTrack.id)
      setIsPickerOpen(false)
      return
    }

    setIsCommitting(true)
    void commitReference(reference).then((committed) => {
      if (committed) setIsPickerOpen(false)
    }).finally(() => setIsCommitting(false))
  }

  const handleMuteToggle = () => {
    if (isMuted || volume === 0) {
      setVolume(lastAudibleVolume > 0 ? lastAudibleVolume : 0.5)
      setIsMuted(false)
      return
    }
    setLastAudibleVolume(volume)
    setVolume(0)
    setIsMuted(true)
  }

  const currentReference = currentTrack?.reference ?? (currentTrack ? `jamendo:${currentTrack.id}` : '')
  const progressMax = duration > 0 ? duration : currentTrack?.duration ?? 0
  const artworkUrl = currentTrack && 'albumImage' in currentTrack && typeof currentTrack.albumImage === 'string'
    ? currentTrack.albumImage
    : undefined
  const progressValue = Math.min(currentTime, progressMax || 0)
  const progressPercent = progressMax > 0 ? Math.min(100, Math.max(0, (progressValue / progressMax) * 100)) : 0
  const volumePercent = Math.min(100, Math.max(0, volume * 100))

  const trackTitle = currentTrack?.name || t('birthdaySong') || t('chooseSong')
  const trackArtist = currentTrack?.artistName || currentTrack?.category || t('music')

  const handleSeekKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const delta = event.shiftKey ? 1 : 5
      seekTo(Math.max(0, Math.min(progressMax, currentTime + direction * delta)))
    } else if (event.key === 'Home') {
      event.preventDefault()
      seekTo(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      seekTo(progressMax)
    } else if (event.key === ' ' || event.key.toLowerCase() === 'k') {
      event.preventDefault()
      toggle()
    }
  }

  return (
    <div className="relative w-full max-w-6xl">
      {/* 歌詞スライドパネル（MusicPlayerの背面から上へせり上がる） */}
      <LyricsDrawer
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        onToggle={() => setIsLyricsOpen((prev) => !prev)}
      />

      {/* メイン音楽プレイヤー（前面 z-30） */}
      <section
        className="relative z-30 w-full rounded-2xl transition-all duration-200 ease-out pointer-events-auto opacity-100 scale-100 translate-y-0 min-h-[84px] px-5 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-[var(--music-text)] border border-amber-950/10 dark:border-amber-100/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-body flex flex-wrap items-center justify-between gap-4"
        aria-label={t('selectMusic')}
      >

        {/* 左ゾーン: アートワーク ＋ 音波インジケーター ＋ 楽曲情報 */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1 basis-64 max-w-xs lg:max-w-sm">
          <div
            className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-amber-950/10 dark:border-amber-100/10 bg-amber-50/50 dark:bg-slate-800/80 flex items-center justify-center text-[#D95D39] shadow-inner"
            aria-hidden="true"
          >
            {isSafeHttpsUrl(artworkUrl) && artworkFailedFor !== currentTrack?.id ? (
              <img
                src={artworkUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setArtworkFailedFor(currentTrack?.id ?? null)}
              />
            ) : isPlaying ? (
              <Disc3 className="w-7 h-7 text-[#D95D39] animate-[spin_8s_linear_infinite]" />
            ) : (
              <Music className="w-6 h-6 text-[#D95D39]/80" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#D95D39] tracking-wider uppercase select-none">
                {t('nowPlaying')}
              </span>
              {/* 和風音波アニメーション */}
              <div className="flex items-end gap-0.5 h-3" aria-hidden="true">
                <span className={`w-0.5 bg-[#D95D39] rounded-full transition-all ${isPlaying ? 'animate-soundbar-1' : 'h-1 opacity-35'}`} />
                <span className={`w-0.5 bg-[#D95D39] rounded-full transition-all ${isPlaying ? 'animate-soundbar-2' : 'h-2 opacity-35'}`} />
                <span className={`w-0.5 bg-[#D95D39] rounded-full transition-all ${isPlaying ? 'animate-soundbar-3' : 'h-1.5 opacity-35'}`} />
              </div>
            </div>
            <strong className="block text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5 leading-snug">
              {trackTitle}
            </strong>
            <span className="block text-xs text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
              {trackArtist}
            </span>
          </div>
        </div>

        {/* 中央ゾーン: コントロールボタン群 ＋ シークバー */}
        <div className="flex flex-col items-center justify-center gap-2 flex-1 basis-80 max-w-md mx-auto min-w-[220px]">
          {/* コントロールボタン群 */}
          <div className="flex items-center gap-3" aria-label={t('selectMusic')}>
            <button
              type="button"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border border-stone-200/80 dark:border-stone-700/80 bg-stone-100/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:text-[#D95D39] hover:border-[#D95D39]/30 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 active:scale-95 flex items-center justify-center cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#D95D39]/50 focus-visible:outline-hidden"
              onClick={prevTrack}
              aria-label={t('previousTrack')}
            >
              <SkipBack className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#D95D39] hover:bg-[#c44e2b] text-white shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#D95D39]/60 focus-visible:ring-offset-2 focus-visible:outline-hidden"
              onClick={toggle}
              aria-label={isPlaying ? t('pause') : t('play')}
              aria-pressed={isPlaying}
              aria-busy={isLoading}
              disabled={!currentTrack || isLoading}
            >
              {isLoading ? (
                <LoaderCircle className="w-5 h-5 animate-spin text-white" aria-hidden="true" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" aria-hidden="true" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border border-stone-200/80 dark:border-stone-700/80 bg-stone-100/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:text-[#D95D39] hover:border-[#D95D39]/30 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 active:scale-95 flex items-center justify-center cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#D95D39]/50 focus-visible:outline-hidden"
              onClick={nextTrack}
              aria-label={t('nextTrack')}
            >
              <SkipForward className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* シークバー ＆ タイム表示 */}
          <div className="w-full flex items-center gap-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            <span className="w-9 text-right flex-shrink-0 select-none">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center py-1 group cursor-pointer">
              <input
                type="range"
                min={0}
                max={progressMax || 1}
                step={0.1}
                value={progressValue}
                onChange={(event) => seekTo(Number(event.target.value))}
                onKeyDown={handleSeekKeyDown}
                aria-label={t('seekPosition')}
                aria-valuetext={`${formatTime(progressValue)} / ${formatTime(progressMax)}`}
                disabled={!currentTrack || !progressMax}
                style={{
                  background: `linear-gradient(to right, #D95D39 0%, #D95D39 ${progressPercent}%, rgba(159, 179, 200, 0.25) ${progressPercent}%, rgba(159, 179, 200, 0.25) 100%)`,
                }}
                className="w-full h-1 group-hover:h-1.5 rounded-full appearance-none transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#D95D39]/50 focus-visible:outline-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D95D39] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:group-hover:scale-125 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#D95D39] [&::-moz-range-thumb]:border-0"
              />
            </div>
            <span className="w-9 text-left flex-shrink-0 select-none">{formatTime(progressMax)}</span>
          </div>
        </div>

        {/* 右ゾーン: 音量調整 ＋ 楽曲選択ボタン */}
        <div className="flex items-center justify-end gap-3 min-w-0 flex-1 basis-48">
          {/* 音量ミュート/調整 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full border border-stone-200/80 dark:border-stone-700/80 bg-stone-100/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:text-[#D95D39] hover:border-[#D95D39]/30 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 active:scale-95 flex items-center justify-center cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#D95D39]/50 focus-visible:outline-hidden"
              onClick={handleMuteToggle}
              aria-label={isMuted || volume === 0 ? t('unmute') : t('mute')}
              aria-pressed={isMuted || volume === 0}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <div className="hidden lg:flex items-center">
              <label htmlFor="music-player-volume" className="sr-only">{t('volume')}</label>
              <input
                id="music-player-volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(event) => {
                  const nextVolume = Number(event.target.value)
                  setVolume(nextVolume)
                  if (nextVolume > 0) {
                    setLastAudibleVolume(nextVolume)
                    setIsMuted(false)
                  }
                }}
                aria-label={t('volume')}
                aria-valuetext={`${Math.round(volume * 100)}%`}
                style={{
                  background: `linear-gradient(to right, #D95D39 0%, #D95D39 ${volumePercent}%, rgba(159, 179, 200, 0.25) ${volumePercent}%, rgba(159, 179, 200, 0.25) 100%)`,
                }}
                className="w-16 h-1 hover:h-1.5 rounded-full appearance-none transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D95D39]/50 focus-visible:outline-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D95D39] [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#D95D39] [&::-moz-range-thumb]:border-0"
              />
            </div>
          </div>

          {/* 楽曲選択モーダル起動ボタン */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            disabled={isCommitting}
            aria-label={t('selectMusic')}
            className="min-h-[44px] px-4 py-2 inline-flex items-center gap-2 rounded-xl bg-amber-50/60 dark:bg-slate-800/80 border border-amber-950/15 dark:border-amber-100/15 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-[#D95D39]/10 hover:border-[#D95D39]/40 hover:text-[#D95D39] dark:hover:text-[#D95D39] active:scale-98 cursor-pointer transition-all shadow-xs disabled:opacity-60 disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-[#D95D39]/50 focus-visible:outline-hidden whitespace-nowrap"
          >
            <Disc3 className="w-4 h-4 text-[#D95D39] shrink-0" aria-hidden="true" />
            <span>{isCommitting ? t('loading') : t('selectMusic')}</span>
          </button>
        </div>

        <SongPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onConfirm={handleConfirmTrack}
          initialValue={currentReference}
          isConfirming={isCommitting}
        />
      </section>
    </div>
  )
}
