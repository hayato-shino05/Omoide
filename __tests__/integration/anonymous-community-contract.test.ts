import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const hasStatement = (statements: string[], pattern: RegExp): boolean =>
  statements.some((statement) => pattern.test(statement))

const grantPattern = (privilege: string, table: string): RegExp =>
  new RegExp(`^grant\\s+${privilege}\\s+on\\s+public\\.[^;]*\\b${table}\\b[^;]*\\bto\\s+anon\\s*$`, 'is')

const policyPattern = (table: string, operation: string, clause?: string): RegExp =>
  new RegExp(
    `^create\\s+policy\\s+[^;]+\\s+on\\s+public\\.${table}\\s+for\\s+${operation}\\s+to\\s+anon\\b${clause ? `\\s+${clause}` : ''}\\s*$`,
    'is',
  )

describe('anonymous community contract', () => {
  it('keeps the public tables read/create-only for anon', () => {
    const migration = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20260812163000_reset_and_create_anonymous_community.sql'), 'utf8')
    const statements = migration.split(';').map((statement) => statement.trim()).filter(Boolean)
    const tables = ['birthdays', 'messages', 'media_submissions', 'virtual_gifts', 'chat_messages', 'bulletin_posts', 'post_replies']
    const insertTables = ['messages', 'media_submissions', 'virtual_gifts', 'chat_messages', 'bulletin_posts', 'post_replies']

    for (const table of tables) {
      expect(migration).toContain(`create table public.${table}`)
      expect(migration).toContain(`alter table public.${table} enable row level security`)
      expect(hasStatement(statements, grantPattern('select', table))).toBe(true)
      expect(hasStatement(statements, policyPattern(table, 'select', 'using\\s*\\(true\\)'))).toBe(true)
      expect(hasStatement(statements, grantPattern('(?:update|delete)', table))).toBe(false)
      expect(hasStatement(statements, policyPattern(table, '(?:update|delete)'))).toBe(false)
    }

    for (const table of insertTables) {
      expect(hasStatement(statements, grantPattern('insert', table))).toBe(true)
      expect(hasStatement(statements, policyPattern(table, 'insert', 'with\\s+check\\s*\\(true\\)'))).toBe(true)
    }

    expect(hasStatement(statements, grantPattern('insert', 'birthdays'))).toBe(false)
    expect(hasStatement(statements, policyPattern('birthdays', 'insert'))).toBe(false)
  })

  it('exposes likes through an atomic, narrowly granted RPC', () => {
    const migration = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20260817000000_add_bulletin_post_likes.sql'), 'utf8')

    expect(migration).toContain('add column if not exists likes integer not null default 0')
    expect(migration).toContain('constraint bulletin_posts_likes_nonnegative check (likes >= 0)')
    expect(migration).toMatch(/update public\.bulletin_posts[\s\S]*set likes = public\.bulletin_posts\.likes \+ 1[\s\S]*returning public\.bulletin_posts\.likes into new_likes/)
    expect(migration).toContain('security definer')
    expect(migration).toContain("set search_path = ''")
    expect(migration).toContain('revoke execute on function public.increment_bulletin_post_likes(bigint) from public, anon, authenticated, service_role;')
    expect(migration).toContain('grant execute on function public.increment_bulletin_post_likes(bigint) to anon;')
  })
})
