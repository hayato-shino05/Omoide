'use client'

import { motion } from 'framer-motion'

interface ChristmasLightsProps {
  active: boolean
  count?: number
}

const COLORS = ['#FF0000', '#00FF00', '#FFD700', '#0066FF', '#FF69B4', '#FFFFFF']

export function ChristmasLights({ active, count = 30 }: ChristmasLightsProps) {
  if (!active) return null

  const lights = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i / count) * 100,
    color: COLORS[i % COLORS.length],
    delay: (i % 6) * 0.15,
  }))

  return (
    <div className="fixed top-0 left-0 right-0 pointer-events-none z-40" style={{ contain: 'layout style paint' }}>
      <svg className="w-full h-16" viewBox="0 0 1000 60" preserveAspectRatio="none">
        <path
          d="M0,10 Q250,40 500,10 Q750,40 1000,10"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="3"
        />
        {lights.map((light, i) => {
          const x = (i / count) * 1000
          const y = 10 + Math.sin((i / count) * Math.PI * 2) * 15 + 15
          return (
            <motion.g key={light.id}>
              <line
                x1={x}
                y1={10 + Math.sin((i / count) * Math.PI * 2) * 15}
                x2={x}
                y2={y}
                stroke="#1a1a1a"
                strokeWidth="1"
              />
              <rect x={x - 3} y={y - 2} width="6" height="4" fill="#2a2a2a" />
              <motion.ellipse
                cx={x}
                cy={y + 8}
                rx="5"
                ry="8"
                fill={light.color}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  filter: ['brightness(0.6)', 'brightness(1.5)', 'brightness(0.6)'],
                }}
                transition={{
                  duration: 1,
                  delay: light.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  filter: `drop-shadow(0 0 8px ${light.color})`,
                  willChange: 'filter, opacity',
                }}
              />
            </motion.g>
          )
        })}
      </svg>

      <svg className="w-full h-16 -mt-4" viewBox="0 0 1000 60" preserveAspectRatio="none">
        <path
          d="M0,30 Q250,5 500,30 Q750,5 1000,30"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="3"
        />
        {lights.slice(0, Math.floor(count * 0.7)).map((light, i) => {
          const x = (i / (count * 0.7)) * 1000
          const y = 30 - Math.sin((i / (count * 0.7)) * Math.PI * 2) * 12 + 15
          const color = COLORS[(i + 3) % COLORS.length]
          return (
            <motion.g key={`second-${light.id}`}>
              <line
                x1={x}
                y1={30 - Math.sin((i / (count * 0.7)) * Math.PI * 2) * 12}
                x2={x}
                y2={y}
                stroke="#1a1a1a"
                strokeWidth="1"
              />
              <rect x={x - 3} y={y - 2} width="6" height="4" fill="#2a2a2a" />
              <motion.ellipse
                cx={x}
                cy={y + 8}
                rx="5"
                ry="8"
                fill={color}
                animate={{
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  delay: light.delay + 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  filter: `drop-shadow(0 0 8px ${color})`,
                  willChange: 'opacity',
                }}
              />
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}