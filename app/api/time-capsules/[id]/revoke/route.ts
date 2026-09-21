import { NextRequest } from 'next/server'
import {
  TimeCapsuleError,
  errorResponse,
  parseId,
  requireUser,
  createServiceClient,
} from '@/lib/time-capsule/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireUser(request)
    const client = createServiceClient()
    const id = parseId((await params).id)
    const { data, error } = await client
      .from('time_capsules')
      .update({ invite_revoked_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', user.id)
      .is('invite_revoked_at', null)
      .select('id')
      .maybeSingle()
    if (error) throw new TimeCapsuleError('revoke_failed', 500, '招待トークンを無効化できません')
    if (!data) throw new TimeCapsuleError('not_found', 404, 'Time Capsuleが見つかりません')
    return Response.json({ revoked: true })
  } catch (error) {
    return errorResponse(error)
  }
}
