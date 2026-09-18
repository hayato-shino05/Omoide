'use client'

import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useRoomBgmSync } from '@/lib/hooks/useRoomBgmSync'
import { useAmbientAudio } from '@/lib/hooks/useAmbientAudio'
import { StudyRoomVoiceBar } from './StudyRoomVoiceBar'
import { AmbientMixerModal } from './AmbientMixerModal'

/**
 * グローバル勉強部屋セッション管理コンポーネント
 * モーダルを閉じても部屋のBGMや環境音、Supabase Realtime接続が途切れないようグローバルで永続化
 */
export function GlobalStudyRoomSession() {
  const { currentRoom, isAmbientMixerOpen, setAmbientMixerOpen } = useStudyRoomStore()

  // 1. 環境音オーディオエンジンのグローバル初期化
  useAmbientAudio()

  // 2. 部屋BGM同期エンジンのグローバル初期化（部屋入室時のみアクティブ）
  useRoomBgmSync(currentRoom ? currentRoom.id : null)

  return (
    <>
      {/* Discordスタイルの接続中ボトムバー */}
      <StudyRoomVoiceBar />

      {/* グローバル環境音ミキサーモーダル */}
      <AmbientMixerModal
        isOpen={isAmbientMixerOpen}
        onClose={() => setAmbientMixerOpen(false)}
      />
    </>
  )
}
