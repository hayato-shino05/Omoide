'use client'

import { Crown, Flame, Coffee, Sparkles, BookOpen, Clock, HeartHandshake } from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/types'
import type { CheerType, FocusStatus } from '@/types/study'

interface DeskPresenceListProps {
  onSendCheer: (cheerType: CheerType) => void
}

export function DeskPresenceList({ onSendCheer }: DeskPresenceListProps) {
  const { members, userIdentifier, currentRoom } = useStudyRoomStore()
  const { t } = useLanguage()

  const cheerButtons: {
    type: CheerType
    labelKey: TranslationKey
    icon: React.ReactNode
    colorClass: string
  }[] = [
    {
      type: 'coffee',
      labelKey: 'studyCheerCoffee',
      icon: <Coffee size={15} className="text-amber-700" />,
      colorClass: 'hover:bg-amber-100 hover:border-amber-400 text-amber-900 bg-amber-50/80',
    },
    {
      type: 'fire',
      labelKey: 'studyCheerFire',
      icon: <Flame size={15} className="text-[#D95D39]" />,
      colorClass: 'hover:bg-orange-100 hover:border-orange-400 text-orange-950 bg-orange-50/80',
    },
    {
      type: 'sparkle',
      labelKey: 'studyCheerSparkle',
      icon: <Sparkles size={15} className="text-amber-600" />,
      colorClass: 'hover:bg-yellow-100 hover:border-yellow-400 text-yellow-950 bg-yellow-50/80',
    },
    {
      type: 'book',
      labelKey: 'studyCheerBook',
      icon: <BookOpen size={15} className="text-[#2E7D6F]" />,
      colorClass: 'hover:bg-emerald-100 hover:border-emerald-400 text-emerald-950 bg-emerald-50/80',
    },
  ]

  const getStatusRingClass = (status: FocusStatus) => {
    switch (status) {
      case 'focusing':
        return 'ring-3 ring-[#D95D39] ring-offset-2 ring-offset-[#FFF9F3]'
      case 'short_break':
        return 'ring-3 ring-[#2E7D6F] ring-offset-2 ring-offset-[#FFF9F3]'
      case 'long_break':
        return 'ring-3 ring-[#4A6572] ring-offset-2 ring-offset-[#FFF9F3]'
      default:
        return 'ring-2 ring-stone-300 ring-offset-2 ring-offset-[#FFF9F3]'
    }
  }

  const getStatusLabel = (status: FocusStatus, minutes: number) => {
    switch (status) {
      case 'focusing':
        return t('studyFocusingDuration', { minutes: String(minutes || 0) })
      case 'short_break':
      case 'long_break':
        return t('studyBreakDuration', { minutes: String(minutes || 0) })
      default:
        return t('studyPaused')
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#D4B08C] text-[#854D27] shadow-xs">
      {/* Stage Audience Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D4B08C]/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] text-[#D95D39]">
            <HeartHandshake size={16} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[#854D27] font-heading">
              {t('studyStageAudience', { count: String(members.length) })}
            </h2>
            <p className="text-[11px] text-[#854D27]/70 font-body">
              {t('studyDesksTitle')}
            </p>
          </div>
        </div>

        {/* Discord Silent Reaction Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-[#854D27]/60 mr-1 hidden sm:inline font-body">
            {t('studySilentCheer')}:
          </span>
          {cheerButtons.map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => onSendCheer(btn.type)}
              title={t(btn.labelKey)}
              aria-label={t(btn.labelKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D4B08C]/70 active:scale-95 transition-all text-xs font-bold cursor-pointer shadow-2xs font-body min-h-[36px] ${btn.colorClass}`}
            >
              {btn.icon}
              <span className="hidden md:inline text-[11px]">{t(btn.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Discord Stage Member Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
        {members.map((member) => {
          const isMe = member.user_identifier === userIdentifier
          const isRoomHost = currentRoom && currentRoom.host_id === member.user_identifier

          return (
            <div
              key={member.user_identifier}
              className={`relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border transition-all text-center group ${
                isMe
                  ? 'bg-[#FAF0E6] border-[#D95D39] shadow-xs'
                  : 'bg-[#FFF9F3] border-[#D4B08C]/60 hover:bg-[#FAF0E6] hover:border-[#D4B08C] shadow-2xs'
              }`}
            >
              {/* Host Crown Badge */}
              {isRoomHost && (
                <div
                  title={t('studyDjBadge')}
                  className="absolute -top-2 -right-1 p-1 rounded-full bg-amber-400 border border-amber-600 text-amber-950 shadow-xs z-10"
                >
                  <Crown size={12} />
                </div>
              )}

              {/* Avatar with Discord-style Status Ring */}
              <div className="relative mb-2 mt-0.5">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FAF0E6] border-2 border-[#D4B08C] flex items-center justify-center text-sm font-bold text-[#854D27] uppercase overflow-hidden transition-all shadow-xs ${getStatusRingClass(
                    member.focus_status
                  )}`}
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-heading tracking-wider">
                      {member.display_name.substring(0, 2)}
                    </span>
                  )}
                </div>

                {/* Status Dot */}
                <div className="absolute -bottom-1 -right-1">
                  <span
                    className={`inline-block w-3.5 h-3.5 rounded-full border-2 border-white ${
                      member.focus_status === 'focusing'
                        ? 'bg-[#D95D39]'
                        : member.focus_status === 'short_break'
                        ? 'bg-[#2E7D6F]'
                        : member.focus_status === 'long_break'
                        ? 'bg-[#4A6572]'
                        : 'bg-stone-400'
                    }`}
                  />
                </div>
              </div>

              {/* Member Name */}
              <div className="w-full">
                <div className="text-xs font-bold text-[#854D27] truncate flex items-center justify-center gap-1 font-heading">
                  <span className="truncate max-w-[90px] sm:max-w-[110px]">
                    {member.display_name}
                  </span>
                  {isMe && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#D95D39] text-white font-semibold flex-shrink-0 font-body">
                      {t('studyYou')}
                    </span>
                  )}
                </div>

                {/* Focus Status & Minutes */}
                <p className="text-[11px] text-[#854D27]/75 font-body font-medium truncate mt-0.5 flex items-center justify-center gap-1">
                  <Clock size={11} className="text-[#D95D39] flex-shrink-0" />
                  <span className="truncate">
                    {getStatusLabel(member.focus_status, member.current_streak_minutes)}
                  </span>
                </p>
              </div>
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-[#854D27]/70 font-body">
            {t('studyNoPartnersYet')}
          </div>
        )}
      </div>
    </div>
  )
}
