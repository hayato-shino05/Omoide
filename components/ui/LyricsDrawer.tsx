'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  X,
  Music,
  Disc3,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useMusicPlayer } from '@/lib/hooks/useMusicPlayer'
import { getTrackLyrics, getActiveLyricIndex } from '@/lib/music/lyrics'

interface LyricsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onToggle?: () => void
}

export default function LyricsDrawer({ isOpen, onClose, onToggle }: LyricsDrawerProps) {
  const { t } = useLanguage()
  const {
    currentTrack,
    isPlaying,
    toggle,
    currentTime,
    seekTo,
  } = useMusicPlayer()
  const reduceMotion = useReducedMotion()

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLButtonElement>(null)
  const userScrollTimeoutRef = useRef<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 歌詞データの取得
  const lyricsInfo = useMemo(() => {
    return getTrackLyrics(currentTrack?.id, currentTrack?.name, currentTrack?.lyricsLrc)
  }, [currentTrack?.id, currentTrack?.name, currentTrack?.lyricsLrc])

  const lyrics = useMemo(() => lyricsInfo?.lines ?? [], [lyricsInfo])
  const hasLyrics = lyrics.length > 0 && !lyricsInfo?.isInstrumental

  // 現在再生中の歌詞行インデックス
  const activeLyricIndex = useMemo(() => {
    return getActiveLyricIndex(lyrics, currentTime)
  }, [lyrics, currentTime])

  // 再生時間の進行に伴い、アクティブ歌詞を中央へスムーズスクロール
  useEffect(() => {
    if (!isOpen || !hasLyrics || activeLyricIndex < 0 || !isAutoScrollEnabled) return

    const lineElement = activeLineRef.current
    if (lineElement) {
      lineElement.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'center',
      })
    }
  }, [activeLyricIndex, isAutoScrollEnabled, isOpen, hasLyrics, reduceMotion])

  // ユーザーが手動でスクロールした際は自動追従を一時停止（3.5秒後に再開）
  const handleScroll = () => {
    if (userScrollTimeoutRef.current) {
      window.clearTimeout(userScrollTimeoutRef.current)
    }
    userScrollTimeoutRef.current = window.setTimeout(() => {
      setIsAutoScrollEnabled(true)
    }, 3500)
  }

  // キーボード操作（Escapeで閉じる）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleTabClick = () => {
    if (onToggle) {
      onToggle()
    } else if (isOpen) {
      onClose()
    }
  }

  return (
    <motion.div
      ref={panelRef}
      role="region"
      aria-label={t('lyricsTitle')}
      initial={false}
      animate={{
        height: isOpen ? '54vh' : '0px',
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: 'spring', damping: 30, stiffness: 280, mass: 0.8 }
      }
      className="absolute bottom-full left-0 right-0 w-full max-h-[500px] z-20 flex flex-col font-body text-slate-800 dark:text-slate-100"
    >
      {/* 一体型タブハンドル（Drawerの頂点に物理的に固定され、Drawerの展開・伸縮と一緒に上下移動する） */}
      <button
        type="button"
        onClick={handleTabClick}
        className="absolute -top-[21px] right-10 sm:right-14 z-30 px-3 py-0.5 rounded-t-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-x border-amber-950/15 dark:border-amber-100/15 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-[0_-2px_4px_rgba(0,0,0,0.03)] cursor-pointer pointer-events-auto focus-visible:ring-2 focus-visible:ring-[#D95D39]"
        aria-label={isOpen ? t('lyricsClose') : t('lyricsTitle')}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#D95D39]" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-[#D95D39]" />
        )}
        <span className="tracking-wide text-[11px]">{t('lyrics')}</span>
      </button>

      {/* ドロワー内部コンテンツ（背景と境界線を維持し、スプリング物理演算で滑らかに開閉） */}
      <div
        className={`flex-1 flex flex-col min-h-0 w-full rounded-t-2xl border-t border-x border-amber-950/15 dark:border-amber-100/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.15)] overflow-hidden ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-amber-950/10 dark:border-amber-100/10 bg-amber-50/30 dark:bg-slate-800/30 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* アートワーク */}
            <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-amber-950/10 dark:border-amber-100/10 bg-amber-50/50 dark:bg-slate-800 flex items-center justify-center shadow-xs">
              {currentTrack?.albumImage ? (
                <img
                  src={currentTrack.albumImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : isPlaying ? (
                <Disc3 className="w-5 h-5 text-[#D95D39] animate-[spin_8s_linear_infinite]" />
              ) : (
                <Music className="w-5 h-5 text-[#D95D39]/80" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D95D39]/10 text-[#D95D39] text-[10px] font-bold tracking-wider uppercase select-none">
                  <Sparkles className="w-3 h-3" />
                  {hasLyrics ? t('lyricsSynchronized') : t('lyrics')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
                {currentTrack?.name || t('birthdaySong')}
              </h3>
            </div>
          </div>

          {/* 閉じるボタン */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center bg-stone-100/80 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-95 cursor-pointer transition-all border border-amber-950/10 dark:border-amber-100/10 focus-visible:ring-2 focus-visible:ring-[#D95D39]"
            aria-label={t('lyricsClose')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 歌詞スクロールエリア */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-8 space-y-5 sm:space-y-6 scrollbar-thin scroll-smooth select-none text-center"
        >
          {hasLyrics ? (
            lyrics.map((line, index) => {
              const isActive = index === activeLyricIndex
              const isPast = activeLyricIndex >= 0 && index < activeLyricIndex

              return (
                <button
                  key={`${line.time}-${index}`}
                  ref={isActive ? activeLineRef : null}
                  type="button"
                  onClick={() => {
                    seekTo(line.time)
                    if (!isPlaying) toggle()
                    setIsAutoScrollEnabled(true)
                  }}
                  className={`w-full block py-2 px-3 rounded-xl text-center transition-all duration-300 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D95D39] ${
                    isActive
                      ? 'scale-[1.03] opacity-100'
                      : isPast
                        ? 'opacity-40 hover:opacity-75 scale-100'
                        : 'opacity-35 hover:opacity-75 scale-100'
                  }`}
                >
                  <span
                    className={`block leading-relaxed tracking-wide transition-colors ${
                      isActive
                        ? 'text-xl sm:text-2xl font-extrabold text-[#D95D39] dark:text-[#ff7a54]'
                      : 'text-base sm:text-lg font-bold text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {line.text}
                  </span>
                  {line.translation && (
                    <span
                      className={`block text-xs mt-1 transition-opacity ${
                        isActive
                          ? 'text-slate-700 dark:text-slate-200 font-medium opacity-90'
                          : 'text-slate-400 dark:text-slate-500 font-normal opacity-60'
                      }`}
                    >
                      {line.translation}
                    </span>
                  )}
                </button>
              )
            })
          ) : (
            /* インストゥルメンタル・歌詞なし表示 */
            <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-950/10 dark:border-amber-100/10 shadow-sm text-[#D95D39] mb-4">
                <Music className="w-8 h-8 opacity-90" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                {t('instrumentalTrack')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                {t('noLyricsFound')}
              </p>

              {/* 音波アニメーション */}
              <div className="flex items-end justify-center gap-1 h-6 mt-4" aria-hidden="true">
                <span className="w-1 bg-[#D95D39] rounded-full animate-soundbar-1" />
                <span className="w-1 bg-[#D95D39] rounded-full animate-soundbar-2" />
                <span className="w-1 bg-[#D95D39] rounded-full animate-soundbar-3" />
                <span className="w-1 bg-[#D95D39] rounded-full animate-soundbar-2" />
                <span className="w-1 bg-[#D95D39] rounded-full animate-soundbar-1" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
