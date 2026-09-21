import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister'

describe('ServiceWorkerRegister', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('serviceWorker が利用可能な環境で /sw.js を登録すること', () => {
    const registerMock = vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
    })

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: registerMock,
      },
      configurable: true,
      writable: true,
    })

    render(<ServiceWorkerRegister />)

    expect(registerMock).toHaveBeenCalledWith('/sw.js', { scope: '/' })
  })

  it('serviceWorker が未対応の環境でも例外を投げずにレンダリングされること', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    expect(() => render(<ServiceWorkerRegister />)).not.toThrow()
  })
})
