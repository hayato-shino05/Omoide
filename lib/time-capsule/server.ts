import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export const TIME_CAPSULE_SELECT =
  'id,owner_id,sender,recipient,message,photo_url,photo_object_path,unlock_date,created_at,invite_token_hash,invite_token_expires_at,invite_revoked_at'

export type CapsuleRow = {
  id: number
  owner_id: string | null
  sender: string
  recipient: string | null
  message: string
  photo_url: string | null
  photo_object_path: string | null
  unlock_date: string
  created_at: string
  invite_token_hash: string | null
  invite_token_expires_at: string | null
  invite_revoked_at: string | null
  opened_at?: string | null
}

export type CapsuleInput = {
  sender: string
  recipient: string | null
  message: string
  unlockDate: string
  photoObjectPath: string | null
}

export class TimeCapsuleError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

export function errorResponse(error: unknown): Response {
  const known = error instanceof TimeCapsuleError
  return Response.json(
    {
      error: {
        code: known ? error.code : 'internal_error',
        message: known ? error.message : 'Time Capsule操作に失敗しました',
      },
    },
    { status: known ? error.status : 500 }
  )
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey || !/^https?:\/\//.test(url)) {
    throw new TimeCapsuleError('server_configuration', 503, 'Time Capsuleは現在利用できません')
  }
  return { url, anonKey }
}

function getServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new TimeCapsuleError('invite_access_unavailable', 503, '招待トークンによるアクセスは現在利用できません')
  }
  return key
}

