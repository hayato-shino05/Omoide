'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

import { parseMusicTrackReference } from '@/lib/music/reference'

interface Message {
  id: number
  sender: string
  message: string
  birthday_person?: string
  media_object_path?: string
  music_track_id?: string
  created_at: string
}

interface UseMessagesReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  sendMessage: (sender: string, message: string, birthdayPerson?: string, mediaObjectPath?: string, musicTrackId?: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useMessages(): UseMessagesReturn {
  const { t } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setMessages((data || []) as Message[])
    } catch (err) {
      setError(err instanceof Error ? err.message : tRef.current('messagesLoadError'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const sendMessage = useCallback(
    async (sender: string, message: string, birthdayPerson?: string, mediaObjectPath?: string, musicTrackId?: string): Promise<boolean> => {
      try {
        if (musicTrackId && !parseMusicTrackReference(musicTrackId)) {
          setError(tRef.current('sendMessageFailed'))
          return false
        }

        const { error: insertError } = await supabase.from('messages').insert({
          sender,
          message,
          birthday_person: birthdayPerson || null,
          media_object_path: mediaObjectPath || null,
          music_track_id: musicTrackId || null,
        })

        if (insertError) throw insertError
        await fetchMessages()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : tRef.current('sendMessageFailed'))
        return false
      }
    },
    [fetchMessages]
  )

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refetch: fetchMessages,
  }
}
