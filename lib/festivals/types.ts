export type EventCategory = 'festival' | 'public-holiday' | 'season'

export type EventStatus = 'enabled' | 'disabled' | 'unsupported-calendar'

export type Locale = 'en' | 'ja'

export interface GregorianRange {
  month: number
  startDay: number
  endDay: number
}

export interface GregorianDate {
  month: number
  day: number
}

export interface GregorianYearlyRule {
  calendar: 'gregorian'
  recurrence: 'yearly'
  ranges: GregorianRange[]
  timeZone: string
}

export interface GregorianYearSpecificRule {
  calendar: 'gregorian'
  recurrence: 'year-specific'
  dates: Record<string, GregorianDate[]>
  timeZone: string
}

export interface LunarYearSpecificRule {
  calendar: 'lunar'
  recurrence: 'year-specific'
  payload: unknown
  timeZone: string
  status: 'unsupported-calendar'
}

export type DateRule =
  | GregorianYearlyRule
  | GregorianYearSpecificRule
  | LunarYearSpecificRule

export interface FestivalPack {
  id: string
  country: string
  region?: string
  locale: Locale
  category: EventCategory
  name: string
  description?: string
  dateRule: DateRule
  enabled: boolean
  status: EventStatus
  priority: number
  themeKey?: string
}
