import { NextRequest } from 'next/server'
import {
  TIME_CAPSULE_SELECT,
  TimeCapsuleError,
  createAccessCode,
  createInviteToken,
  errorResponse,
  hashAccessCode,
  hashInviteToken,
  parseCapsuleInput,
  parseIdempotencyKey,
  requireUser,
  serializeCapsule,
  createServiceClient,
} from '@/lib/time-capsule/server'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireUser(request)
    const client = createServiceClient()
    const { data, error } = await client
      .from('time_capsules')
      .select(TIME_CAPSULE_SELECT)
      .eq('owner_id', user.id)
      .order('unlock_date', { ascending: true })
    if (error) throw new TimeCapsuleError('read_failed', 500, 'Time Capsuleを読み込めません')

    const capsules = await Promise.all(
      (data as unknown[] | null | undefined ?? []).map((row) => serializeCapsule(client, row as Parameters<typeof serializeCapsule>[1]))
    )
    return Response.json({ data: capsules, count: capsules.length })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser(request)
    const client = createServiceClient()
    const idempotencyKey = parseIdempotencyKey(request)
    const input = parseCapsuleInput(await request.json(), user.id)
    const inviteToken = createInviteToken(user.id, idempotencyKey)
    const inviteTokenHash = hashInviteToken(inviteToken)
    const inviteTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const accessCodes = Array.from({ length: 5 }, (_, attempt) => createAccessCode(user.id, idempotencyKey, attempt))

    const { data: result, error } = await client.rpc('create_time_capsule_with_access_code', {
      input_owner_id: user.id,
      input_idempotency_key: idempotencyKey,
      input_sender: input.sender,
      input_recipient: input.recipient,
      input_message: input.message,
      input_unlock_date: input.unlockDate,
      input_photo_object_path: input.photoObjectPath,
      input_invite_token_hash: inviteTokenHash,
      input_invite_token_expires_at: inviteTokenExpiresAt,
      input_access_code_hashes: accessCodes.map(hashAccessCode),
    })

    if (error) {
      if (error.message?.includes('idempotency_replay_unavailable')) {
        throw new TimeCapsuleError('idempotency_replay_unavailable', 409, 'Time Capsuleの再送結果を復元できません')
      }
      throw new TimeCapsuleError('write_failed', 500, 'Time Capsuleを作成できません')
    }

    const rpcRow = Array.isArray(result) ? result[0] : null
    const capsuleId =
      rpcRow && typeof rpcRow.capsule_id === 'number'
        ? rpcRow.capsule_id
        : rpcRow && typeof rpcRow.capsule_id === 'string' && /^\d+$/.test(rpcRow.capsule_id)
          ? Number(rpcRow.capsule_id)
          : null
    if (
      !rpcRow ||
      capsuleId === null ||
      !Number.isSafeInteger(capsuleId) ||
      capsuleId < 1 ||
      !Number.isInteger(rpcRow.derivation_attempt) ||
      (rpcRow.idempotent !== true && rpcRow.idempotent !== false)
    ) {
      throw new TimeCapsuleError('write_failed', 500, 'Time Capsuleを作成できません')
    }

    const existing = await client
      .from('time_capsules')
      .select(TIME_CAPSULE_SELECT)
      .eq('id', capsuleId)
      .maybeSingle()
    if (existing.error || !existing.data) throw new TimeCapsuleError('write_failed', 500, 'Time Capsuleを作成できません')

    const accessCode = accessCodes[rpcRow.derivation_attempt]
    if (!accessCode) throw new TimeCapsuleError('write_failed', 500, 'Time Capsuleを作成できません')
    const capsule = await serializeCapsule(client, existing.data)

    if (rpcRow.idempotent) {
      const inviteTokenActive =
        existing.data.invite_revoked_at === null &&
        typeof existing.data.invite_token_expires_at === 'string' &&
        existing.data.invite_token_expires_at > new Date().toISOString()
      return Response.json({
        data: capsule,
        ...(inviteTokenActive
          ? { inviteToken, inviteTokenExpiresAt: existing.data.invite_token_expires_at }
          : {}),
        ...(existing.data.invite_revoked_at === null ? { accessCode } : {}),
        idempotent: true,
      })
    }

    return Response.json(
      { data: capsule, inviteToken, inviteTokenExpiresAt, accessCode, idempotent: false },
      { status: 201 }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
