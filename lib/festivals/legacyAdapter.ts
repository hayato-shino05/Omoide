import { festivalPacks } from '@/data/generated/festival-packs'
import { VISUAL_THEME_KEYS } from '@/config/visualThemes'
import type { FestivalPack } from './types'

export interface LegacyFestivalDate {
  month: number
  startDate: number
  endDate: number
}

export type LegacyFestivalDates = Record<string, LegacyFestivalDate | LegacyFestivalDate[]>

const LEGACY_SEASON_MONTHS = {
  winter: [12, 1],
  spring: [2, 3, 4],
  summer: [5, 6, 7, 8],
  autumn: [9, 10, 11],
} as const

function isVisualThemeKey(themeKey: string): boolean {
  return (VISUAL_THEME_KEYS as readonly string[]).includes(themeKey)
}

function addLegacyRange(
  dates: Map<string, LegacyFestivalDate[]>,
  pack: FestivalPack,
): void {
  if (
    !pack.themeKey ||
    !isVisualThemeKey(pack.themeKey) ||
    !pack.enabled ||
    pack.status !== 'enabled' ||
    pack.dateRule.calendar !== 'gregorian' ||
    pack.dateRule.recurrence !== 'yearly'
  ) return

  const ranges = dates.get(pack.themeKey) ?? []
  for (const range of pack.dateRule.ranges) {
    const legacyRange = {
      month: range.month,
      startDate: range.startDay,
      endDate: range.endDay,
    }
    if (!ranges.some((existing) => JSON.stringify(existing) === JSON.stringify(legacyRange))) {
      ranges.push(legacyRange)
    }
  }
  dates.set(pack.themeKey, ranges)
}

export function getLegacyFestivalDates(): LegacyFestivalDates {
  const dates = new Map<string, LegacyFestivalDate[]>()
  for (const pack of festivalPacks) addLegacyRange(dates, pack)

  return Object.fromEntries(
    [...dates.entries()].map(([themeKey, ranges]) => [
      themeKey,
      ranges.length === 1 ? ranges[0] : ranges,
    ]),
  )
}

export function getLegacySeasonMonths(): Record<string, number[]> {
  return {
    winter: [...LEGACY_SEASON_MONTHS.winter],
    spring: [...LEGACY_SEASON_MONTHS.spring],
    summer: [...LEGACY_SEASON_MONTHS.summer],
    autumn: [...LEGACY_SEASON_MONTHS.autumn],
  }
}
