import { NextRequest, NextResponse } from 'next/server'
import { createCommunityMediaUploadToken, createServiceClient } from '@/lib/time-capsule/server'
import { getMediaKind, isCommunityMediaMimeType, MEDIA_EXTENSIONS, MAX_COMMUNITY_MEDIA_SIZE } from '@/lib/validations/upload'

function parseText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

function parseOptionalText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized ? normalized.length <= maxLength ? normalized : undefined : null
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'メディア内容が無効です' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'メディア内容が無効です' }, { status: 400 })
  const input = body as Record<string, unknown>
  const sender = parseText(input.sender, 100)
  const filename = parseText(input.filename, 255)
  const mimeType = parseText(input.mimeType, 100)?.split(';', 1)[0].trim().toLowerCase()
  const sizeBytes = input.sizeBytes
  const birthdayPerson = parseOptionalText(input.birthdayPerson, 100)
  const description = parseOptionalText(input.description, 1000)
  if (!sender || !filename || !mimeType || typeof sizeBytes !== 'number' || !Number.isSafeInteger(sizeBytes) || birthdayPerson === undefined || description === undefined) {
    return NextResponse.json({ error: 'メディア内容が無効です' }, { status: 400 })
  }
  if (/[\\/\p{Cc}]/u.test(filename)) return NextResponse.json({ error: 'ファイル名が無効です' }, { status: 400 })
  if (sizeBytes <= 0 || sizeBytes > MAX_COMMUNITY_MEDIA_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは50MB以下にしてください' }, { status: 400 })
  }
  const mediaKind = getMediaKind(mimeType)
  if (!isCommunityMediaMimeType(mimeType) || !mediaKind) {
    return NextResponse.json({ error: 'サポートされていないファイル形式です' }, { status: 400 })
  }

  const objectPath = `${mediaKind}s/${crypto.randomUUID()}.${MEDIA_EXTENSIONS[mimeType as keyof typeof MEDIA_EXTENSIONS] ?? 'bin'}`
  try {
    const { data, error } = await createServiceClient().storage.from('community-media').createSignedUploadUrl(objectPath, { upsert: false })
    if (error || !data?.token) throw error ?? new Error('signed upload authorization unavailable')
    const tokenPayload = JSON.stringify({ path: objectPath, filename, mimeType, sizeBytes, sender, birthdayPerson, description })
    const uploadToken = createCommunityMediaUploadToken(tokenPayload, Date.now() + 2 * 60 * 60 * 1000)
    return NextResponse.json({ data: { path: objectPath, token: data.token, uploadToken } })
  } catch {
    return NextResponse.json({ error: 'メディアをアップロードできません' }, { status: 500 })
  }
}
