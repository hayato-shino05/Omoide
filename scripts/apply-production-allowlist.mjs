import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, posix, resolve } from 'node:path'

const FORBIDDEN_PATH_RULES = [
  { test: (path) => /^\.env(?:\.|$)/.test(path), reason: '環境変数と秘密情報' },
  { test: (path) => path === 'supabase' || path.startsWith('supabase/'), reason: 'Supabase 設定とスキーマ' },
  { test: (path) => path === '.vercel' || path.startsWith('.vercel/') || /(?:^|\/)(?:deploy|deployment|vercel|netlify)(?:\/|\.|$)/i.test(path), reason: 'デプロイ設定または成果物' },
]

function parseArguments(args) {
  const options = {}
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--check' || argument === '--check-staged') {
      options[argument.slice(2)] = true
      continue
    }
    if (!argument.startsWith('--')) continue
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`引数の値がありません: ${argument}`)
    options[argument.slice(2)] = value
    index += 1
  }
  return options
}

function requireOptions(options) {
  const required = ['production-root', 'production-commit', 'allowlist', 'destination']
  const missing = required.filter((key) => !options[key])
  if (missing.length > 0) throw new Error(`必須引数がありません: ${missing.map((key) => `--${key}`).join(', ')}`)
}

function runGit(root, args, encoding = 'utf8') {
  return execFileSync('git', ['-C', root, ...args], { encoding })
}

function normalizeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value)) {
    throw new TypeError(`相対パスではありません: ${String(value)}`)
  }
  const normalized = value.replaceAll('\\', '/')
  if (normalized !== posix.normalize(normalized) || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`安全でない相対パスです: ${value}`)
  }
  return normalized
}

function flattenExcludedPaths(excludedPaths) {
  if (!excludedPaths || typeof excludedPaths !== 'object' || Array.isArray(excludedPaths)) return []
  return Object.values(excludedPaths).flatMap((paths) => Array.isArray(paths) ? paths : [])
}

export function readIntegrationPaths(allowlist) {
  if (!allowlist || typeof allowlist !== 'object' || Array.isArray(allowlist)) {
    throw new TypeError('allowlist は JSON オブジェクトで指定してください')
  }
  const paths = allowlist.integrationPaths ?? []
  if (!Array.isArray(paths) || paths.some((path) => typeof path !== 'string')) {
    throw new TypeError('allowlist.integrationPaths は文字列配列で指定してください')
  }

  const scopes = Array.isArray(allowlist.allowedPathScopes) ? allowlist.allowedPathScopes : []
  const allowedPaths = Array.isArray(allowlist.allowedPaths) ? allowlist.allowedPaths : []
  const excludedPaths = new Set(flattenExcludedPaths(allowlist.excludedPaths).map(normalizeRelativePath))
  const normalizedPaths = [...new Set(paths.map(normalizeRelativePath))].sort()

  for (const path of normalizedPaths) {
    if (FORBIDDEN_PATH_RULES.some(({ test }) => test(path)) || excludedPaths.has(path)) {
      throw new Error(`除外対象を integrationPaths に指定できません: ${path}`)
    }
    if (!scopes.some((scope) => typeof scope === 'string' && path.startsWith(scope))) {
      throw new Error(`許可スコープ外の integration path です: ${path}`)
    }
    if (!allowedPaths.includes(path)) {
      throw new Error(`allowedPaths にない integration path です: ${path}`)
    }
  }

  return normalizedPaths
}

function verifyCommit(root, commit) {
  try {
    return runGit(root, ['rev-parse', '--verify', `${commit}^{commit}`]).toString().trim()
  } catch {
    throw new Error(`Production の clean commit が見つかりません: ${commit}`)
  }
}

function readCommitFile(root, commit, relativePath) {
  try {
    return runGit(root, ['show', `${commit}:${relativePath}`], 'buffer')
  } catch {
    throw new Error(`Production commit にファイルがありません: ${relativePath}`)
  }
}

function writeAtomic(destination, content) {
  mkdirSync(dirname(destination), { recursive: true })
  const temporaryPath = `${destination}.${process.pid}.tmp`
  try {
    writeFileSync(temporaryPath, content)
    renameSync(temporaryPath, destination)
  } finally {
    rmSync(temporaryPath, { force: true })
  }
}

export function checkStagedFiles(destination) {
  const files = runGit(destination, ['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB'])
    .toString()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(normalizeRelativePath)
  const forbidden = files.filter((path) => FORBIDDEN_PATH_RULES.some(({ test }) => test(path)))
  if (forbidden.length > 0) {
    throw new Error(`staged に禁止対象があります: ${forbidden.join(', ')}`)
  }
  return files
}

export function applyProductionAllowlist({ productionRoot, productionCommit, allowlistPath, destination, check = false }) {
  const root = resolve(productionRoot)
  const targetRoot = resolve(destination)
  const allowlist = JSON.parse(readFileSync(resolve(allowlistPath), 'utf8'))
  const integrationPaths = readIntegrationPaths(allowlist)
  const resolvedCommit = verifyCommit(root, productionCommit)
  const files = integrationPaths.map((relativePath) => ({
    relativePath,
    source: `${resolvedCommit}:${relativePath}`,
    destination: resolve(targetRoot, relativePath),
  }))

  if (check) {
    for (const file of files) process.stdout.write(`${file.source} -> ${file.destination}\n`)
    process.stdout.write(`integrationPaths: ${files.length}\n`)
    return files
  }

  const contents = files.map((file) => ({
    ...file,
    content: readCommitFile(root, resolvedCommit, file.relativePath),
  }))
  for (const file of contents) writeAtomic(file.destination, file.content)
  process.stdout.write(`適用しました: ${contents.length} 件\n`)
  return contents
}

function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options['check-staged']) {
    if (!options.destination) throw new Error('必須引数がありません: --destination')
    const files = checkStagedFiles(resolve(options.destination))
    process.stdout.write(`staged: ${files.length} 件、禁止対象: 0 件\n`)
    return
  }
  requireOptions(options)
  applyProductionAllowlist({
    productionRoot: options['production-root'],
    productionCommit: options['production-commit'],
    allowlistPath: options.allowlist,
    destination: options.destination,
    check: Boolean(options.check),
  })
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/apply-production-allowlist.mjs')) main()
