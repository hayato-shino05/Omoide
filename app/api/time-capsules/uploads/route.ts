import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { createServiceClient, errorResponse, requireUser, TimeCapsuleError } from '@/lib/time-capsule/server'

const PHOTO_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const

const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024

function parseUploadRequest(value: unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TimeCapsuleError('invalid_upload', 400, '写真情報が無効です')
  }
  const { contentType, sizeBytes } = value as Record<string, unknown>
  if (typeof contentType !== 'string' || !(contentType in PHOTO_TYPES)) {
    throw new TimeCapsuleError('invalid_photo_type', 400, '対応していない画像形式です')
  }
  if (typeof sizeBytes !== 'number' || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_PHOTO_SIZE_BYTES) {
    throw new TimeCapsuleError('invalid_photo_size', 400, '写真サイズが無効です')
  }
  return { contentType: contentType as keyof typeof PHOTO_TYPES }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser(request)
    const { contentType } = parseUploadRequest(await request.json())
    const path = `${user.id}/${randomUUID()}.${PHOTO_TYPES[contentType]}`
    const { data, error } = await createServiceClient()
      .storage
      .from('time-capsules-private')
      .createSignedUploadUrl(path)
    if (error || !data) throw new TimeCapsuleError('upload_unavailable', 503, '写真アップロードを準備できません')

    return Response.json(
      { path, token: data.token },
      { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireUser(request)
    const body = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body) || typeof (body as Record<string, unknown>).path !== 'string') {
      throw new TimeCapsuleError('invalid_photo_path', 400, '写真パスが無効です')
    }
    const path = (body as Record<string, string>).path
    if (!path.startsWith(`${user.id}/`) || path.includes('..')) {
      throw new TimeCapsuleError('invalid_photo_path', 400, '写真パスが無効です')
    }
    const { error } = await createServiceClient().storage.from('time-capsules-private').remove([path])
    if (error) throw new TimeCapsuleError('cleanup_failed', 500, '写真を削除できません')
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
