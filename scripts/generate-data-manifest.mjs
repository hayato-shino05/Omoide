import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'

const LOCALE_PATTERN = /^[A-Za-z]{2,3}$/
const COUNTRY_PATTERN = /^[a-z]{2,3}$/
const SUPPORTED_LOCALES = ['en', 'ja']
const LOCALE_FILE_NAMES = { 'en': 'en.json', 'ja': 'ja.json' }
const LOCALE_KEYS = new Set(['locale', 'translations'])
const PACK_KEYS = new Set(['id', 'country', 'region', 'locale', 'category', 'name', 'description', 'dateRule', 'enabled', 'status', 'priority', 'themeKey'])
const YEARLY_RULE_KEYS = new Set(['calendar', 'recurrence', 'ranges', 'timeZone'])
const YEAR_SPECIFIC_RULE_KEYS = new Set(['calendar', 'recurrence', 'dates', 'timeZone'])
const LUNAR_RULE_KEYS = new Set(['calendar', 'recurrence', 'payload', 'timeZone', 'status'])
const RANGE_KEYS = new Set(['month', 'startDay', 'endDay'])
const DATE_KEYS = new Set(['month', 'day'])

function fail(message) {
  throw new Error(message)
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    fail(`JSONを読み込めません: ${path}: ${error.message}`)
  }
}

async function listJsonFiles(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true })

    const files = []
    for (const entry of entries) {
      const path = join(root, entry.name)
      if (entry.isDirectory()) files.push(...await listJsonFiles(path))
      else if (entry.isFile() && entry.name.endsWith('.json')) files.push(path)
    }
    return files.sort()
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

function assertRequired(record, required, path) {
  for (const key of required) {
    if (!(key in record)) fail(`${path} に ${key} がありません`)
  }
}

function assertExactKeys(record, allowedKeys, path) {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) fail(`${path}.${key} は未対応です`)
  }
}

function assertTimeZone(timeZone, path) {
  if (typeof timeZone !== 'string' || timeZone.length === 0) fail(`${path} は必須です`)
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format()
  } catch {
    fail(`${path} は IANA timezone である必要があります`)
  }
}

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

function normalizeLineEndings(value) {
  return value.replaceAll('\r\n', '\n')
}

function validateMonthDay(month, day, path, year = 2024) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    fail(`${path} が不正です`)
  }
  const candidate = new Date(0)
  candidate.setUTCFullYear(year, month - 1, day)
  candidate.setUTCHours(12, 0, 0, 0)
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    fail(`${path} が不正です`)
  }
}

function validateYearDates(dates, path) {
  if (!dates || typeof dates !== 'object' || Array.isArray(dates)) fail(`${path} が不正です`)
  const entries = Object.entries(dates)
  if (entries.length === 0) fail(`${path} が不正です`)
  for (const [year, values] of entries) {
    const numericYear = Number(year)
    if (!/^\d{4}$/.test(year) || !Array.isArray(values) || values.length === 0) fail(`${path}.${year} が不正です`)
    for (const [index, value] of values.entries()) {
      if (!value || typeof value !== 'object') fail(`${path}.${year}[${index}] が不正です`)
      assertExactKeys(value, DATE_KEYS, `${path}.${year}[${index}]`)
      validateMonthDay(value.month, value.day, `${path}.${year}[${index}]`, numericYear)
    }
  }
}

function validateDateRule(rule, path) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) fail(`${path} は object である必要があります`)
  assertTimeZone(rule.timeZone, `${path}.timeZone`)

  if (rule.calendar === 'gregorian' && rule.recurrence === 'yearly') {
    assertExactKeys(rule, YEARLY_RULE_KEYS, path)
    if (!Array.isArray(rule.ranges) || rule.ranges.length === 0) fail(`${path}.ranges は空にできません`)
    for (const [index, range] of rule.ranges.entries()) {
      if (!range || typeof range !== 'object') fail(`${path}.ranges[${index}] が不正です`)
      assertExactKeys(range, RANGE_KEYS, `${path}.ranges[${index}]`)
      const { month, startDay, endDay } = range
      if (![month, startDay, endDay].every(Number.isInteger) || month < 1 || month > 12 || startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31 || startDay > endDay) {
        fail(`${path}.ranges[${index}] が不正です`)
      }
      validateMonthDay(month, startDay, `${path}.ranges[${index}].startDay`, 2023)
      validateMonthDay(month, endDay, `${path}.ranges[${index}].endDay`, 2023)
    }
    return
  }

  if (rule.calendar === 'gregorian' && rule.recurrence === 'year-specific') {
    assertExactKeys(rule, YEAR_SPECIFIC_RULE_KEYS, path)
    validateYearDates(rule.dates, `${path}.dates`)
    return
  }

  if (
    rule.calendar === 'lunar' &&
    rule.recurrence === 'year-specific' &&
    rule.status === 'unsupported-calendar' &&
    'payload' in rule &&
    !('dates' in rule) &&
    !('ranges' in rule)
  ) {
    assertExactKeys(rule, LUNAR_RULE_KEYS, path)
    return
  }
  fail(`${path} の calendar と recurrence の組み合わせが不正です`)
}

