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
    <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-5 p-4 sm:p-6 text-stone-100">
      {/* Floating Silent Cheer Layer */}
      <SilentCheerOverlay />

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-stone-900/85 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-2xl bg-[#D95D39]/15 border border-[#D95D39]/30 text-amber-300 flex-shrink-0 shadow-sm">
            <Sparkles size={22} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-medium text-white truncate max-w-[180px] sm:max-w-md">
                {currentRoom?.name || t('studyRoomTitle')}
              </h1>
              {currentRoom?.is_private && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium flex-shrink-0">
                  <Lock size={10} />
                  {t('studyPrivateRoom')}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 truncate max-w-[240px] sm:max-w-md mt-0.5">
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#D95D39]/20 hover:bg-[#D95D39]/30 active:scale-95 text-amber-200 border border-[#D95D39]/40 backdrop-blur-md transition-all shadow-[0_4px_16px_rgba(217,93,57,0.2)]"
          >
            <Maximize2 size={14} className="text-[#D95D39]" />
            <span>{t('studyZenMode')}</span>
          </button>

          {/* Copy Share Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            title={t('studyCopyInviteLink')}
            aria-label={t('studyCopyInviteLink')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-stone-300 hover:text-white border border-white/10 transition-all shadow-sm"
          >
            {isCopied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={handleLeave}
            title={t('studyLeaveRoom')}
            aria-label={t('studyLeaveRoom')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 active:scale-95 text-stone-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/30 transition-all shadow-sm"
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

