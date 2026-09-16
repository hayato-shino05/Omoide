'use client'

import { useState } from 'react'
import {
  Sparkles,
  LogOut,
  Share2,
  Check,
  Maximize2,
  Lock,
} from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useRoomBgmSync } from '@/lib/hooks/useRoomBgmSync'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { DualAudioControls } from './DualAudioControls'
import { DeskPresenceList } from './DeskPresenceList'
import { SilentCheerOverlay } from './SilentCheerOverlay'
import { ZenFocusModal } from './ZenFocusModal'
import { leaveStudyRoom, updateMemberStatus } from '@/lib/study/client'

interface StudyRoomViewProps {
  roomId: string
  onLeave: () => void
}

export function StudyRoomView({ roomId, onLeave }: StudyRoomViewProps) {
  const { currentRoom, userIdentifier, resetRoom } = useStudyRoomStore()
  const { changeRoomTrack, sendSilentCheer, updatePresenceStatus } = useRoomBgmSync(roomId)
  const { t } = useLanguage()

  const [isZenOpen, setIsZenOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleLeave = async () => {
    if (confirm(t('studyLeaveConfirm'))) {
      await leaveStudyRoom(roomId, userIdentifier)
      resetRoom()
      onLeave()
    }
  }

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('studyRoom', roomId)
    navigator.clipboard.writeText(url.toString()).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  const handleCycleComplete = async (mode: string, streakMinutes: number) => {
    const status = mode === 'focus' ? 'focusing' : mode === 'long_break' ? 'long_break' : 'short_break'
    await updateMemberStatus(roomId, userIdentifier, status, streakMinutes)
    await updatePresenceStatus(status, streakMinutes)
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-4 p-2 sm:p-4 text-[#854D27]">
      {/* Floating Silent Cheer Layer */}
      <SilentCheerOverlay />

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#D4B08C] shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] text-[#D95D39] flex-shrink-0 shadow-xs">
            <Sparkles size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#854D27] truncate max-w-[180px] sm:max-w-md font-heading">
                {currentRoom?.name || t('studyRoomTitle')}
              </h1>
              {currentRoom?.is_private && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-[#FAF0E6] text-[#854D27] border border-[#D4B08C] font-semibold flex-shrink-0 font-body">
                  <Lock size={10} />
                  {t('studyPrivateRoom')}
                </span>
              )}
            </div>
            <p className="text-xs text-[#854D27]/70 truncate max-w-[240px] sm:max-w-md mt-0.5 font-body">
              {currentRoom?.description || t('studyRoomDesc')}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Zen Mode Button */}
          <button
            type="button"
            onClick={() => setIsZenOpen(true)}
            aria-label={t('studyZenMode')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#D95D39] hover:bg-[#c44e2b] active:scale-95 text-white shadow-xs transition-all cursor-pointer font-body"
          >
            <Maximize2 size={14} />
            <span>{t('studyZenMode')}</span>
          </button>

          {/* Copy Share Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            title={t('studyCopyInviteLink')}
            aria-label={t('studyCopyInviteLink')}
            className="p-2 rounded-xl bg-[#FFF9F3] hover:bg-[#FAF0E6] active:scale-95 text-[#854D27] border border-[#D4B08C] transition-all shadow-xs cursor-pointer"
          >
            {isCopied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={handleLeave}
            title={t('studyLeaveRoom')}
            aria-label={t('studyLeaveRoom')}
            className="p-2 rounded-xl bg-[#FFF9F3] hover:bg-rose-50 active:scale-95 text-[#854D27] hover:text-rose-700 border border-[#D4B08C] hover:border-rose-300 transition-all shadow-xs cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Dual Audio Sovereignty Controls */}
      <DualAudioControls onHostChangeTrack={changeRoomTrack} />

      {/* Desk Presence & Silent Cheer */}
      <DeskPresenceList onSendCheer={sendSilentCheer} />

      {/* Zen Focus Fullscreen Modal */}
      <ZenFocusModal
        isOpen={isZenOpen}
        onClose={() => setIsZenOpen(false)}
        onCycleComplete={handleCycleComplete}
      />
    </div>
  )
}

