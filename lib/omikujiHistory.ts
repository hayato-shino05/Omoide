import { OMIKUJI_FORTUNES, type OmikujiFortune } from '@/data/omikujiData'

export const OMIKUJI_HISTORY_STORAGE_KEY = 'omikuji_history_v1'
const HISTORY_LIMIT = 7

export type OmikujiHistoryEntry = {
  date: string
  fortuneId: number
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function getOmikujiDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseOmikujiHistory(value: string | null, fortuneIds: ReadonlySet<number>): OmikujiHistoryEntry[] {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    const entries = parsed.filter((entry): entry is OmikujiHistoryEntry => {
      if (!entry || typeof entry !== 'object') return false
      const record = entry as Record<string, unknown>
      return isDateKey(record.date) && typeof record.fortuneId === 'number' && fortuneIds.has(record.fortuneId)
    })

    if (entries.length !== parsed.length) return []

    return entries
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function appendOmikujiHistory(
  history: readonly OmikujiHistoryEntry[],
  entry: OmikujiHistoryEntry
): OmikujiHistoryEntry[] {
  return [entry, ...history.filter((item) => item.date !== entry.date)]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, HISTORY_LIMIT)
}

function previousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  date.setDate(date.getDate() - 1)
  return getOmikujiDateKey(date)
}

export function getOmikujiStreak(history: readonly OmikujiHistoryEntry[], today: Date = new Date()): number {
  const dates = new Set(history.map((entry) => entry.date))
  let dateKey = getOmikujiDateKey(today)
  let streak = 0

  while (dates.has(dateKey)) {
    streak += 1
    dateKey = previousDateKey(dateKey)
  }

  return streak
}

/**
 * ユーザーIDと日付に基づいて当日の運勢を決定論的または安全に取得
 * @param userId - ユーザー識別子（任意）
 * @param fortunes - 運勢データセット（省略時は OMIKUJI_FORTUNES）
 * @param date - 基準日付（省略時は当日）
 */
export function getTodayFortune(
  userId?: string | null,
  fortunes: readonly OmikujiFortune[] = OMIKUJI_FORTUNES,
  date: Date = new Date()
): OmikujiFortune {
  const list = fortunes && fortunes.length > 0 ? fortunes : OMIKUJI_FORTUNES
  const dateKey = getOmikujiDateKey(date)
  const seed = userId ? `${userId}:${dateKey}` : dateKey

  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }

  const index = Math.abs(hash) % list.length
  return list[index] ?? list[0] ?? OMIKUJI_FORTUNES[0]
}

