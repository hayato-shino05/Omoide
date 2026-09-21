'use client'

import React, { useMemo, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useQuiz } from '@/lib/hooks/useQuiz'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import { useBirthdays } from '@/lib/hooks/useBirthdays'

interface BirthdayQuizProps {
  onClose?: () => void
}

export function BirthdayQuiz({}: BirthdayQuizProps) {
  const { language, t } = useLanguage()
  const {
    questions,
    currentQuestion,
    score,
    isComplete,
    isPlaying,
    selectedAnswer,
    answerQuestion,
    nextQuestion,
    startQuiz,
  } = useQuiz(language)

  const { data: birthdays = [] } = useBirthdays()
  const shouldReduceMotion = useReducedMotion()

  const question = questions[currentQuestion]
  const totalQuestions = questions.length || 5
  const progressPercent = Math.min(
    100,
    Math.round(((currentQuestion + (selectedAnswer !== null ? 1 : 0)) / Math.max(1, totalQuestions)) * 100)
  )

  const handleStart = useCallback(() => {
    startQuiz(birthdays, language)
  }, [startQuiz, birthdays, language])

  // アニメーション設定
  const containerVariants = useMemo(
    () => ({
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    }),
    [shouldReduceMotion]
  )

  // 未開始状態
  if (!isPlaying) {
    return (
      <div className="w-full max-w-lg mx-auto py-2">
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="p-6 sm:p-8 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl shadow-[4px_4px_0_#D4B08C] text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#854D27] text-[#FFF9F3] mb-4 shadow-[2px_2px_0_#D4B08C]">
            <Icon name="HelpCircle" size={28} aria-hidden="true" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#854D27] mb-2 font-heading">
            {t('birthdayQuiz')}
          </h3>

          <p className="text-sm text-[#2C1810]/80 leading-relaxed mb-6 max-w-md mx-auto">
            {t('quizInstructions')}
          </p>

          {birthdays.length < 4 ? (
            <div className="p-4 bg-[#FFEBEE] border-2 border-[#EF9A9A] rounded-lg text-[#C62828] text-sm mb-4 flex items-center justify-center gap-2">
              <Icon name="CircleAlert" size={18} className="shrink-0" />
              <span>{t('quizMinimumPlayers')}</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleStart}
                className="min-h-[44px] px-8 py-3 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] font-semibold text-base cursor-pointer shadow-[4px_4px_0_#D4B08C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
              >
                {t('gameStart')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // クイズ完了画面
  if (isComplete) {
    const isPerfect = score === 100
    return (
      <div className="w-full max-w-lg mx-auto py-2">
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="p-6 sm:p-8 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl shadow-[4px_4px_0_#D4B08C] text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#854D27] text-[#D4B08C] mb-4 shadow-[2px_2px_0_#D4B08C]">
            <Icon name="Trophy" size={32} aria-hidden="true" />
          </div>

          <h3 className="text-2xl font-bold text-[#854D27] mb-2 font-heading">
            {t('quizComplete')}
          </h3>

          <p className="text-sm text-[#854D27]/80 mb-6">
            {isPerfect
              ? '全問正解！みんなの誕生日を完璧に覚えていますね。'
              : 'クイズ挑戦お疲れ様でした！'}
          </p>

          {/* スコアバッジ */}
          <div className="p-4 bg-[#F3E5D8]/50 border border-[#D4B08C] rounded-lg mb-6 max-w-xs mx-auto">
            <div className="text-xs text-[#854D27]/80 font-medium mb-1">{t('gameScore')}</div>
            <div className="text-3xl font-bold text-[#854D27] font-heading">
              {score} <span className="text-base font-normal text-[#854D27]/70">/ 100</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleStart}
              className="min-h-[44px] px-8 py-3 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] font-semibold text-sm cursor-pointer shadow-[3px_3px_0_#D4B08C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
            >
              {t('gameRestart')}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="w-full max-w-lg mx-auto py-2 space-y-4">
      {/* 進捗とスコア */}
      <div className="p-3.5 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-lg shadow-[2px_2px_0_#D4B08C]">
        <div className="flex items-center justify-between text-xs font-semibold text-[#854D27] mb-2">
          <span>
            {t('questionProgress', { current: currentQuestion + 1, total: questions.length })}
          </span>
          <span className="flex items-center gap-1 font-bold">
            <span>{t('gameScore')}:</span>
            <span className="text-sm font-heading">{score}</span>
          </span>
        </div>

        {/* プログレスバー（アクセシブル対応） */}
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="クイズの進捗状況"
          className="h-2 w-full bg-[#D4B08C]/40 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-[#854D27] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 質問カード */}
      <motion.div
        key={currentQuestion}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="p-5 sm:p-6 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl shadow-[3px_3px_0_#D4B08C]"
      >
        <h3 className="text-base sm:text-lg font-bold text-[#854D27] text-center mb-5 font-heading leading-snug">
          {question.question}
        </h3>

        {/* 選択肢リスト */}
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="クイズの選択肢">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrect = index === question.correctAnswer
            const showResult = selectedAnswer !== null

            let stateClasses = 'bg-white/80 text-[#2C1810] border-[#D4B08C] hover:bg-white hover:border-[#854D27]'
            let iconElement = null

            if (showResult) {
              if (isCorrect) {
                stateClasses =
                  'bg-[#E8F5E9] text-[#1B5E20] border-[#2E7D32] shadow-[0_0_8px_rgba(46,125,50,0.25)] font-semibold'
                iconElement = (
                  <Icon name="CheckCircle2" size={18} className="text-[#2E7D32] shrink-0" />
                )
              } else if (isSelected) {
                stateClasses =
                  'bg-[#FFEBEE] text-[#C62828] border-[#C62828] font-semibold'
                iconElement = (
                  <Icon name="CircleAlert" size={18} className="text-[#C62828] shrink-0" />
                )
              } else {
                stateClasses = 'bg-white/40 text-[#2C1810]/50 border-[#D4B08C]/40 opacity-70'
              }
            }

            return (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => answerQuestion(index)}
                disabled={selectedAnswer !== null}
                className={`min-h-[48px] px-4 py-3 border-2 rounded-lg text-left text-sm sm:text-base flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer
                  focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none
                  ${selectedAnswer !== null ? 'cursor-default' : 'active:scale-[0.99]'}
                  ${stateClasses}
                `}
              >
                <span className="flex-1 leading-snug">{option}</span>
                {iconElement}
              </button>
            )
          })}
        </div>

        {/* 次の質問へ進むボタン */}
        {selectedAnswer !== null && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5"
          >
            <button
              type="button"
              onClick={nextQuestion}
              className="w-full min-h-[44px] px-6 py-3 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] font-semibold text-sm sm:text-base cursor-pointer shadow-[3px_3px_0_#D4B08C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
            >
              {currentQuestion < questions.length - 1 ? t('nextQuestion') : t('viewResult')}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
