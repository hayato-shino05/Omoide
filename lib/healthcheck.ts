'use client'

export interface HealthcheckResult {
  ok: boolean
  status: number | null
  detail: string
}

/**
 * Supabase REST エンドポイントへの読み取り専用ヘルスチェック。
 * 書き込みは行わず、タイムアウト付きで到達性と認証のみ確認する。
 */
export async function checkSupabaseReadonly(
  timeoutMs: number = 5000,
  fetchImpl: typeof fetch = fetch,
): Promise<HealthcheckResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return { ok: false, status: null, detail: 'supabase-not-configured' }
    }

    const response = await fetchImpl(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    return { ok: response.ok, status: response.status, detail: response.ok ? 'reachable' : 'unhealthy' }
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError'
    return { ok: false, status: null, detail: aborted ? 'timeout' : 'network-error' }
  } finally {
    clearTimeout(timer)
  }
}
