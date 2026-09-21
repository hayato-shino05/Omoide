'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { VirtualGift } from '@/types'

export const GIFT_CATALOG = [
  { emoji: '🎂', nameKey: 'giftBirthdayCake' as const },
  { emoji: '🎁', nameKey: 'giftGiftBox' as const },
  { emoji: '💐', nameKey: 'giftBouquet' as const },
  { emoji: '🌹', nameKey: 'giftRose' as const },
  { emoji: '🧸', nameKey: 'giftTeddyBear' as const },
  { emoji: '💝', nameKey: 'giftHeart' as const },
  { emoji: '🎈', nameKey: 'giftBalloon' as const },
  { emoji: '🍫', nameKey: 'giftChocolate' as const },
  { emoji: '🎀', nameKey: 'giftRibbon' as const },
  { emoji: '⭐', nameKey: 'giftStar' as const },
  { emoji: '🌸', nameKey: 'giftSakura' as const },
  { emoji: '🎵', nameKey: 'giftMusic' as const },
]

interface UseGiftsReturn {
  gifts: VirtualGift[]
  isLoading: boolean
  error: string | null
  sendGift: (sender: string, giftEmoji: string, giftName: string, birthdayPerson?: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useGifts(): UseGiftsReturn {
  const { t } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [gifts, setGifts] = useState<VirtualGift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGifts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('virtual_gifts')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setGifts((data || []) as VirtualGift[])
    } catch (err) {
      setError(err instanceof Error ? err.message : tRef.current('giftsLoadError'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGifts()
  }, [fetchGifts])

  const sendGift = useCallback(
    async (sender: string, giftEmoji: string, giftName: string, birthdayPerson?: string): Promise<boolean> => {
      try {
        const { error: insertError } = await supabase.from('virtual_gifts').insert({
          sender,
          gift_emoji: giftEmoji,
          gift_name: giftName,
          birthday_person: birthdayPerson,
        })

        if (insertError) throw insertError
        await fetchGifts()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : tRef.current('giftSendError'))
        return false
      }
    },
    [fetchGifts]
  )

  return {
    gifts,
    isLoading,
    error,
    sendGift,
    refetch: fetchGifts,
  }
}
