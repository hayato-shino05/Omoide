'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cake2D } from './Cake2D'
import { BlowButton } from './BlowButton'
import { Confetti } from './Confetti'
import { Balloons } from './Balloons'
import { Fireworks } from './Fireworks'
import { useMicrophone } from '@/lib/hooks/useMicrophone'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'

interface BirthdayCakeProps {
  candleCount?: number
  onAllCandlesBlown?: () => void
}

// 誕生日ケーキメインコンポーネント
export function BirthdayCake({ candleCount = 5, onAllCandlesBlown }: BirthdayCakeProps) {
  const [candlesBlown, setCandlesBlown] = useState<boolean[]>(Array(candleCount).fill(false))
  const [showEffects, setShowEffects] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const { t } = useLanguage()

  const allCandlesBlown = candlesBlown.every((blown) => blown)

  // ろうそくを吹く処理
  const blowCandle = useCallback(() => {
    setCandlesBlown((prev) => {
      const nextUnblown = prev.findIndex((blown) => !blown)
      if (nextUnblown === -1) return prev

      const newState = [...prev]
      newState[nextUnblown] = true

      // 全部消えたらエフェクト発動
      if (newState.every((blown) => blown)) {
        setShowEffects(true)
        onAllCandlesBlown?.()
      }

      return newState
    })
  }, [onAllCandlesBlown])

  // マイク入力処理
  const { isListening, audioLevel, requestPermission, startListening, stopListening } = useMicrophone({
    onBlowDetected: blowCandle,
    threshold: 0.4,
    debounceMs: 650,
  })

  // すべてのろうそくが消灯したらマイクを自動停止
  useEffect(() => {
    if (allCandlesBlown && isListening) {
      stopListening()
    }
  }, [allCandlesBlown, isListening, stopListening])

  // マイク有効化
  const handleEnableMic = async () => {
    const granted = await requestPermission()
    if (granted) {
      setMicEnabled(true)
      startListening()
    }
  }

  // ボタンでろうそくを吹く
  const handleBlowClick = () => {
    blowCandle()
  }

  return (
    <div className="relative">
      {/* エフェクト */}
      <Confetti active={showEffects} count={50} />
      <Balloons active={showEffects} count={15} />
      <Fireworks active={showEffects} count={8} />

      {/* ケーキ */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="flex flex-col items-center gap-8"
      >
        <Cake2D candlesBlown={candlesBlown} onCandleBlown={blowCandle} />

        {/* マイク権限ボタン */}
        {!micEnabled && !allCandlesBlown && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={handleEnableMic}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-colors cursor-pointer"
            style={{ color: '#ffffff' }}
          >
            <span
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              className="inline-flex items-center gap-2"
            >
              <Icon name="Mic" size={18} />
              {t('useMicrophone')}
            </span>
          </motion.button>
        )}

        {/* 音声レベルインジケーター */}
        {isListening && !allCandlesBlown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-48 h-2 bg-[#D4B08C]/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#D95D39] rounded-full"
                style={{ width: `${audioLevel * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-sm text-[#854D27]/80">{t('blowToMic')}</p>
          </motion.div>
        )}

        {/* 吹くボタン */}
        <BlowButton onClick={handleBlowClick} allCandlesBlown={allCandlesBlown} />

        {/* 全部消えた時のメッセージ */}
        {allCandlesBlown && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-3xl font-extrabold text-[#D95D39] tracking-tight">
              {t('congratulations')}
            </h3>
            <p className="mt-2 text-lg text-[#854D27]/90 font-medium">
              {t('allWishesComeTrue')}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
