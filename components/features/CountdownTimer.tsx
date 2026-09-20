'use client'

import React, { useEffect, useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTimeUntilBirthday } from '@/lib/utils/birthday'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface CountdownTimerProps {
  targetDate: Date
  onComplete?: () => void
}

// ポラロイド風ミニフォトカードによるカウントダウンタイマーコンポーネント（モバイルコンパクト最適化版）
export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  // クライアント側でのみ時間計算を実行（SSR ではゼロ値）
  const [timeLeft, setTimeLeft] = useState(() =>
    typeof window === 'undefined'
      ? { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false }
      : getTimeUntilBirthday(targetDate)
  )
  const { t } = useLanguage()

  useEffect(() => {
    const raf = requestAnimationFrame(() => setTimeLeft(getTimeUntilBirthday(targetDate)))
    return () => cancelAnimationFrame(raf)
  }, [targetDate])

  useEffect(() => {
    if (!mounted) return

    const timer = setInterval(() => {
      const newTimeLeft = getTimeUntilBirthday(targetDate)
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.isExpired && onComplete) {
        onComplete()
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onComplete, mounted])

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-5 justify-items-center max-w-[620px] mx-auto">
        <PolaroidPlaceholder label={t('days')} tapeStyle="tape-1" />
        <PolaroidPlaceholder label={t('hours')} tapeStyle="tape-2" />
        <PolaroidPlaceholder label={t('minutes')} tapeStyle="tape-3" />
        <PolaroidPlaceholder label={t('seconds')} tapeStyle="tape-4" />
      </div>
    )
  }

  if (timeLeft.isExpired) {
    return null
  }

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-5 justify-items-center max-w-[620px] mx-auto">
      <PolaroidUnit
        value={timeLeft.days}
        label={t('days')}
        tapeStyle="tape-1"
        hoverRotate={1.5}
      />
      <PolaroidUnit
        value={timeLeft.hours}
        label={t('hours')}
        tapeStyle="tape-2"
        hoverRotate={-1.5}
      />
      <PolaroidUnit
        value={timeLeft.minutes}
        label={t('minutes')}
        tapeStyle="tape-3"
        hoverRotate={2}
      />
      <PolaroidUnit
        value={timeLeft.seconds}
        label={t('seconds')}
        tapeStyle="tape-4"
        hoverRotate={-2}
        isSeconds
      />
    </div>
  )
}

interface PolaroidUnitProps {
  value: number
  label: string
  tapeStyle: 'tape-1' | 'tape-2' | 'tape-3' | 'tape-4'
  hoverRotate: number
  isSeconds?: boolean
}

const PolaroidUnit = React.memo(function PolaroidUnit({ value, label, tapeStyle, hoverRotate, isSeconds = false }: PolaroidUnitProps) {
  const formattedValue = String(value).padStart(2, '0')

  // 和紙テープのスタイルバリエーション（モバイル対応の比率）
  const getTapeStyle = () => {
    switch (tapeStyle) {
      case 'tape-1':
        return {
          background: 'rgba(215, 195, 181, 0.9)',
          transform: 'rotate(-12deg)',
          top: '-6px',
          left: '-4px',
        }
      case 'tape-2':
        return {
          background: 'rgba(202, 178, 86, 0.8)',
          transform: 'rotate(10deg)',
          top: '-6px',
          right: '-4px',
        }
      case 'tape-3':
        return {
          background: 'rgba(215, 195, 181, 0.9)',
          transform: 'rotate(15deg)',
          top: '-6px',
          left: '-3px',
        }
      case 'tape-4':
        return {
          background: 'rgba(202, 178, 86, 0.8)',
          transform: 'rotate(-10deg)',
          top: '-6px',
          right: '-3px',
        }
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4, rotate: hoverRotate }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative group w-full max-w-[76px] sm:max-w-[110px] md:max-w-[130px] flex flex-col items-center"
    >
      {/* 和紙テープ装飾 */}
      <div
        className="absolute z-20 pointer-events-none rounded-2xs shadow-2xs w-6 sm:w-9 md:w-10 h-2.5 sm:h-3.5"
        style={getTapeStyle()}
      />

      {/* ポラロイド写真風カード */}
      <div
        className="w-full bg-white/95 backdrop-blur-md p-1.5 pb-2 sm:p-2.5 sm:pb-3.5 md:p-3 md:pb-4 rounded-xs flex flex-col items-center transition-all duration-300"
        style={{
          boxShadow: '0 6px 18px -3px rgba(44, 24, 16, 0.2), 0 2px 4px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* 写真スロット */}
        <div
          className="w-full aspect-square flex items-center justify-center rounded-2xs mb-1 sm:mb-2"
          style={{
            background: 'linear-gradient(145deg, #FAF5E4 0%, #F5ECCB 100%)',
            border: '1px dashed rgba(109, 94, 0, 0.35)',
            boxShadow: 'inset 0 1px 3px rgba(74, 36, 0, 0.08)',
          }}
        >
          <AnimatePresence mode="popLayout">
            <motion.span
              key={formattedValue}
              initial={{ opacity: 0, y: isSeconds ? -3 : 0, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isSeconds ? 3 : 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="font-black text-[#2C1400] tracking-tight select-none"
              style={{
                fontFamily: 'var(--font-heading), ui-sans-serif, system-ui',
                fontSize: 'clamp(1.15rem, 4.2vw, 2.3rem)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {formattedValue}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* ラベル */}
        <span
          className="text-[9px] sm:text-xs md:text-sm font-black tracking-wider sm:tracking-widest text-[#522500] uppercase"
          style={{
            fontFamily: 'var(--font-body), sans-serif',
          }}
        >
          {label}
        </span>
      </div>
    </motion.div>
  )
})

const PolaroidPlaceholder = React.memo(function PolaroidPlaceholder({ label, tapeStyle }: { label: string; tapeStyle: 'tape-1' | 'tape-2' | 'tape-3' | 'tape-4' }) {
  void tapeStyle
  return (
    <div className="relative w-full max-w-[76px] sm:max-w-[110px] md:max-w-[130px] flex flex-col items-center">
      <div
        className="w-full bg-white p-1.5 pb-2 sm:p-2.5 sm:pb-3.5 md:p-3 md:pb-4 rounded-xs flex flex-col items-center"
        style={{
          boxShadow: '0 6px 18px -3px rgba(44, 24, 16, 0.16)',
        }}
      >
        <div
          className="w-full aspect-square flex items-center justify-center rounded-2xs mb-1 sm:mb-2"
          style={{
            background: '#FAF5E4',
            border: '1px dashed rgba(109, 94, 0, 0.35)',
          }}
        >
          <span
            className="font-black text-[#2C1400]/30"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.15rem, 4.2vw, 2.3rem)',
            }}
          >
            --
          </span>
        </div>
        <span className="text-[9px] sm:text-xs md:text-sm font-black text-[#522500]">
          {label}
        </span>
      </div>
    </div>
  )
})