export function createAuthenticatedClient(accessToken: string): SupabaseClient {
  const { url, anonKey } = getConfig()
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

export function createServiceClient(): SupabaseClient {
  const { url } = getConfig()
  return createClient(url, getServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function requireUser(request: Request): Promise<{ client: SupabaseClient; user: User }> {
  const header = request.headers.get('authorization')
  const match = header?.match(/^Bearer\s+([^\s]+)$/i)
  if (!match) throw new TimeCapsuleError('auth_required', 401, '認証が必要です')

  const client = createAuthenticatedClient(match[1])
  const { data, error } = await client.auth.getUser(match[1])
  if (error || !data.user) throw new TimeCapsuleError('auth_required', 401, '認証が必要です')
  return { client, user: data.user }
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function createAccessCode(ownerId?: string, idempotencyKey?: string, attempt = 0): string {
  if (ownerId && idempotencyKey) {
    const digest = createHmac('sha256', getServiceKey())
      .update(`time-capsule-access:v1|${ownerId}|${idempotencyKey}|${attempt}`, 'utf8')
      .digest('hex')
    return String((Number.parseInt(digest.slice(0, 12), 16) % 900000) + 100000)
  }
  return String(randomInt(100000, 1000000))
}

export function parseAccessCode(value: string | null): string {
  const normalized = value?.replace(/[ -]/g, '') ?? ''
  if (!/^\d{6}$/.test(normalized)) {
    throw new TimeCapsuleError('invalid_access_code', 401, 'アクセスコードが無効です')
  }
  return normalized
}

export function hashAccessCode(code: string): string {
  return createHmac('sha256', getServiceKey()).update(`time-capsule-access:v1|${code}`, 'utf8').digest('hex')
}

export function hashAccessAttemptBucket(identity: string): string {
  return createHash('sha256').update(`time-capsule-access-bucket:v1|${identity}`, 'utf8').digest('hex')
}

export function getAccessAttemptBucketFingerprint(request: Request): string {
  // X-Forwarded-For は偽装可能なため、信頼できる送信元情報として扱わない。
  const identity = request.headers.get('user-agent')?.trim() || 'unknown-client'
  return hashAccessAttemptBucket(identity)
}

export function createInviteToken(ownerId: string, idempotencyKey: string): string {
  return createHmac('sha256', getServiceKey())
    .update(`time-capsule-invite:v1|${ownerId}|${idempotencyKey}`, 'utf8')
    .digest('base64url')
}

export function createCommunityMediaUploadToken(payload: string, expiresAt: number): string {
  const message = `community-media-upload:v1|${expiresAt}|${payload}`
  return `${expiresAt}.${createHmac('sha256', getServiceKey()).update(message, 'utf8').digest('base64url')}`
}

export function verifyCommunityMediaUploadToken(payload: string, token: string): boolean {
  const [expiry, signature] = token.split('.', 2)
  const expiresAt = Number(expiry)
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now() || !signature) return false
  const message = `community-media-upload:v1|${expiresAt}|${payload}`
  const expected = Buffer.from(createHmac('sha256', getServiceKey()).update(message, 'utf8').digest('base64url'))
  const actual = Buffer.from(signature)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function parseCapsuleInput(value: unknown, ownerId: string): CapsuleInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TimeCapsuleError('invalid_input', 400, '入力内容が無効です')
  }
  const body = value as Record<string, unknown>
  const sender = typeof body.sender === 'string' ? body.sender.trim() : ''
  const recipient = typeof body.recipient === 'string' && body.recipient.trim() ? body.recipient.trim() : null
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const unlockDate = typeof body.unlockDate === 'string' ? body.unlockDate : ''
  const photoObjectPath = typeof body.photoObjectPath === 'string' && body.photoObjectPath.trim() ? body.photoObjectPath.trim() : null

  if (!sender || sender.length > 80 || (recipient && recipient.length > 80) || !message || message.length > 2000) {
    throw new TimeCapsuleError('invalid_input', 400, '入力内容が無効です')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(unlockDate) || unlockDate < todayUtc()) {
    throw new TimeCapsuleError('invalid_unlock_date', 400, '解禁日は今日以降の日付を指定してください')
  }
  if (photoObjectPath && (!photoObjectPath.startsWith(`${ownerId}/`) || photoObjectPath.includes('..') || photoObjectPath.length > 500)) {
    throw new TimeCapsuleError('invalid_photo_path', 400, '写真パスが無効です')
  }

  return { sender, recipient, message, unlockDate, photoObjectPath }
}

export function parseIdempotencyKey(request: Request): string {
  const value = request.headers.get('idempotency-key')?.trim() ?? ''
  if (!value || value.length > 128 || !/^[A-Za-z0-9._~-]+$/.test(value)) {
    throw new TimeCapsuleError('invalid_idempotency_key', 400, 'Idempotency-Keyが無効です')
  }
  return value
}

export function parseId(id: string): number {
  if (!/^\d+$/.test(id)) throw new TimeCapsuleError('invalid_id', 400, 'Time Capsule IDが無効です')
  const value = Number(id)
  if (!Number.isSafeInteger(value)) throw new TimeCapsuleError('invalid_id', 400, 'Time Capsule IDが無効です')
  return value
}

export function parseInviteToken(value: string | null): string {
  if (!value || value.length < 32 || value.length > 128 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new TimeCapsuleError('invalid_invite_token', 401, '招待トークンが無効です')
  }
  return value
}

export async function serializeCapsule(client: SupabaseClient, row: CapsuleRow): Promise<Record<string, unknown>> {
  const unlocked = row.unlock_date <= todayUtc()
  const result: Record<string, unknown> = {
    id: row.id,
    sender: row.sender,
    recipient: row.recipient,
    unlockDate: row.unlock_date,
    createdAt: row.created_at,
    isUnlocked: unlocked,
  }
  if (!unlocked) return result

  result.message = row.message
  if (row.photo_object_path) {
    const { data } = await client.storage.from('time-capsules-private').createSignedUrl(row.photo_object_path, 300)
    if (data?.signedUrl) result.photoUrl = data.signedUrl
  }
  return result
}

export async function recordFirstOpen(
  client: SupabaseClient,
  row: CapsuleRow,
  openedAt = new Date().toISOString()
): Promise<boolean> {
  if (row.invite_revoked_at !== null || row.unlock_date > openedAt.slice(0, 10)) return false

  const { data, error } = await client
    .from('time_capsules')
    .update({ opened_at: openedAt })
    .eq('id', row.id)
    .is('opened_at', null)
    .select('id')
    .maybeSingle()

  if (error) throw new TimeCapsuleError('tracking_failed', 500, '開封記録を保存できません')
  return data !== null
}

export async function findByInviteToken(token: string, id?: number) {
  const client = createServiceClient()
  let query = client
    .from('time_capsules')
    .select(TIME_CAPSULE_SELECT)
    .eq('invite_token_hash', hashInviteToken(token))
    .is('invite_revoked_at', null)
    .gt('invite_token_expires_at', new Date().toISOString())
  if (id !== undefined) query = query.eq('id', id)
  const { data, error } = await query.maybeSingle()
  if (error || !data) throw new TimeCapsuleError('invite_not_found', 404, 'Time Capsuleが見つかりません')
  return { client, row: data as unknown as CapsuleRow }
}

export async function findByAccessCode(code: string, attemptBucketFingerprint: string) {
  const client = createServiceClient()
  const access = await client.rpc('consume_time_capsule_access_code', {
    input_code_hash: hashAccessCode(code),
    input_attempt_bucket: attemptBucketFingerprint,
  })
  const accessRow = Array.isArray(access.data) ? access.data[0] : null
  if (access.error || !accessRow || typeof accessRow.capsule_id !== 'number') {
    throw new TimeCapsuleError('access_not_found', 404, 'Time Capsuleが見つかりません')
  }

  const capsule = await client
    .from('time_capsules')
    .select(TIME_CAPSULE_SELECT)
    .eq('id', accessRow.capsule_id)
    .is('invite_revoked_at', null)
    .maybeSingle()
  if (capsule.error || !capsule.data) {
    throw new TimeCapsuleError('access_not_found', 404, 'Time Capsuleが見つかりません')
  }
  return { client, row: capsule.data as unknown as CapsuleRow }
}
