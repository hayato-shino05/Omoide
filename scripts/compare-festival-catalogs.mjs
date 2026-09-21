import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const REPORT_KEYS = [
  'shared',
  'productionOnly',
  'openSourceOnly',
  'sameDateDifferentContent',
  'duplicateIds',
  'calendarRuleMismatch',
  'localeCoverageMismatch',
  'themeReferenceMismatch',
  'runtimeContractMismatch',
]

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

const PACK_KEYS = new Set(['id', 'country', 'region', 'locale', 'category', 'name', 'description', 'dateRule', 'enabled', 'status', 'priority', 'themeKey'])
const YEARLY_RULE_KEYS = new Set(['calendar', 'recurrence', 'ranges', 'timeZone'])
const YEAR_SPECIFIC_RULE_KEYS = new Set(['calendar', 'recurrence', 'dates', 'timeZone'])
const LUNAR_RULE_KEYS = new Set(['calendar', 'recurrence', 'payload', 'timeZone', 'status'])
const RANGE_KEYS = new Set(['month', 'startDay', 'endDay'])
const DATE_KEYS = new Set(['month', 'day'])

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function assertRecord(value) {
  if (!isRecord(value)) throw new TypeError('must be an object')
  return value
}

function assertExactKeys(record, allowedKeys) {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) throw new TypeError(`unknown key: ${key}`)
  }
}

function assertNonEmptyString(value) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new TypeError('must be a non-empty string')
  return value
}

function assertMonthDay(month, day, year = 2023) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    throw new TypeError('must contain a valid month and day')
  }
  const candidate = new Date(0)
  candidate.setUTCFullYear(year, month - 1, day)
  candidate.setUTCHours(12, 0, 0, 0)
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    throw new TypeError('must contain a valid month and day')
  }
}

function assertTimeZone(value) {
  const timeZone = assertNonEmptyString(value)
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format()
  } catch {
    throw new TypeError('must be a valid IANA timezone')
  }
}

function validateDateRule(value) {
  const record = assertRecord(value)
  const { calendar, recurrence } = record
  assertTimeZone(record.timeZone)

  if (calendar === 'gregorian' && recurrence === 'yearly') {
    assertExactKeys(record, YEARLY_RULE_KEYS)
    if (!Array.isArray(record.ranges) || record.ranges.length === 0) throw new TypeError('ranges must not be empty')
    for (const range of record.ranges) {
      const rangeRecord = assertRecord(range)
      assertExactKeys(rangeRecord, RANGE_KEYS)
      if (!Number.isInteger(rangeRecord.month) || !Number.isInteger(rangeRecord.startDay) ||
        !Number.isInteger(rangeRecord.endDay) || rangeRecord.startDay > rangeRecord.endDay) {
        throw new TypeError('range is invalid')
      }
      assertMonthDay(rangeRecord.month, rangeRecord.startDay)
      assertMonthDay(rangeRecord.month, rangeRecord.endDay)
    }
    return
  }

  if (calendar === 'gregorian' && recurrence === 'year-specific') {
    assertExactKeys(record, YEAR_SPECIFIC_RULE_KEYS)
    const dates = assertRecord(record.dates)
    const entries = Object.entries(dates)
    if (entries.length === 0) throw new TypeError('dates must not be empty')
    for (const [year, values] of entries) {
      if (!/^\d{4}$/.test(year) || !Array.isArray(values) || values.length === 0) throw new TypeError('year-specific dates are invalid')
      for (const date of values) {
        const dateRecord = assertRecord(date)
        assertExactKeys(dateRecord, DATE_KEYS)
        assertMonthDay(dateRecord.month, dateRecord.day, Number(year))
      }
    }
    return
  }

  if (calendar === 'lunar' && recurrence === 'year-specific') {
    assertExactKeys(record, LUNAR_RULE_KEYS)
    if (record.status !== 'unsupported-calendar' || !('payload' in record) || 'dates' in record || 'ranges' in record) {
      throw new TypeError('lunar rules require an opaque unsupported-calendar payload')
    }
    return
  }

  throw new TypeError('dateRule calendar and recurrence combination is invalid')
}

