'use client'

import { useBirthdayCheck } from '@/lib/hooks/useBirthdayCheck'
import { BirthdayHero } from './BirthdayHero'
import { BirthdayHub } from './BirthdayHub'

// 誕生日チェックコンポーネント
export function BirthdayChecker() {
  const { birthdayPerson, isBirthday } = useBirthdayCheck()

  if (isBirthday && birthdayPerson) {
    return <BirthdayHero person={birthdayPerson} />
  }

  return <BirthdayHub />
}
