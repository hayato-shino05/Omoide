import type {
  DateRule,
  EventCategory,
  EventStatus,
  FestivalPack,
  GregorianDate,
  GregorianRange,
  Locale,
} from './types'

const EVENT_CATEGORIES = new Set<EventCategory>(['festival', 'public-holiday', 'season'])
const EVENT_STATUSES = new Set<EventStatus>(['enabled', 'disabled', 'unsupported-calendar'])
const LOCALE_PATTERN = /^(en|ja)$/
const COUNTRY_PATTERN = /^[a-z]{2,3}$/
const YEAR_PATTERN = /^\d{4}$/
const PACK_KEYS = new Set(['id', 'country', 'region', 'locale', 'category', 'name', 'description', 'dateRule', 'enabled', 'status', 'priority', 'themeKey'])
const YEARLY_RULE_KEYS = new Set(['calendar', 'recurrence', 'ranges', 'timeZone'])
const YEAR_SPECIFIC_RULE_KEYS = new Set(['calendar', 'recurrence', 'dates', 'timeZone'])
const LUNAR_RULE_KEYS = new Set(['calendar', 'recurrence', 'payload', 'timeZone', 'status'])
const RANGE_KEYS = new Set(['month', 'startDay', 'endDay'])
const DATE_KEYS = new Set(['month', 'day'])

export class FestivalPackValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FestivalPackValidationError'
  }
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new FestivalPackValidationError(`${path} must be an object`)
  }
  return value as Record<string, unknown>
}

function asNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new FestivalPackValidationError(`${path} must be a non-empty string`)
  }
  return value
}

function assertExactKeys(record: Record<string, unknown>, allowedKeys: Set<string>, path: string): void {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      throw new FestivalPackValidationError(`${path}.${key} is not allowed`)
    }
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function validateTimeZone(value: unknown): string {
  const timeZone = asNonEmptyString(value, 'dateRule.timeZone')
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format()
  } catch {
    throw new FestivalPackValidationError('dateRule.timeZone must be a valid IANA timezone')
  }
  return timeZone
}

function validateMonthDay(month: unknown, day: unknown, path: string, year = 2024): GregorianDate {
  if (
    typeof month !== 'number' || !Number.isInteger(month) || month < 1 || month > 12 ||
    typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > 31
  ) {
    throw new FestivalPackValidationError(`${path} must contain a valid month and day`)
  }
  const candidate = new Date(0)
  candidate.setUTCFullYear(year, month - 1, day)
  candidate.setUTCHours(12, 0, 0, 0)
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    throw new FestivalPackValidationError(`${path} must contain a valid month and day`)
  }
  return { month, day }
}

function validateRanges(value: unknown): GregorianRange[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new FestivalPackValidationError('dateRule.ranges must not be empty')
  }

  return value.map((range, index) => {
    const record = asRecord(range, `dateRule.ranges[${index}]`)
    assertExactKeys(record, RANGE_KEYS, `dateRule.ranges[${index}]`)
    const month = record.month
    const startDay = record.startDay
    const endDay = record.endDay
    if (
      typeof month !== 'number' || !Number.isInteger(month) || month < 1 || month > 12 ||
      typeof startDay !== 'number' || !Number.isInteger(startDay) || startDay < 1 || startDay > 31 ||
      typeof endDay !== 'number' || !Number.isInteger(endDay) || endDay < 1 || endDay > 31 ||
      startDay > endDay
    ) {
      throw new FestivalPackValidationError(`dateRule.ranges[${index}] is invalid`)
    }
    validateMonthDay(month, startDay, `dateRule.ranges[${index}].startDay`, 2023)
    validateMonthDay(month, endDay, `dateRule.ranges[${index}].endDay`, 2023)
    return { month, startDay, endDay }
  })
}

function validateYearDates(value: unknown): Record<string, GregorianDate[]> {
  const dates = asRecord(value, 'dateRule.dates')
  const entries = Object.entries(dates)
  if (entries.length === 0) {
    throw new FestivalPackValidationError('dateRule.dates must not be empty')
  }

  return Object.fromEntries(entries.map(([year, values]) => {
    if (!YEAR_PATTERN.test(year) || !Array.isArray(values) || values.length === 0) {
      throw new FestivalPackValidationError(`dateRule.dates[${year}] is invalid`)
    }
    return [year, values.map((item, index) => {
      const record = asRecord(item, `dateRule.dates[${year}][${index}]`)
      assertExactKeys(record, DATE_KEYS, `dateRule.dates[${year}][${index}]`)
      return validateMonthDay(record.month, record.day, `dateRule.dates[${year}][${index}]`, Number(year))
    })]
  }))
}

