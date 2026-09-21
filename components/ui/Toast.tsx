'use client'

import { useState, useEffect, createContext, useContext, useCallback, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { useOptionalLanguage } from '@/lib/i18n/LanguageContext'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'
type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'

interface Toast {
  id: string
  message: string
  title?: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  updateToast: (id: string, toast: Partial<Toast>) => void
  success: (message: string, options?: Partial<Toast>) => string
  error: (message: string, options?: Partial<Toast>) => string
  warning: (message: string, options?: Partial<Toast>) => string
  info: (message: string, options?: Partial<Toast>) => string
  loading: (message: string, options?: Partial<Toast>) => string
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => Promise<T>
}

const ToastContext = createContext<ToastContextType | null>(null)

const fallbackToastContext: ToastContextType = {
  toasts: [],
  addToast: () => '',
  removeToast: () => {},
  updateToast: () => {},
  success: () => '',
  error: () => '',
  warning: () => '',
  info: () => '',
  loading: () => '',
  promise: async <T,>(promiseToResolve: Promise<T>): Promise<T> => promiseToResolve,
}

export function useOptionalToast(): ToastContextType | null {
  return useContext(ToastContext)
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  return context ?? fallbackToastContext
}

interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastPosition
  maxToasts?: number
}

const subscribeNoop = () => () => {}

export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }: ToastProviderProps) {
  const lang = useOptionalLanguage()
  const t = lang?.t ?? ((k: string) => k)
  const [toasts, setToasts] = useState<Toast[]>([])
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => {
      const newToasts = [...prev, { ...toast, id }]
      return newToasts.slice(-maxToasts)
    })
    return id
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [])

  const success = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ message, type: 'success', duration: 4000, ...options }),
    [addToast]
  )

  const error = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ message, type: 'error', duration: 5000, ...options }),
    [addToast]
  )

  const warning = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ message, type: 'warning', duration: 4000, ...options }),
    [addToast]
  )

  const info = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ message, type: 'info', duration: 4000, ...options }),
    [addToast]
  )

  const loading = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ message, type: 'loading', duration: 0, ...options }),
    [addToast]
  )

  const promise = useCallback(
    async <T,>(
      promiseToResolve: Promise<T>,
      messages: { loading: string; success: string; error: string }
    ): Promise<T> => {
      const id = loading(messages.loading)
      try {
        const result = await promiseToResolve
        updateToast(id, { message: messages.success, type: 'success', duration: 4000 })
        return result
      } catch (err) {
        updateToast(id, { message: messages.error, type: 'error', duration: 5000 })
        throw err
      }
    },
    [loading, updateToast]
  )

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  }

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, updateToast, success, error, warning, info, loading, promise }}
    >
      {children}
      {mounted &&
        createPortal(
          <div
            className={`fixed z-[100] flex flex-col gap-3 pointer-events-none ${positionClasses[position]}`}
            aria-live="polite"
            aria-label={t('notifications')}
          >
            {toasts.map((toast, index) => (
              <ToastItem
                key={toast.id}
                toast={toast}
                onClose={() => {
                  toast.onClose?.()
                  removeToast(toast.id)
                }}
                index={index}
                position={position}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

const typeStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-emerald-800/95 dark:bg-emerald-900/95',
    border: 'border-emerald-600/50',
    icon: <Icon name="CheckCircle2" size={20} className="text-emerald-200" aria-hidden="true" />,
  },
  error: {
    bg: 'bg-rose-900/95 dark:bg-rose-950/95',
    border: 'border-rose-700/60',
    icon: <Icon name="CircleX" size={20} className="text-rose-200" aria-hidden="true" />,
  },
  warning: {
    bg: 'bg-amber-800/95 dark:bg-amber-900/95',
    border: 'border-amber-600/50',
    icon: <Icon name="AlertTriangle" size={20} className="text-amber-200" aria-hidden="true" />,
  },
  info: {
    bg: 'bg-[#854D27]/95 dark:bg-stone-900/95',
    border: 'border-[#D4B08C]/60',
    icon: <Icon name="Info" size={20} className="text-[#FBE8D3]" aria-hidden="true" />,
  },
  loading: {
    bg: 'bg-stone-800/95 dark:bg-stone-900/95',
    border: 'border-[#D4B08C]/50',
    icon: <Icon name="LoaderCircle" size={20} className="animate-spin text-[#D4B08C]" aria-hidden="true" />,
  },
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
  index: number
  position: ToastPosition
}

function ToastItem({ toast, onClose, index, position }: ToastItemProps) {
  const lang = useOptionalLanguage()
  const t = lang?.t ?? ((k: string) => k)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(onClose, 200)
  }, [onClose])

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const startTime = Date.now()
      const duration = toast.duration

      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
        setProgress(remaining)
      }, 50)

      timerRef.current = setTimeout(handleClose, duration)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [toast.duration, handleClose])

  const style = typeStyles[toast.type]

  const slideDirection = position.includes('right')
    ? 'translate-x-full'
    : position.includes('left')
    ? '-translate-x-full'
    : 'translate-y-full'

  return (
    <div
      className={`
        pointer-events-auto min-w-[300px] sm:min-w-[340px] max-w-md
        ${style.bg} backdrop-blur-md
        text-white rounded-xl shadow-2xl
        border ${style.border}
        transition-all duration-200 ease-out
        ${isExiting ? `opacity-0 ${slideDirection}` : 'opacity-100 translate-x-0 translate-y-0'}
      `}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        {/* アイコン */}
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>

        {/* 本文 */}
        <div className="flex-1 min-w-0 pr-2">
          {toast.title && (
            <p className="font-semibold text-white mb-0.5 text-sm sm:text-base font-heading">{toast.title}</p>
          )}
          <p className="text-white/95 text-xs sm:text-sm font-body leading-relaxed">{toast.message}</p>

          {/* アクションボタン */}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick()
                handleClose()
              }}
              className="mt-2 inline-flex items-center text-xs sm:text-sm font-semibold text-white hover:text-amber-200 underline underline-offset-4 min-h-[36px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* 閉じるボタン */}
        {toast.type !== 'loading' && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-11 h-11 -mr-2 -mt-2 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={t('closeNotification')}
          >
            <Icon name="Close" size={16} className="text-rose-100" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* プログレスバー */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-black/20 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-white/40 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default ToastItem
