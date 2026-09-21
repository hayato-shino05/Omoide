import type { FestivalPack } from './types'
import { validateFestivalPack } from './validation'

export interface ParityItem {
  id: string
}

export interface ParityReport {
  shared: ParityItem[]
  productionOnly: ParityItem[]
  openSourceOnly: ParityItem[]
  sameDateDifferentContent: ParityItem[]
  duplicateIds: ParityItem[]
  calendarRuleMismatch: ParityItem[]
  localeCoverageMismatch: ParityItem[]
  themeReferenceMismatch: ParityItem[]
  runtimeContractMismatch: ParityItem[]
}

export interface CatalogSnapshotObject {
  catalog?: unknown
  packs?: unknown
  festivals?: unknown
  events?: unknown
  locales?: unknown
  themes?: unknown
}

export type CatalogSnapshot = readonly FestivalPack[] | CatalogSnapshotObject

const REPORT_KEYS: (keyof ParityReport)[] = [
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

function readPacks(snapshot: CatalogSnapshot): FestivalPack[] {
  if (!snapshot || typeof snapshot !== 'object') throw new TypeError('catalog snapshot must be an object or array')
  const values = Array.isArray(snapshot)
    ? snapshot
    : (['catalog', 'packs', 'festivals', 'events'] as const)
      .map((key) => (snapshot as CatalogSnapshotObject)[key])
      .find(Array.isArray)
  if (!values) return []
  const packs: FestivalPack[] = []
  for (const [index, value] of values.entries()) {
    try {
      packs.push(validateFestivalPack(value))
    } catch (error) {
      const reason = error instanceof Error ? `: ${error.message}` : ''
      throw new TypeError(`catalog snapshot contains malformed festival pack at index ${index}${reason}`, { cause: error })
    }
  }
  return packs
}

function groupById(packs: readonly FestivalPack[]): Map<string, FestivalPack[]> {
  const groups = new Map<string, FestivalPack[]>()
  for (const pack of packs) groups.set(pack.id, [...(groups.get(pack.id) ?? []), pack])
  return groups
}

function localeSet(packs: readonly FestivalPack[]): string {
  return [...new Set(packs.map(({ locale }) => locale))].sort().join('\u0000')
}

function themeSet(packs: readonly FestivalPack[]): string {
  return packs
    .map(({ locale, themeKey }) => stableJson({ locale, themeKey: themeKey ?? null }))
    .sort()
    .join('\u0000')
}

function ruleSet(packs: readonly FestivalPack[]): string {
  return packs
    .map(({ locale, dateRule }) => stableJson({ locale, dateRule }))
    .sort()
    .join('\u0000')
}

function identitySet(packs: readonly FestivalPack[]): string {
  return packs
    .map(({ locale, country, region, category }) => stableJson({ locale, country, region, category }))
    .sort()
    .join('\u0000')
}

function runtimeContractSet(packs: readonly FestivalPack[]): string {
  return packs
    .map(({ locale, enabled, status, priority }) => stableJson({ locale, enabled, status, priority }))
    .sort()
    .join('\u0000')
}

function hasRuntimeContractMismatch(packs: readonly FestivalPack[]): boolean {
  if (packs.length < 2) return false
  const runtimeContracts = new Set(
    packs.map(({ enabled, status, priority }) => stableJson({ enabled, status, priority })),
  )
  return runtimeContracts.size > 1
}

function contentSet(packs: readonly FestivalPack[]): string {
  return packs
    .map(({ locale, name, description }) => stableJson({ locale, name, description }))
    .sort()
    .join('\u0000')
}

function eventIdentity(pack: FestivalPack): string {
  return stableJson({
    country: pack.country,
    region: pack.region,
    category: pack.category,
    dateRule: pack.dateRule,
  })
}

function hasDuplicateId(packs: readonly FestivalPack[]): boolean {
  if (packs.length < 2) return false
  const locales = new Set<string>()
  const identities = new Set<string>()
  for (const pack of packs) {
    if (locales.has(pack.locale)) return true
    locales.add(pack.locale)
    identities.add(eventIdentity(pack))
  }
  return identities.size > 1
}

function sorted(items: ParityItem[]): ParityItem[] {
  return items.sort((left, right) => left.id.localeCompare(right.id))
}

export function compareCatalogs(productionSnapshot: CatalogSnapshot, openSourceSnapshot: CatalogSnapshot): ParityReport {
  const production = readPacks(productionSnapshot)
  const openSource = readPacks(openSourceSnapshot)
  const productionById = groupById(production)
  const openSourceById = groupById(openSource)
  const ids = [...new Set([...productionById.keys(), ...openSourceById.keys()])].sort((left, right) => left.localeCompare(right))
  const report: ParityReport = {
    shared: [],
    productionOnly: [],
    openSourceOnly: [],
    sameDateDifferentContent: [],
    duplicateIds: [],
    calendarRuleMismatch: [],
    localeCoverageMismatch: [],
    themeReferenceMismatch: [],
    runtimeContractMismatch: [],
  }

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