function validatePack(pack, path) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) fail(`${path} が不正です`)
  assertExactKeys(pack, PACK_KEYS, path)
  assertRequired(pack, ['id', 'country', 'locale', 'category', 'name', 'dateRule', 'enabled', 'status', 'priority'], path)
  if (typeof pack.id !== 'string' || pack.id.trim().length === 0) fail(`${path}.id が不正です`)
  if (typeof pack.country !== 'string' || !COUNTRY_PATTERN.test(pack.country)) fail(`${path}.country が不正です`)
  if (typeof pack.locale !== 'string' || !LOCALE_PATTERN.test(pack.locale)) fail(`${path}.locale が不正です`)
  if (!SUPPORTED_LOCALES.includes(pack.locale)) fail(`${path}.locale は en または ja である必要があります`)
  if (!['festival', 'public-holiday', 'season'].includes(pack.category)) fail(`${path}.category が不正です`)
  if (typeof pack.name !== 'string' || pack.name.trim().length === 0) fail(`${path}.name が不正です`)
  if (pack.description !== undefined && (typeof pack.description !== 'string' || pack.description.trim().length === 0)) fail(`${path}.description が不正です`)
  if (pack.region !== undefined && (typeof pack.region !== 'string' || pack.region.trim().length === 0)) fail(`${path}.region が不正です`)
  if (pack.themeKey !== undefined && (typeof pack.themeKey !== 'string' || pack.themeKey.trim().length === 0)) fail(`${path}.themeKey が不正です`)
  if (typeof pack.enabled !== 'boolean') fail(`${path}.enabled が不正です`)
  if (!['enabled', 'disabled', 'unsupported-calendar'].includes(pack.status)) fail(`${path}.status が不正です`)
  if (!Number.isInteger(pack.priority) || pack.priority < 0) fail(`${path}.priority が不正です`)
  validateDateRule(pack.dateRule, `${path}.dateRule`)
  if (pack.status === 'unsupported-calendar' && pack.dateRule.calendar !== 'lunar') fail(`${path}.status は lunar rule にのみ指定できます`)
  if (pack.dateRule.calendar === 'lunar' && pack.status !== 'unsupported-calendar') fail(`${path}.lunar rule には unsupported-calendar が必要です`)
}

async function readSchema(root, name) {
  const schemaPath = join(root, 'data', 'schemas', name)
  return readJson(schemaPath)
}

function validateSchemaDefinition(schema, name, required) {
  if (!schema || schema.type !== 'object' || !Array.isArray(schema.required)) {
    fail(`${name} は object schema と required 配列を定義する必要があります`)
  }
  for (const key of required) {
    if (!schema.required.includes(key)) fail(`${name}.required に ${key} がありません`)
  }
}

