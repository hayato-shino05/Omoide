'use client'

import { motion } from 'framer-motion'
import { Candle } from './Candle'

interface Cake2DProps {
  candlesBlown: boolean[]
  onCandleBlown?: (index: number) => void
}

// 日本の伝統的な生クリーム苺ショートケーキ（Nama Cream Shortcake）コンポーネント
export function Cake2D({ candlesBlown, onCandleBlown }: Cake2DProps) {
  const candleCount = 5

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-sm mx-auto flex flex-col items-center select-none"
    >
      {/* ふんわりとした浮遊微アニメーションでケーキ全体を包み込む */}
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative flex flex-col items-center w-full"
        style={{ willChange: 'transform' }}
      >
        {/* 最上段：ろうそく＆生クリーム苺デコレーション */}
        <div className="relative z-20 flex flex-col items-center">
          {/* ろうそく配置（上段ケーキの上面に底面を自然に接地） */}
          <div className="relative -mb-2 z-30 flex justify-around w-40 sm:w-44 px-2 pointer-events-auto">
            {Array.from({ length: candleCount }).map((_, index) => (
              <Candle
                key={index}
                isBlown={candlesBlown[index]}
                delay={0.4 + index * 0.1}
                onBlown={() => onCandleBlown?.(index)}
              />
            ))}
          </div>

          {/* 苺のトッピング */}
          <div className="relative -mb-3 z-20 flex justify-center gap-3 sm:gap-4 px-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, y: -10 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 300 }}
                className="relative flex items-center justify-center filter drop-shadow-md"
              >
                {/* 苺の果実 */}
                <div className="w-5 h-6 sm:w-6 sm:h-7 rounded-t-full rounded-b-2xl bg-gradient-to-b from-[#E53935] via-[#C62828] to-[#B71C1C] relative overflow-hidden">
                  <div className="absolute top-1 left-1.5 w-1 h-1.5 rounded-full bg-white/60 transform -rotate-12" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#43A047] rounded-full" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* 上段ケーキ層（スポンジ＆生クリーム） */}
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="w-40 sm:w-48 h-16 sm:h-18 rounded-2xl sm:rounded-3xl relative overflow-hidden shadow-lg border border-white/80"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F0 45%, #FBE8A6 50%, #F5D77F 80%, #FFFFFF 100%)',
              boxShadow: '0 8px 20px -4px rgba(68, 36, 17, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
            }}
          >
            {/* 上段の絞り出し生クリーム飾り */}
            <div className="absolute top-0 inset-x-0 h-3 flex justify-around px-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              ))}
            </div>
          </motion.div>
        </div>

        {/* 下段ケーキ層（大きめの生クリームスポンジ層） */}
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-60 sm:w-72 h-20 sm:h-24 rounded-2xl sm:rounded-3xl -mt-2 overflow-hidden shadow-xl border border-white/80"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 35%, #FBE8A6 40%, #F5D77F 75%, #FFFFFF 100%)',
            boxShadow: '0 12px 30px -6px rgba(68, 36, 17, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.95)',
          }}
        >
          {/* 下段の絞り出し生クリーム＆サンドされた苺スライス */}
          <div className="absolute top-0 inset-x-0 h-4 flex justify-around px-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-white shadow-xs" />
            ))}
          </div>

          <div className="absolute inset-x-0 top-9 flex justify-around px-4 opacity-90">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-2.5 rounded-full bg-[#D32F2F] shadow-xs" />
            ))}
          </div>
        </motion.div>

        {/* ケーキプレート（陶器製のお皿 - 小画面でもはみ出さないレスポンシブ幅） */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="w-full max-w-[270px] sm:max-w-[320px] h-5 sm:h-6 -mt-2 rounded-full border-2 border-[#D4B08C]/60 shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F5EBE1 100%)',
            boxShadow: '0 16px 36px -8px rgba(45, 27, 17, 0.45)',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
