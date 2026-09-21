import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const { error } = await getSupabase()
      .from('media_submissions')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        { error: 'タグを読み込めません' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { tags: [], tagCounts: [], total: 0 },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    )
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
