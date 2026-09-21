'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Icon } from './Icon'
import { LANGUAGE_COOKIE_NAME } from '@/lib/i18n/cookie'
import { DEFAULT_LOCALE, translate } from '@/lib/i18n/resolveLocale'
import type { Locale } from '@/lib/i18n/types'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

function readLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const match = document.cookie.match(new RegExp(`${LANGUAGE_COOKIE_NAME}=([^;]+)`))
  const value = match?.[1]
  return value === 'en' ? 'en' : DEFAULT_LOCALE
}

function DefaultErrorFallback({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const locale = readLocaleFromCookie()
  return (
    <div className="min-h-[220px] flex items-center justify-center p-4">
      <div
        role="alert"
        aria-live="assertive"
        className="bg-[#FFF9F3] dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border-2 border-[#D4B08C] shadow-[6px_6px_0_#D4B08C] text-center max-w-md w-full"
      >
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-500">
          <Icon name="AlertTriangle" size={24} className="text-rose-500" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-[#854D27] dark:text-stone-100 mb-2 font-heading">
          {translate(locale, 'error', DEFAULT_LOCALE)}
        </h3>
        <p className="text-stone-600 dark:text-stone-300 text-sm mb-6 leading-relaxed font-body">
          {message || translate(locale, 'unexpectedError', DEFAULT_LOCALE)}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 min-h-[44px] bg-[#854D27] hover:bg-[#6e3e1e] text-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl font-semibold transition-all active:scale-[0.96] shadow-[3px_3px_0_#D4B08C] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#854D27]"
        >
          {translate(locale, 'retry', DEFAULT_LOCALE)}
        </button>
      </div>
    </div>
  )
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <DefaultErrorFallback
          message={this.state.error?.message}
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      )
    }

    return this.props.children
  }
}
