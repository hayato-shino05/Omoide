'use client'

import dynamic from 'next/dynamic'
import type { ThemeEffect } from '@/config/themes'

const FallingPetals = dynamic(() => import('./FallingPetals').then((mod) => mod.FallingPetals), { ssr: false })
const FallingLeaves = dynamic(() => import('./FallingLeaves').then((mod) => mod.FallingLeaves), { ssr: false })
const FallingSnow = dynamic(() => import('./FallingSnow').then((mod) => mod.FallingSnow), { ssr: false })
const FloatingLanterns = dynamic(() => import('./FloatingLanterns').then((mod) => mod.FloatingLanterns), { ssr: false })
const Fireworks = dynamic(() => import('../features/Fireworks').then((mod) => mod.Fireworks), { ssr: false })
const Sparkles = dynamic(() => import('./Sparkles').then((mod) => mod.Sparkles), { ssr: false })
const ChristmasLights = dynamic(() => import('./ChristmasLights').then((mod) => mod.ChristmasLights), { ssr: false })
const Bats = dynamic(() => import('./Bats').then((mod) => mod.Bats), { ssr: false })
const Ghosts = dynamic(() => import('./Ghosts').then((mod) => mod.Ghosts), { ssr: false })
const Fireflies = dynamic(() => import('./Fireflies').then((mod) => mod.Fireflies), { ssr: false })
const Koinobori = dynamic(() => import('./Koinobori').then((mod) => mod.Koinobori), { ssr: false })
const MoonGlow = dynamic(() => import('./MoonGlow').then((mod) => mod.MoonGlow), { ssr: false })

interface ThemeEffectsProps {
  effects: ThemeEffect[]
  active?: boolean
  className?: string
}

export function ThemeEffects({ effects, active = true, className }: ThemeEffectsProps) {
  if (!active || !effects || effects.length === 0) return null

  return (
    <div
      className={className}
      style={{
        contain: 'layout style paint',
        pointerEvents: 'none',
      }}
    >
      {effects.map((effect, index) => {
        switch (effect.type) {
          case 'fallingPetals':
            return <FallingPetals key={`petal-${index}`} count={effect.count} active={active} />
          case 'fallingLeaves':
            return <FallingLeaves key={`leaf-${index}`} count={effect.count} active={active} />
          case 'fallingSnow':
            return <FallingSnow key={`snow-${index}`} count={effect.count} active={active} />
          case 'floatingLanterns':
            return <FloatingLanterns key={`lantern-${index}`} count={effect.count} active={active} />
          case 'fireworks':
            return <Fireworks key={`firework-${index}`} count={effect.count} active={active} />
          case 'sparkles':
            return <Sparkles key={`sparkle-${index}`} count={effect.count} active={active} />
          case 'christmasLights':
            return <ChristmasLights key={`xmas-${index}`} count={effect.count} active={active} />
          case 'bats':
            return <Bats key={`bat-${index}`} count={effect.count} active={active} />
          case 'ghosts':
            return <Ghosts key={`ghost-${index}`} count={effect.count} active={active} />
          case 'fireflies':
            return <Fireflies key={`firefly-${index}`} count={effect.count} active={active} />
          case 'koinobori':
            return <Koinobori key={`koi-${index}`} count={effect.count} active={active} />
          case 'moonGlow':
            return <MoonGlow key={`moon-${index}`} active={active} />
          default:
            return null
        }
      })}
    </div>
  )
}
