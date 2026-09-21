'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export interface AudioMessage {
  id: number
  sender: string
  audio_url: string
  duration: number
  birthday_person?: string
  created_at: string
}

interface AudioSubmission {
  id: number
  sender: string
  object_path: string
  duration_seconds: number | null
  birthday_person: string | null
  created_at: string
}

export function useAudioMessages(birthdayPerson?: string) {
  const { t } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [messages, setMessages] = useState<AudioMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabase()
      let query = supabase
        .from('media_submissions')
        .select('id, sender, object_path, duration_seconds, birthday_person, created_at')
        .eq('media_kind', 'audio')
        .order('created_at', { ascending: false })

      if (birthdayPerson) query = query.eq('birthday_person', birthdayPerson)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      setMessages(((data || []) as AudioSubmission[]).map((message) => ({
        id: message.id,
        sender: message.sender,
        audio_url: supabase.storage.from('community-media').getPublicUrl(message.object_path).data.publicUrl,
        duration: message.duration_seconds ?? 0,
        birthday_person: message.birthday_person ?? undefined,
        created_at: message.created_at,
      })))
    } catch {
      setError(tRef.current('audioMessagesLoadError'))
    } finally {
      setLoading(false)
    }
  }, [birthdayPerson])

  useEffect(() => {
    void fetchMessages()
  }, [fetchMessages])

  return { messages, loading, error, refetch: fetchMessages }
}
