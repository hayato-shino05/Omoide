'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { MediaFile } from '@/types'
import { Icon } from '@/components/ui/Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const SLIDESHOW_INTERVAL = 3000

interface MediaViewerProps {
  media: MediaFile
  allMedia: MediaFile[]
  onClose: () => void
  onNavigate: (media: MediaFile) => void
  slideshowMode?: boolean
  onToggleSlideshow?: () => void
}

function findVisibleFallback(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const candidates = document.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  for (const el of candidates) {
    if (
      !el.isConnected ||
      el.hasAttribute('inert') ||
      el.closest('[inert]') ||
      el.getAttribute('aria-hidden') === 'true' ||
      el.closest('[aria-hidden="true"]')
    ) {
      continue
    }
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') {
      continue
    }
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      return el
    }
    if (el.offsetWidth > 0 || el.offsetHeight > 0) {
      return el
    }
  }
  return null
}

export function MediaViewer({ 
  media, 
  allMedia, 
  onClose, 
  onNavigate,
  slideshowMode = false,
  onToggleSlideshow,
}: MediaViewerProps) {
  const { t } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(slideshowMode)
  const [mounted, setMounted] = useState(false)
  const currentIndex = allMedia.findIndex((m) => m.id === media.id)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(allMedia[currentIndex - 1])
    } else {
      onNavigate(allMedia[allMedia.length - 1])
    }
  }, [currentIndex, allMedia, onNavigate])

  const goToNext = useCallback(() => {
    if (currentIndex < allMedia.length - 1) {
      onNavigate(allMedia[currentIndex + 1])
    } else {
      onNavigate(allMedia[0])
    }
  }, [currentIndex, allMedia, onNavigate])

  useEffect(() => {
    if (!isPlaying) return
    if (media.file_type === 'video') return

    const timer = setTimeout(() => {
      goToNext()
    }, SLIDESHOW_INTERVAL)

    return () => clearTimeout(timer)
  }, [isPlaying, media, goToNext])

  useEffect(() => {
    setIsPlaying(slideshowMode)
  }, [slideshowMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') {
        setIsPlaying(false)
        goToPrev()
      }
      if (e.key === 'ArrowRight') {
        setIsPlaying(false)
        goToNext()
      }
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying(!isPlaying)
        onToggleSlideshow?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, goToPrev, goToNext, isPlaying, onToggleSlideshow])

  const isVideo = media.file_type === 'video'

  const handleToggleSlideshow = () => {
    setIsPlaying(!isPlaying)
    onToggleSlideshow?.()
  }

  const viewerRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<Element | null>(null)

  // ダイアログとしてのフォーカス lifecycle（portal mount 後にフォーカスを奪い、閉じたら返す）
  useEffect(() => {
    if (!mounted) return
    lastFocusedRef.current = document.activeElement
    viewerRef.current?.focus()

    // viewerRef.current 以外のすべての body 直下要素（背景・親モーダル・動的ポータル）を inert / aria-hidden 化
    const viewerElement = viewerRef.current
    const modifiedElements = new Map<HTMLElement, { originalInert: string | null; originalAriaHidden: string | null }>()

    const isolateNode = (node: Node) => {
      if (
        node instanceof HTMLElement &&
        node !== viewerElement &&
        !node.contains(viewerElement) &&
        !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName)
      ) {
        if (!modifiedElements.has(node)) {
          modifiedElements.set(node, {
            originalInert: node.getAttribute('inert'),
            originalAriaHidden: node.getAttribute('aria-hidden'),
          })
          node.setAttribute('inert', '')
          node.setAttribute('aria-hidden', 'true')
        }
      }
    }

    // 初期 body 直下要素を隔離
    const bodyChildren = Array.from(document.body.children)
    for (const child of bodyChildren) {
      isolateNode(child)
    }

    // viewer マウント後に追加されたポータル／兄弟要素も動的に隔離
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of Array.from(mutation.addedNodes)) {
          isolateNode(addedNode)
        }
      }
    })
    observer.observe(document.body, { childList: true })

    return () => {
      observer.disconnect()
      for (const [element, { originalInert, originalAriaHidden }] of modifiedElements) {
        if (originalInert !== null) {
          element.setAttribute('inert', originalInert)
        } else {
          element.removeAttribute('inert')
        }
        if (originalAriaHidden !== null) {
          element.setAttribute('aria-hidden', originalAriaHidden)
        } else {
          element.removeAttribute('aria-hidden')
        }
      }
      const saved = lastFocusedRef.current
      if (saved instanceof HTMLElement && saved.isConnected) {
        saved.focus()
      } else {
        const fallback = findVisibleFallback()
        fallback?.focus()
      }
    }
  }, [mounted])

  // Tab キーによるダイアログ内のフォーカストラップ
  useEffect(() => {
    if (!mounted) return
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !viewerRef.current) return
      const focusableElements = viewerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])'
      )
      if (focusableElements.length === 0) return
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey && (document.activeElement === firstElement || document.activeElement === viewerRef.current)) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [mounted])

  const viewerContent = (
    <AnimatePresence>
      <motion.div
        ref={viewerRef}
        role="dialog"
        aria-modal="true"
        aria-label={media.file_name}
        tabIndex={-1}
        className="focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D4B08C] focus:outline-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 上部コントロール */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            zIndex: 1000000,
          }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 500,
              background: 'rgba(0,0,0,0.6)',
              padding: '10px 20px',
              borderRadius: '25px',
            }}
          >
            {currentIndex + 1} / {allMedia.length}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleSlideshow()
            }}
            style={{
              background: isPlaying ? 'rgba(133, 77, 39, 0.9)' : 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <Icon name={isPlaying ? 'Pause' : 'Play'} size={18} />
            <span>{isPlaying ? t('pause') : t('slideshow')}</span>
          </button>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label={t('close')}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            cursor: 'pointer',
            fontSize: '1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000000,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <Icon name="X" size={28} />
        </button>

        {/* 前へボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsPlaying(false)
            goToPrev()
          }}
          aria-label={t('previousMedia')}
          style={{
            position: 'absolute',
            left: '30px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '70px',
            height: '70px',
            cursor: 'pointer',
            fontSize: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000000,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <Icon name="ArrowLeft" size={34} />
        </button>

        {/* 次へボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsPlaying(false)
            goToNext()
          }}
          aria-label={t('nextMedia')}
          style={{
            position: 'absolute',
            right: '30px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '70px',
            height: '70px',
            cursor: 'pointer',
            fontSize: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000000,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <Icon name="ArrowRight" size={34} />
        </button>

        {/* メディア表示エリア（フルスクリーン） */}
        <motion.div
          key={media.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px 120px',
            boxSizing: 'border-box',
          }}
        >
          {isVideo ? (
            <video
              src={media.file_path}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              onPlay={() => setIsPlaying(false)}
            />
          ) : (
            // Media paths may be private or signed URLs and are not statically allowlisted.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.file_path}
              alt={media.file_name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </motion.div>

        {/* スライドショー用のプログレスバー */}
        {isPlaying && !isVideo && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '250px',
              height: '5px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '3px',
              overflow: 'hidden',
              zIndex: 1000000,
            }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: SLIDESHOW_INTERVAL / 1000, ease: 'linear' }}
              key={media.id}
              style={{
                height: '100%',
                background: '#854D27',
              }}
            />
          </div>
        )}

        {/* 下部のファイル名表示 */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#fff',
            fontSize: '1rem',
            zIndex: 1000000,
            background: 'rgba(0,0,0,0.6)',
            padding: '10px 24px',
            borderRadius: '25px',
            maxWidth: '80%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {media.file_name}
        </div>
      </motion.div>
    </AnimatePresence>
  )

  // 親コンテナの外側に描画するためにポータルを利用
  if (!mounted) return null
  
  return createPortal(viewerContent, document.body)
}
