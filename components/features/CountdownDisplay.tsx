'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNextBirthday } from '@/lib/hooks/useNextBirthday'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useThemeContext } from '@/lib/providers/ThemeProvider'
import { CountdownTimer } from './CountdownTimer'
import type { Birthday } from '@/types'
import { calculateNextBirthday } from '@/lib/utils/birthday'
import { Calendar, Eye, EyeOff } from 'lucide-react'

// ヴィンテージ・スクラップブック風のカウントダウンカードコンポーネント（タップ/クリックで表示・非表示切り替え対応）
export function CountdownDisplay({ selectedBirthday }: { selectedBirthday?: Birthday }) {
  const { nextBirthday: defaultNextBirthday, isLoading } = useNextBirthday()
  const nextBirthday = selectedBirthday ? calculateNextBirthday(new Date(), [selectedBirthday]) : defaultNextBirthday
  const { language, t } = useLanguage()
  const { currentTheme } = useThemeContext()
  const [isHidden, setIsHidden] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!nextBirthday) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 text-center shadow-xl">
          <p className="text-base sm:text-lg font-bold text-[#4A2400]">
            {t('noBirthdayData')}
          </p>
        </div>
      </div>
    )
  }

  const personName = nextBirthday.person.name
  const targetDateStr = nextBirthday.date
    ? language === 'ja'
      ? `${nextBirthday.date.getMonth() + 1}月${nextBirthday.date.getDate()}日`
      : nextBirthday.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  return (
    <div className={`countdown-card-wrapper theme-${currentTheme} w-full flex justify-center items-center px-3 sm:px-4 min-h-[42vh]`}>
      <AnimatePresence mode="wait" initial={false}>
        {isHidden ? (
          /* 非表示時の再表示トリガーボタン */
          <motion.button
            key="show-trigger"
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={() => setIsHidden(false)}
            className="group px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-white/90 text-[#4A2400] font-black text-xs sm:text-sm shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            style={{
              boxShadow: '0 12px 30px -4px rgba(44, 24, 16, 0.25)',
            }}
          >
            <Eye className="w-4 h-4 text-[#895033] group-hover:scale-110 transition-transform" />
            <span>{t('countdownShow')}</span>
          </motion.button>
        ) : (
          /* メインのスクラップブック風カウントダウンカード */
          <motion.div
            key="countdown-card"
            initial={false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[92%] sm:max-w-[620px] md:max-w-[720px] rounded-2xl sm:rounded-3xl flex flex-col items-center select-none p-4 sm:p-7 md:p-8 pb-3.5 sm:pb-6"
            style={{
              background: 'rgba(253, 249, 233, 0.42)',
              backdropFilter: 'blur(26px)',
              WebkitBackdropFilter: 'blur(26px)',
              border: '1.5px solid rgba(255, 255, 255, 0.65)',
              boxShadow: '0 20px 50px -12px rgba(44, 24, 16, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 16px rgba(255, 255, 255, 0.25)',
            }}
          >
            {/* 左上の非表示ボタン（背景をじっくり鑑賞するためのトグルボタン） */}
            <button
              onClick={() => setIsHidden(true)}
              className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 hover:bg-white border border-white/80 flex items-center justify-center text-[#6E3902] hover:text-[#2C1400] shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={t('countdownHideTitle')}
              aria-label={t('countdownHide')}
            >
              <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* 右上のクリップとヴィンテージチケット装飾 */}
            <div className="absolute -top-3 right-4 sm:right-8 transform rotate-6 z-20 pointer-events-none">
              <div
                className="w-3.5 sm:w-4 h-8 sm:h-9 border-2 rounded-full absolute -top-1.5 left-2 sm:left-3 opacity-80"
                style={{ borderColor: '#6E3902' }}
              />
              <div
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-xs text-[#522500] text-[9px] sm:text-[11px] font-extrabold tracking-wider sm:tracking-widest shadow-md transform -rotate-3 uppercase"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(215, 195, 181, 0.9)',
                  fontFamily: 'var(--font-heading), monospace',
                }}
              >
                CELEBRATION
              </div>
            </div>

            {/* 上部ヘッダー：想い出箱タイトル & 日付 */}
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 mb-3 sm:mb-5 text-center">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className="text-[10px] sm:text-xs font-black tracking-widest text-[#522500] uppercase"
                  style={{
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  OMOIDE BAKO
                </span>
                {targetDateStr && (
                  <span
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-[#4A2400] shadow-xs"
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: '1px solid rgba(215, 195, 181, 0.7)',
                    }}
                  >
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#6E3902]" />
                    {targetDateStr}
                  </span>
                )}
              </div>

              {/* メインお祝いタイトル */}
              <h1
                className="text-lg sm:text-2xl md:text-3xl font-black text-[#2C1400] tracking-tight relative mt-0.5"
                style={{
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {language === 'ja' ? (
                  <>
                    <span className="text-[#6E3902]">{personName}</span>
                    <span className="font-extrabold text-base sm:text-xl md:text-2xl text-[#381A00] ml-1">{t('countdownTitle')}</span>
                  </>
                ) : (
                  <>
                    <span className="font-extrabold text-base sm:text-xl md:text-2xl text-[#381A00]">{t('countdownTitle')} </span>
                    <span className="text-[#6E3902]">{personName}</span>
                  </>
                )}
                <div className="w-14 sm:w-18 h-0.5 mx-auto mt-1.5 rounded-full bg-[#BEAB4E]/80 shadow-xs" />
              </h1>
            </div>

            {/* ポラロイド風カウントダウンタイマー */}
            <div className="w-full my-1 sm:my-2">
              <CountdownTimer targetDate={nextBirthday.date} />
            </div>

            {/* 下部：残り日数ステータス */}
            <div className="mt-4 sm:mt-6 flex justify-center">
              <div
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs md:text-sm font-black tracking-wide shadow-md"
                style={{
                  background: 'rgba(255, 255, 255, 0.92)',
                  color: '#4A2400',
                  border: '1px solid rgba(215, 195, 181, 0.8)',
                }}
              >
                <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#10B981]" />
                {t('daysUntilCelebration', { count: nextBirthday.daysUntil })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
