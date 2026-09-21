#!/usr/bin/env node
/**
 * Local mock for the Supabase read-only PostgreSQL attestation step
 * defined in .github/workflows/supabase-healthcheck.yml.
 *
 * The CI workflow invokes `psql` with a CTE-based query that returns
 * a single boolean `t` only when the connected role satisfies the
 * production read-only contract. This script reproduces the same
 * boolean logic in-process so the contract can be verified without a
 * live Supabase instance, real credentials, or extra dependencies.
 *
 * Usage:
 *   node scripts/local-healthcheck-mock.mjs --mock-credential=readonly-mock
 *   node scripts/local-healthcheck-mock.mjs --mock-credential=invalid
 *   node scripts/local-healthcheck-mock.mjs --mock-credential=readonly-mock --socket-timeout=1
 *
 * Exit code 0 means the read-only attestation succeeded; non-zero
 * reproduces the failure paths that the CI workflow checks.
 */

import { performance } from 'node:perf_hooks'
import process from 'node:process'

const DEFAULT_SOCKET_TIMEOUT_MS = 15_000
// Approximate the latency of a real psql attestation round-trip so a
// pathological --socket-timeout=1 can actually exercise the failure path.
const MOCK_LATENCY_MS = 50

function parseArguments(args) {
  const options = {}
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (!argument.startsWith('--')) continue
    const stripped = argument.slice(2)
    const equalsIndex = stripped.indexOf('=')
    if (equalsIndex >= 0) {
      const key = stripped.slice(0, equalsIndex)
      const value = stripped.slice(equalsIndex + 1)
      options[key] = value
      continue
    }
    const next = args[index + 1]
    if (next === undefined || next.startsWith('--')) {
      options[stripped] = true
      continue
    }
    options[stripped] = next
    index += 1
  }
  return options
}

const MOCK_REGISTRY = {
  'readonly-mock': {
    roleNameMatches: true,
    identityMatches: true,
    rolcanlogin: true,
    noSuperuser: true,
    noCreaterole: true,
    noCreatedb: true,
    noReplication: true,
    noBypassrls: true,
    noWritePrivileges: true,
    noSequenceWritePrivileges: true,
    noCreatePrivileges: true,
    noSecurityDefinerExecute: true,
    noAssumableWritePrivileges: true,
  },
  'invalid': {
    roleNameMatches: false,
    identityMatches: false,
    rolcanlogin: true,
    noSuperuser: true,
    noCreaterole: true,
    noCreatedb: true,
    noReplication: true,
    noBypassrls: true,
    noWritePrivileges: false,
    noSequenceWritePrivileges: true,
    noCreatePrivileges: true,
    noSecurityDefinerExecute: true,
    noAssumableWritePrivileges: false,
  },
}

function resolveMockRole(credential) {
  if (typeof credential !== 'string' || credential.length === 0) {
    return null
  }
  return MOCK_REGISTRY[credential] ?? null
}

function evaluateReadonlyAttestation(role) {
  const {
    roleNameMatches,
    identityMatches,
    rolcanlogin,
    noSuperuser,
    noCreaterole,
    noCreatedb,
    noReplication,
    noBypassrls,
    noWritePrivileges,
    noSequenceWritePrivileges,
    noCreatePrivileges,
    noSecurityDefinerExecute,
    noAssumableWritePrivileges,
  } = role
  return Boolean(
    roleNameMatches
      && identityMatches
      && rolcanlogin
      && noSuperuser
      && noCreaterole
      && noCreatedb
      && noReplication
      && noBypassrls
      && noWritePrivileges
      && noSequenceWritePrivileges
      && noCreatePrivileges
      && noSecurityDefinerExecute
      && noAssumableWritePrivileges,
  )
}

async function runWithTimeout(task, timeoutMs) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`mock attestation timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })
  try {
    return await Promise.race([task(), timeout])
  } finally {
    clearTimeout(timer)
  }
}

function emitProgress(stage, detail) {
  process.stdout.write(`[local-healthcheck-mock] ${stage}: ${detail}\n`)
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const credential = typeof options['mock-credential'] === 'string' ? options['mock-credential'] : ''
  const socketTimeoutRaw = options['socket-timeout']
  const socketTimeoutMs = Number.parseInt(
    typeof socketTimeoutRaw === 'string' ? socketTimeoutRaw : `${DEFAULT_SOCKET_TIMEOUT_MS}`,
    10,
  )
  if (!Number.isFinite(socketTimeoutMs) || socketTimeoutMs <= 0) {
    process.stderr.write('--socket-timeout must be a positive integer (milliseconds)\n')
    process.exit(2)
  }

  emitProgress('config', `credential=${credential || '(none)'} socket-timeout=${socketTimeoutMs}ms`)

  if (credential.length === 0) {
    process.stderr.write('--mock-credential is required\n')
    process.exit(2)
  }

  const role = resolveMockRole(credential)
  if (!role) {
    process.stderr.write(`unknown mock credential: ${credential}\n`)
    process.exit(1)
  }

  const startedAt = performance.now()
  try {
    await runWithTimeout(async () => {
      await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
      const passes = evaluateReadonlyAttestation(role)
      if (!passes) {
        throw new Error('PostgreSQL read-only identity attestation failed')
      }
    }, socketTimeoutMs)
  } catch (error) {
    const elapsed = Math.round(performance.now() - startedAt)
    process.stderr.write(`${error.message} (elapsed=${elapsed}ms)\n`)
    process.exit(1)
  }

  const elapsed = Math.round(performance.now() - startedAt)
  emitProgress('result', `t (elapsed=${elapsed}ms)`)
  process.exit(0)
}

main().catch((error) => {
  process.stderr.write(`unexpected error: ${error?.message ?? error}\n`)
  process.exit(1)
})
