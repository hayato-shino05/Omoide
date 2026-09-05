export const BIRTHDAY_TIMEZONE = 'Asia/Tokyo'

export interface BirthdayBusinessDate {
  year: number
  month: number
  day: number
  isoDate: string
  timeZoneLabel: string
}

const pad = (value: number): string => String(value).padStart(2, '0')

// サーバー側でビジネス日付（Asia/Tokyo）を決める。ブラウザ時刻は判定根拠にしない。
export function getBusinessDate(now: Date = new Date(), timeZone: string = BIRTHDAY_TIMEZONE): BirthdayBusinessDate {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)

  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type === 'year' || type === 'month' || type === 'day')
      .map(({ type, value }) => [type, Number(value)]),
  ) as { year: number; month: number; day: number }

  return {
    ...values,
    isoDate: `${values.year}-${pad(values.month)}-${pad(values.day)}`,
    timeZoneLabel: timeZone,
  }
}

export function formatBirthdayDate(date: { year: number; month: number; day: number }, timeZone: string = BIRTHDAY_TIMEZONE): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0)))
}
