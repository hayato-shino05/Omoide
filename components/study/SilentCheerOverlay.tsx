'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Flame, Sparkles, BookOpen } from 'lucide-react'
import { useStudyRoomStore } from '@/lib/stores/studyRoomStore'
import type { SilentCheerPayload, CheerType } from '@/types/study'

interface ActiveCheerItem extends SilentCheerPayload {
  xOffset: number
  driftOffset: number
}

// 応援アイコンの描画（絵文字を完全排除し、上品な発光 Lucide SVG アイコンを採用）
function CheerIcon({ type }: { type: CheerType }) {
  switch (type) {
    case 'coffee':
      return (
        <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] backdrop-blur-md">
          <Coffee size={24} className="animate-pulse" />
        </div>
      )
    case 'fire':
      return (
        <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] backdrop-blur-md">
          <Flame size={24} className="animate-bounce" />
        </div>
      )
    case 'sparkle':
      return (
        <div className="p-2.5 rounded-2xl bg-amber-300/20 border border-amber-300/40 text-amber-200 shadow-[0_0_20px_rgba(252,211,77,0.5)] backdrop-blur-md">
          <Sparkles size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      )
    case 'book':
      return (
        <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] backdrop-blur-md">
          <BookOpen size={24} />
        </div>
      )
    default:
      return (
        <div className="p-2.5 rounded-2xl bg-pink-500/20 border border-pink-400/40 text-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.4)] backdrop-blur-md">
          <Sparkles size={24} />
        </div>
      )
  }
}

export function SilentCheerOverlay() {
  const { cheers, removeCheer } = useStudyRoomStore()
  const [activeItems, setActiveItems] = useState<ActiveCheerItem[]>([])
  const handledIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (cheers.length === 0) return

    const newCheers = cheers.filter((item) => !handledIdsRef.current.has(item.id))
    if (newCheers.length === 0) return

    const timers: NodeJS.Timeout[] = []

    newCheers.forEach((latest) => {
      handledIdsRef.current.add(latest.id)
      const newItem: ActiveCheerItem = {
        ...latest,
        xOffset: Math.random() * 50 - 25,
        driftOffset: Math.random() * 8 - 4,
      }

      const addTimer = setTimeout(() => {
        setActiveItems((prev) => [...prev.slice(-8), newItem])
      }, 0)
      timers.push(addTimer)

      const removeTimer = setTimeout(() => {
        setActiveItems((prev) => prev.filter((item) => item.id !== latest.id))
        removeCheer(latest.id)
        handledIdsRef.current.delete(latest.id)
      }, 3200)
      timers.push(removeTimer)
    })

    return () => {
      timers.forEach((t) => clearTimeout(t))
    }
  }, [cheers, removeCheer])

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {activeItems.map((cheer) => (
          <motion.div
            key={cheer.id}
            initial={{
              opacity: 0,
              y: '85vh',
              x: `calc(50% + ${cheer.xOffset}vw)`,
              scale: 0.7,
            }}
            animate={{
              opacity: [0, 1, 1, 0.9, 0],
              y: '22vh',
              x: `calc(50% + ${cheer.xOffset + cheer.driftOffset}vw)`,
              scale: [0.7, 1.15, 1, 0.95],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3,
              ease: [0.16, 1, 0.3, 1], // 優雅なイージングカーブ
            }}
            className="absolute flex flex-col items-center -translate-x-1/2"
          >
            <CheerIcon type={cheer.cheer_type} />
            <span className="mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-950/80 text-stone-100 border border-white/15 backdrop-blur-xl shadow-lg select-none whitespace-nowrap">
              {cheer.sender_name}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

