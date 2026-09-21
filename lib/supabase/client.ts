import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase接続設定の取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabaseが有効に設定されているか判定
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co')
}

// Supabaseクライアントの遅延シングルトンインスタンス
let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // 環境変数が未設定の場合はフォールバック用のプレースホルダーでクライアントを生成し、クラッシュを防止
  const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co'
  const effectiveKey = supabaseAnonKey || 'placeholder-anon-key'

  if (!isSupabaseConfigured() && typeof window !== 'undefined') {
    console.warn('[Supabase] 環境変数が未設定のため、オフライン／フォールバックモードで動作します')
  }

  supabaseInstance = createClient(effectiveUrl, effectiveKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return supabaseInstance
}

// 後方互換性のためのエクスポート
export const supabase = {
  from: (table: string) => getSupabase().from(table),
  storage: {
    from: (bucket: string) => getSupabase().storage.from(bucket),
  },
}
