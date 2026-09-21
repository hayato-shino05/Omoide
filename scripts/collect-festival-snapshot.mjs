import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { validateFestivalPack } from './compare-festival-catalogs.mjs'

const EXCLUDED_PATH_RULES = [
  { test: (path) => /^\.env(?:\.|$)/.test(path), reason: '環境変数と秘密情報' },
  { test: (path) => path === 'supabase' || path.startsWith('supabase/'), reason: 'Supabase 設定とスキーマ' },
  { test: (path) => path === '.vercel' || path.startsWith('.vercel/') || /(?:^|\/)(?:deploy|deployment|vercel|netlify)(?:\/|\.|$)/i.test(path), reason: 'デプロイ設定または成果物' },
  { test: (path) => /^(?:\.claude|\.agents|\.harness-core)(?:\/|$)/.test(path), reason: 'リポジトリ管理用の生成物' },
]

function runGit(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
}

function getTrackedFiles(root, commit) {
  return runGit(root, ['ls-tree', '-r', '--name-only', commit]).split('\n').filter(Boolean)
}

function getDirtyFiles(root) {
  if (!existsSync(resolve(root, '.git'))) return []
  const output = execFileSync(
    'git',
    ['-C', root, 'status', '--porcelain', '-z', '--untracked-files=all'],
    { encoding: 'utf8' },
  )
  const dirtyFiles = []
  const entries = output.split('\0')
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    if (!entry || entry.length < 3 || entry[2] !== ' ') continue
    const status = entry.slice(0, 2)
    const path = entry.slice(3)
    if (!path) continue
    dirtyFiles.push(path)
    if (status.includes('R') || status.includes('C')) {
      const previousPath = entries[index + 1]
      if (previousPath) dirtyFiles.push(previousPath)
      index += 1
    }
  }
  return [...new Set(dirtyFiles)]
}

function readAtCommit(root, commit, relativePath) {
  try {
    return runGit(root, ['show', `${commit}:${relativePath}`])
  } catch {
    return ''
  }
}

function readTrackedFile(root, commit, relativePath) {
  if (commit) return readAtCommit(root, commit, relativePath)
  const absolutePath = resolve(root, relativePath)
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : ''
}

function readTrackedJson(root, commit, relativePath) {
  const source = readTrackedFile(root, commit, relativePath)
  if (!source) return null
  try {
    return JSON.parse(source)
  } catch {
    throw new Error(`JSON を読み込めません: ${relativePath}`)
  }
}

function readFestivalPacks(root, commit, trackedFiles) {
  const packs = []
  for (const relativePath of trackedFiles.filter((path) => path.startsWith('data/festivals/') && path.endsWith('.json'))) {
    const value = readTrackedJson(root, commit, relativePath)
    if (!Array.isArray(value)) throw new Error(`festival pack は配列である必要があります: ${relativePath}`)
    for (const [index, pack] of value.entries()) {
      try {
        packs.push(validateFestivalPack(pack))
      } catch (error) {
        const reason = error instanceof Error ? `: ${error.message}` : ''
        throw new Error(`festival pack が不正です: ${relativePath}[${index}]${reason}`, { cause: error })
      }
    }
  }
  return packs
}

function isIntegrationPath(path) {
  return (path.startsWith('data/festivals/') && path.endsWith('.json')) ||
    (path.startsWith('data/i18n/') && path.endsWith('.json') && !path.endsWith('/keys.json'))
}

function readLocales(root, commit, trackedFiles) {
  const locales = []
  for (const relativePath of trackedFiles.filter((path) => isIntegrationPath(path) && path.startsWith('data/i18n/'))) {
    const value = readTrackedJson(root, commit, relativePath)
    if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.locale !== 'string') {
      throw new Error(`locale pack が不正です: ${relativePath}`)
    }
    locales.push(value.locale)
  }
  return [...new Set(locales)].sort()
}

function extractObjectKeys(source, marker) {
  const markerIndex = source.indexOf(marker)
  if (markerIndex < 0) return []
  const openingBrace = source.indexOf('{', markerIndex)
  if (openingBrace < 0) return []

  const keys = []
  let depth = 0
  let quote = null
  let escaped = false
  let token = ''
  let quotedToken = ''
  let quotedDepth = 0
  let afterQuotedToken = false

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index]
    if (quote) {
      if (escaped) {
        escaped = false
        if (quotedDepth === depth) quotedToken += character
      } else if (character === '\\') {
        escaped = true
      } else if (character === quote) {
        quote = null
        if (quotedDepth === depth) afterQuotedToken = quotedToken.length > 0
      } else if (quotedDepth === depth) {
        quotedToken += character
      }
      continue
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character
      quotedDepth = depth
      quotedToken = depth === 1 ? '' : quotedToken
      continue
    }
    if (character === '{') {
      depth += 1
      token = ''
      quotedToken = ''
      afterQuotedToken = false
      continue
    }
    if (character === '}') {
      depth -= 1
      if (depth === 0) break
      token = ''
      quotedToken = ''
      afterQuotedToken = false
      continue
    }
    if (depth === 1) {
      if (/[$\w-]/.test(character)) token += character
      else if (character === ':') {
        const key = token || (afterQuotedToken ? quotedToken : '')
        if (key && !keys.includes(key)) keys.push(key)
        token = ''
        quotedToken = ''
        afterQuotedToken = false
      } else if (!/\s/.test(character)) {
        token = ''
        quotedToken = ''
        afterQuotedToken = false
      }
    }
  }

  return keys.sort()
}

function classifyPath(relativePath) {
  return EXCLUDED_PATH_RULES.find(({ test }) => test(relativePath)) ?? null
}

