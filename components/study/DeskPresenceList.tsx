'use client'

import { useState } from 'react'
import { Crown, Coffee, Clock, HeartHandshake, Target, CheckCircle2, Circle } from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { CheerType, FocusStatus } from '@/types/study'

interface DeskPresenceListProps {
  onSendCheer: (cheerType: CheerType) => void
}

export function DeskPresenceList({ onSendCheer }: DeskPresenceListProps) {
  const {
    members,
    userIdentifier,
    currentRoom,
    personalGoal,
    isGoalCompleted,
    setPersonalGoal,
    toggleGoalCompleted,
  } = useStudyRoomStore()
  const { t } = useLanguage()
  const [goalInput, setGoalInput] = useState(personalGoal)
  const [isEditingGoal, setIsEditingGoal] = useState(!personalGoal)

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (goalInput.trim()) {
      setPersonalGoal(goalInput.trim())
      setIsEditingGoal(false)
    }
  }

  // 部屋全体の総集中時間を計算
  const totalRoomMinutes = members.reduce(
    (acc, m) => acc + (m.focus_status === 'focusing' ? m.current_streak_minutes || 0 : 0),
    0
  )

  const getStatusRingClass = (status: FocusStatus) => {
    switch (status) {
      case 'focusing':
        return 'ring-3 ring-[#D95D39] ring-offset-2 ring-offset-[#FFF9F3]'
      case 'short_break':
        return 'ring-3 ring-[#2E7D6F] ring-offset-2 ring-offset-[#FFF9F3]'
      case 'long_break':
        return 'ring-3 ring-[#4A6572] ring-offset-2 ring-offset-[#FFF9F3]'
      default:
        return 'ring-2 ring-[#D4B08C]/60 ring-offset-2 ring-offset-[#FFF9F3]'
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
    <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border-2 border-[#D4B08C] text-[#3D2314] shadow-[0_4px_20px_-4px_rgba(133,77,39,0.06)]">
      {/* 1. 参加者一覧ヘッダー・セッション目標バー */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3.5 border-b border-[#D4B08C]/40">
        {/* 机一覧ヘッダー・総集中時間統計 */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] text-[#D95D39] shadow-2xs">
            <HeartHandshake size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#3D2314] font-heading">
                {t('studyStageAudience', { count: String(members.length) })}
              </h2>
              <span className="w-2 h-2 rounded-full bg-[#2E7D6F] animate-pulse" />
            </div>
            <p className="text-xs text-[#5C3A21] font-body font-medium mt-0.5">
              {t('studyTotalFocusTime', { time: `${totalRoomMinutes}m` })}
            </p>
          </div>
        </div>

        {/* セッション目標管理および応援アクション */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 自身のセッション目標入力・完了トグル */}
          {isEditingGoal ? (
            <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:w-64">
                <Target size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#D95D39]" />
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder={t('studyGoalPlaceholder')}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-body font-medium text-[#3D2314] bg-white border border-[#D4B08C] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D95D39]/40 min-h-[38px] placeholder:text-[#854D27]/40"
                  maxLength={60}
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-[#D95D39] hover:bg-[#C24E2B] text-white text-xs font-bold font-body transition-all active:scale-95 shadow-2xs cursor-pointer min-h-[38px]"
              >
                {t('studySetGoal')}
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF0E6] border border-[#D4B08C] min-h-[38px]">
              <button
                type="button"
                onClick={toggleGoalCompleted}
                title={isGoalCompleted ? t('studyGoalDone') : t('studySessionGoal')}
                className="text-[#D95D39] hover:text-[#2E7D6F] transition-colors cursor-pointer"
              >
                {isGoalCompleted ? (
                  <CheckCircle2 size={16} className="text-[#2E7D6F]" />
                ) : (
                  <Circle size={16} className="text-[#D95D39]" />
                )}
              </button>
              <span
                onClick={() => setIsEditingGoal(true)}
                className={`text-xs font-body font-medium cursor-pointer max-w-[180px] sm:max-w-xs truncate ${
                  isGoalCompleted ? 'line-through text-[#5C3A21]/60' : 'text-[#3D2314]'
                }`}
                title={personalGoal}
              >
                {personalGoal}
              </span>
            </div>
          )}

          {/* 静かな応援ボタン（お茶） */}
          <button
            type="button"
            onClick={() => onSendCheer('coffee')}
            title={t('studyCheerCoffee')}
            aria-label={t('studyCheerCoffee')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF0E6] hover:bg-[#F3E5D8] text-[#3D2314] border border-[#D4B08C] active:scale-95 transition-all text-xs font-bold cursor-pointer shadow-2xs font-body min-h-[38px]"
          >
            <Coffee size={14} className="text-[#D95D39]" />
            <span className="text-xs font-medium">{t('studyCheerCoffee')}</span>
          </button>
        </div>
      </div>

      {/* 2. 参加者の勉強机グリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
        {members.map((member) => {
          const isMe = member.user_identifier === userIdentifier
          const isRoomHost = currentRoom && currentRoom.host_id === member.user_identifier
          const isFocusing = member.focus_status === 'focusing'

          return (
            <div
              key={member.user_identifier}
              className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center group ${
                isMe
                  ? 'bg-[#FAF3EB] border-[#D95D39] shadow-[0_2px_10px_-2px_rgba(217,93,57,0.15)]'
                  : 'bg-white border-[#D4B08C]/70 hover:bg-[#FAF6F0] hover:border-[#D4B08C] shadow-2xs'
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

              {/* Avatar with Status Ring */}
              <div className="relative mb-2 mt-0.5">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FAF0E6] border-2 border-[#D4B08C] flex items-center justify-center text-sm font-bold text-[#3D2314] uppercase overflow-hidden transition-all shadow-xs ${getStatusRingClass(
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
                    <span className="font-heading tracking-wider text-[#3D2314]">
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

              {/* Member Name & Tag */}
              <div className="w-full">
                <div className="text-xs font-bold text-[#3D2314] truncate flex items-center justify-center gap-1 font-heading">
                  <span className="truncate max-w-[90px] sm:max-w-[110px]">
                    {member.display_name}
                  </span>
                  {isMe && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#D95D39] text-white font-bold flex-shrink-0 font-body">
                      {t('studyYou')}
                    </span>
                  )}
                </div>

                {/* Focus Status & Minutes */}
                <p className="text-[11px] text-[#5C3A21] font-body font-semibold truncate mt-0.5 flex items-center justify-center gap-1">
                  <Clock
                    size={12}
                    className={
                      isFocusing
                        ? 'text-[#D95D39] animate-pulse flex-shrink-0'
                        : 'text-[#5C3A21] flex-shrink-0'
                    }
                  />
                  <span className="truncate">
                    {getStatusLabel(member.focus_status, member.current_streak_minutes)}
                  </span>
                </p>

                {/* 自身の机に表示するセッション目標バッジ */}
                {isMe && personalGoal && (
                  <div
                    className={`mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-body font-medium truncate border flex items-center justify-center gap-1 ${
                      isGoalCompleted
                        ? 'bg-emerald-50 text-[#2E7D6F] border-emerald-200 line-through'
                        : 'bg-[#FAF0E6] text-[#3D2314] border-[#D4B08C]/60'
                    }`}
                    title={personalGoal}
                  >
                    <Target size={10} className={isGoalCompleted ? 'text-[#2E7D6F]' : 'text-[#D95D39]'} />
                    <span className="truncate max-w-[100px]">{personalGoal}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-[#5C3A21] font-body font-medium">
            {t('studyNoPartnersYet')}
          </div>
        )}
      </div>
    </div>
  )
}
