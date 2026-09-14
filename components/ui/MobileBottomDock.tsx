'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUIStore } from '@/lib/stores/uiStore'
import { useMusicPlayer } from '@/lib/hooks/useMusicPlayer'
import { buildLineShareUrl } from '@/lib/share'
import { Icon } from './Icon'
import SongPickerModal from '@/components/community/SongPickerModal'

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
    seekTo,
    commitReference,
    isLoading,
    playbackError,
    retry,
  } = useMusicPlayer()
  const [showMenuSheet, setShowMenuSheet] = useState(false)
  const [showMusicList, setShowMusicList] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const reduceMotion = useReducedMotion()
  const menuId = useId()
  const musicListId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const musicListRef = useRef<HTMLDivElement>(null)
  const musicListButtonRef = useRef<HTMLButtonElement>(null)
  const wasMusicListOpenRef = useRef(false)

  const progressMax = duration > 0 ? duration : currentTrack?.duration ?? 0
  const progressPercent = progressMax > 0 ? Math.min(100, (currentTime / progressMax) * 100) : 0
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

    if (showMusicList || showMenuSheet) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showMenuSheet, showMusicList])

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
    if (!showMusicList && !showMenuSheet) return
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node
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
  }, [showMenuSheet, showMusicList])

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
            alert(t('linkCopied'))
            return
          } catch {
          }
        }
        window.prompt(t('copyLinkPrompt'), shareUrl)
        break
    }
  }

  return (
    <>
      {/* 1. 上層スリム音楽バー（ミニシークバー＋SongPickerModal起動導線） */}
      <div className="fixed inset-x-3 bottom-[calc(74px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md md:hidden font-body text-[var(--music-text)]">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--music-border)] bg-[var(--music-surface-elevated)] shadow-[0_8px_24px_rgba(133,77,39,0.18)] p-2.5 flex flex-col gap-1.5 transition-all">
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
                  <Icon name="Music" size={18} />
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
                <span className="text-[10px] text-[var(--music-text-muted)] block truncate mt-0.5">
                  {formatTime(currentTime)} / {formatTime(progressMax)}
                </span>
              </div>
            </button>

            {/* SongPickerModal起動導線ボタン */}
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="min-h-[44px] px-2 flex items-center justify-center rounded-lg text-xs font-bold text-[var(--music-accent)] hover:bg-[var(--music-surface)] active:scale-95 cursor-pointer transition-all"
              aria-label={t('selectMusic')}
            >
              <Icon name="Search" size={16} />
            </button>

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
                className="min-w-[44px] min-h-[44px] bg-transparent hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer transition-transform text-[var(--music-text)] focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
                aria-label={t('previousTrack')}
              >
                <Icon name="SkipBack" size={20} useSvg />
              </button>

              {/* 再生 / 一時停止 */}
              <button
                onClick={toggle}
                disabled={!currentTrack || isLoading}
                aria-busy={isLoading}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-[var(--music-accent)] text-[var(--music-surface)] border border-[var(--music-border)] shadow-xs flex items-center justify-center active:scale-95 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
                aria-label={isPlaying ? t('pause') : t('play')}
              >
                <Icon name={isPlaying ? 'Pause' : 'Play'} size={20} useSvg />
              </button>

              {/* 次の曲 */}
              <button
                onClick={nextTrack}
                className="min-w-[44px] min-h-[44px] bg-transparent hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer transition-transform text-[var(--music-text)] focus-visible:ring-2 focus-visible:ring-[var(--music-focus)]"
                aria-label={t('nextTrack')}
              >
                <Icon name="SkipForward" size={20} useSvg />
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
                  <Icon name="Gamepad" size={22} />
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
                  <Icon name="X" size={18} />
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
                  className="min-h-[48px] p-2.5 bg-[var(--music-surface-elevated)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface-elevated))] text-[var(--music-accent)] border border-[var(--music-border)] rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer"
                >
                  <div className="w-7 h-7 bg-[color-mix(in_srgb,var(--music-surface)_12%,transparent)] flex items-center justify-center flex-shrink-0 rounded-lg">
                    <Icon name="Sparkles" size={20} />
                  </div>
                  <span className="truncate">{t('omikujiTitle')}</span>
                </button>

                {/* あの日の思い出 */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('flashback')
                  }}
                  className="min-h-[48px] p-2.5 bg-[var(--music-surface-elevated)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface-elevated))] text-[var(--music-accent)] border border-[var(--music-border)] rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer"
                >
                  <div className="w-7 h-7 bg-[color-mix(in_srgb,var(--music-surface)_12%,transparent)] flex items-center justify-center flex-shrink-0 rounded-lg">
                    <Icon name="Calendar" size={20} />
                  </div>
                  <span className="truncate">{t('flashbackTitle')}</span>
                </button>

                {/* タイムカプセル */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('timeCapsule')
                  }}
                  className="min-h-[48px] p-2.5 bg-[var(--music-surface-elevated)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface-elevated))] text-[var(--music-accent)] border border-[var(--music-border)] rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer col-span-2"
                >
                  <div className="w-7 h-7 bg-[color-mix(in_srgb,var(--music-surface)_12%,transparent)] flex items-center justify-center flex-shrink-0 rounded-lg">
                    <Icon name="Archive" size={20} />
                  </div>
                  <span className="truncate">{t('timeCapsuleTitle')}</span>
                </button>

                {/* 1. 記憶ゲーム (Brain) */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('memoryGame')
                  }}
                  className="min-h-[48px] p-2.5 bg-[var(--music-surface-elevated)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface-elevated))] text-[var(--music-accent)] border border-[var(--music-border)] rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer"
                >
                  <div className="w-7 h-7 bg-[color-mix(in_srgb,var(--music-surface)_12%,transparent)] flex items-center justify-center flex-shrink-0 rounded-lg">
                    <Icon name="Brain" size={20} />
                  </div>
                  <span className="truncate">{t('memoryGame')}</span>
                </button>

                {/* 2. パズル (Puzzle) */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('puzzleGame')
                  }}
                  className="min-h-[48px] p-2.5 bg-[var(--music-surface-elevated)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface-elevated))] text-[var(--music-accent)] border border-[var(--music-border)] rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer"
                >
                  <div className="w-7 h-7 bg-[color-mix(in_srgb,var(--music-surface)_12%,transparent)] flex items-center justify-center flex-shrink-0 rounded-lg">
                    <Icon name="Puzzle" size={20} />
                  </div>
                  <span className="truncate">{t('puzzleGame')}</span>
                </button>

                {/* 3. カレンダー (Calendar) */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('calendar')
                  }}
                  className="min-h-[48px] p-2.5 bg-[var(--music-surface-elevated)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface-elevated))] text-[var(--music-accent)] border border-[var(--music-border)] rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer"
                >
                  <div className="w-7 h-7 bg-[color-mix(in_srgb,var(--music-surface)_12%,transparent)] flex items-center justify-center flex-shrink-0 rounded-lg">
                    <Icon name="Calendar" size={20} />
                  </div>
                  <span className="truncate">{t('birthdayCalendar')}</span>
                </button>

                {/* 4. クイズ (HelpCircle) */}
                <button
                  onClick={() => {
                    setShowMenuSheet(false)
                    openModal('quiz')
                  }}
                  className="min-h-[48px] p-2.5 bg-[var(--music-surface-elevated)] hover:bg-[color-mix(in_srgb,var(--music-accent)_10%,var(--music-surface-elevated))] text-[var(--music-accent)] border border-[var(--music-border)] rounded-xl flex items-center gap-2.5 text-xs font-bold font-body active:translate-y-0.5 transition-all text-left cursor-pointer"
                >
                  <div className="w-7 h-7 bg-[color-mix(in_srgb,var(--music-surface)_12%,transparent)] flex items-center justify-center flex-shrink-0 rounded-lg">
                    <Icon name="HelpCircle" size={20} />
                  </div>
                  <span className="truncate">{t('birthdayQuiz')}</span>
                </button>
              </div>

              {/* PC SocialButtons と 100% 同一の「友達を招待 (Users)」ボタン */}
              <div className="border-t border-[var(--music-border)]/50 pt-2.5">
                <button
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="w-full min-h-[46px] p-2.5 bg-[var(--music-accent)] hover:bg-[color-mix(in_srgb,var(--music-accent)_82%,var(--music-text)_18%)] text-[var(--music-surface)] border-2 border-[var(--music-border)] rounded-xl flex items-center justify-center gap-2 text-xs font-bold font-body shadow-sm active:translate-y-0.5 cursor-pointer"
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
                      <Icon name="Copy" size={18} />
                      <span>{t('copyLink')}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. 下層ナビバー（touch target ≥48px、コントラスト比 ≥4.5:1） */}
      <nav
        className="mobile-bottom-dock fixed inset-x-3 bottom-2 z-40 mx-auto max-w-md pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label={t('mobileNavDock')}
      >
        <div
          className="flex items-center justify-around p-1.5 bg-[var(--music-accent)] text-[var(--music-surface)] border-2 border-[var(--music-border)] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        >
          {/* 1. アルバムを見る (PC: Camera) */}
          <button
            onClick={() => openModal('album')}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 text-[var(--music-surface)] hover:text-[var(--music-focus)] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] rounded-lg"
            aria-label={t('viewAlbum')}
          >
            <Icon name="Camera" size={22} />
            <span className="text-xs font-bold tracking-tight mt-1 font-body text-[var(--music-surface)]">
              {t('dockAlbum')}
            </span>
          </button>

          {/* 2. メッセージを送る (PC: PenLine) */}
          <button
            onClick={() => openModal('message')}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 text-[var(--music-surface)] hover:text-[var(--music-focus)] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] rounded-lg"
            aria-label={t('sendMessage')}
          >
            <Icon name="PenLine" size={22} />
            <span className="text-xs font-bold tracking-tight mt-1 font-body text-[var(--music-surface)]">
              {t('dockWishes')}
            </span>
          </button>

          {/* 3. 掲示板 (PC: ClipboardList) */}
          <button
            onClick={() => openModal('bulletin')}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 text-[var(--music-surface)] hover:text-[var(--music-focus)] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] rounded-lg"
            aria-label={t('bulletinBoard')}
          >
            <Icon name="ClipboardList" size={22} />
            <span className="text-xs font-bold tracking-tight mt-1 font-body text-[var(--music-surface)]">
              {t('dockBoard')}
            </span>
          </button>

          {/* 4. グループチャット (PC: MessageCircle) */}
          <button
            onClick={() => openModal('chat')}
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 text-[var(--music-surface)] hover:text-[var(--music-focus)] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] rounded-lg"
            aria-label={t('groupChat')}
          >
            <Icon name="MessageCircle" size={22} />
            <span className="text-xs font-bold tracking-tight mt-1 font-body text-[var(--music-surface)]">
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
            className={`flex flex-col items-center justify-center min-w-[50px] min-h-[48px] px-1 py-1 ${showMenuSheet ? 'bg-[color-mix(in_srgb,var(--music-accent)_82%,var(--music-text)_18%)] text-[var(--music-focus)]' : 'text-[var(--music-surface)]'} hover:text-[var(--music-focus)] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--music-focus)] rounded-lg`}
            aria-label={t('gamesAndSocial')}
          >
            <Icon name="Gamepad" size={22} />
            <span className="text-xs font-bold tracking-tight mt-1 font-body text-[var(--music-surface)]">
              {t('dockGames')}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
