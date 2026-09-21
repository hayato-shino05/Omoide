'use client'

import { useState, useCallback, useEffect } from 'react'

interface PuzzlePiece {
  id: number
  currentPos: number
  correctPos: number
}

interface UsePuzzleGameReturn {
  pieces: PuzzlePiece[]
  moves: number
  isComplete: boolean
  isPlaying: boolean
  timeElapsed: number
  movePiece: (pieceId: number) => void
  startGame: (gridSize?: number) => void
  resetGame: () => void
}

// 100%解ける盤面を生成するため、完成状態から有効な移動をランダムにシミュレートしてシャッフルする
function shufflePuzzle(size: number): PuzzlePiece[] {
  const total = size * size
  const emptyId = total - 1
  
  // 初期状態（完成状態）
  const positions = Array.from({ length: total }, (_, i) => i)
  let emptyPos = emptyId

  // ランダムウォーク（80回の有効な移動）
  const movesCount = 80
  let lastMovedPos = -1

  for (let step = 0; step < movesCount; step++) {
    const emptyRow = Math.floor(emptyPos / size)
    const emptyCol = emptyPos % size

    // 移動可能な隣接位置を収集
    const neighbors: number[] = []
    if (emptyRow > 0) neighbors.push((emptyRow - 1) * size + emptyCol)
    if (emptyRow < size - 1) neighbors.push((emptyRow + 1) * size + emptyCol)
    if (emptyCol > 0) neighbors.push(emptyRow * size + (emptyCol - 1))
    if (emptyCol < size - 1) neighbors.push(emptyRow * size + (emptyCol + 1))

    // 直前の位置へ戻る無駄なループを抑制
    const validNeighbors = neighbors.filter((pos) => pos !== lastMovedPos)
    const nextPos = validNeighbors.length > 0
      ? validNeighbors[Math.floor(Math.random() * validNeighbors.length)]
      : neighbors[Math.floor(Math.random() * neighbors.length)]

    // スワップ
    const pieceIndex = positions.indexOf(nextPos)
    const emptyIndex = positions.indexOf(emptyPos)
    positions[pieceIndex] = emptyPos
    positions[emptyIndex] = nextPos

    lastMovedPos = emptyPos
    emptyPos = nextPos
  }

  // 偶然完成状態のままなら、追加で1手スワップ
  if (positions.every((pos, i) => pos === i)) {
    const neighborPos = emptyPos > 0 ? emptyPos - 1 : emptyPos + 1
    const pieceIndex = positions.indexOf(neighborPos)
    const emptyIndex = positions.indexOf(emptyPos)
    positions[pieceIndex] = emptyPos
    positions[emptyIndex] = neighborPos
  }

  return Array.from({ length: total }, (_, index) => ({
    id: index,
    currentPos: positions[index],
    correctPos: index,
  }))
}

function canMove(piecePos: number, emptyPos: number, gridSize: number): boolean {
  const pieceRow = Math.floor(piecePos / gridSize)
  const pieceCol = piecePos % gridSize
  const emptyRow = Math.floor(emptyPos / gridSize)
  const emptyCol = emptyPos % gridSize

  // 隣接している場合のみ移動可能（斜めは不可）
  return (
    (Math.abs(pieceRow - emptyRow) === 1 && pieceCol === emptyCol) ||
    (Math.abs(pieceCol - emptyCol) === 1 && pieceRow === emptyRow)
  )
}

export function usePuzzleGame(): UsePuzzleGameReturn {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [gridSize, setGridSize] = useState(3)
  const [moves, setMoves] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const emptyPiece = pieces.find((p) => p.id === gridSize * gridSize - 1)
  const isComplete =
    isPlaying &&
    pieces.length > 0 &&
    pieces.every((p) => p.currentPos === p.correctPos)

  // タイマー
  useEffect(() => {
    if (!isPlaying || isComplete) return

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, isComplete])

  const startGame = useCallback((size: number = 3) => {
    setGridSize(size)
    setPieces(shufflePuzzle(size))
    setMoves(0)
    setTimeElapsed(0)
    setIsPlaying(true)
  }, [])

  const resetGame = useCallback(() => {
    setPieces([])
    setMoves(0)
    setTimeElapsed(0)
    setIsPlaying(false)
  }, [])

  const movePiece = useCallback(
    (pieceId: number) => {
      if (!isPlaying || !emptyPiece) return

      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece || piece.id === emptyPiece.id) return

      if (canMove(piece.currentPos, emptyPiece.currentPos, gridSize)) {
        setPieces((prev) =>
          prev.map((p) => {
            if (p.id === pieceId) {
              return { ...p, currentPos: emptyPiece.currentPos }
            }
            if (p.id === emptyPiece.id) {
              return { ...p, currentPos: piece.currentPos }
            }
            return p
          })
        )
        setMoves((prev) => prev + 1)
      }
    },
    [pieces, emptyPiece, gridSize, isPlaying]
  )

  return {
    pieces,
    moves,
    isComplete,
    isPlaying,
    timeElapsed,
    movePiece,
    startGame,
    resetGame,
  }
}