async function collectFestivalPacks(root) {
  const files = await listJsonFiles(join(root, 'data', 'festivals'))
  const packs = []
  for (const file of files) {
    const value = await readJson(file)
    if (!Array.isArray(value)) fail(`${file} は pack の配列である必要があります`)
    for (const [index, pack] of value.entries()) {
      validatePack(pack, `${relative(root, file)}[${index}]`)
      packs.push(pack)
    }
  }
  const byId = new Map()
  for (const pack of packs) {
    const existing = byId.get(pack.id)
    if (!existing) {
      byId.set(pack.id, {
        pack,
        locales: new Set([pack.locale]),
      })
      continue
    }
    const sameIdentity = existing.pack.country === pack.country &&
      existing.pack.region === pack.region &&
      existing.pack.category === pack.category &&
      stableJson(existing.pack.dateRule) === stableJson(pack.dateRule)
    const sameRuntimeContract = existing.pack.enabled === pack.enabled &&
      existing.pack.status === pack.status &&
      existing.pack.priority === pack.priority &&
      existing.pack.themeKey === pack.themeKey
    if (!sameIdentity || !sameRuntimeContract || existing.locales.has(pack.locale)) {
      fail(`festival pack の ID が重複しています: ${pack.id}`)
    }
    existing.locales.add(pack.locale)
  }
  for (const [id, group] of byId.entries()) {
    for (const locale of SUPPORTED_LOCALES) {
      if (!group.locales.has(locale)) fail(`festival pack に locale が不足しています: ${id}:${locale}`)
    }
  }
  return packs.sort((left, right) => left.id.localeCompare(right.id) || left.locale.localeCompare(right.locale))
}

async function collectLocales(root) {
  const files = await listJsonFiles(join(root, 'data', 'i18n'))
  const locales = []
  const seen = new Set()
  for (const file of files) {
    if (file.endsWith('keys.json')) continue
    const value = await readJson(file)
    const path = relative(root, file)
    assertRequired(value, ['locale', 'translations'], path)
    assertExactKeys(value, LOCALE_KEYS, path)
    if (typeof value.locale !== 'string' || !LOCALE_PATTERN.test(value.locale)) fail(`${path}.locale が不正です`)
    if (SUPPORTED_LOCALES.includes(value.locale) && LOCALE_FILE_NAMES[value.locale] !== basename(file)) fail(`${path} は ${LOCALE_FILE_NAMES[value.locale]} である必要があります`)
    if (seen.has(value.locale)) fail(`locale が重複しています: ${value.locale}`)
    seen.add(value.locale)
    if (!value.translations || typeof value.translations !== 'object' || Array.isArray(value.translations)) fail(`${path}.translations が不正です`)
    locales.push(value)
  }
  return locales.sort((left, right) => left.locale.localeCompare(right.locale))
}

async function readVisualThemeKeys(root) {
  const source = await readFile(join(root, 'config', 'visualThemes.ts'), 'utf8')
  const match = source.match(/VISUAL_THEME_KEYS\s*=\s*\[([\s\S]*?)\]\s*as const/)
  if (!match) fail('VISUAL_THEME_KEYS を config/visualThemes.ts から読み込めません')
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((entry) => entry[1]).sort()
}

async function readTranslationKeys(root) {
  const keys = await readJson(join(root, 'data', 'i18n', 'keys.json'))
  if (!Array.isArray(keys) || keys.length === 0 || keys.some((key) => typeof key !== 'string' || key.length === 0)) {
    fail('data/i18n/keys.json は空でない string 配列である必要があります')
  }
  const sorted = [...keys].sort()
  if (new Set(sorted).size !== sorted.length) fail('data/i18n/keys.json に重複 key があります')
  return sorted
}

function validateThemeKeys(packs, themeKeys) {
  const available = new Set(themeKeys)
  for (const pack of packs) {
    if (pack.themeKey && !available.has(pack.themeKey)) fail(`themeKey が登録されていません: ${pack.themeKey}`)
  }
}

function validateLocaleKeys(locales, canonicalKeys) {
  if (locales.length === 0) fail('locale pack がありません')

  const availableLocales = new Set(locales.map(({ locale }) => locale))
  for (const supportedLocale of SUPPORTED_LOCALES) {
    if (!availableLocales.has(supportedLocale)) fail(`supported locale pack が不足しています: ${supportedLocale}`)
  }
  for (const locale of locales) {
    if (!SUPPORTED_LOCALES.includes(locale.locale)) fail(`未対応の locale pack です: ${locale.locale}`)
    const keys = Object.keys(locale.translations).sort()
    if (JSON.stringify(keys) !== JSON.stringify(canonicalKeys)) {
      fail(`translation keys が一致しません: ${locale.locale}`)
    }
    if (keys.some((key) => typeof locale.translations[key] !== 'string' || locale.translations[key].length === 0)) {
      fail(`translation value が空または不正です: ${locale.locale}`)
    }
  }
}