export function validateDateRule(value: unknown): DateRule {
  const record = asRecord(value, 'dateRule')
  const calendar = record.calendar
  const recurrence = record.recurrence
  const timeZone = validateTimeZone(record.timeZone)

  if (calendar === 'gregorian' && recurrence === 'yearly') {
    assertExactKeys(record, YEARLY_RULE_KEYS, 'dateRule')
    return { calendar, recurrence, ranges: validateRanges(record.ranges), timeZone }
  }

  if (calendar === 'gregorian' && recurrence === 'year-specific') {
    assertExactKeys(record, YEAR_SPECIFIC_RULE_KEYS, 'dateRule')
    return { calendar, recurrence, dates: validateYearDates(record.dates), timeZone }
  }

  if (calendar === 'lunar' && recurrence === 'year-specific') {
    assertExactKeys(record, LUNAR_RULE_KEYS, 'dateRule')
    if (record.status !== 'unsupported-calendar' || !('payload' in record) || 'dates' in record || 'ranges' in record) {
      throw new FestivalPackValidationError('lunar rules require an opaque unsupported-calendar payload')
    }
    return { calendar, recurrence, payload: record.payload, timeZone, status: 'unsupported-calendar' }
  }

  throw new FestivalPackValidationError('dateRule calendar and recurrence combination is invalid')
}

export function validateFestivalPack(value: unknown): FestivalPack {
  const record = asRecord(value, 'festivalPack')
  assertExactKeys(record, PACK_KEYS, 'festivalPack')
  const id = asNonEmptyString(record.id, 'id')
  const country = asNonEmptyString(record.country, 'country')
  const locale = asNonEmptyString(record.locale, 'locale')

  if (!COUNTRY_PATTERN.test(country)) {
    throw new FestivalPackValidationError('country must be a lowercase ISO-style code')
  }
  if (!LOCALE_PATTERN.test(locale)) {
    throw new FestivalPackValidationError('locale must be en or ja')
  }
  if (!EVENT_CATEGORIES.has(record.category as EventCategory)) {
    throw new FestivalPackValidationError('category is invalid')
  }
  if (!EVENT_STATUSES.has(record.status as EventStatus)) {
    throw new FestivalPackValidationError('status is invalid')
  }
  if (typeof record.enabled !== 'boolean') {
    throw new FestivalPackValidationError('enabled must be boolean')
  }
  if (typeof record.priority !== 'number' || !Number.isInteger(record.priority) || record.priority < 0) {
    throw new FestivalPackValidationError('priority must be a non-negative integer')
  }

  const name = asNonEmptyString(record.name, 'name')
  const description = record.description === undefined
    ? undefined
    : asNonEmptyString(record.description, 'description')
  const region = record.region === undefined
    ? undefined
    : asNonEmptyString(record.region, 'region')
  const themeKey = record.themeKey === undefined
    ? undefined
    : asNonEmptyString(record.themeKey, 'themeKey')
  const dateRule = validateDateRule(record.dateRule)
  if (record.status === 'unsupported-calendar' && dateRule.calendar !== 'lunar') {
    throw new FestivalPackValidationError('unsupported-calendar status requires a lunar date rule')
  }
  if (dateRule.calendar === 'lunar' && record.status !== 'unsupported-calendar') {
    throw new FestivalPackValidationError('lunar date rules require unsupported-calendar status')
  }

  return {
    id,
    country,
    ...(region ? { region } : {}),
    locale: locale as Locale,
    category: record.category as EventCategory,
    name,
    ...(description ? { description } : {}),
    dateRule,
    enabled: record.enabled,
    status: record.status as EventStatus,
    priority: record.priority,
    ...(themeKey ? { themeKey } : {}),
  }
}

export function validateFestivalPacks(value: unknown): FestivalPack[] {
  if (!Array.isArray(value)) {
    throw new FestivalPackValidationError('festival packs must be an array')
  }
  const packs = value.map(validateFestivalPack)
  const ids = new Map<string, Map<string, FestivalPack>>()
  for (const pack of packs) {
    const localized = ids.get(pack.id)
    if (!localized) {
      ids.set(pack.id, new Map([[pack.locale, pack]]))
      continue
    }
    if (localized.has(pack.locale)) {
      throw new FestivalPackValidationError(`duplicate festival pack id: ${pack.id}`)
    }
    const existing = localized.values().next().value as FestivalPack
    const sameEvent =
      existing.country === pack.country &&
      existing.region === pack.region &&
      existing.category === pack.category &&
      stableJson(existing.dateRule) === stableJson(pack.dateRule)
    const sameRuntimeContract =
      existing.enabled === pack.enabled &&
      existing.status === pack.status &&
      existing.priority === pack.priority &&
      existing.themeKey === pack.themeKey
    if (!sameEvent || !sameRuntimeContract) {
      throw new FestivalPackValidationError(`duplicate festival pack id: ${pack.id}`)
    }
    localized.set(pack.locale, pack)
  }
  return packs
}
