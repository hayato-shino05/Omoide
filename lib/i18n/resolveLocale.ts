import { localePacks, translationKeys } from '@/data/generated/locales'
import type { Language, Locale, TranslationDictionary, TranslationKey } from './types'

export interface LocaleResolution {
  locale: Locale
  usedFallback: boolean
}

type TranslationPack = {
  locale: string
  translations: Readonly<Record<string, string>>
}

export const DEFAULT_LOCALE: Locale = 'ja'

export function normalizeLocale(locale: string): string {
  return locale.trim().toLowerCase().replaceAll('_', '-').split('-')[0]
}

export function resolveLocale(
  requestedLocale: string,
  availableLocales: readonly Locale[],
  defaultLocale: Locale,
): LocaleResolution {
  const normalizedRequested = normalizeLocale(requestedLocale)
  const normalizedDefault = normalizeLocale(defaultLocale)
  const exactLocale = availableLocales.find((locale) => locale === normalizedRequested)
  if (exactLocale) return { locale: exactLocale, usedFallback: false }

  const fallbackLocale = availableLocales.find((locale) => locale === normalizedDefault)
  if (!fallbackLocale) {
    throw new Error(`既定 locale が利用できません: ${defaultLocale}`)
  }
  return { locale: fallbackLocale, usedFallback: true }
}

export function validateTranslationPacks(packs: readonly TranslationPack[]): void {
  if (packs.length === 0) throw new Error('translation packs must not be empty')

  const seenLocales = new Set<string>()
  for (const pack of packs) {
    if (seenLocales.has(pack.locale)) throw new Error(`duplicate locale: ${pack.locale}`)
    seenLocales.add(pack.locale)
  }

  const canonicalKeys = [...translationKeys].sort()
  for (const pack of packs) {
    const keys = Object.keys(pack.translations).sort()
    if (JSON.stringify(keys) !== JSON.stringify(canonicalKeys)) {
      throw new Error(`translation keys do not match: ${pack.locale}`)
    }
    if (keys.some((key) => typeof pack.translations[key] !== 'string' || pack.translations[key].length === 0)) {
      throw new Error(`translation values must not be empty: ${pack.locale}`)
    }
  }
}

function interpolate(value: string, params?: Record<string, string | number>): string {
  if (!params) return value
  return value.replace(/\{\{?(\w+)\}?\}/g, (match, key: string) =>
    params[key] === undefined ? match : String(params[key]),
  )
}

export function translate(
  locale: Locale | string,
  key: TranslationKey,
  defaultLocale: Locale,
  params?: Record<string, string | number>,
): string {
  const requested = normalizeLocale(locale)
  const primary = localePacks.find((pack) => pack.locale === requested)
  const fallback = localePacks.find((pack) => pack.locale === defaultLocale)
  const value = primary?.translations[key] ?? fallback?.translations[key]
  return interpolate(value ?? key, params)
}

export type { Language, Locale, TranslationDictionary, TranslationKey }
