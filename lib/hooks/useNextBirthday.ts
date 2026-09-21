'use client'

import { useEffect, useMemo, useState } from 'react'
import { useBirthdays } from './useBirthdays'
import { calculateNextBirthday } from '@/lib/utils/birthday'

// 次の誕生日を取得するカスタムフック
export function useNextBirthday() {
  const { data: birthdays, isLoading, error } = useBirthdays()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timeout = window.setTimeout(() => setNow(new Date()), nextMidnight.getTime() - now.getTime())

    return () => window.clearTimeout(timeout)
  }, [now])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)

    return () => window.clearInterval(interval)
  }, [])

  const nextBirthday = useMemo(() => {
    if (!birthdays || birthdays.length === 0) return null
    return calculateNextBirthday(now, birthdays)
  }, [birthdays, now])

  return {
    nextBirthday,
    isLoading,
    error,
  }
}
