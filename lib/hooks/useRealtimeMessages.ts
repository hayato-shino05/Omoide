'use client'

import { useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

type TableName = 'custom_messages' | 'audio_messages' | 'video_messages' | 'virtual_gifts' | 'bulletin_posts'

interface UseRealtimeOptions {
  table: TableName
  onInsert?: (payload: Record<string, unknown>) => void
  onUpdate?: (payload: Record<string, unknown>) => void
  onDelete?: (payload: Record<string, unknown>) => void
  filter?: { column: string; value: string }
}

export function useRealtimeMessages({
  table,
  onInsert,
  onUpdate,
  onDelete,
  filter,
}: UseRealtimeOptions) {
  const subscribe = useCallback(() => {
    const supabase = getSupabase()
    
    const channel: RealtimeChannel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
        },
        (payload) => {
          onInsert?.(payload.new as Record<string, unknown>)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
        },
        (payload) => {
          onUpdate?.(payload.new as Record<string, unknown>)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
        },
        (payload) => {
          onDelete?.(payload.old as Record<string, unknown>)
        }
      )

    channel.subscribe()

    return channel
  }, [table, onInsert, onUpdate, onDelete, filter])

  useEffect(() => {
    const channel = subscribe()

    return () => {
      const supabase = getSupabase()
      supabase.removeChannel(channel)
    }
  }, [subscribe])
}
