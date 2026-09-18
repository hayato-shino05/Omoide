'use client'

import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useRoomBgmSync } from '@/lib/hooks/useRoomBgmSync'
import { useAmbientAudio } from '@/lib/hooks/useAmbientAudio'
import { AmbientMixerModal } from './AmbientMixerModal'

/**
 * グローバル勉強部屋セッション管理コンポーネント
 * モーダルを閉じても部屋のBGMや環境音、Supabase Realtime接続が途切れないようバックグラウンドで完全稼働
 */
export function GlobalStudyRoomSession() {
  const { currentRoom, isAmbientMixerOpen, setAmbientMixerOpen } = useStudyRoomStore()

  // 1. 環境音オーディオエンジンのグローバル初期化
  useAmbientAudio()

  // 2. 部屋BGM同期エンジンのグローバル初期化（部屋入室時のみバックグラウンドで再生継続）
  useRoomBgmSync(currentRoom ? currentRoom.id : null)

  return (
    <AmbientMixerModal
      isOpen={isAmbientMixerOpen}
      onClose={() => setAmbientMixerOpen(false)}
    />
  )
}
