import { NextRequest, NextResponse } from 'next/server'
import { createCommunitySubmission, type CommunitySubmissionInput } from '@/lib/community/server'
import { parseMusicTrackReference, toMusicTrackReference } from '@/lib/music/reference'
import { validateCommunityMediaFile } from '@/lib/validations/upload'

function normalizeMimeType(value: string): string {
  return value.split(';', 1)[0].trim().toLowerCase()
}

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

function parseInput(formData: FormData): CommunitySubmissionInput | null {
  const kind = formData.get('kind')
  if (kind !== 'message' && kind !== 'post') return null
  const sender = parseText(formData, 'sender', 100)
  const content = parseText(formData, 'content', 1000)
  if (!sender || !content) return null

  const birthdayPerson = parseOptionalText(formData, 'birthdayPerson', 100)
  const description = parseOptionalText(formData, 'description', 1000)
  const musicTrackValue = formData.get('musicTrackId')
  const musicReference = musicTrackValue === null || musicTrackValue === ''
    ? null
    : parseMusicTrackReference(musicTrackValue)
  if (birthdayPerson === undefined || description === undefined || (musicReference === null && musicTrackValue !== null && musicTrackValue !== '')) return null
  const musicTrackId = musicReference ? toMusicTrackReference(musicReference) : null
  if (musicTrackId && kind !== 'message') return null
  const fileValue = formData.get('media')
  if (fileValue !== null && (typeof fileValue !== 'object' || typeof (fileValue as Blob).size !== 'number' || typeof (fileValue as File).name !== 'string')) return null

  let file = fileValue as File | null
  if (file && file.size === 0 && !file.name) file = null
  if (!file && description !== null) return null
  if (file) {
    const fileName = file.name.trim()
    if (!fileName || fileName.length > 255 || /[\\/\p{Cc}]/u.test(fileName)) return null
    const mimeType = normalizeMimeType(file.type)
    file = new File([file], file.name, { type: mimeType, lastModified: file.lastModified })
    if (!validateCommunityMediaFile(file).valid) return null
  }

  return { kind, sender, content, birthdayPerson, description, file, musicTrackId }
}

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: '投稿内容が無効です' }, { status: 400 })
  }

  try {
    const input = parseInput(formData)
    if (!input) return NextResponse.json({ error: '投稿内容が無効です' }, { status: 400 })

    const data = await createCommunitySubmission(input)
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '投稿を送信できません' }, { status: 500 })
  }
}
