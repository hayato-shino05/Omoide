'use client'

import { useState, useCallback, useEffect } from 'react'

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

interface UseMemoryGameReturn {
  cards: Card[]
  score: number
  moves: number
  isComplete: boolean
  isPlaying: boolean
  timeElapsed: number
  flipCard: (id: number) => void
  startGame: (customEmojis?: string[]) => void
  resetGame: () => void
}

const DEFAULT_EMOJIS = ['🎂', '🎁', '🎈', '🎉', '🎊', '🎀', '🧁', '🍰']

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createCards(emojis: string[] = DEFAULT_EMOJIS): Card[] {
  const source = emojis && emojis.length >= 8 ? emojis.slice(0, 8) : DEFAULT_EMOJIS
  const pairs = [...source, ...source]
  const shuffled = shuffleArray(pairs)
  return shuffled.map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false,
  }))
}

export function useMemoryGame(initialEmojis?: string[]): UseMemoryGameReturn {
  const [deckEmojis, setDeckEmojis] = useState<string[]>(initialEmojis || DEFAULT_EMOJIS)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const isComplete = cards.length > 0 && cards.every((card) => card.isMatched)

  // タイマーの更新
  useEffect(() => {
    if (!isPlaying || isComplete) return

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, isComplete])

  const startGame = useCallback((customEmojis?: string[]) => {
    const targetEmojis = customEmojis || deckEmojis
    if (customEmojis) {
      setDeckEmojis(customEmojis)
    }
    setCards(createCards(targetEmojis))
    setFlippedIds([])
    setScore(0)
    setMoves(0)
    setTimeElapsed(0)
    setIsPlaying(true)
  }, [deckEmojis])

  const resetGame = useCallback(() => {
    setCards([])
    setFlippedIds([])
    setScore(0)
    setMoves(0)
    setTimeElapsed(0)
    setIsPlaying(false)
  }, [])

  const flipCard = useCallback(
    (id: number) => {
      if (!isPlaying) return

      const card = cards.find((c) => c.id === id)
      if (!card || card.isFlipped || card.isMatched || flippedIds.length >= 2) return

      const newFlippedIds = [...flippedIds, id]
      setFlippedIds(newFlippedIds)

      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
      )

      if (newFlippedIds.length === 2) {
        setMoves((prev) => prev + 1)

        const [firstId, secondId] = newFlippedIds
        const firstCard = cards.find((c) => c.id === firstId)
        const secondCard = cards.find((c) => c.id === secondId)

        if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
          // マッチが見つかった
          setScore((prev) => prev + 10)
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
            )
          )
          setFlippedIds([])
        } else {
          // マッチなし - 遅延後に裏返す
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
              )
            )
            setFlippedIds([])
          }, 1000)
        }
      }
    },
    [cards, flippedIds, isPlaying]
  )

  return {
    cards,
    score,
    moves,
    isComplete,
    isPlaying,
    timeElapsed,
    flipCard,
    startGame,
    resetGame,
  }
}
