'use client'

import React, { useCallback } from 'react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useRoomBgmSync } from '@/lib/hooks/useRoomBgmSync'
import { useAmbientAudio } from '@/lib/hooks/useAmbientAudio'
import { AmbientMixerModal } from './AmbientMixerModal'

/**
 * グローバル勉強部屋セッション管理コンポーネント
 * モーダルを閉じても部屋のBGMや環境音、Supabase Realtime接続が途切れないようバックグラウンドで完全稼働
 */
export const GlobalStudyRoomSession = React.memo(function GlobalStudyRoomSession() {
  const currentRoomId = useStudyRoomStore((state) => state.currentRoom?.id ?? null)
  const isAmbientMixerOpen = useStudyRoomStore((state) => state.isAmbientMixerOpen)
  const setAmbientMixerOpen = useStudyRoomStore((state) => state.setAmbientMixerOpen)

  // 1. 環境音オーディオエンジンのグローバル初期化
  useAmbientAudio()

  // 2. 部屋BGM同期エンジンのグローバル初期化（部屋入室時のみバックグラウンドで再生継続）
  useRoomBgmSync(currentRoomId)

  const handleCloseMixer = useCallback(() => {
    setAmbientMixerOpen(false)
  }, [setAmbientMixerOpen])

  return (
    <AmbientMixerModal
      isOpen={isAmbientMixerOpen}
      onClose={handleCloseMixer}
    />
  )
})
