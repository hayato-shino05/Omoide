'use client'

import { useQuery } from '@tanstack/react-query'
import { OMIKUJI_FORTUNES, type OmikujiFortune } from '@/data/omikujiData'

/**
 * おみくじデータ取得用カスタムフックの戻り値の型定義
 */
export interface UseDailyFortunesResult {
  fortunes: OmikujiFortune[]
  isLoading: boolean
  isFallback: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

/**
 * データベースおよびAPIからおみくじ一覧を非同期取得するフック
 * ネットワーク切断時やAPIエラー時もOMIKUJI_FORTUNESへ即座に100%フォールバック
 */
export function useDailyFortunes(): UseDailyFortunesResult {
  const query = useQuery<OmikujiFortune[], Error>({
    queryKey: ['daily-fortunes'],
    queryFn: async (): Promise<OmikujiFortune[]> => {
      const res = await fetch('/api/omikuji/fortunes', {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`)
      }

      const data = (await res.json()) as { fortunes?: OmikujiFortune[] } | OmikujiFortune[]
      const list = Array.isArray(data) ? data : data?.fortunes

      if (Array.isArray(list) && list.length > 0) {
        return list
      }

      throw new Error('Empty fortunes list')
    },
    staleTime: 1000 * 60 * 30, // 30分間キャッシュ
    refetchOnWindowFocus: false,
    retry: false,
  })

  const isFallback = query.isError || !query.data

  return {
    fortunes: query.data ?? OMIKUJI_FORTUNES,
    isLoading: query.isLoading,
    isFallback,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  }
}
