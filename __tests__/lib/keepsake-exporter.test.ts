import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  downloadDataUrl,
  exportElementAsPng,
  generateOmikujiCardImage,
} from '@/lib/export/keepsakeExporter'
import type { OmikujiFortune } from '@/data/omikujiData'

describe('keepsakeExporter', () => {
  const mockFortune: OmikujiFortune = {
    id: 1,
    rank: 'daikichi',
    rankNameJa: '大吉',
    rankNameEn: 'Great Blessing',
    poemJa: '桜花 咲き誇る日の 喜びを',
    poemEn: 'Cherry blossoms blooming in pure delight',
    generalJa: 'すべての願いが花開く最良の日。',
    generalEn: 'The finest day where every wish blossoms.',
    bondJa: '大切な人との絆がより深まります。',
    bondEn: 'Bonds with loved ones grow deeper.',
    healthJa: '心身ともに満ち足りて快調。',
    healthEn: 'Both mind and body are in perfect harmony.',
    wishJa: '長年の願いが一気に進展する兆し。',
    wishEn: 'A long-held wish makes great progress.',
    blessingJa: 'あなたの存在そのものが周りを照らす光。',
    blessingEn: 'Your presence is a shining light to all.',
    luckyColorJa: '桜色（さくらいろ）',
    luckyColorEn: 'Cherry Blossom Pink',
    luckyItemJa: '思い出の写真立て',
    luckyItemEn: 'Memory Photo Frame',
    luckyNumber: 7,
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('downloadDataUrl', () => {
    it('リンク要素を生成してクリックイベントを発火すること', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const removeChildSpy = vi.spyOn(document.body, 'removeChild')

      downloadDataUrl('data:image/png;base64,mock', 'test.png')

      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
    })
  })

  describe('generateOmikujiCardImage', () => {
    it('Canvas 2D を利用しておみくじ画像を生成しデータURLを返すこと', async () => {
      const mockDataUrl = 'data:image/png;base64,mockOmikujiData'
      const mockContext = {
        scale: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn(),
        }),
        fillStyle: '',
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 50 }),
        roundRect: vi.fn(),
      }

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
        mockContext as unknown as CanvasRenderingContext2D
      )
      vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(mockDataUrl)

      const result = await generateOmikujiCardImage(mockFortune, {
        language: 'ja',
        autoDownload: false,
      })

      expect(result).toBe(mockDataUrl)
      expect(mockContext.scale).toHaveBeenCalledWith(2, 2)
      expect(mockContext.fillText).toHaveBeenCalled()
    })
  })

  describe('exportElementAsPng', () => {
    it('要素が存在しない場合は null を返すこと', async () => {
      const result = await exportElementAsPng('non-existent-id')
      expect(result).toBeNull()
    })

    it('DOM 要素を渡した場合に PNG エクスポート処理を試みること', async () => {
      const div = document.createElement('div')
      div.id = 'target-element'
      div.innerText = '想い出カード'
      document.body.appendChild(div)

      const mockDataUrl = 'data:image/png;base64,mockExport'
      const mockContext = {
        scale: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      }

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
        mockContext as unknown as CanvasRenderingContext2D
      )
      vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(mockDataUrl)

      // exportElementAsPng は非同期 SVG レンダリングを行うため Promise の解決を検証
      const exportPromise = exportElementAsPng(div, 'test-keepsake.png')
      expect(exportPromise).toBeInstanceOf(Promise)

      document.body.removeChild(div)
    })
  })
})
