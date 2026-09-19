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

// 応援アイコンの描画（ネオン発光・過度な点滅を排除し、和モダンカードスタイルを採用）
function CheerIcon({ type }: { type: CheerType }) {
  switch (type) {
    case 'coffee':
      return (
        <div className="p-2.5 rounded-2xl bg-[#FFF9F3] border-2 border-[#D4B08C] text-[#854D27] shadow-[3px_3px_0_#D4B08C]">
          <Coffee size={22} />
        </div>
      )
    case 'fire':
      return (
        <div className="p-2.5 rounded-2xl bg-[#FFF9F3] border-2 border-[#D95D39] text-[#D95D39] shadow-[3px_3px_0_#D95D39]">
          <Flame size={22} />
        </div>
      )
    case 'sparkle':
      return (
        <div className="p-2.5 rounded-2xl bg-[#FFF9F3] border-2 border-[#D4B08C] text-[#D95D39] shadow-[3px_3px_0_#D4B08C]">
          <Sparkles size={22} />
        </div>
      )
    case 'book':
      return (
        <div className="p-2.5 rounded-2xl bg-[#FFF9F3] border-2 border-[#2E7D6F] text-[#2E7D6F] shadow-[3px_3px_0_#2E7D6F]">
          <BookOpen size={22} />
        </div>
      )
    default:
      return (
        <div className="p-2.5 rounded-2xl bg-[#FFF9F3] border-2 border-[#D4B08C] text-[#854D27] shadow-[3px_3px_0_#D4B08C]">
          <Sparkles size={22} />
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
              x: `${cheer.xOffset}vw`,
              scale: 0.8,
            }}
            animate={{
              opacity: [0, 1, 1, 0.9, 0],
              y: '22vh',
              x: `${cheer.xOffset + cheer.driftOffset}vw`,
              scale: [0.8, 1.08, 1, 0.95],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute left-1/2 flex flex-col items-center -translate-x-1/2"
          >
            <CheerIcon type={cheer.cheer_type} />
            <span className="mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-[#854D27] border-2 border-[#D4B08C] shadow-[2px_2px_0_#D4B08C] select-none whitespace-nowrap">
              {cheer.sender_name}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
