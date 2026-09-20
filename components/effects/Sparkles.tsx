'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface SparklesProps {
  active: boolean
  count?: number
  colors?: string[]
}

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
}

export function Sparkles({ active, count = 30, colors = ['#FFD700', '#FFFFFF', '#FFF8DC'] }: SparklesProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  const createSparkle = useCallback((): Sparkle => {
    return {
      id: Date.now() + Math.random() * 10000,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.5,
    }
  }, [colors])

  useEffect(() => {
    if (!active || prefersReducedMotion) {
      const raf = requestAnimationFrame(() => setSparkles([]))
      return () => cancelAnimationFrame(raf)
    }

    const initialRaf = requestAnimationFrame(() => {
      setSparkles(Array.from({ length: count }, createSparkle))
    })

    const interval = setInterval(() => {
      setSparkles(prev => {
        const filtered = prev.filter(() => Math.random() > 0.1)
        const newCount = count - filtered.length
        const newSparkles = Array.from({ length: newCount }, createSparkle)
        return [...filtered, ...newSparkles]
      })
    }, 500)

    return () => {
      cancelAnimationFrame(initialRaf)
      clearInterval(interval)
    }
  }, [active, count, createSparkle, prefersReducedMotion])

  // reduced-motion 時は描画もループも停止
  if (prefersReducedMotion) return null

  if (!active) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden" style={{ contain: 'layout style paint' }}>
      <AnimatePresence>
        {sparkles.map((sparkle, i) => (
          <motion.div
            key={sparkle.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1.2, 0],
              rotate: [0, 180, 360],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: sparkle.duration,
              delay: sparkle.delay,
              repeat: Infinity,
              repeatDelay: ((i * 37) % 100) / 50,
            }}
            className="absolute"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              willChange: 'transform, opacity',
            }}
          >
            <svg width={sparkle.size} height={sparkle.size} viewBox="0 0 24 24" fill={sparkle.color}>
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
