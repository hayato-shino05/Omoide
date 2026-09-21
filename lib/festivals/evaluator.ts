import type { FestivalPack, GregorianYearlyRule } from './types'

export type FestivalEvaluationStatus = 'active' | 'inactive' | 'unsupported-calendar'

export interface FestivalEvaluation {
  pack: FestivalPack
  status: FestivalEvaluationStatus
}

function getCalendarDate(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    era: 'short',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)

  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type === 'year' || type === 'month' || type === 'day' || type === 'era')
      .map(({ type, value }) => [type, type === 'era' ? value : Number(value)]),
  ) as { year: number; month: number; day: number; era?: string }

  return {
    year: values.era === 'BC' ? 1 - values.year : values.year,
    month: values.month,
    day: values.day,
  }
}


export function getInstantForCalendarDate(year: number, month: number, day: number, timeZone: string): Date {
  for (let hour = 0; hour < 48; hour += 1) {
    const candidate = new Date(0)
    candidate.setUTCFullYear(year, month - 1, day)
    candidate.setUTCHours(hour, 0, 0, 0)
    const actual = getCalendarDate(candidate, timeZone)
    if (actual.year === year && actual.month === month && actual.day === day) return candidate
  }

  throw new RangeError(`Calendar date cannot be represented in timezone: ${timeZone}`)
}

function isActiveYearlyRule(rule: GregorianYearlyRule, now: Date): boolean {
  const { month, day } = getCalendarDate(now, rule.timeZone)
  return rule.ranges.some((range) =>
    range.month === month && day >= range.startDay && day <= range.endDay,
  )
}

function compareEvaluations(left: FestivalEvaluation, right: FestivalEvaluation): number {
  return right.pack.priority - left.pack.priority ||
    (left.pack.id < right.pack.id ? -1 : left.pack.id > right.pack.id ? 1 : 0)
}

export function evaluateFestivalPacks(
  packs: readonly FestivalPack[],
  now: Date = new Date(),
): FestivalEvaluation[] {
  return packs
    .map((pack): FestivalEvaluation => {
      if (pack.dateRule.calendar !== 'gregorian' || pack.dateRule.recurrence !== 'yearly') {
        return { pack, status: 'unsupported-calendar' }
      }

      if (!pack.enabled || pack.status !== 'enabled') {
        return { pack, status: 'inactive' }
      }

      return {
        pack,
        status: isActiveYearlyRule(pack.dateRule, now) ? 'active' : 'inactive',
      }
    })
    .sort(compareEvaluations)
}
