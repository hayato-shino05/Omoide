'use client'

import { RefreshCw } from 'lucide-react'
import { CountdownDisplay } from './CountdownDisplay'
import type { Birthday } from '@/types'
import { useBirthdays } from '@/lib/hooks/useBirthdays'
import { useLanguage } from '@/lib/i18n/LanguageContext'

function calendarDate(birthday: Birthday, year: number) {
  return new Date(year, birthday.month - 1, birthday.day)
}

export type BirthdayEventStatus = 'today' | 'upcoming' | 'past'

export interface BirthdayEvent {
  person: Birthday
  status: BirthdayEventStatus
  sortDate: Date
}

// 純粋関数として切り出すことで、midnight 跨ぎのロジックを直接テストできるようにする。
export function buildBirthdayEvents(birthdays: readonly Birthday[], now: Date): BirthdayEvent[] {
  return birthdays
    .map((person) => {
      const thisYear = calendarDate(person, now.getFullYear())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayDiff = Math.round((thisYear.getTime() - today.getTime()) / 86400000)
      const status: BirthdayEventStatus = dayDiff === 0 ? 'today' : dayDiff > 0 ? 'upcoming' : 'past'
      const sortDate = dayDiff < 0 ? calendarDate(person, now.getFullYear() + 1) : thisYear
      return { person, status, sortDate }
    })
    .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
}

export function millisecondsUntilNextMidnight(now: Date): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return nextMidnight.getTime() - now.getTime()
}

export function BirthdayHub() {
  const { isLoading, isError, refetch } = useBirthdays()
  const { t } = useLanguage()

  if (isLoading) {
    return <div suppressHydrationWarning className="flex min-h-[40vh] items-center justify-center text-sm" role="status">{t('loading')}</div>
  }

  if (isError) {
    return (
      <div suppressHydrationWarning className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center" role="alert">
        <p className="font-semibold">{t('error')}</p>
        <button type="button" onClick={() => refetch()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--theme-primary)] px-4 py-2 font-semibold">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('retry')}
        </button>
      </div>
    )
  }

  return <CountdownDisplay />
}
