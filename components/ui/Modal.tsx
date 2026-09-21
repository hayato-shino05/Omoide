'use client'

import { useEffect, useCallback, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'widescreen'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  footer?: React.ReactNode
  centered?: boolean
  scrollBehavior?: 'inside' | 'outside'
  variant?: 'default' | 'music'
  initialFocusRef?: RefObject<HTMLElement | null>
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-7xl',
  widescreen: 'max-w-6xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  centered = true,
  scrollBehavior = 'inside',
  variant = 'default',
  initialFocusRef,
}: ModalProps) {
  const { t } = useLanguage()
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Escape キー押下時のクローズ処理
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    },
    [onClose, closeOnEscape]
  )

  // Tab キーによるフォーカストラップの処理
  const handleTab = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement?.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement?.focus()
    }
  }, [])

  // アニメーションとライフサイクル管理
  useEffect(() => {
    if (isOpen) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      if (!wasOpenRef.current) {
        previousActiveElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        wasOpenRef.current = true
      }
      requestAnimationFrame(() => {
        setShouldRender(true)
        setIsAnimating(true)
      })

      // スクロールバー幅を計算してレイアウトシフト（ガタつき）を防止
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.paddingRight = `${scrollBarWidth}px`
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleTab)

      // 最初のフォーカス可能要素へフォーカス
      focusTimeoutRef.current = setTimeout(() => {
        const firstFocusable = initialFocusRef?.current ?? modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null
        firstFocusable?.focus()
      }, 100)
    } else {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
        focusTimeoutRef.current = null
      }
      requestAnimationFrame(() => {
        setIsAnimating(false)
      })
      wasOpenRef.current = false
      closeTimeoutRef.current = setTimeout(() => {
        setShouldRender(false)
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
        if (previousActiveElement.current?.isConnected) previousActiveElement.current.focus()
        previousActiveElement.current = null
      }, 200)
    }

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
        focusTimeoutRef.current = null
      }
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen, handleEscape, handleTab, initialFocusRef])

  if (!mounted) return null
  if (!shouldRender && !isOpen) return null

  const modalContent = (
    <div
      className={`fixed inset-0 ${centered ? 'flex items-center justify-center' : ''} ${
        scrollBehavior === 'outside' ? 'overflow-y-auto' : ''
      }`}
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* 背景のオーバーレイ */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* モーダル全体のコンテナ */}
      <div
        className={`${scrollBehavior === 'outside' ? 'min-h-full py-4 md:py-8' : ''} ${
          centered ? '' : 'pt-8 md:pt-16'
        } px-2 md:px-4 w-full flex items-start md:items-center justify-center pointer-events-none pt-4 md:pt-0 overflow-y-auto`}
        style={{ maxHeight: '100vh' }}
      >
        {/* ビンテージスタイルのモーダルコンテンツ */}
        <div
          ref={modalRef}
          style={{
            background: variant === 'music' ? '#FFFFFF' : '#FFF9F3',
            border: variant === 'music' ? '2px solid #D4B08C' : '3px solid #D4B08C',
            borderRadius: '16px',
            boxShadow: variant === 'music' ? '0 12px 30px rgba(133, 77, 39, 0.18)' : '8px 8px 0 #D4B08C',
            maxHeight: '92vh',
            overflow: 'hidden',
            display: size === 'widescreen' ? 'flex' : undefined,
            flexDirection: size === 'widescreen' ? 'column' : undefined,
            marginTop: '8px',
            marginBottom: '8px',
          }}
          className={`
            relative w-full ${sizeClasses[size]} ${variant === 'music' ? 'rounded-xl' : ''}
            ${size === 'widescreen' ? 'md:min-h-[580px]' : ''}
            transition-all duration-200 ease-out
            pointer-events-auto
            ${isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          {(title || showCloseButton) && (
            <div 
              className="p-3.5 sm:p-5 flex justify-between items-center border-b-2 border-[#D4B08C]"
            >
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    style={{
                      color: '#854D27',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.35rem',
                      fontWeight: 'bold',
                      margin: 0,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    style={{
                      color: '#854D27',
                      opacity: 0.7,
                      marginTop: '4px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer text-[#854D27] hover:opacity-80 active:scale-95 transition-all rounded-lg focus-visible:ring-2 focus-visible:ring-[#854D27]"
                  aria-label={t('close')}
                >
                  <Icon name="X" size={22} useSvg className="text-[#854D27]" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {/* 本文 */}
          <div
            style={{ 
              flex: (size === 'widescreen' || size === 'full') ? 1 : undefined,
              minHeight: (size === 'widescreen' || size === 'full') ? 0 : undefined,
            }}
            className={`p-3 sm:p-5 ${scrollBehavior === 'inside' && size !== 'widescreen' && size !== 'full' ? 'max-h-[60vh] overflow-y-auto' : 'max-h-[82vh] overflow-y-auto'}`}
          >
            {children}
          </div>

          {/* フッター */}
          {footer && (
            <div 
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '20px',
                borderTop: '2px solid #D4B08C',
                background: 'rgba(212, 176, 140, 0.1)',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // モーダルを document.body にポータルとして描画
  return createPortal(modalContent, document.body)
}

// 確認用モーダルコンポーネント
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useLanguage()
  const resolvedConfirmText = confirmText ?? t('confirm')
  const resolvedCancelText = cancelText ?? t('cancel')
  const variantStyles = {
    danger: {
      icon: <Icon name="AlertTriangle" size={24} className="text-rose-300" />,
      iconBg: 'bg-red-500/20',
      confirmClass: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: <Icon name="AlertTriangle" size={24} className="text-amber-300" />,
      iconBg: 'bg-yellow-500/20',
      confirmClass: 'bg-yellow-500 hover:bg-yellow-600',
    },
    info: {
      icon: <Icon name="Info" size={24} className="text-sky-300" />,
      iconBg: 'bg-blue-500/20',
      confirmClass: 'bg-blue-500 hover:bg-blue-600',
    },
  }

  const style = variantStyles[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className={`w-14 h-14 rounded-full ${style.iconBg} flex items-center justify-center mx-auto mb-4`}>
          {style.icon}
        </div>
        <h3 className="text-lg font-bold text-[#854D27] dark:text-stone-100 mb-2 font-heading">{title}</h3>
        <p className="text-stone-600 dark:text-stone-300 text-sm mb-6 leading-relaxed font-body">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 min-h-[44px] bg-[#FFF9F3] hover:bg-[#FAF0E6] text-[#854D27] border-2 border-[#D4B08C] rounded-xl font-semibold transition-all active:scale-[0.96] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
          >
            {resolvedCancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 min-h-[44px] ${style.confirmClass} text-white rounded-xl font-semibold transition-all active:scale-[0.96] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
          >
            {isLoading && (
              <Icon name="LoaderCircle" size={16} className="animate-spin" aria-hidden="true" />
            )}
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
