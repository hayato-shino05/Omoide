'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { locales } from '@/data/generated/locales'
import { DEFAULT_LOCALE, normalizeLocale, resolveLocale, translate } from './resolveLocale'
import type { Language, Locale, TranslationKey } from './types'
import { LANGUAGE_COOKIE_NAME } from './cookie'

interface LanguageContextType {
  language: Language
  locale: Locale
  setLanguage: (language: Language | Locale) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 言語プロバイダー
export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const resolvedInitialLocale = resolveLocale(initialLocale, locales, DEFAULT_LOCALE).locale
  const [locale, setLocale] = useState<Locale>(resolvedInitialLocale)

  const setLanguage = useCallback((requestedLanguage: Language | Locale) => {
    const requestedLocale = normalizeLocale(requestedLanguage)
    const resolved = resolveLocale(requestedLocale, locales, DEFAULT_LOCALE)
    setLocale(resolved.locale)
    const secure = window.location.protocol === 'https:' ? '; secure' : ''
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${resolved.locale}; path=/; max-age=31536000; samesite=lax${secure}`
  }, [])

  const language: Language = locale.startsWith('ja') ? 'ja' : 'en'

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string =>
      translate(locale, key, DEFAULT_LOCALE, params),
    [locale],
  )

  return (
    <LanguageContext.Provider value={{ language, locale, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// 言語フックを使用
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage フックは LanguageProvider 内でのみ使用できます')
  }
  return context
}


export function useOptionalLanguage() {
  return useContext(LanguageContext)
}
