'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameScore {
  game: string
  score: number
  date: string
  moves?: number
  time?: number
}

interface GameState {
  highScores: Record<string, GameScore[]>
  currentGame: string | null
  isGameActive: boolean
  soundEnabled: boolean
  
  // アクション
  setCurrentGame: (game: string | null) => void
  setGameActive: (active: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  
  // スコアアクション
  addScore: (game: string, score: number, moves?: number, time?: number) => void
  getHighScores: (game: string, limit?: number) => GameScore[]
  clearScores: (game?: string) => void
  
  // 統計
  getTotalGamesPlayed: () => number
  getBestScore: (game: string) => GameScore | null
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      highScores: {},
      currentGame: null,
      isGameActive: false,
      soundEnabled: true,

      setCurrentGame: (game) => set({ currentGame: game }),
      setGameActive: (active) => set({ isGameActive: active }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      addScore: (game, score, moves, time) => {
        const { highScores } = get()
        const gameScores = highScores[game] || []
        
        const newScore: GameScore = {
          game,
          score,
          date: new Date().toISOString(),
          moves,
          time,
        }

        const updatedScores = [...gameScores, newScore]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10) // 上位10件のみ保持

        set({
          highScores: {
            ...highScores,
            [game]: updatedScores,
          },
        })
      },

      getHighScores: (game, limit = 5) => {
        const { highScores } = get()
        return (highScores[game] || []).slice(0, limit)
      },

      clearScores: (game) => {
        if (game) {
          const { highScores } = get()
          const { [game]: removedScore, ...rest } = highScores
          void removedScore
          set({ highScores: rest })
        } else {
          set({ highScores: {} })
        }
      },

      getTotalGamesPlayed: () => {
        const { highScores } = get()
        return Object.values(highScores).reduce((total, scores) => total + scores.length, 0)
      },

      getBestScore: (game) => {
        const { highScores } = get()
        const scores = highScores[game]
        return scores && scores.length > 0 ? scores[0] : null
      },
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        highScores: state.highScores,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
)
