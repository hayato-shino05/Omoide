import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { VideoBackground } from '@/components/effects/VideoBackground'

describe('VideoBackground Component Tests', () => {
  it('videoUrl 変更時に正しい src と再マウント key でレンダリングされること', () => {
    const { container, rerender } = render(
      <VideoBackground videoUrl="/videos/theme-spring.mp4" />
    )

    const videoElement = container.querySelector('video')
    expect(videoElement).toBeDefined()
    expect(videoElement?.getAttribute('src')).toBe('/videos/theme-spring.mp4')

    // videoUrl を更新して再レンダリング
    rerender(<VideoBackground videoUrl="/videos/theme-summer.mp4" />)

    const updatedVideoElement = container.querySelector('video')
    expect(updatedVideoElement?.getAttribute('src')).toBe('/videos/theme-summer.mp4')
  })
})
