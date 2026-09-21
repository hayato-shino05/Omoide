'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
}

interface ParticleSystemProps {
  isActive: boolean
  type?: 'sparkle' | 'fire' | 'smoke' | 'magic' | 'hearts'
  x?: number
  y?: number
  followMouse?: boolean
  particleCount?: number
  spread?: number
}

const particleConfigs = {
  sparkle: {
    colors: ['#FFD700', '#FFF8DC', '#FFFACD', '#FAFAD2', '#FFFFE0'],
    sizeRange: [2, 6],
    lifeRange: [30, 60],
    velocityRange: [-2, 2],
    gravity: -0.05,
  },
  fire: {
    colors: ['#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFD700'],
    sizeRange: [4, 10],
    lifeRange: [20, 40],
    velocityRange: [-1, 1],
    gravity: -0.15,
  },
  smoke: {
    colors: ['#696969', '#808080', '#A9A9A9', '#C0C0C0', '#D3D3D3'],
    sizeRange: [5, 15],
    lifeRange: [40, 80],
    velocityRange: [-0.5, 0.5],
    gravity: -0.03,
  },
  magic: {
    colors: ['#FF69B4', '#DA70D6', '#BA55D3', '#9370DB', '#8A2BE2'],
    sizeRange: [3, 8],
    lifeRange: [40, 70],
    velocityRange: [-1.5, 1.5],
    gravity: 0,
  },
  hearts: {
    colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB', '#FF0000'],
    sizeRange: [8, 16],
    lifeRange: [50, 100],
    velocityRange: [-1, 1],
    gravity: -0.02,
  },
}

export default function ParticleSystem({
  isActive,
  type = 'sparkle',
  x: initialX,
  y: initialY,
  followMouse = false,
  particleCount = 3,
  spread = 20,
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const config = particleConfigs[type]

  const createParticle = useCallback((x: number, y: number): Particle => {
    const [minSize, maxSize] = config.sizeRange
    const [minLife, maxLife] = config.lifeRange
    const [minVel, maxVel] = config.velocityRange

    return {
      x: x + (Math.random() - 0.5) * spread,
      y: y + (Math.random() - 0.5) * spread,
      vx: minVel + Math.random() * (maxVel - minVel),
      vy: minVel + Math.random() * (maxVel - minVel),
      life: minLife + Math.random() * (maxLife - minLife),
      maxLife: minLife + Math.random() * (maxLife - minLife),
      size: minSize + Math.random() * (maxSize - minSize),
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      alpha: 1,
    }
  }, [config, spread])

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath()
    ctx.moveTo(x, y + size / 4)
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4)
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size)
    ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4)
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4)
    ctx.fill()
  }

  useEffect(() => {
    if (prefersReducedMotion) return

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

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    if (followMouse) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    let isRunning = true
    const animate = () => {
      if (!isRunning) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (isActive) {
        const spawnX = followMouse ? mouseRef.current.x : (initialX ?? canvas.width / 2)
        const spawnY = followMouse ? mouseRef.current.y : (initialY ?? canvas.height / 2)

        for (let i = 0; i < particleCount; i++) {
          particlesRef.current.push(createParticle(spawnX, spawnY))
        }
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += config.gravity
        p.life--
        p.alpha = p.life / p.maxLife

        if (p.life <= 0) return false

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color

        if (type === 'hearts') {
          drawHeart(ctx, p.x, p.y, p.size)
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
        return true
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    // バックグラウンドタブ時にアニメーションループを一時停止
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
      } else {
        if (!isRunning) {
          isRunning = true
          animationRef.current = requestAnimationFrame(animate)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    animate()

    return () => {
      isRunning = false
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (followMouse) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, type, initialX, initialY, followMouse, particleCount, createParticle, config.gravity, prefersReducedMotion])

  // reduced-motion 時は描画もループも停止
  if (prefersReducedMotion) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ mixBlendMode: type === 'magic' ? 'screen' : 'normal', contain: 'layout style paint' }}
    />
  )
}