export function validateFestivalPack(value) {
  const record = assertRecord(value)
  assertExactKeys(record, PACK_KEYS)
  const country = assertNonEmptyString(record.country)
  const locale = assertNonEmptyString(record.locale)
  if (!/^[a-z]{2,3}$/.test(country)) throw new TypeError('country must be a lowercase ISO-style code')
  if (!/^(en|ja)$/.test(locale)) throw new TypeError('locale must be en or ja')
  if (!['festival', 'public-holiday', 'season'].includes(record.category)) throw new TypeError('category is invalid')
  if (!['enabled', 'disabled', 'unsupported-calendar'].includes(record.status)) throw new TypeError('status is invalid')
  if (typeof record.enabled !== 'boolean') throw new TypeError('enabled must be boolean')
  if (!Number.isInteger(record.priority) || record.priority < 0) throw new TypeError('priority must be a non-negative integer')
  assertNonEmptyString(record.id)
  assertNonEmptyString(record.name)
  if (record.description !== undefined) assertNonEmptyString(record.description)
  if (record.region !== undefined) assertNonEmptyString(record.region)
  if (record.themeKey !== undefined) assertNonEmptyString(record.themeKey)
  validateDateRule(record.dateRule)
  if (record.status === 'unsupported-calendar' && record.dateRule.calendar !== 'lunar') {
    throw new TypeError('unsupported-calendar status requires a lunar date rule')
  }
  if (record.dateRule.calendar === 'lunar' && record.status !== 'unsupported-calendar') {
    throw new TypeError('lunar date rules require unsupported-calendar status')
  }
  return record
}

function readPacks(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') throw new TypeError('catalog snapshot must be an object or array')
  const values = Array.isArray(snapshot)
    ? snapshot
    : ['catalog', 'packs', 'festivals', 'events']
      .map((key) => snapshot[key])
      .find(Array.isArray)
  if (!values) return []
  return values.map((value, index) => {
    try {
      return validateFestivalPack(value)
    } catch (error) {
      const reason = error instanceof Error ? `: ${error.message}` : ''
      throw new TypeError(`catalog snapshot contains malformed festival pack at index ${index}${reason}`, { cause: error })
    }
  })
}

function groupById(packs) {
  const groups = new Map()
  for (const pack of packs) groups.set(pack.id, [...(groups.get(pack.id) ?? []), pack])
  return groups
}

function localeSet(packs) {
  return [...new Set(packs.map(({ locale }) => locale))].sort().join('\u0000')
}

function themeSet(packs) {
  return packs
    .map(({ locale, themeKey }) => stableJson({ locale, themeKey: themeKey ?? null }))
    .sort()
    .join('\u0000')
}

function ruleSet(packs) {
  return packs
    .map(({ locale, dateRule }) => stableJson({ locale, dateRule }))
    .sort()
    .join('\u0000')
}

function identitySet(packs) {
  return packs
    .map(({ locale, country, region, category }) => stableJson({ locale, country, region, category }))
    .sort()
    .join('\u0000')
}

function runtimeContractSet(packs) {
  return packs
    .map(({ locale, enabled, status, priority }) => stableJson({ locale, enabled, status, priority }))
    .sort()
    .join('\u0000')
}

function hasRuntimeContractMismatch(packs) {
  if (packs.length < 2) return false
  const runtimeContracts = new Set(
    packs.map(({ enabled, status, priority }) => stableJson({ enabled, status, priority })),
  )
  return runtimeContracts.size > 1
}

function contentSet(packs) {
  return packs
    .map(({ locale, name, description }) => stableJson({ locale, name, description }))
    .sort()
    .join('\u0000')
}

function eventIdentity(pack) {
  return stableJson({ country: pack.country, region: pack.region, category: pack.category, dateRule: pack.dateRule })
}

