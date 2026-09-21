import { NextResponse } from 'next/server'
import { getServiceSupabase, isServerSupabaseConfigured } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const revalidate = 3600

const STATIC_QUIZ = {
  id: 'default-birthday-quiz',
  title: '誕生日クイズ',
  description: '登録された誕生日データからランダム生成されるクイズです',
  is_default: true,
}

export async function GET() {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json([STATIC_QUIZ], {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('birthday_quizzes')
    .select('id, title, description, celebrant_name, is_default')
    .order('created_at')

  if (error || !data || data.length === 0) {
    console.error('birthday_quizzesの取得エラー、フォールバックを使用:', error)
    return NextResponse.json([STATIC_QUIZ], {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
