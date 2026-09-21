'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MediaFile } from '@/types'
import { Icon } from '@/components/ui/Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface SlideshowProps {
  media: MediaFile[]
  autoPlay?: boolean
  interval?: number
  onClose: () => void
}

export function Slideshow({ media, autoPlay = true, interval = 5000, onClose }: SlideshowProps) {
  const { t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length)
  }, [media.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
  }, [media.length])

  // 自動再生
  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(goToNext, interval)
    return () => clearInterval(timer)
  }, [isPlaying, interval, goToNext])

  // キーボード操作によるナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToPrev, goToNext])

  const currentMedia = media[currentIndex]
  const isVideo = currentMedia?.file_type === 'video'

  if (media.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* メインコンテンツ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
            }}
          >
            {isVideo ? (
              <video
                src={currentMedia.file_path}
                autoPlay
                muted
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
            ) : (
              // Media paths may be private or signed URLs and are not statically allowlisted.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentMedia.file_path}
                alt={currentMedia.file_name}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* 矢印ナビゲーション */}
        <button
          onClick={goToPrev}
          aria-label={t('previousMedia')}
          className="min-w-11 min-h-11 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white border-none flex items-center justify-center cursor-pointer transition-all z-20"
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <Icon name="ArrowLeft" size={24} />
        </button>
        <button
          onClick={goToNext}
          aria-label={t('nextMedia')}
          className="min-w-11 min-h-11 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white border-none flex items-center justify-center cursor-pointer transition-all z-20"
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <Icon name="ArrowRight" size={24} />
        </button>
      </div>

      {/* コントロール */}
      <div className="p-4 sm:p-5 flex justify-center items-center gap-4 bg-black/60 z-20">
        <button
          onClick={() => setIsPlaying((prev) => !prev)}
          className="min-h-11 px-5 py-2.5 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] rounded-lg cursor-pointer font-[var(--font-body)] text-sm font-bold shadow-xs hover:bg-[#6D3D1E] active:scale-95 transition-all flex items-center gap-2"
        >
          <Icon name={isPlaying ? 'Pause' : 'Play'} size={18} /> {isPlaying ? t('pause') : t('play')}
        </button>

        <span className="text-white text-sm font-bold tracking-wide">
          {currentIndex + 1} / {media.length}
        </span>

        <button
          onClick={onClose}
          className="min-h-11 px-5 py-2.5 bg-white/15 text-[#FFF9F3] border-2 border-[#D4B08C] rounded-lg cursor-pointer font-[var(--font-body)] text-sm font-bold hover:bg-white/25 active:scale-95 transition-all flex items-center gap-2"
        >
          <Icon name="X" size={18} /> {t('close')}
        </button>
      </div>

      {/* 進行状況ドット */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 items-center z-20"
      >
        {media.slice(0, 10).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={t('slide', { index: i + 1 })}
            className="w-8 h-8 flex items-center justify-center cursor-pointer bg-transparent border-none"
          >
            <span
              className={`block w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-[#D4B08C] scale-125' : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          </button>
        ))}
        {media.length > 10 && (
          <span className="text-white text-xs font-bold">+{media.length - 10}</span>
        )}
      </div>
    </motion.div>
  )
}