function hasDuplicateId(packs) {
  if (packs.length < 2) return false
  const locales = new Set()
  const identities = new Set()
  for (const pack of packs) {
    if (locales.has(pack.locale)) return true
    locales.add(pack.locale)
    identities.add(eventIdentity(pack))
  }
  return identities.size > 1
}

function sorted(items) {
  return items.sort((left, right) => left.id.localeCompare(right.id))
}

export function compareCatalogs(productionSnapshot, openSourceSnapshot) {
  const production = readPacks(productionSnapshot)
  const openSource = readPacks(openSourceSnapshot)
  const productionById = groupById(production)
  const openSourceById = groupById(openSource)
  const ids = [...new Set([...productionById.keys(), ...openSourceById.keys()])].sort((left, right) => left.localeCompare(right))
  const report = Object.fromEntries(REPORT_KEYS.map((key) => [key, []]))

  for (const id of ids) {
    const productionEntries = productionById.get(id) ?? []
    const openSourceEntries = openSourceById.get(id) ?? []
    const hasDuplicate = hasDuplicateId(productionEntries) || hasDuplicateId(openSourceEntries)
    const hasRuntimeMismatch = hasRuntimeContractMismatch(productionEntries) || hasRuntimeContractMismatch(openSourceEntries)
    if (hasDuplicate) report.duplicateIds.push({ id })
    if (productionEntries.length === 0) {
      report.openSourceOnly.push({ id })
      continue
    }
    if (openSourceEntries.length === 0) {
      report.productionOnly.push({ id })
      continue
    }
    if (hasDuplicate) continue
    const hasLocaleCoverageMismatch = localeSet(productionEntries) !== localeSet(openSourceEntries)
    const hasCalendarRuleMismatch = ruleSet(productionEntries) !== ruleSet(openSourceEntries)
    const hasThemeReferenceMismatch = themeSet(productionEntries) !== themeSet(openSourceEntries)
    const runtimeContractMismatchDetected = hasRuntimeMismatch || runtimeContractSet(productionEntries) !== runtimeContractSet(openSourceEntries)
    const hasIdentityMismatch = identitySet(productionEntries) !== identitySet(openSourceEntries)
    const hasContentMismatch = contentSet(productionEntries) !== contentSet(openSourceEntries)

    if (hasLocaleCoverageMismatch) report.localeCoverageMismatch.push({ id })
    if (hasCalendarRuleMismatch) report.calendarRuleMismatch.push({ id })
    if (hasThemeReferenceMismatch) report.themeReferenceMismatch.push({ id })
    if (runtimeContractMismatchDetected) report.runtimeContractMismatch.push({ id })
    if (hasIdentityMismatch || hasContentMismatch) report.sameDateDifferentContent.push({ id })
    if (!hasLocaleCoverageMismatch && !hasCalendarRuleMismatch && !hasThemeReferenceMismatch &&
      !runtimeContractMismatchDetected && !hasIdentityMismatch && !hasContentMismatch) {
      report.shared.push({ id })
    }
  }

  for (const key of REPORT_KEYS) report[key] = sorted(report[key])
  return report
}

function parseArguments(args) {
  const options = {}
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (!argument.startsWith('--')) continue
    options[argument.slice(2)] = args[index + 1]
    index += 1
  }
  return options
}

function main() {
  const options = parseArguments(process.argv.slice(2))
  const required = ['production', 'opensource', 'output']
  const missing = required.filter((key) => !options[key])
  if (missing.length > 0) throw new Error(`必須引数がありません: ${missing.map((key) => `--${key}`).join(', ')}`)
  const production = JSON.parse(readFileSync(resolve(options.production), 'utf8'))
  const openSource = JSON.parse(readFileSync(resolve(options.opensource), 'utf8'))
  const report = compareCatalogs(production, openSource)
  const output = resolve(options.output)
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`)
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/compare-festival-catalogs.mjs')) main()
