import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let serviceClientInstance: SupabaseClient | null = null

/**
 * サーバーサイド専用の特権・保護されたSupabaseクライアントを取得
 * SERVICE_ROLE_KEYが利用可能な場合はそれを優先し、未設定時はANON_KEYをフォールバックとして使用
 */
export function getServiceSupabase(): SupabaseClient {
  if (serviceClientInstance) {
    return serviceClientInstance
  }

  const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co'
  const effectiveKey = supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-service-key'

  serviceClientInstance = createClient(effectiveUrl, effectiveKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return serviceClientInstance
}
