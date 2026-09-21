'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useMemoryGame } from '@/lib/hooks/useMemoryGame'
import { useMemoryDecks, type MemoryDeck } from '@/lib/hooks/useMemoryDecks'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'
import { MemoryCard } from './MemoryCard'

interface MemoryGameProps {
  onClose: () => void
}

export function MemoryGame({ onClose }: MemoryGameProps) {
  const { decks, defaultDeck } = useMemoryDecks()
  const [selectedDeck, setSelectedDeck] = useState<MemoryDeck>(defaultDeck)
  const shouldReduceMotion = useReducedMotion()

  const {
    cards,
    score,
    moves,
    isComplete,
    isPlaying,
    timeElapsed,
    flipCard,
    startGame,
    resetGame,
  } = useMemoryGame(selectedDeck.cards)

  const { t } = useLanguage()

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleStartWithDeck = useCallback(
    (deck: MemoryDeck) => {
      setSelectedDeck(deck)
      startGame(deck.cards)
    },
    [startGame]
  )

  const handleRestart = useCallback(() => {
    startGame(selectedDeck.cards)
  }, [startGame, selectedDeck])

  // アニメーション設定
  const containerVariants = useMemo(
    () => ({
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    }),
    [shouldReduceMotion]
  )

  return (
    <div className="w-full max-w-lg mx-auto py-2">
      {/* ゲームステータスヘッダー */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 p-3.5 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-lg shadow-[2px_2px_0_#D4B08C]">
        <div className="flex-1 text-center border-r border-[#D4B08C]/40 last:border-none">
          <div className="text-xl sm:text-2xl font-bold text-[#854D27] leading-tight font-heading">
            {score}
          </div>
          <div className="text-xs text-[#854D27]/80 font-medium">{t('gameScore')}</div>
        </div>

        <div className="flex-1 text-center border-r border-[#D4B08C]/40 last:border-none">
          <div className="text-xl sm:text-2xl font-bold text-[#854D27] leading-tight font-heading">
            {moves}
          </div>
          <div className="text-xs text-[#854D27]/80 font-medium">{t('moves')}</div>
        </div>

        <div className="flex-1 text-center">
          <div className="text-xl sm:text-2xl font-bold text-[#854D27] leading-tight font-heading flex items-center justify-center gap-1">
            <Icon name="Clock" size={16} className="text-[#854D27]/70" aria-hidden="true" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
          <div className="text-xs text-[#854D27]/80 font-medium">{t('gameTime')}</div>
        </div>
      </div>

      {/* ゲーム開始前画面（デッキ選択 ＆ 説明） */}
      {!isPlaying ? (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="p-6 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl shadow-[4px_4px_0_#D4B08C] text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#854D27] text-[#FFF9F3] mb-3 shadow-[2px_2px_0_#D4B08C]">
            <Icon name="Brain" size={24} aria-hidden="true" />
          </div>

          <h3 className="text-xl font-bold text-[#854D27] mb-2 font-heading">
            {t('memoryGame')}
          </h3>

          <p className="text-sm text-[#2C1810]/80 leading-relaxed mb-6 max-w-sm mx-auto">
            {t('memoryGameInstructions')}
          </p>

          {/* デッキ選択エリア */}
          {decks && decks.length > 0 && (
            <div className="mb-6 text-left">
              <label className="block text-xs font-semibold text-[#854D27] mb-2.5 uppercase tracking-wider">
                カードテーマ
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {decks.map((deck) => {
                  const isSelected = selectedDeck.id === deck.id
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => setSelectedDeck(deck)}
                      className={`min-h-[44px] p-3 rounded-lg border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between
                        focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none
                        ${
                          isSelected
                            ? 'bg-[#854D27] text-[#FFF9F3] border-[#854D27] shadow-[2px_2px_0_#D4B08C]'
                            : 'bg-white/80 text-[#854D27] border-[#D4B08C] hover:bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs">{deck.title}</span>
                        {isSelected && (
                          <Icon name="CheckCircle2" size={14} className="text-[#D4B08C]" />
                        )}
                      </div>
                      <div className="text-base tracking-wider truncate" aria-hidden="true">
                        {deck.cards.slice(0, 4).join(' ')}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => handleStartWithDeck(selectedDeck)}
              className="min-h-[44px] px-8 py-3 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] font-semibold text-base cursor-pointer shadow-[4px_4px_0_#D4B08C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
            >
              {t('gameStart')}
            </button>
          </div>
        </motion.div>
      ) : isComplete ? (
        /* ゲームクリア勝利画面 */
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
            {t('gameWin')}
          </h3>

          <p className="text-sm text-[#854D27]/80 mb-6">
            すべてのペアを揃えました！素晴らしい記憶力です。
          </p>

          <div className="grid grid-cols-3 gap-3 p-4 bg-[#F3E5D8]/40 border border-[#D4B08C] rounded-lg mb-6 max-w-sm mx-auto">
            <div>
              <div className="text-xs text-[#854D27]/70">{t('gameScore')}</div>
              <div className="text-lg font-bold text-[#854D27]">{score}</div>
            </div>
            <div>
              <div className="text-xs text-[#854D27]/70">{t('moves')}</div>
              <div className="text-lg font-bold text-[#854D27]">{moves}</div>
            </div>
            <div>
              <div className="text-xs text-[#854D27]/70">{t('gameTime')}</div>
              <div className="text-lg font-bold text-[#854D27]">{formatTime(timeElapsed)}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleRestart}
              className="min-h-[44px] px-6 py-3 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] font-semibold text-sm cursor-pointer shadow-[3px_3px_0_#D4B08C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
            >
              {t('gameRestart')}
            </button>
            <button
              type="button"
              onClick={resetGame}
              className="min-h-[44px] px-6 py-3 bg-white text-[#854D27] border-2 border-[#D4B08C] font-semibold text-sm cursor-pointer shadow-[3px_3px_0_#D4B08C] hover:bg-[#FFF9F3] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
            >
              テーマ変更
            </button>
          </div>
        </motion.div>
      ) : (
        /* ゲームボード */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[#854D27] flex items-center gap-1.5">
              <span>テーマ:</span>
              <span className="font-bold">{selectedDeck.title}</span>
            </span>
            <button
              type="button"
              onClick={resetGame}
              className="text-xs text-[#854D27]/80 hover:text-[#854D27] underline cursor-pointer p-1 focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none rounded"
            >
              ゲームを中断して戻る
            </button>
          </div>

          <div
            className="grid grid-cols-4 gap-2 sm:gap-3 p-3 bg-[#F3E5D8]/40 border-2 border-[#D4B08C] rounded-xl shadow-[3px_3px_0_#D4B08C]"
            role="grid"
            aria-label="記憶ゲームのカードグリッド"
          >
            {cards.map((card, index) => (
              <div key={card.id} role="gridcell" className="w-full flex items-center justify-center">
                <MemoryCard
                  index={index}
                  emoji={card.emoji}
                  isFlipped={card.isFlipped || card.isMatched}
                  isMatched={card.isMatched}
                  onClick={() => flipCard(card.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
