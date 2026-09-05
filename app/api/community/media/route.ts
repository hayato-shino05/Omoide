import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/time-capsule/server'
import {
  getMediaKind,
  inspectMediaFile,
  MEDIA_EXTENSIONS,
  MAX_MULTIPART_UPLOAD_SIZE,
  normalizeMediaFile,
  validateCommunityMediaFile,
} from '@/lib/validations/upload'

function parseText(formData: FormData, key: string, maxLength: number): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

function parseOptionalText(formData: FormData, key: string, maxLength: number): string | null | undefined {
  const value = formData.get(key)
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized) return null
  return normalized.length <= maxLength ? normalized : undefined
}

function isUsableMediaRow(value: unknown): value is { id: number; object_path: string } {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && typeof value.id === 'number'
    && 'object_path' in value
    && typeof value.object_path === 'string'
}

function parseFile(formData: FormData): File | null {
  const value = formData.get('file')
  if (!value || typeof value !== 'object' || typeof (value as Blob).size !== 'number' || typeof (value as File).name !== 'string') return null
  if ((value as File).size === 0 && !(value as File).name) return null
  const file = normalizeMediaFile(value as File)
  const filename = file.name.trim()
  if (!filename || filename.length > 255 || /[\\/\p{Cc}]/u.test(filename)) return null
  return file
}

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'メディア内容が無効です' }, { status: 400 })
  }

  const file = parseFile(formData)
  const sender = parseText(formData, 'sender', 100)
  const birthdayPerson = parseOptionalText(formData, 'birthdayPerson', 100)
  const description = parseOptionalText(formData, 'description', 1000)
  if (!file || !sender || birthdayPerson === undefined || description === undefined) {
    return NextResponse.json({ error: 'メディア内容が無効です' }, { status: 400 })
  }

  const validation = validateCommunityMediaFile(file)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.valid ? 'サポートされていないファイル形式です' : validation.error }, { status: 400 })
  }
  if (file.size > MAX_MULTIPART_UPLOAD_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは4MB以下にしてください' }, { status: 400 })
  }

  // 宣言された MIME ではなく先頭バイトの実内容で種別を確定する
  const inspected = await inspectMediaFile(file)
  if (!inspected) {
    return NextResponse.json({ error: 'サポートされていないファイル形式です' }, { status: 400 })
  }
  // 実内容が別の許可形式だった場合（例: PNG と宣言して video/mp4 を送る）も、実内容の種別で保存先・メタデータを確定する
  const mediaKind = getMediaKind(inspected)
  if (!mediaKind) {
    return NextResponse.json({ error: 'サポートされていないファイル形式です' }, { status: 400 })
  }
  const extension = MEDIA_EXTENSIONS[inspected]
  const objectPath = `${mediaKind}s/${crypto.randomUUID()}.${extension}`
  try {
    const supabase = createServiceClient()
    const { error: uploadError } = await supabase.storage
      .from('community-media')
      .upload(objectPath, file, { contentType: inspected, upsert: false })
    if (uploadError) throw uploadError

    const { data, error: insertError } = await supabase
      .from('media_submissions')
      .insert({
        sender,
        object_path: objectPath,
        media_kind: mediaKind,
        mime_type: inspected,
        original_name: file.name.trim(),
        size_bytes: file.size,
        birthday_person: birthdayPerson ?? null,
        description: description ?? null,
      })
      .select()
      .single()

    if (insertError) {
      const { error: cleanupError } = await supabase.storage.from('community-media').remove([objectPath])
      if (cleanupError) {
        console.error('Community media cleanup failed', cleanupError.message)
      }
      throw insertError
    }
    if (!isUsableMediaRow(data)) {
      throw new Error('invalid media metadata')
    }

    const { data: urlData } = supabase.storage.from('community-media').getPublicUrl(objectPath)
    return NextResponse.json({ data: { ...data, media_url: urlData.publicUrl } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'メディアをアップロードできません' }, { status: 500 })
  }
}
