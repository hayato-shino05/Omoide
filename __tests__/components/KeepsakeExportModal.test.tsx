import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { ToastProvider } from '@/components/ui/Toast'
import { KeepsakeExportModal } from '@/components/community/KeepsakeExportModal'
import * as keepsakeExporter from '@/lib/export/keepsakeExporter'
import type { ReactNode } from 'react'

const Wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </LanguageProvider>
)

describe('KeepsakeExportModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('isOpen=true のときモーダルとプレビューカードが表示されること', () => {
    render(<KeepsakeExportModal isOpen={true} onClose={vi.fn()} />, {
      wrapper: Wrapper,
    })

    expect(screen.getByText(/記念カードのエクスポート|Export Keepsake Card/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Omoide Bako/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /画像として保存|Save as Image/i })).toBeInTheDocument()
  })

  it('isOpen=false のときは非表示になること', () => {
    render(<KeepsakeExportModal isOpen={false} onClose={vi.fn()} />, {
      wrapper: Wrapper,
    })

    expect(screen.queryByText(/記念カードのエクスポート|Export Keepsake Card/i)).not.toBeInTheDocument()
  })

  it('エクスポートボタンをクリックすると exportElementAsPng が呼ばれること', async () => {
    const exportSpy = vi.spyOn(keepsakeExporter, 'exportElementAsPng').mockResolvedValue('data:image/png;base64,mock')

    render(<KeepsakeExportModal isOpen={true} onClose={vi.fn()} />, {
      wrapper: Wrapper,
    })

    const saveBtn = screen.getByRole('button', { name: /画像として保存|Save as Image/i })
    fireEvent.click(saveBtn)

    expect(exportSpy).toHaveBeenCalled()
  })
})
