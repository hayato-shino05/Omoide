import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

const MAX_MEDIA_LIMIT = 100
const DEFAULT_MEDIA_LIMIT = 20
const MAX_MEDIA_OFFSET = 1_000_000

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const tag = searchParams.get('tag')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const search = searchParams.get('search')

    if (tag) {
      return NextResponse.json({ error: 'タグ検索はサポートされていません' }, { status: 400 })
    }

    let query = supabase
      .from('media_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('media_kind', type)
    }

    if (search) {
      query = query.or(`original_name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const requestedLimit = limit ? Number(limit) : DEFAULT_MEDIA_LIMIT
    const validLimit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_MEDIA_LIMIT)
      : DEFAULT_MEDIA_LIMIT
    query = query.limit(validLimit)

    const requestedOffset = offset ? Number(offset) : 0
    const validOffset = Number.isSafeInteger(requestedOffset) && requestedOffset >= 0
      ? Math.min(requestedOffset, MAX_MEDIA_OFFSET)
      : 0
    if (validOffset > 0) {
      query = query.range(validOffset, validOffset + validLimit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: 'メディアを読み込めません' },
        { status: 500 }
      )
    }

    const stats = {
      total: count || 0,
      images: data?.filter(media => media.media_kind === 'image').length || 0,
      videos: data?.filter(media => media.media_kind === 'video').length || 0,
    }

    return NextResponse.json({ data, count, stats })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
