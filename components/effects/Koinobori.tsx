'use client'

import { motion } from 'framer-motion'

interface KoinoboriProps {
  active: boolean
  count?: number
}

const KOI_COLORS = [
  ['#000000', '#333333'],
  ['#DC143C', '#FF4500'],
  ['#1E90FF', '#00BFFF'],
  ['#FF69B4', '#FFB6C1'],
  ['#32CD32', '#7CFC00'],
]

export function Koinobori({ active, count = 3 }: KoinoboriProps) {
  if (!active) return null

  const kois = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: i,
    x: 15 + i * 18,
    colors: KOI_COLORS[i % KOI_COLORS.length],
    size: i === 0 ? 1.2 : i === 1 ? 1 : 0.8,
  }))

  return (
    <div className="fixed top-0 left-0 right-0 pointer-events-none z-35 h-64" style={{ contain: 'layout style paint' }}>
      <div
        className="absolute left-1/2 top-0 w-2 bg-gradient-to-b from-amber-700 to-amber-900"
        style={{ height: '100%', transform: 'translateX(-50%)' }}
      />

      <div
        className="absolute left-1/2 top-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600"
        style={{ transform: 'translateX(-50%)' }}
      />

      <motion.div
        className="absolute left-1/2 top-10"
        style={{ transform: 'translateX(-50%)', willChange: 'transform' }}
        animate={{ rotateZ: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {['#FF0000', '#FFFFFF', '#0000FF', '#FFFF00', '#00FF00'].map((color, i) => (
          <motion.div
            key={i}
            className="w-1 absolute"
            style={{
              height: 40,
              backgroundColor: color,
              left: i * 6 - 12,
              transformOrigin: 'top',
              willChange: 'transform',
            }}
            animate={{
              rotateZ: [-10 + i * 2, 10 - i * 2, -10 + i * 2],
              skewX: [-5, 5, -5],
            }}
            transition={{
              duration: 1.5 + i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {kois.map((koi, index) => (
        <motion.div
          key={koi.id}
          className="absolute"
          style={{
            left: `${koi.x}%`,
            top: 60 + index * 35,
            transform: `scale(${koi.size})`,
            willChange: 'transform',
          }}
          animate={{
            x: [-10, 15, -10],
            rotateZ: [-3, 3, -3],
          }}
          transition={{
            duration: 2 + index * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg width="120" height="50" viewBox="0 0 120 50">
            <motion.path
              d="M10,25 Q30,5 60,10 Q90,5 100,25 Q90,45 60,40 Q30,45 10,25 Z"
              fill={koi.colors[0]}
              animate={{
                d: [
                  'M10,25 Q30,5 60,10 Q90,5 100,25 Q90,45 60,40 Q30,45 10,25 Z',
                  'M10,25 Q30,8 60,12 Q90,8 100,25 Q90,42 60,38 Q30,42 10,25 Z',
                  'M10,25 Q30,5 60,10 Q90,5 100,25 Q90,45 60,40 Q30,45 10,25 Z',
                ],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            {[20, 35, 50, 65, 80].map((x, i) => (
              <circle
                key={i}
                cx={x}
                cy={25}
                r="8"
                fill={koi.colors[1]}
                opacity="0.6"
              />
            ))}
            <circle cx="20" cy="22" r="4" fill="white" />
            <circle cx="20" cy="22" r="2" fill="black" />
            <circle cx="8" cy="25" r="4" fill={koi.colors[1]} />
            <motion.path
              d="M100,25 L115,15 L115,35 Z"
              fill={koi.colors[0]}
              animate={{
                d: [
                  'M100,25 L115,15 L115,35 Z',
                  'M100,25 L118,18 L118,32 Z',
                  'M100,25 L115,15 L115,35 Z',
                ],
              }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}
