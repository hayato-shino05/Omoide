'use client'

import React, { useMemo, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { usePuzzleGame } from '@/lib/hooks/usePuzzleGame'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Icon } from '@/components/ui/Icon'

interface PuzzleGameProps {
  onClose?: () => void
}

export function PuzzleGame({}: PuzzleGameProps) {
  const { pieces, moves, isComplete, isPlaying, timeElapsed, movePiece, startGame, resetGame } =
    usePuzzleGame()
  const { t } = useLanguage()
  const shouldReduceMotion = useReducedMotion()

  const gridSize = 3
  const emptyId = gridSize * gridSize - 1

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const sortedPieces = useMemo(
    () => [...pieces].sort((a, b) => a.currentPos - b.currentPos),
    [pieces]
  )

  const handleStart = useCallback(() => {
    startGame(3)
  }, [startGame])

  // アニメーション設定
  const containerVariants = useMemo(
    () => ({
      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    }),
    [shouldReduceMotion]
  )

  return (
    <div className="w-full max-w-md mx-auto py-2">
      {/* ステータスバー */}
      <div className="flex items-center justify-between gap-4 mb-4 p-3.5 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-lg shadow-[2px_2px_0_#D4B08C]">
        <div className="flex-1 text-center border-r border-[#D4B08C]/40">
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

      {/* ゲーム開始前画面 */}
      {!isPlaying ? (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="p-6 sm:p-8 bg-[#FFF9F3] border-2 border-[#D4B08C] rounded-xl shadow-[4px_4px_0_#D4B08C] text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#854D27] text-[#FFF9F3] mb-4 shadow-[2px_2px_0_#D4B08C]">
            <Icon name="Puzzle" size={28} aria-hidden="true" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#854D27] mb-2 font-heading">
            {t('puzzleGame')}
          </h3>

          <p className="text-sm text-[#2C1810]/80 leading-relaxed mb-6 max-w-sm mx-auto">
            {t('puzzleGameInstructions')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleStart}
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
            数字パズルを完成させました！お見事です。
          </p>

          <div className="grid grid-cols-2 gap-3 p-4 bg-[#F3E5D8]/50 border border-[#D4B08C] rounded-lg mb-6 max-w-xs mx-auto">
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
              onClick={handleStart}
              className="min-h-[44px] px-8 py-3 bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] font-semibold text-sm cursor-pointer shadow-[3px_3px_0_#D4B08C] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#D4B08C] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
            >
              {t('gameRestart')}
            </button>
          </div>
        </motion.div>
      ) : (
        /* パズル盤面（寄木細工風） */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-[#854D27]/90 font-medium">
              1〜8 の数字を順番通りに並べ替えてください
            </span>
            <button
              type="button"
              onClick={resetGame}
              className="text-xs text-[#854D27]/80 hover:text-[#854D27] underline cursor-pointer p-1 focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none rounded"
            >
              リセット
            </button>
          </div>

          <div
            className="grid grid-cols-3 gap-2.5 p-3.5 bg-[#854D27]/10 border-2 border-[#D4B08C] rounded-xl shadow-[3px_3px_0_#D4B08C]"
            role="grid"
            aria-label="スライドパズル盤面"
          >
            {sortedPieces.map((piece) => {
              const isEmpty = piece.id === emptyId
              const tileNumber = piece.id + 1

              if (isEmpty) {
                return (
                  <div
                    key={piece.id}
                    role="gridcell"
                    aria-hidden="true"
                    className="w-full aspect-square min-h-[56px] min-w-[56px] rounded-lg bg-[#D4B08C]/15 border-2 border-dashed border-[#D4B08C]/40"
                  />
                )
              }

              return (
                <div key={piece.id} role="gridcell" className="w-full flex items-center justify-center">
                  <motion.button
                    type="button"
                    onClick={() => movePiece(piece.id)}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                    aria-label={`ピース ${tileNumber}`}
                    className="w-full aspect-square min-h-[56px] min-w-[56px] rounded-lg bg-[#854D27] text-[#FFF9F3] border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] flex items-center justify-center cursor-pointer select-none transition-shadow duration-150 hover:shadow-[3px_3px_0_#D4B08C] active:shadow-none focus-visible:ring-2 focus-visible:ring-[#854D27] focus-visible:outline-none"
                  >
                    <span className="font-heading text-2xl sm:text-3xl font-bold filter drop-shadow-sm">
                      {tileNumber}
                    </span>
                  </motion.button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
