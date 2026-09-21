'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useBirthdays } from '@/lib/hooks/useBirthdays'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'

interface BirthdayCalendarProps {
  onClose?: () => void
}

export function BirthdayCalendar({}: BirthdayCalendarProps) {
  const { data: birthdays = [] } = useBirthdays()
  const { language, t } = useLanguage()
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const shouldReduceMotion = useReducedMotion()

  const isJa = language === 'ja'
  const monthsList = useMemo(
    () => (isJa ? t('months') : t('monthsShort')).split(','),
    [isJa, t]
  )
  const fullMonthsList = useMemo(() => t('months').split(','), [t])
  const currentMonthLabel = fullMonthsList[selectedMonth] || `${selectedMonth + 1}月`

  // 選択月の誕生日リスト（日順でソート）
  const birthdaysInMonth = useMemo(() => {
    return birthdays
      .filter((b) => b.month === selectedMonth + 1)
      .sort((a, b) => a.day - b.day)
  }, [birthdays, selectedMonth])

  // 各月の誕生日数マップ
  const monthCounts = useMemo(() => {
    const counts: number[] = new Array(12).fill(0)
    for (const b of birthdays) {
      if (b.month >= 1 && b.month <= 12) {
        counts[b.month - 1]++
      }
    }
    return counts
  }, [birthdays])

  const prevMonth = useCallback(() => {
    setSelectedMonth((prev) => (prev - 1 + 12) % 12)
  }, [])

  const nextMonth = useCallback(() => {
    setSelectedMonth((prev) => (prev + 1) % 12)
  }, [])

  // アニメーション設定
  const cardVariants = useMemo(
    () => ({
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    }),
    [shouldReduceMotion]
  )

  return (
    <div className="w-full max-w-lg mx-auto py-2 space-y-5">
      {/* 月の切り替えナビゲーション */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl shadow-[3px_3px_0_#D4B08C]">
        <button
          type="button"
          onClick={prevMonth}
          aria-label={t('previousMonth')}
          className="min-h-[44px] min-w-[44px] p-2 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] rounded-lg cursor-pointer flex items-center justify-center shadow-[2px_2px_0_#D4B08C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
        >
          <Icon name="ArrowLeft" size={20} />
        </button>

        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-[#854D27] font-heading m-0">
            {currentMonthLabel}
          </h3>
          <div className="text-xs text-[#854D27]/80 font-medium mt-0.5">
            {t('birthdaysInMonthCount', { count: birthdaysInMonth.length })}
          </div>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          aria-label={t('nextMonth')}
          className="min-h-[44px] min-w-[44px] p-2 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] rounded-lg cursor-pointer flex items-center justify-center shadow-[2px_2px_0_#D4B08C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
        >
          <Icon name="ArrowRight" size={20} />
        </button>
      </div>

      {/* 選択中の月の誕生日リスト */}
      <div
        className="min-h-[140px]"
        role="region"
        aria-live="polite"
        aria-label={`${currentMonthLabel}の誕生日一覧`}
      >
        {birthdaysInMonth.length === 0 ? (
          <div className="p-8 bg-[#FFF9F3] border-2 border-dashed border-[#D4B08C] rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#854D27]/10 text-[#854D27] mb-3">
              <Icon name="Calendar" size={24} aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-[#854D27]">
              {t('noBirthdaysThisMonth')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {birthdaysInMonth.map((birthday) => (
              <motion.div
                key={birthday.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="flex items-center gap-3.5 p-3.5 sm:p-4 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl shadow-[2px_2px_0_#D4B08C] transition-all hover:border-[#854D27]"
              >
                {/* 日付バッジ */}
                <div className="w-12 h-12 shrink-0 rounded-lg bg-[#854D27] text-[#FFF9F3] border border-[#D4B08C] flex flex-col items-center justify-center shadow-[1px_1px_0_#D4B08C]">
                  <span className="text-base sm:text-lg font-bold font-heading leading-tight">
                    {birthday.day}
                  </span>
                  <span className="text-[10px] opacity-80 leading-none">日</span>
                </div>

                {/* 名前とメッセージ */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-[#854D27] flex items-center gap-1.5 truncate">
                    <Icon name="Cake" size={16} className="text-[#D4B08C] shrink-0" aria-hidden="true" />
                    <span className="truncate">{birthday.name}</span>
                  </h4>
                  {birthday.message ? (
                    <p className="text-xs text-[#2C1810]/75 mt-1 line-clamp-2 leading-relaxed">
                      {birthday.message}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 12ヶ月の年間概要グリッド */}
      <div className="p-4 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl shadow-[3px_3px_0_#D4B08C]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#854D27] mb-3 flex items-center gap-1.5">
          <Icon name="Calendar" size={14} aria-hidden="true" />
          <span>{t('yearOverview')}</span>
        </h4>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {monthsList.map((month, index) => {
            const count = monthCounts[index] || 0
            const isCurrentMonth = index === selectedMonth

            return (
              <button
                key={month}
                type="button"
                onClick={() => setSelectedMonth(index)}
                aria-pressed={isCurrentMonth}
                className={`min-h-[44px] p-2 rounded-lg border-2 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center
                  focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none
                  ${
                    isCurrentMonth
                      ? 'bg-[#854D27] text-[#FFF9F3] border-[#854D27] shadow-[2px_2px_0_#D4B08C]'
                      : count > 0
                      ? 'bg-[#F3E5D8]/60 text-[#854D27] border-[#D4B08C] hover:bg-[#F3E5D8]'
                      : 'bg-white/80 text-[#854D27]/80 border-[#D4B08C]/60 hover:bg-white'
                  }
                `}
              >
                <span className="text-xs font-semibold leading-tight">{month}</span>
                {count > 0 && (
                  <span
                    className={`text-[11px] font-bold mt-0.5 ${
                      isCurrentMonth ? 'text-[#D4B08C]' : 'text-[#854D27]'
                    }`}
                  >
                    ({count})
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