function buildFiles(root, commit, trackedFiles) {
  const dirtyFiles = getDirtyFiles(root)
  const candidates = [...new Set([...trackedFiles, ...dirtyFiles])].sort()
  const excluded = []
  const reasons = {}
  const included = []

  for (const relativePath of candidates) {
    const rule = classifyPath(relativePath)
    if (rule) {
      excluded.push(relativePath)
      reasons[relativePath] = rule.reason
    } else if (trackedFiles.includes(relativePath)) {
      included.push(relativePath)
    }
  }

  return { included, excluded, reasons, commit }
}

function collectSource({ source, root, commit }) {
  const trackedFiles = getTrackedFiles(root, commit)
  const themeSource = readTrackedFile(root, commit, 'config/themes.ts')
  const festivalPacks = readFestivalPacks(root, commit, trackedFiles)
  const legacyEventIds = extractObjectKeys(themeSource, 'FESTIVAL_DATES')
  if (festivalPacks.length === 0 && legacyEventIds.length > 0) {
    throw new Error('legacy FESTIVAL_DATES requires validated festival packs in data/festivals/')
  }
  const events = festivalPacks
  const seasons = festivalPacks.length > 0
    ? [...new Set(festivalPacks.filter((pack) => pack.category === 'season').map((pack) => pack.id))].sort()
    : extractObjectKeys(themeSource, 'SEASON_MONTHS')
  const themes = [...new Set([
    ...extractObjectKeys(themeSource, 'THEMES'),
    ...festivalPacks.map((pack) => pack?.themeKey).filter((themeKey) => typeof themeKey === 'string'),
  ])].sort()
  const locales = readLocales(root, commit, trackedFiles)

  return {
    source,
    commit,
    files: buildFiles(root, commit, trackedFiles),
    events,
    seasons,
    locales,
    themes,
  }
}

export function collectSnapshot({ productionRoot, productionCommit, openSourceRoot }) {
  const openSourceCommit = runGit(openSourceRoot, ['rev-parse', 'HEAD'])
  const production = collectSource({ source: 'production', root: productionRoot, commit: productionCommit })
  const openSource = collectSource({ source: 'openSource', root: openSourceRoot, commit: openSourceCommit })

  return {
    source: { production, openSource },
    production,
    openSource,
  }
}

function parseArguments(argumentsList) {
  const options = {}
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (!argument.startsWith('--')) continue
    options[argument.slice(2)] = argumentsList[index + 1]
    index += 1
  }
  return options
}

function writeJsonBatch(entries) {
  const files = entries.map(({ path, value }) => {
    const absolutePath = resolve(path)
    const hadOriginal = existsSync(absolutePath)
    return {
      absolutePath,
      backupPath: `${absolutePath}.${process.pid}.bak`,
      temporaryPath: `${absolutePath}.${process.pid}.tmp`,
      content: `${JSON.stringify(value, null, 2)}\n`,
      hadOriginal,
      originalContent: hadOriginal ? readFileSync(absolutePath) : null,
      installed: false,
    }
  })

  try {
    for (const file of files) {
      mkdirSync(dirname(file.absolutePath), { recursive: true })
      writeFileSync(file.temporaryPath, file.content)
      rmSync(file.backupPath, { force: true })
    }
    for (const file of files) {
      if (file.hadOriginal) renameSync(file.absolutePath, file.backupPath)
      renameSync(file.temporaryPath, file.absolutePath)
      file.installed = true
    }
    for (const file of files) rmSync(file.backupPath, { force: true })
  } catch (error) {
    for (const file of files) {
      if (file.installed && existsSync(file.absolutePath)) rmSync(file.absolutePath, { force: true })
      if (existsSync(file.backupPath)) renameSync(file.backupPath, file.absolutePath)
      else if (file.hadOriginal && file.originalContent !== null) writeFileSync(file.absolutePath, file.originalContent)
      rmSync(file.temporaryPath, { force: true })
    }
    throw error
  }
}

function main() {
  const options = parseArguments(process.argv.slice(2))
  const required = ['production-root', 'production-commit', 'opensource-root', 'production-output', 'opensource-output', 'allowlist']
  const missing = required.filter((key) => !options[key])
  if (missing.length > 0) {
    throw new Error(`必須引数がありません: ${missing.map((key) => `--${key}`).join(', ')}`)
  }

  const snapshot = collectSnapshot({
    productionRoot: resolve(options['production-root']),
    productionCommit: options['production-commit'],
    openSourceRoot: resolve(options['opensource-root']),
  })

  const allowedPaths = snapshot.production.files.included
    .filter(isIntegrationPath)
    .sort()

  writeJsonBatch([
    { path: options['production-output'], value: snapshot.production },
    { path: options['opensource-output'], value: snapshot.openSource },
    {
      path: options.allowlist,
      value: {
        version: 1,
        allowedPathScopes: ['data/festivals/', 'data/i18n/'],
        integrationPaths: allowedPaths,
        allowedPaths,
        excludedPaths: {
          environment: snapshot.openSource.files.excluded.filter((path) => /^\.env(?:\.|$)/.test(path)),
          supabase: snapshot.openSource.files.excluded.filter((path) => path === 'supabase' || path.startsWith('supabase/')),
          deployment: snapshot.openSource.files.excluded.filter((path) => /(?:^|\/)(?:deploy|deployment|vercel|netlify)(?:\/|\.|$)/i.test(path)),
          dirty: getDirtyFiles(resolve(options['opensource-root']))
            .filter((path) => !allowedPaths.includes(path)),
        },
      },
    },
  ])
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/collect-festival-snapshot.mjs')) {
  try {
    main()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exit(1)
  }
}
