'use client'

import { useState, useEffect, useRef, useId } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUIStore } from '@/lib/stores/uiStore'
import { useMusicPlayer } from '@/lib/hooks/useMusicPlayer'
import { useToast } from '@/components/ui/Toast'
import { buildLineShareUrl } from '@/lib/share'
import { Icon } from './Icon'

const SongPickerModal = dynamic(() => import('@/components/community/SongPickerModal'), { ssr: false })
const LyricsDrawer = dynamic(() => import('@/components/ui/LyricsDrawer'), { ssr: false })

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function MobileBottomDock() {
  const { t } = useLanguage()
  const { openModal } = useUIStore()
  const {
    isPlaying,
    currentTrack,
    tracks,
    toggle,
    selectTrack,
    nextTrack,
    prevTrack,
    currentTime,
    duration,
    volume,
    setVolume,
    seekTo,
    commitReference,
    isLoading,
    playbackError,
    retry,
  } = useMusicPlayer()
  const toast = useToast()
  const [showMenuSheet, setShowMenuSheet] = useState(false)
  const [showMusicList, setShowMusicList] = useState(false)
  const [showVolumePopup, setShowVolumePopup] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isLyricsOpen, setIsLyricsOpen] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [lastAudibleVolume, setLastAudibleVolume] = useState(0.5)
  const reduceMotion = useReducedMotion()
  const menuId = useId()
  const musicListId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const musicListRef = useRef<HTMLDivElement>(null)
  const musicListButtonRef = useRef<HTMLButtonElement>(null)
  const volumePopupRef = useRef<HTMLDivElement>(null)
  const volumeButtonRef = useRef<HTMLButtonElement>(null)
  const wasMusicListOpenRef = useRef(false)

  const progressMax = duration > 0 ? duration : currentTrack?.duration ?? 0
  const progressPercent = progressMax > 0 ? Math.min(100, (currentTime / progressMax) * 100) : 0
  const volumePercent = Math.min(100, Math.max(0, volume * 100))
  const currentReference = currentTrack?.reference ?? (currentTrack ? `jamendo:${currentTrack.id}` : '')

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVolumePopup) {
          setShowVolumePopup(false)
          volumeButtonRef.current?.focus()
          return
        }
        if (showMusicList) {
          setShowMusicList(false)
          musicListButtonRef.current?.focus()
          return
        }
        if (showMenuSheet) {
          setShowMenuSheet(false)
          setShowShareOptions(false)
          menuBtnRef.current?.focus()
          return
        }
      }

      if (e.key === 'Tab' && showMenuSheet && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    if (showMusicList || showMenuSheet || showVolumePopup) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showMenuSheet, showMusicList, showVolumePopup])

  useEffect(() => {
    if (showMenuSheet) {
      requestAnimationFrame(() => {
        menuRef.current?.querySelector<HTMLElement>('button:not([disabled]), a[href]')?.focus()
      })
    }
    if (wasMusicListOpenRef.current && !showMusicList) musicListButtonRef.current?.focus()
    wasMusicListOpenRef.current = showMusicList
  }, [showMenuSheet, showMusicList])

  useEffect(() => {
    if (!showMusicList && !showMenuSheet && !showVolumePopup) return
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (showVolumePopup && volumePopupRef.current && !volumePopupRef.current.contains(target) && !volumeButtonRef.current?.contains(target)) {
        setShowVolumePopup(false)
      }
      if (showMusicList && musicListRef.current && !musicListRef.current.contains(target) && !musicListButtonRef.current?.contains(target)) {
        setShowMusicList(false)
      }
      if (showMenuSheet && menuRef.current && !menuRef.current.contains(target)) {
        setShowMenuSheet(false)
        setShowShareOptions(false)
        menuBtnRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [showMenuSheet, showMusicList, showVolumePopup])

  // PC（SocialButtons.tsx）と完全同一のSNSシェア処理
  const handleShare = async (platform: string) => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    const shareText = t('happyBirthday')

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400,noopener,noreferrer')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400,noopener,noreferrer')
        break
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank', 'noopener,noreferrer')
        break
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
        break
      case 'line':
        window.open(buildLineShareUrl('', shareText, shareUrl), '_blank', 'noopener,noreferrer')
        break
      case 'copy':
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(shareUrl)
            toast.success(t('linkCopied'))
            return
          } catch {
          }
        }
        toast.info(t('linkCopied'))
        break
    }
  }

  return (
    <>
      {/* 1. 上層スリム音楽バー（ミニシークバー＋SongPickerModal起動導線） */}
      <div className="fixed inset-x-3 bottom-[calc(74px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md md:hidden font-body text-[var(--music-text)]">
        <div className="relative rounded-2xl border border-[var(--music-border)] bg-[var(--music-surface-elevated)] shadow-[0_8px_24px_rgba(133,77,39,0.18)] p-2.5 flex flex-col gap-1.5 transition-all">
          {/* ミニシークバー */}
          <div className="relative w-full h-1.5 bg-[color-mix(in_srgb,var(--music-border)_50%,var(--music-surface))] rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const clickX = e.clientX - rect.left
            const ratio = Math.max(0, Math.min(1, clickX / rect.width))
            seekTo(ratio * progressMax)
          }}>
            <div
              className="h-full bg-[var(--music-accent)] rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex min-h-[52px] items-center gap-2">
            {/* 曲名 ＆ 楽曲モーダル開閉ボタン */}
            <button
              ref={musicListButtonRef}
              onClick={() => {
                setShowMusicList(!showMusicList)
              }}
              className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
              aria-label={t('selectMusic')}
              aria-expanded={showMusicList}
              aria-controls={musicListId}
            >
              <div
                className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--music-border)] bg-[color-mix(in_srgb,var(--music-accent)_12%,var(--music-surface))] text-[var(--music-accent)] shadow-2xs"
              >
                {currentTrack && 'albumImage' in currentTrack && typeof currentTrack.albumImage === 'string' ? (
                  <img src={currentTrack.albumImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="Music" size={18} useSvg />
                )}
                {isPlaying && (
                  <div className="absolute inset-x-0 bottom-0.5 flex items-end justify-center gap-0.5 h-2 px-1" aria-hidden="true">
                    <span className="w-0.5 bg-[var(--music-accent)] rounded-full animate-soundbar-1" />
                    <span className="w-0.5 bg-[var(--music-accent)] rounded-full animate-soundbar-2" />
                    <span className="w-0.5 bg-[var(--music-accent)] rounded-full animate-soundbar-3" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-[var(--music-text)] block truncate">
                  {currentTrack?.name || t('birthdaySong')}
                </span>
                <span className="text-[10px] text-[var(--music-text-muted)] block truncate mt-0.5 font-mono tabular-nums">
                  {formatTime(currentTime)} / {formatTime(progressMax)}
                </span>
              </div>
            </button>

            {/* 歌詞ドロワー起動ボタン */}
            <button
              type="button"
              onClick={() => setIsLyricsOpen(true)}
              className="min-h-[44px] min-w-[36px] px-1.5 flex items-center justify-center rounded-lg text-xs font-bold text-[var(--music-accent)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface))] active:scale-[0.96] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
              aria-label={t('lyricsTitle')}
            >
              <Icon name="Mic" size={18} useSvg />
            </button>

            {/* SongPickerModal起動導線ボタン */}
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="min-h-[44px] px-1.5 flex items-center justify-center rounded-lg text-xs font-bold text-[var(--music-accent)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface))] active:scale-[0.96] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
              aria-label={t('selectMusic')}
            >
              <Icon name="Search" size={18} useSvg />
            </button>

            {/* 音量ボタン ＆ 調整ポップアップ */}
            <div className="relative">
              <button
                ref={volumeButtonRef}
                type="button"
                onClick={() => {
                  setShowVolumePopup(!showVolumePopup)
                  if (showMusicList) setShowMusicList(false)
                }}
                className={`min-h-[44px] min-w-[36px] px-1.5 flex items-center justify-center rounded-lg ${
                  showVolumePopup
                    ? 'bg-[color-mix(in_srgb,var(--music-accent)_15%,var(--music-surface))] text-[var(--music-accent)]'
                    : 'text-slate-700 dark:text-slate-300'
                } hover:text-[var(--music-accent)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface))] active:scale-[0.96] cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]`}
                aria-label={t('volume')}
                aria-expanded={showVolumePopup}
              >
                <Icon
                  name={volume === 0 || isMuted ? 'VolumeX' : volume < 0.5 ? 'Volume1' : 'Volume2'}
                  size={19}
                  useSvg
                  className="text-current"
                />
              </button>

              {/* 音量調整ポップアップ */}
              <AnimatePresence>
                {showVolumePopup && (
                  <motion.div
                    ref={volumePopupRef}
                    initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: reduceMotion ? 0 : 0.15 }}
                    className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--music-border)] bg-[var(--music-surface-elevated)] backdrop-blur-md shadow-[0_8px_24px_rgba(133,77,39,0.22)]"
                    style={{ minWidth: '190px' }}
                  >
                    {/* Tooltip 矢印 */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b border-[var(--music-border)] bg-[var(--music-surface-elevated)] pointer-events-none" />

                    {/* ミュート切替 */}
                    <button
                      type="button"
                      onClick={handleMuteToggle}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:text-[var(--music-accent)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface))] active:scale-[0.96] cursor-pointer transition-colors"
                      aria-label={isMuted || volume === 0 ? t('unmute') : t('mute')}
                    >
                      <Icon name={isMuted || volume === 0 ? 'VolumeX' : 'Volume2'} size={18} useSvg className="text-current" />
                    </button>

                    {/* スライダー */}
                    <div className="flex-1 flex items-center">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setVolume(val)
                          if (val > 0) {
                            setLastAudibleVolume(val)
                            setIsMuted(false)
                          }
                        }}
                        style={{
                          background: `linear-gradient(to right, var(--music-accent) 0%, var(--music-accent) ${volumePercent}%, color-mix(in srgb, var(--music-border) 60%, var(--music-surface)) ${volumePercent}%, color-mix(in srgb, var(--music-border) 60%, var(--music-surface)) 100%)`,
                        }}
                        className="w-full h-1.5 rounded-full appearance-none transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--music-accent)] [&::-webkit-slider-thumb]:shadow-xs [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--music-accent)] [&::-moz-range-thumb]:border-0"
                        aria-label={t('volume')}
                        aria-valuetext={`${Math.round(volume * 100)}%`}
                      />
                    </div>

                    {/* ％ 表示 */}
                    <span className="text-[11px] font-mono tabular-nums font-bold text-[var(--music-text)] select-none w-7 text-right">
                      {Math.round(volume * 100)}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isLoading && <span role="status" aria-live="polite" className="sr-only">{t('loading')}</span>}
            {playbackError && (
              <button
                type="button"
                onClick={retry}
                className="min-h-11 min-w-11 rounded-lg px-2 text-xs font-semibold text-[var(--music-error)] underline focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
                aria-label={t('retry')}
              >
                {t('retry')}
              </button>
            )}

            {/* 前の曲・再生/停止・次の曲 */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* 前の曲 */}
              <button
                onClick={prevTrack}
                className="min-w-[44px] min-h-[44px] bg-transparent hover:scale-105 active:scale-[0.96] flex items-center justify-center cursor-pointer transition-transform text-slate-700 dark:text-slate-300 hover:text-[var(--music-accent)] focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
                aria-label={t('previousTrack')}
              >
                <Icon name="SkipBack" size={20} useSvg className="text-current" />
              </button>

              {/* 再生 / 一時停止 */}
              <button
                onClick={toggle}
                disabled={!currentTrack || isLoading}
                aria-busy={isLoading}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-[var(--music-accent)] text-white shadow-xs flex items-center justify-center active:scale-[0.96] cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] hover:brightness-105 transition-all"
                aria-label={isPlaying ? t('pause') : t('play')}
              >
                {isLoading ? (
                  <Icon name="LoaderCircle" size={20} useSvg className="motion-safe:animate-spin text-white" />
                ) : (
                  <Icon name={isPlaying ? 'Pause' : 'Play'} size={20} useSvg className="text-white fill-current" />
                )}
              </button>

              {/* 次の曲 */}
              <button
                onClick={nextTrack}
                className="min-w-[44px] min-h-[44px] bg-transparent hover:scale-105 active:scale-[0.96] flex items-center justify-center cursor-pointer transition-transform text-slate-700 dark:text-slate-300 hover:text-[var(--music-accent)] focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
                aria-label={t('nextTrack')}
              >
                <Icon name="SkipForward" size={20} useSvg className="text-current" />
              </button>
            </div>
          </div>
        </div>

        {/* 楽曲クイック選択ドロップダウン */}
        <AnimatePresence>
          {showMusicList && (
            <motion.div
              ref={musicListRef}
              id={musicListId}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="mt-2 p-2 max-h-48 overflow-y-auto rounded-xl border border-[var(--music-border)] bg-[var(--music-surface-elevated)] shadow-lg"
            >
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--music-border)] px-1">
                <span className="text-xs font-bold text-[var(--music-text)]">{t('selectMusic')}</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowMusicList(false)
                    setIsPickerOpen(true)
                  }}
                  className="text-xs font-bold text-[var(--music-accent)] underline hover:opacity-80"
                >
                  {t('songSearchButton')}
                </button>
              </div>
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => {
                    selectTrack(track.id)
                    setShowMusicList(false)
                  }}
                  className={`w-full min-h-[44px] px-2.5 py-2 mb-1 last:mb-0 rounded-lg text-left text-xs font-body flex items-center justify-between cursor-pointer transition-colors ${
                    currentTrack?.id === track.id
                      ? 'bg-[var(--music-accent)] text-[var(--music-surface)] font-bold'
                      : 'text-[var(--music-text)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface))]'
                  }`}
                >
                  <span className="truncate">{track.name}</span>
                  {currentTrack?.id === track.id && (
                    <span className="text-[10px] font-bold text-[var(--music-focus)] ml-1">●</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <SongPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onConfirm={handleConfirmTrack}
          initialValue={currentReference}
          isConfirming={isCommitting}
        />

        <LyricsDrawer
          isOpen={isLyricsOpen}
          onClose={() => setIsLyricsOpen(false)}
        />
      </div>

      {/* 2. PCのGameButtons & SocialButtons を完全統合したメニューシート */}
      <AnimatePresence>
        {showMenuSheet && (
          <div
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label={t('gamesAndSocial')}
            className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
          >
            {/* 背景オーバーレイ */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              onClick={() => {
                setShowMenuSheet(false)
                setShowShareOptions(false)
                menuBtnRef.current?.focus()
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              ref={menuRef}
              initial={reduceMotion ? false : { y: '100%' }}
              animate={{ y: 0 }}
              exit={reduceMotion ? { y: 0 } : { y: '100%' }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 mx-3 mb-20 p-4 bg-[var(--music-surface)] border-2 border-[var(--music-border)] text-[var(--music-accent)] max-h-[80vh] overflow-y-auto rounded-2xl shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[var(--music-border)]">
                <div className="flex items-center gap-2">
                  <Icon name="Gamepad" size={22} useSvg className="text-[var(--music-accent)]" />
                  <span className="font-bold text-sm font-body tracking-wider text-[var(--music-accent)]">
                    {t('gamesAndSocial')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    setShowShareOptions(false)
                    menuBtnRef.current?.focus()
                  }}
                  className="min-w-[44px] min-h-[44px] bg-[var(--music-surface-elevated)] text-[var(--music-accent)] border border-[var(--music-border)] rounded-lg flex items-center justify-center cursor-pointer active:translate-y-0.5"
                  aria-label={t('close')}
                >
                  <Icon name="X" size={18} useSvg className="text-[var(--music-accent)]" />
                </button>
              </div>

              {/* PC GameButtons / 記念機能 と 100% 同一の機能グリッド */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {/* おみくじ */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('omikuji')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="Sparkles" size={22} />
                  </div>
                  <span className="truncate">{t('omikujiTitle')}</span>
                </button>

                {/* あの日の思い出 */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('flashback')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="Calendar" size={22} />
                  </div>
                  <span className="truncate">{t('flashbackTitle')}</span>
                </button>

                {/* タイムカプセル */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('timeCapsule')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="Archive" size={22} />
                  </div>
                  <span className="truncate">{t('timeCapsuleTitle')}</span>
                </button>

                {/* 勉強部屋（コワーキング） */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('studyRoom')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="BookOpen" size={22} />
                  </div>
                  <span className="truncate">{t('studyRoomTitle')}</span>
                </button>

                {/* 禅・集中モード（全画面ソロ集中） */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('zenFocus')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="Sparkles" size={22} />
                  </div>
                  <span className="truncate">{t('studyZenModeTitle')}</span>
                </button>

                {/* 1. 記憶ゲーム (Brain) */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('memoryGame')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="Brain" size={22} />
                  </div>
                  <span className="truncate">{t('memoryGame')}</span>
                </button>

                {/* 2. パズル (Puzzle) */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('puzzleGame')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="Puzzle" size={22} />
                  </div>
                  <span className="truncate">{t('puzzleGame')}</span>
                </button>

                {/* 3. カレンダー (Calendar) */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('calendar')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="Calendar" size={22} />
                  </div>
                  <span className="truncate">{t('birthdayCalendar')}</span>
                </button>

                {/* 4. クイズ (HelpCircle) */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('quiz')
                  }}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="min-h-[48px] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer hover:brightness-110"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <Icon name="HelpCircle" size={22} />
                  </div>
                  <span className="truncate">{t('birthdayQuiz')}</span>
                </button>
              </div>

              {/* PC SocialButtons と 100% 同一の「友達を招待 (Users)」ボタン */}
              <div className="border-t-2 border-[var(--music-border)] pt-2.5">
                <button
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  style={{
                    background: '#854D27',
                    border: '2px solid #D4B08C',
                    boxShadow: '2px 2px 0 #D4B08C',
                    color: '#FFF9F3',
                  }}
                  className="w-full min-h-[48px] p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold font-body shadow-sm active:translate-y-0.5 cursor-pointer hover:brightness-110"
                >
                  <Icon name="Users" size={22} />
                  <span>{t('inviteFriends')}</span>
                </button>

                {/* PCと全く同一の5大SNSシェアメニュー（Facebook, LINE, Twitter, WhatsApp, Telegram, コピー） */}
                {showShareOptions && (
                  <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 bg-[var(--music-surface)] border border-[var(--music-border)] rounded-xl">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 min-h-[44px] p-2 bg-[var(--music-surface-elevated)] border border-[var(--music-border)] rounded-lg text-xs font-body text-[var(--music-text)] cursor-pointer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span>Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare('line')}
                      aria-label={t('shareOnLine')}
                      className="flex items-center gap-2 min-h-[44px] p-2 bg-[var(--music-surface-elevated)] border border-[var(--music-border)] rounded-lg text-xs font-body text-[var(--music-text)] cursor-pointer"
                    >
                      <span className="font-bold">LINE</span>
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-2 min-h-[44px] p-2 bg-[var(--music-surface-elevated)] border border-[var(--music-border)] rounded-lg text-xs font-body text-[var(--music-text)] cursor-pointer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span>Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-2 min-h-[44px] p-2 bg-[var(--music-surface-elevated)] border border-[var(--music-border)] rounded-lg text-xs font-body text-[var(--music-text)] cursor-pointer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShare('telegram')}
                      className="flex items-center gap-2 min-h-[44px] p-2 bg-[var(--music-surface-elevated)] border border-[var(--music-border)] rounded-lg text-xs font-body text-[var(--music-text)] cursor-pointer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0088cc"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      <span>Telegram</span>
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="col-span-2 flex items-center justify-center gap-2 min-h-[44px] p-2 bg-[var(--music-surface-elevated)] border border-[var(--music-border)] rounded-lg text-xs font-body text-[var(--music-text)] cursor-pointer"
                    >
                      <Icon name="Copy" size={18} useSvg className="text-[var(--music-text)]" />
                      <span>{t('copyLink')}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. 下層ナビバー（touch target ≥48px、コントラスト比 ≥4.5:1、PCと同一のビンテージ木目調＆アセットアイコン） */}
      <nav
        className="mobile-bottom-dock fixed inset-x-3 bottom-2 z-40 mx-auto max-w-md pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label={t('mobileNavDock')}
      >
        <div
          style={{
            background: '#854D27',
            border: '2px solid #D4B08C',
            boxShadow: '0 4px 16px rgba(133, 77, 39, 0.4)',
          }}
          className="flex items-center justify-around p-1 rounded-2xl"
        >
          {/* 1. アルバムを見る (PC: Camera) */}
          <button
            onClick={() => openModal('album')}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 text-[#FFF9F3] hover:text-[#D4B08C] active:translate-y-0.5 transition-transform cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D4B08C] rounded-lg"
            aria-label={t('viewAlbum')}
          >
            <Icon name="Camera" size={24} />
            <span className="text-[11px] font-bold tracking-tight mt-0.5 font-body text-[#FFF9F3]">
              {t('dockAlbum')}
            </span>
          </button>

          {/* 2. メッセージを送る (PC: PenLine) */}
          <button
            onClick={() => openModal('message')}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 text-[#FFF9F3] hover:text-[#D4B08C] active:translate-y-0.5 transition-transform cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D4B08C] rounded-lg"
            aria-label={t('sendMessage')}
          >
            <Icon name="PenLine" size={24} />
            <span className="text-[11px] font-bold tracking-tight mt-0.5 font-body text-[#FFF9F3]">
              {t('dockWishes')}
            </span>
          </button>

          {/* 3. 掲示板 (PC: ClipboardList) */}
          <button
            onClick={() => openModal('bulletin')}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 text-[#FFF9F3] hover:text-[#D4B08C] active:translate-y-0.5 transition-transform cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D4B08C] rounded-lg"
            aria-label={t('bulletinBoard')}
          >
            <Icon name="ClipboardList" size={24} />
            <span className="text-[11px] font-bold tracking-tight mt-0.5 font-body text-[#FFF9F3]">
              {t('dockBoard')}
            </span>
          </button>

          {/* 4. グループチャット (PC: MessageCircle) */}
          <button
            onClick={() => openModal('chat')}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 text-[#FFF9F3] hover:text-[#D4B08C] active:translate-y-0.5 transition-transform cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D4B08C] rounded-lg"
            aria-label={t('groupChat')}
          >
            <Icon name="MessageCircle" size={24} />
            <span className="text-[11px] font-bold tracking-tight mt-0.5 font-body text-[#FFF9F3]">
              {t('dockChat')}
            </span>
          </button>

          {/* 5. ゲーム ＆ 共有 (PC: Gamepad) */}
          <button
            ref={menuBtnRef}
            onClick={() => {
              setShowMenuSheet(!showMenuSheet)
              if (showMenuSheet) setShowShareOptions(false)
            }}
            aria-expanded={showMenuSheet}
            aria-controls={menuId}
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 ${showMenuSheet ? 'bg-black/25 text-[#D4B08C]' : 'text-[#FFF9F3]'} hover:text-[#D4B08C] active:translate-y-0.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D4B08C] rounded-lg`}
            aria-label={t('gamesAndSocial')}
          >
            <Icon name="Gamepad" size={24} />
            <span className="text-[11px] font-bold tracking-tight mt-0.5 font-body text-[#FFF9F3]">
              {t('dockGames')}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
