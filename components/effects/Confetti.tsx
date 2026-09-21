'use client'

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  size: number
  velocityX: number
  velocityY: number
  rotationSpeed: number
  shape: 'square' | 'circle' | 'triangle' | 'star'
}

interface ConfettiProps {
  isActive: boolean
  duration?: number
  particleCount?: number
  colors?: string[]
  onComplete?: () => void
}

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF69B4',
]

function drawShape(ctx: CanvasRenderingContext2D, shape: ConfettiPiece['shape'], size: number) {
  switch (shape) {
    case 'circle': {
      ctx.beginPath()
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'triangle': {
      ctx.beginPath()
      ctx.moveTo(0, -size / 2)
      ctx.lineTo(size / 2, size / 2)
      ctx.lineTo(-size / 2, size / 2)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'star': {
      ctx.beginPath()
      const spikes = 5
      const outerRadius = size / 2
      const innerRadius = size / 4
      let rot = (Math.PI / 2) * 3
      const step = Math.PI / spikes

      ctx.moveTo(0, -outerRadius)
      for (let i = 0; i < spikes; i++) {
        let sx = Math.cos(rot) * outerRadius
        let sy = Math.sin(rot) * outerRadius
        ctx.lineTo(sx, sy)
        rot += step

        sx = Math.cos(rot) * innerRadius
        sy = Math.sin(rot) * innerRadius
        ctx.lineTo(sx, sy)
        rot += step
      }
      ctx.lineTo(0, -outerRadius)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'square':
    default: {
      ctx.fillRect(-size / 2, -size / 2, size, size)
      break
    }
  }
}

export default function Confetti({
  isActive,
  duration = 5000,
  particleCount = 150,
  colors = defaultColors,
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isActive) return

    if (prefersReducedMotion) {
      onCompleteRef.current?.()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const shapes: ConfettiPiece['shape'][] = ['square', 'circle', 'triangle', 'star']
    const pieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: (Math.random() * 100 * canvas.width) / 100,
      y: -Math.random() * 50 - 10,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: 2 + Math.random() * 3,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }))

    let animationId: number | null = null
    let lastTime = performance.now()
    let isRunning = true

    const step = (currentTime: number) => {
      if (!isRunning) return
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 3)
      lastTime = currentTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let hasActiveParticles = false
      for (const piece of pieces) {
        piece.x += piece.velocityX * deltaTime * 0.5 * (canvas.width / 100)
        piece.y += piece.velocityY * deltaTime * 0.5 * (canvas.height / 100)
        piece.rotation += piece.rotationSpeed * deltaTime
        piece.velocityY += 0.1 * deltaTime

        if (piece.y < canvas.height + 50) {
          hasActiveParticles = true
          const opacity = Math.max(0, 1 - piece.y / canvas.height)

          ctx.save()
          ctx.translate(piece.x, piece.y)
          ctx.rotate((piece.rotation * Math.PI) / 180)
          ctx.globalAlpha = opacity
          ctx.fillStyle = piece.color
          drawShape(ctx, piece.shape, piece.size)
          ctx.restore()
        }
      }

      if (isRunning && hasActiveParticles) {
        animationId = requestAnimationFrame(step)
      }
    }

    animationId = requestAnimationFrame((time) => {
      lastTime = time
      step(time)
    })

    const timeout = setTimeout(() => {
      isRunning = false
      if (animationId !== null) cancelAnimationFrame(animationId)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      onCompleteRef.current?.()
    }, duration)

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false
        if (animationId !== null) {
          cancelAnimationFrame(animationId)
          animationId = null
        }
      } else {
        if (!isRunning) {
          isRunning = true
          lastTime = performance.now()
          animationId = requestAnimationFrame(step)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isRunning = false
      if (animationId !== null) cancelAnimationFrame(animationId)
      clearTimeout(timeout)
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, duration, particleCount, colors, prefersReducedMotion])

  if (prefersReducedMotion || !isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ contain: 'layout style paint' }}
    />
  )
}

// 指定した位置からのバーストコンフェッティ
interface ConfettiBurstProps {
  x: number
  y: number
  isActive: boolean
  onComplete?: () => void
}

export function ConfettiBurst({ x, y, isActive, onComplete }: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isActive) return

    if (prefersReducedMotion) {
      onCompleteRef.current?.()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => {
      const angle = (i / 50) * Math.PI * 2
      const velocity = 5 + Math.random() * 10
      return {
        id: i,
        x,
        y,
        rotation: Math.random() * 360,
        color: defaultColors[Math.floor(Math.random() * defaultColors.length)],
        size: 6 + Math.random() * 6,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 5,
        rotationSpeed: (Math.random() - 0.5) * 15,
        shape: 'square' as const,
      }
    })

    let animationId: number | null = null
    let lastTime = performance.now()
    let isRunning = true

    const step = (currentTime: number) => {
      if (!isRunning) return
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 3)
      lastTime = currentTime
      const drag = Math.pow(0.98, deltaTime)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let hasActiveParticles = false
      for (const piece of pieces) {
        piece.x += piece.velocityX * deltaTime
        piece.y += piece.velocityY * deltaTime
        piece.rotation += piece.rotationSpeed * deltaTime
        piece.velocityY += 0.5 * deltaTime
        piece.velocityX *= drag

        if (piece.y < canvas.height + 50) {
          hasActiveParticles = true
          const opacity = Math.max(0, 1 - piece.y / canvas.height)

          ctx.save()
          ctx.translate(piece.x, piece.y)
          ctx.rotate((piece.rotation * Math.PI) / 180)
          ctx.globalAlpha = opacity
          ctx.fillStyle = piece.color
          ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size)
          ctx.restore()
        }
      }

      if (isRunning && hasActiveParticles) {
        animationId = requestAnimationFrame(step)
      }
    }

    animationId = requestAnimationFrame((time) => {
      lastTime = time
      step(time)
    })

    const timeout = setTimeout(() => {
      isRunning = false
      if (animationId !== null) cancelAnimationFrame(animationId)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      onCompleteRef.current?.()
    }, 3000)

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false
        if (animationId !== null) {
          cancelAnimationFrame(animationId)
          animationId = null
        }
      } else {
        if (!isRunning) {
          isRunning = true
          lastTime = performance.now()
          animationId = requestAnimationFrame(step)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isRunning = false
      if (animationId !== null) cancelAnimationFrame(animationId)
      clearTimeout(timeout)
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, x, y, prefersReducedMotion])

  if (prefersReducedMotion || !isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ contain: 'layout style paint' }}
    />
  )
}
