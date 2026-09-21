import { NextRequest } from 'next/server'
import {
  TimeCapsuleError,
  errorResponse,
  findByInviteToken,
  parseId,
  parseInviteToken,
  recordFirstOpen,
  serializeCapsule,
} from '@/lib/time-capsule/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseId((await params).id)
    const body: unknown = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new TimeCapsuleError('invalid_input', 400, '入力内容が無効です')
    }
    const token = (body as Record<string, unknown>).inviteToken
    if (typeof token !== 'string') {
      throw new TimeCapsuleError('invalid_invite_token', 401, '招待トークンが無効です')
    }
    const { client, row } = await findByInviteToken(parseInviteToken(token), id)
    const data = await serializeCapsule(client, row)
    if (data.isUnlocked === true) {
      try {
        await recordFirstOpen(client, row)
      } catch (error) {
        console.warn('[TimeCapsule] first-open tracking failed', {
          error: error instanceof Error ? error.name : 'unknown_error',
        })
      }
    }
    return Response.json(
      { data },
      { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
