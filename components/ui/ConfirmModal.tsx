'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, LogOut, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  icon?: 'logout' | 'alert' | 'none'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'danger',
  icon = 'alert',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // フォーカストラップとキーボードナビゲーション
  const handleTab = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements.length === 0) return

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

  useEffect(() => {
    if (!isOpen) {
      if (previousActiveElement.current?.isConnected) {
        previousActiveElement.current.focus()
      }
      return
    }

    previousActiveElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Tab') {
        handleTab(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const timeout = setTimeout(() => {
      const firstButton = modalRef.current?.querySelector('button') as HTMLElement | null
      firstButton?.focus()
    }, 50)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel, handleTab])

  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
          confirmBtn:
            'bg-rose-600 hover:bg-rose-700 text-white border-2 border-rose-700 shadow-[3px_3px_0_#be123c] focus-visible:ring-rose-500',
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
          confirmBtn:
            'bg-[#D95D39] hover:bg-[#C24E2B] text-white border-2 border-[#854D27] shadow-[3px_3px_0_#854D27] focus-visible:ring-[#854D27]/40',
        }
      default:
        return {
          iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
          confirmBtn:
            'bg-[#2E7D6F] hover:bg-[#25665B] text-white border-2 border-[#1B4D44] shadow-[3px_3px_0_#1B4D44] focus-visible:ring-[#2E7D6F]/40',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="relative w-full max-w-md rounded-2xl border-2 border-[#D4B08C] bg-[#FFF9F3] dark:bg-stone-900 p-6 text-stone-900 dark:text-stone-100 shadow-[8px_8px_0_#D4B08C]"
        >
          {/* 閉じるボタン */}
          <button
            onClick={onCancel}
            className="absolute top-3.5 right-3.5 flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 hover:text-[#854D27] hover:bg-[#D4B08C]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] active:scale-[0.96] transition-all cursor-pointer"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex items-start gap-4">
            {icon !== 'none' && (
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${styles.iconBg}`}
              >
                {icon === 'logout' ? <LogOut className="h-6 w-6" aria-hidden="true" /> : <AlertCircle className="h-6 w-6" aria-hidden="true" />}
              </div>
            )}

            <div className="flex-1 min-w-0 pr-6">
              <h2 id="confirm-modal-title" className="text-base sm:text-lg font-serif font-bold text-[#854D27] dark:text-stone-100 font-heading">
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-body">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* ボタン操作エリア */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#D4B08C]/40">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-[#FFF9F3] hover:bg-[#FAF0E6] text-[#854D27] border-2 border-[#D4B08C] active:scale-[0.96] transition-all text-xs sm:text-sm font-bold font-body cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27] min-h-[44px]"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl active:scale-[0.96] transition-all text-xs sm:text-sm font-bold font-body cursor-pointer focus-visible:outline-none focus-visible:ring-2 min-h-[44px] ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
