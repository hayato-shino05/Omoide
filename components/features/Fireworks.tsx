'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FireworksProps {
  active: boolean
  count?: number
}

interface Firework {
  id: number
  x: number
  y: number
  color: string
  delay: number
}

// 花火コンポーネント
export function Fireworks({ active, count = 8 }: FireworksProps) {
  const [fireworks, setFireworks] = useState<Firework[]>([])

  useEffect(() => {
    if (active) {
      const colors = ['#ff0000', '#ffd700', '#00ff00', '#00bfff', '#ff1493', '#ff8c00']
      const timers: NodeJS.Timeout[] = []

      const createFireworks = () => {
        const newFireworks = Array.from({ length: count }, (_, i) => ({
          id: Date.now() + i,
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: i * 0.5,
        }))

        setFireworks(newFireworks)

        const timer = setTimeout(() => {
          setFireworks([])
        }, count * 500 + 2000)
        timers.push(timer)
      }

      createFireworks()

      // 複数回花火を打ち上げる
      const interval = setInterval(createFireworks, 3000)

      return () => {
        clearInterval(interval)
        timers.forEach((t) => clearTimeout(t))
      }
    }
  }, [active, count])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" style={{ contain: 'layout style paint' }}>
      <AnimatePresence>
        {fireworks.map((firework) => (
          <div
            key={firework.id}
            className="absolute"
            style={{
              left: `${firework.x}%`,
              top: `${firework.y}%`,
            }}
          >
            {/* 花火の粒子 */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 360) / 12
              const distance = 50 + Math.random() * 30

              return (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * distance,
                    y: Math.sin((angle * Math.PI) / 180) * distance,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: firework.delay,
                    ease: 'easeOut',
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: firework.color,
                    boxShadow: `0 0 10px ${firework.color}`,
                    willChange: 'transform, opacity',
                  }}
                />
              )
            })}

            {/* 中心の光 */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 2, 0],
                opacity: [1, 0.8, 0],
              }}
              transition={{
                duration: 1.5,
                delay: firework.delay,
                ease: 'easeOut',
              }}
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                backgroundColor: firework.color,
                boxShadow: `0 0 30px ${firework.color}`,
                filter: 'blur(4px)',
                willChange: 'transform, opacity',
              }}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