function generatedContents(packs, locales, themeKeys, translationKeys) {
  return new Map([
    [
      'data/generated/festival-packs.ts',
      `import type { FestivalPack } from '@/lib/festivals/types'\n\nexport const festivalPacks = ${JSON.stringify(packs, null, 2)} as const satisfies readonly FestivalPack[]\n`,
    ],
    [
      'data/generated/locales.ts',
      `import type { Locale } from '@/lib/festivals/types'\n\nexport const translationKeys = ${JSON.stringify(translationKeys, null, 2)} as const\n\nexport type GeneratedTranslationKey = (typeof translationKeys)[number]\n\nexport type GeneratedLocalePack = {\n  readonly locale: Locale\n  readonly translations: Readonly<Record<GeneratedTranslationKey, string>>\n}\n\nexport const localePacks = ${JSON.stringify(locales, null, 2)} as const satisfies readonly GeneratedLocalePack[]\n\nexport const locales = ${JSON.stringify(locales.map(({ locale }) => locale), null, 2)} as const satisfies readonly Locale[]\n`,
    ],
    [
      'data/generated/themes.ts',
      `export const themes = ${JSON.stringify(themeKeys, null, 2)} as const satisfies readonly string[]\n`,
    ],
  ])
}

async function writeAtomically(root, contents) {
  const entries = [...contents.entries()].map(([relativePath, content]) => {
    const target = join(root, relativePath)
    return {
      target,
      temporary: `${target}.${process.pid}.tmp`,
      backup: `${target}.${process.pid}.bak`,
      content,
      installed: false,
      backedUp: false,
    }
  })

  try {
    for (const entry of entries) {
      await mkdir(dirname(entry.target), { recursive: true })
      await writeFile(entry.temporary, entry.content)
    }
    for (const entry of entries) {
      if (existsSync(entry.target)) {
        await rm(entry.backup, { force: true })
        await rename(entry.target, entry.backup)
        entry.backedUp = true
      }
    }
    for (const entry of entries) {
      await rename(entry.temporary, entry.target)
      entry.installed = true
    }
  } catch (error) {
    for (const entry of entries) {
      await rm(entry.temporary, { force: true })
      if (entry.installed && existsSync(entry.target)) await rm(entry.target, { force: true })
      if (entry.backedUp && existsSync(entry.backup)) await rename(entry.backup, entry.target)
    }
    throw error
  }

  const cleanupErrors = []
  for (const entry of entries) {
    try {
      await rm(entry.backup, { force: true })
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error.message : String(error))
    }
  }
  if (cleanupErrors.length > 0) fail(cleanupErrors.join('\n'))
}

async function generate(root) {
  const [festivalSchema, i18nSchema] = await Promise.all([
    readSchema(root, 'festival-pack.schema.json'),
    readSchema(root, 'i18n.schema.json'),
  ])
  validateSchemaDefinition(festivalSchema, 'festival-pack.schema.json', ['id', 'country', 'locale', 'category', 'name', 'dateRule', 'enabled', 'status', 'priority'])
  validateSchemaDefinition(i18nSchema, 'i18n.schema.json', ['locale', 'translations'])
  const packs = await collectFestivalPacks(root)
  const locales = await collectLocales(root)
  const translationKeys = await readTranslationKeys(root)
  validateLocaleKeys(locales, translationKeys)
  const themeKeys = await readVisualThemeKeys(root)
  validateThemeKeys(packs, themeKeys)
  return generatedContents(packs, locales, themeKeys, translationKeys)
}

async function main() {
  const args = process.argv.slice(2)
  const rootIndex = args.indexOf('--root')
  const rootArgument = rootIndex >= 0 ? args[rootIndex + 1] : undefined
  if (rootIndex >= 0 && (!rootArgument || rootArgument.startsWith('--'))) fail('`--root` にはパスが必要です')
  const root = resolve(rootArgument ?? process.cwd())
  const mode = args.includes('--check') ? 'check' : args.includes('--write') ? 'write' : null
  if (!mode) fail('`--check` または `--write` が必要です')
  const contents = await generate(root)
  if (mode === 'check') {
    for (const [relativePath, expected] of contents) {
      const target = join(root, relativePath)
      const actual = await readFile(target, 'utf8').catch(() => null)
      if (actual === null || normalizeLineEndings(actual) !== normalizeLineEndings(expected)) fail(`生成済み manifest が古いです: ${relativePath}`)
    }
    return
  }
  await writeAtomically(root, contents)
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/generate-data-manifest.mjs')) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
