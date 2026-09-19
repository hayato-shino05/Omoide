'use client'

import { useEffect, useRef } from 'react'
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

  // Escapeキーでキャンセル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        onConfirm()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, onConfirm])

  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          confirmBtn:
            'bg-rose-600 hover:bg-rose-500 text-white border-rose-700 shadow-xs focus-visible:ring-rose-500',
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          confirmBtn:
            'bg-[#D95D39] hover:bg-[#C24E2B] text-white border-[#854D27] shadow-xs focus-visible:ring-[#854D27]/40',
        }
      default:
        return {
          iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          confirmBtn:
            'bg-[#2E7D6F] hover:bg-[#25665B] text-white border-[#1B4D44] shadow-xs focus-visible:ring-[#2E7D6F]/40',
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
          className="relative w-full max-w-md rounded-2xl border border-stone-800 bg-stone-900/95 p-6 text-stone-200 shadow-2xl backdrop-blur-md"
        >
          {/* 閉じるボタン */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-800/60 hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-[0.96] transition-all motion-safe:duration-150"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            {icon !== 'none' && (
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border ${styles.iconBg}`}
              >
                {icon === 'logout' ? <LogOut className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
            )}

            <div className="flex-1 min-w-0 pr-4">
              <h2 id="confirm-modal-title" className="text-base font-serif font-bold text-stone-100">
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-xs text-stone-400 leading-relaxed font-body">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* ボタン操作エリア */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-800/80">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 active:scale-[0.96] transition-all text-xs font-bold font-body motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 min-h-[40px]"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl active:scale-[0.96] transition-all text-xs font-bold font-body motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 min-h-[40px] border ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
