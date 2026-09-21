import { locales } from '@/data/generated/locales'
import type { GeneratedTranslationKey } from '@/data/generated/locales'

export type Locale = (typeof locales)[number]
export type TranslationKey = GeneratedTranslationKey
export type TranslationDictionary = Readonly<Record<TranslationKey, string>>
export type Language = 'en' | 'ja'
