import { festivalPacks } from '@/data/generated/festival-packs'
import { VISUAL_THEME_KEYS } from '@/config/visualThemes'
import { THEMES, type ThemeConfig } from '@/config/themes'
import { evaluateFestivalPacks, getInstantForCalendarDate } from '@/lib/festivals/evaluator'
import { getLegacySeasonMonths } from '@/lib/festivals/legacyAdapter'
import type { ThemeName } from '@/types'

/**
 * 指定された日付で祭りがアクティブかどうかを確認
 */
export function isFestivalActive(festivalKey: string, month: number, date: number): boolean {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(date) || date < 1 || date > 31) {
    return false
  }

  const calendarDate = new Date(Date.UTC(2024, month - 1, date, 12))
  if (calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== date) return false

  return festivalPacks.some((pack) => {
    if (
      pack.themeKey !== festivalKey ||
      pack.dateRule.calendar !== 'gregorian' ||
      pack.dateRule.recurrence !== 'yearly'
    ) return false

    const currentDate = getInstantForCalendarDate(2024, month, date, pack.dateRule.timeZone)
    return evaluateFestivalPacks([pack], currentDate)[0]?.status === 'active'
  })
}

/**
 * 現在の日付に基づいて季節と祭りを検出
 */
export function detectSeasonAndFestival(currentDate: Date = new Date()): ThemeName {
  const activeFestival = evaluateFestivalPacks(festivalPacks, currentDate).find(
    ({ pack, status }) =>
      status === 'active' &&
      pack.themeKey !== undefined &&
      (VISUAL_THEME_KEYS as readonly string[]).includes(pack.themeKey),
  )
  if (activeFestival?.pack.themeKey) return activeFestival.pack.themeKey as ThemeName

  const month = currentDate.getMonth() + 1
  const seasonMonths = getLegacySeasonMonths()
  if (seasonMonths.winter.includes(month)) return 'winter'
  if (seasonMonths.spring.includes(month)) return 'spring'
  if (seasonMonths.summer.includes(month)) return 'summer'
  if (seasonMonths.autumn.includes(month)) return 'autumn'

  return 'spring'
}

/**
 * テーマ設定を取得
 */
export function getThemeConfig(themeName: ThemeName): ThemeConfig {
  return THEMES[themeName] || THEMES.spring
}

/**
 * テーマのTailwind gradient classを取得
 */
export function getThemeGradient(themeName: ThemeName): string {
  const theme = getThemeConfig(themeName)
  return theme.gradient
}

/**
 * テーマの表示名を取得
 */
export function getThemeDisplayName(themeName: ThemeName, language: 'en' | 'ja'): string {
  const theme = getThemeConfig(themeName)
  return theme.displayName[language]
}

/**
 * テーマがダークモードかどうかを判定
 */
export function isThemeDark(themeName: ThemeName): boolean {
  return themeName === 'halloween'
}
