'use client'

import { useQuery } from '@tanstack/react-query'
export type MemoryDeck = {
  id: string
  title: string
  theme: string
  cards: string[]
  is_default: boolean
}

const STATIC_MEMORY_DECKS: MemoryDeck[] = [
  { id: 'birthday-classic', title: '誕生日クラシック', theme: 'birthday', cards: ['🎂','🎁','🎈','🎉','🎊','🎀','🧁','🍰'], is_default: true },
  { id: 'seasons-japan',    title: '四季の日本',      theme: 'seasons',  cards: ['🌸','⛄','🎆','🍂','🌺','❄️','🎇','🍁'], is_default: false },
  { id: 'animals-cute',     title: 'かわいい動物',    theme: 'animals',  cards: ['🐱','🐶','🐰','🐻','🐼','🦊','🐸','🐨'], is_default: false },
]

export interface UseMemoryDecksResult {
  decks: MemoryDeck[]
  defaultDeck: MemoryDeck
  isLoading: boolean
  isFallback: boolean
  isError: boolean
}

export function useMemoryDecks(): UseMemoryDecksResult {
  const query = useQuery<MemoryDeck[], Error>({
    queryKey: ['memory-decks'],
    queryFn: async () => {
      const res = await fetch('/api/games/memory-decks')
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const data = (await res.json()) as MemoryDeck[]
      if (Array.isArray(data) && data.length > 0) return data
      throw new Error('Empty memory decks')
    },
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const decks = query.data ?? STATIC_MEMORY_DECKS
  const defaultDeck = decks.find((d) => d.is_default) ?? decks[0]

  return {
    decks,
    defaultDeck,
    isLoading: query.isLoading,
    isFallback: query.isError || !query.data,
    isError: query.isError,
  }
}
