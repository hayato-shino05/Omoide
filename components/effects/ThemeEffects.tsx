'use client'

import { FallingPetals } from './FallingPetals'
import { FallingLeaves } from './FallingLeaves'
import { FallingSnow } from './FallingSnow'
import { FloatingLanterns } from './FloatingLanterns'
import { Fireworks } from '../features/Fireworks'
import { Sparkles } from './Sparkles'
import { ChristmasLights } from './ChristmasLights'
import { Bats } from './Bats'
import { Ghosts } from './Ghosts'
import { Fireflies } from './Fireflies'
import { Koinobori } from './Koinobori'
import { MoonGlow } from './MoonGlow'
import type { ThemeEffect } from '@/config/themes'

interface ThemeEffectsProps {
  effects: ThemeEffect[]
  active?: boolean
  className?: string
}

export function ThemeEffects({ effects, active = true, className }: ThemeEffectsProps) {
  if (!active || !effects || effects.length === 0) return null

  return (
    <div className={className}>
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
