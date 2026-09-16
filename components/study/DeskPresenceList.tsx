'use client'

import { Users, Flame, Coffee, Sparkles, BookOpen } from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/types'
import type { CheerType, FocusStatus } from '@/types/study'

interface DeskPresenceListProps {
  onSendCheer: (cheerType: CheerType) => void
}

export function DeskPresenceList({ onSendCheer }: DeskPresenceListProps) {
  const { members, userIdentifier } = useStudyRoomStore()
  const { t } = useLanguage()

  const cheerButtons: { type: CheerType; labelKey: TranslationKey; icon: React.ReactNode; colorClass: string }[] = [
    {
      type: 'coffee',
      labelKey: 'studyCheerCoffee',
      icon: <Coffee size={14} className="text-amber-300" />,
      colorClass: 'hover:bg-amber-500/20 hover:border-amber-500/30 text-amber-200',
    },
    {
      type: 'fire',
      labelKey: 'studyCheerFire',
      icon: <Flame size={14} className="text-rose-400" />,
      colorClass: 'hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-200',
    },
    {
      type: 'sparkle',
      labelKey: 'studyCheerSparkle',
      icon: <Sparkles size={14} className="text-amber-200" />,
      colorClass: 'hover:bg-amber-300/20 hover:border-amber-300/30 text-amber-100',
    },
    {
      type: 'book',
      labelKey: 'studyCheerBook',
      icon: <BookOpen size={14} className="text-emerald-300" />,
      colorClass: 'hover:bg-emerald-500/20 hover:border-emerald-500/30 text-emerald-200',
    },
  ]

  const getStatusBadge = (status: FocusStatus) => {
    switch (status) {
      case 'focusing':
        return (
          <span
            className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"
            title={t('studyPomodoroFocus')}
          />
        )
      case 'short_break':
      case 'long_break':
        return (
          <span
            className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"
            title={t('studyPomodoroShortBreak')}
          />
        )
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-stone-500" title={t('studyPaused')} />
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-stone-900/80 border border-white/10 backdrop-blur-xl text-stone-100 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-stone-300">
            <Users size={16} />
          </div>
          <h2 className="text-xs sm:text-sm font-medium text-stone-100">
            {t('studyDesksTitle')} <span className="text-stone-400 font-normal">({members.length})</span>
          </h2>
        </div>

        {/* Silent Cheer Bar */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-400 mr-1 hidden sm:inline">{t('studySilentCheer')}:</span>
          {cheerButtons.map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => onSendCheer(btn.type)}
              title={t(btn.labelKey)}
              aria-label={t(btn.labelKey)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 active:scale-95 transition-all text-xs font-medium ${btn.colorClass}`}
            >
              {btn.icon}
              <span className="hidden md:inline text-[11px]">{t(btn.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách Desks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
        {members.map((member) => {
          const isMe = member.user_identifier === userIdentifier
          return (
            <div
              key={member.user_identifier}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isMe
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              {/* Avatar + Status dot */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-stone-800 border border-white/15 flex items-center justify-center text-xs font-semibold text-stone-200 uppercase overflow-hidden shadow-sm">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.display_name.substring(0, 2)
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 ring-2 ring-stone-900 rounded-full">
                  {getStatusBadge(member.focus_status)}
                </div>
              </div>

              {/* Tên & Streak */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-stone-100 truncate flex items-center gap-1.5">
                  <span className="truncate">{member.display_name}</span>
                  {isMe && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-normal border border-amber-500/30 flex-shrink-0">
                      {t('studyYou')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                  <Flame size={12} className="text-amber-400 flex-shrink-0" />
                  <span className="tabular-nums font-mono">{member.current_streak_minutes || 0}m streak</span>
                </div>
              </div>
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-stone-400">
            {t('studyNoPartnersYet')}
          </div>
        )}
      </div>
    </div>
  )
}

