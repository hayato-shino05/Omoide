'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface FallingPetalsProps {
  count?: number
  active?: boolean
}

interface Petal {
  id: number
  x: number
  size: number
  delay: number
  duration: number
  rotateX: number
  rotateY: number
  rotateZ: number
  swayAmount: number
  colorVariant: PetalColor
  flipSpeed: number
}

interface PetalColor {
  main: string
  light: string
  dark: string
}

// 実際の桜の花びらのカラーバリエーション
const PETAL_COLORS: PetalColor[] = [
  // 薄ピンク（ソメイヨシノ・定番）
  { main: '#FFB7C5', light: '#FFC8D3', dark: '#FF9EB5' },
  // 濃いめのピンク
  { main: '#FFA0B4', light: '#FFB8C8', dark: '#FF87A0' },
  // 白みがかったピンク
  { main: '#FFE4E9', light: '#FFF0F3', dark: '#FFD4DC' },
  // ピーチピンク
  { main: '#FFCCD5', light: '#FFDDE3', dark: '#FFBAC5' },
  // 薄紫がかったピンク（ヤエザクラ）
  { main: '#F8BBD9', light: '#FACCE3', dark: '#F5A3CB' },
]

export function FallingPetals({ count = 30, active = true }: FallingPetalsProps) {
  const [petals, setPetals] = useState<Petal[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!active || prefersReducedMotion) return

    // 一括生成ではなく花びらを継続的に生成
    const createSinglePetal = (): Petal => ({
      id: Date.now() + Math.random() * 10000,
      x: Math.random() * 100,
      size: 12 + Math.random() * 16,
      delay: 0, // 時間差スポーン前提のため遅延なし
      duration: 10 + Math.random() * 8,
      rotateX: Math.random() * 360,
      rotateY: Math.random() * 360,
      rotateZ: Math.random() * 360,
      swayAmount: 15 + Math.random() * 25,
      colorVariant: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      flipSpeed: 2 + Math.random() * 3,
    })

    // 初期花びらは画面中ほどにランダム配置
    const initialPetals: Petal[] = Array.from({ length: Math.floor(count * 0.6) }, () => ({
      ...createSinglePetal(),
      delay: Math.random() * 3, // 同時出現を避ける小さな遅延
    }))
    const initialTimeout = setTimeout(() => setPetals(initialPetals), 0)

    // バックグラウンドタブ時に生成を一時停止してCPU負荷を軽減
    let isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 花びらを継続的にスポーン
    const spawnInterval = setInterval(() => {
      if (!isVisible) return
      setPetals(prev => {
        if (prev.length >= count * 1.5) {
          return prev
        }
        const newCount = Math.random() > 0.5 ? 2 : 1
        const newPetals = Array.from({ length: newCount }, () => createSinglePetal())
        return [...prev, ...newPetals]
      })
    }, 800 + Math.random() * 600)

    // 寿命が尽きた花びらを一括除去
    const cleanupInterval = setInterval(() => {
      if (!isVisible) return
      setPetals(prev => {
        const now = Date.now()
        return prev.filter(p => now - p.id < (p.duration + p.delay) * 1000 + 2000)
      })
    }, 3000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(spawnInterval)
      clearInterval(cleanupInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [active, count, prefersReducedMotion])

  if (!active || prefersReducedMotion) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden" style={{ contain: 'layout style paint' }}>
      <AnimatePresence>
        {petals.map((petal) => (
          <PetalElement key={petal.id} petal={petal} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface PetalElementProps {
  petal: Petal
}

function PetalElement({ petal }: PetalElementProps) {
  const id = useId().replaceAll(':', '')

  // 自然な揺れのキーフレームを生成
  const swayKeyframes = useMemo(() => {
    const baseX = petal.x
    return [
      `${baseX}vw`,
      `${baseX + petal.swayAmount * 0.4}vw`,
      `${baseX - petal.swayAmount * 0.3}vw`,
      `${baseX + petal.swayAmount * 0.5}vw`,
      `${baseX - petal.swayAmount * 0.2}vw`,
      `${baseX + petal.swayAmount * 0.3}vw`,
      `${baseX - petal.swayAmount * 0.4}vw`,
      `${baseX + petal.swayAmount * 0.2}vw`,
    ]
  }, [petal.x, petal.swayAmount])

  return (
    <motion.div
      initial={{
        x: `${petal.x}vw`,
        y: '-5vh',
        opacity: 0,
        rotateX: petal.rotateX,
        rotateY: petal.rotateY,
        rotateZ: petal.rotateZ,
      }}
      animate={{
        y: '110vh',
        opacity: [0, 0.9, 0.9, 0.85, 0.8, 0],
        x: swayKeyframes,
        rotateX: [petal.rotateX, petal.rotateX + 720],
        rotateY: [petal.rotateY, petal.rotateY + 540],
        rotateZ: [petal.rotateZ, petal.rotateZ + 360],
      }}
      transition={{
        duration: petal.duration,
        delay: petal.delay,
        ease: 'linear',
        x: {
          duration: petal.duration,
          ease: 'easeInOut',
          times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
        },
        rotateX: {
          duration: petal.flipSpeed,
          repeat: Math.floor(petal.duration / petal.flipSpeed),
          ease: 'linear',
        },
        rotateY: {
          duration: petal.flipSpeed * 1.3,
          repeat: Math.floor(petal.duration / (petal.flipSpeed * 1.3)),
          ease: 'linear',
        },
        rotateZ: {
          duration: petal.flipSpeed * 0.8,
          repeat: Math.floor(petal.duration / (petal.flipSpeed * 0.8)),
          ease: 'linear',
        },
      }}
      className="absolute"
      style={{
        width: petal.size,
        height: petal.size,
        transformStyle: 'preserve-3d',
        filter: `drop-shadow(0 2px 3px rgba(255, 182, 193, 0.4))`,
        willChange: 'transform, opacity',
      }}
    >
      <SakuraPetal size={petal.size} colors={petal.colorVariant} id={id} />
    </motion.div>
  )
}

interface SakuraPetalProps {
  size: number
  colors: PetalColor
  id: string
}

// リアルな5弁桜のSVG
function SakuraPetal({ size, colors, id }: SakuraPetalProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: 'rotateX(60deg)' }}
    >
      <defs>
        {/* 花びら用グラデーション */}
        <radialGradient id={`petal-gradient-${id}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="50%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.dark} />
        </radialGradient>
        {/* 花芯用グラデーション */}
        <radialGradient id={`center-gradient-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFACD" />
          <stop offset="70%" stopColor="#FFE4B5" />
          <stop offset="100%" stopColor="#FFD700" />
        </radialGradient>
      </defs>

      {/* 先端に欠けがある特徴的な5枚の桜花びら */}
      <g>
        {/* 花びら1（上） */}
        <path
          d="M25 5
             Q28 8 30 12
             Q32 16 30 20
             Q28 22 25 22
             Q22 22 20 20
             Q18 16 20 12
             Q22 8 25 5
             M25 5 Q24 3 25 2 Q26 3 25 5"
          fill={`url(#petal-gradient-${id})`}
        />
        {/* 花びら2（右上） */}
        <path
          d="M38 12
             Q42 14 44 18
             Q45 22 42 25
             Q39 27 35 26
             Q32 25 30 22
             Q29 18 32 15
             Q35 12 38 12
             M38 12 Q40 10 42 11 Q40 12 38 12"
          fill={`url(#petal-gradient-${id})`}
        />
        {/* 花びら3（右下） */}
        <path
          d="M42 32
             Q44 36 43 40
             Q41 44 37 45
             Q33 45 30 42
             Q28 39 29 35
             Q31 31 35 30
             Q39 29 42 32
             M42 32 Q44 31 45 33 Q43 33 42 32"
          fill={`url(#petal-gradient-${id})`}
        />
        {/* 花びら4（左下） */}
        <path
          d="M8 32
             Q11 29 15 30
             Q19 31 21 35
             Q22 39 20 42
             Q17 45 13 45
             Q9 44 7 40
             Q6 36 8 32
             M8 32 Q6 31 5 33 Q7 33 8 32"
          fill={`url(#petal-gradient-${id})`}
        />
        {/* 花びら5（左上） */}
        <path
          d="M12 12
             Q15 12 18 15
             Q21 18 20 22
             Q18 25 15 26
             Q11 27 8 25
             Q5 22 6 18
             Q8 14 12 12
             M12 12 Q10 10 8 11 Q10 12 12 12"
          fill={`url(#petal-gradient-${id})`}
        />
      </g>

      {/* 中央の花芯 */}
      <circle cx="25" cy="25" r="5" fill={`url(#center-gradient-${id})`} />

      {/* 花芯の小さな点 */}
      <circle cx="23" cy="23" r="1" fill="#FFB347" />
      <circle cx="27" cy="23" r="1" fill="#FFB347" />
      <circle cx="25" cy="27" r="1" fill="#FFB347" />
      <circle cx="23" cy="26" r="0.8" fill="#FFA500" />
      <circle cx="27" cy="26" r="0.8" fill="#FFA500" />

      {/* 花びらのハイライト */}
      <ellipse cx="24" cy="12" rx="3" ry="4" fill="white" opacity="0.25" />
      <ellipse cx="38" cy="20" rx="3" ry="2" fill="white" opacity="0.2" />
    </svg>
  )
}
