/**
 * 想い出箱（Omoide Bako）記念カード・おみくじ画像高解像度エクスポートユーティリティ
 * Canvas 2D / SVG ForeignObject による Retina (Scale: 2) 高解像度 PNG 生成
 */

import type { OmikujiFortune } from '@/data/omikujiData'

/**
 * データURLをブラウザから自動ダウンロードさせるヘルパー関数
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export interface ExportElementOptions {
  filename?: string
  scale?: number
  backgroundColor?: string
}

/**
 * 指定した DOM 要素を高解像度 PNG 画像としてエクスポートする関数
 * @param elementIdOrElement 要素または要素ID
 * @param filename ダウンロードファイル名
 */
export async function exportElementAsPng(
  elementIdOrElement: string | HTMLElement,
  filename: string = `omoide-keepsake-${Date.now()}.png`,
  options: ExportElementOptions = {}
): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null
  }

  const element =
    typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement

  if (!element) {
    console.warn(`[KeepsakeExporter] Element not found:`, elementIdOrElement)
    return null
  }

  try {
    const rect = element.getBoundingClientRect()
    const width = Math.max(rect.width, 320)
    const height = Math.max(rect.height, 240)
    const scale = options.scale ?? 2 // Retina シャープネス用 2x スケール

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    ctx.scale(scale, scale)

    // 背景色の塗りつぶし
    ctx.fillStyle = options.backgroundColor || '#FFFDF9'
    ctx.fillRect(0, 0, width, height)

    // DOM のクローンと SVG ForeignObject によるレンダリング
    const clone = element.cloneNode(true) as HTMLElement
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')

    // SVG データURI の構築
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; background: transparent;">
            ${new XMLSerializer().serializeToString(clone)}
          </div>
        </foreignObject>
      </svg>
    `

    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const blobUrl = URL.createObjectURL(svgBlob)

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(blobUrl)
        const pngUrl = canvas.toDataURL('image/png')
        if (filename) {
          downloadDataUrl(pngUrl, filename)
        }
        resolve(pngUrl)
      }

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl)
        // SVG フォールバック失敗時は代替描画または null
        resolve(null)
      }

      img.src = blobUrl
    })
  } catch (err) {
    console.error('[KeepsakeExporter] Export failed:', err)
    return null
  }
}

export interface OmikujiCardExportOptions {
  username?: string
  language?: 'ja' | 'en'
  filename?: string
  autoDownload?: boolean
}

/**
 * 複数行テキストを最大幅で折り返して描画する補助関数
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split('')
  let line = ''
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n]
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n]
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
  return currentY + lineHeight
}

/**
 * 日替わりおみくじ用の高解像度（Retina 2x）記念カード画像を Canvas で直接生成・エクスポート
 * @param fortune おみくじ結果データ
 * @param options 言語・ファイル名・ダウンロード設定
 */
export async function generateOmikujiCardImage(
  fortune: OmikujiFortune,
  options: OmikujiCardExportOptions = {}
): Promise<string> {
  if (typeof document === 'undefined') {
    return ''
  }

  const {
    username,
    language = 'ja',
    filename = `omikuji-fortune-${fortune.id}-${Date.now()}.png`,
    autoDownload = true,
  } = options

  const isJa = language === 'ja'
  const width = 800
  const height = 1200
  const scale = 2 // 1600x2400 高解像度出力

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')

  if (!ctx) return ''

  ctx.scale(scale, scale)

  // 1. 和紙テクスチャ背景の描画
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
  bgGrad.addColorStop(0, '#FFFDF9')
  bgGrad.addColorStop(0.5, '#FFF9F3')
  bgGrad.addColorStop(1, '#FFF5EA')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 金箔・和紙の斑点テクスチャを再現
  ctx.fillStyle = 'rgba(212, 176, 140, 0.25)'
  for (let i = 0; i < 180; i++) {
    const px = Math.sin(i * 997) * 0.5 + 0.5
    const py = Math.cos(i * 7919) * 0.5 + 0.5
    ctx.beginPath()
    ctx.arc(px * width, py * height, (i % 3) + 0.8, 0, Math.PI * 2)
    ctx.fill()
  }

  // 2. 外枠・伝統的飾り枠の描画
  ctx.strokeStyle = '#D4B08C'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, width - 48, height - 48)

  ctx.strokeStyle = '#854D27'
  ctx.lineWidth = 2
  ctx.strokeRect(34, 34, width - 68, height - 68)

  // 四隅の装飾文様
  const drawCornerFlourish = (cx: number, cy: number) => {
    ctx.fillStyle = '#854D27'
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#B8860B'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, 12, 0, Math.PI * 2)
    ctx.stroke()
  }
  drawCornerFlourish(44, 44)
  drawCornerFlourish(width - 44, 44)
  drawCornerFlourish(44, height - 44)
  drawCornerFlourish(width - 44, height - 44)

  // 3. ヘッダーエリア
  ctx.fillStyle = '#854D27'
  ctx.font = 'bold 16px "Noto Serif JP", "Hiragino Mincho ProN", serif'
  ctx.textAlign = 'left'
  ctx.fillText('想い出箱  OMOIDE BAKO', 50, 75)

  // 今日の日付印
  const todayStr = new Date().toLocaleDateString(isJa ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillStyle = '#854D27'
  ctx.fillText(todayStr, width - 50, 75)

  // 番号札
  ctx.font = 'bold 15px sans-serif'
  ctx.fillStyle = '#B8860B'
  ctx.textAlign = 'center'
  ctx.fillText(isJa ? `第 ${fortune.id} 番` : `No. ${fortune.id}`, width / 2, 110)

  // 4. 運勢の印章・大見出し（大吉 / 中吉 / 小吉）
  const rankText = isJa ? fortune.rankNameJa : fortune.rankNameEn
  const isDaikichi = fortune.rank === 'daikichi'
  const isChukichi = fortune.rank === 'chukichi'

  // 印章グラデーション
  const badgeWidth = 260
  const badgeHeight = 70
  const badgeX = (width - badgeWidth) / 2
  const badgeY = 130

  const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY + badgeHeight)
  if (isDaikichi) {
    badgeGrad.addColorStop(0, '#B8860B')
    badgeGrad.addColorStop(0.5, '#E5A93C')
    badgeGrad.addColorStop(1, '#D4AF37')
  } else if (isChukichi) {
    badgeGrad.addColorStop(0, '#854D27')
    badgeGrad.addColorStop(0.5, '#A05D30')
    badgeGrad.addColorStop(1, '#854D27')
  } else {
    badgeGrad.addColorStop(0, '#3E6B48')
    badgeGrad.addColorStop(0.5, '#4E825A')
    badgeGrad.addColorStop(1, '#3E6B48')
  }

  // 印章の背景
  ctx.fillStyle = badgeGrad
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 16)
  ctx.fill()
  ctx.strokeStyle = '#FFFDF9'
  ctx.lineWidth = 3
  ctx.stroke()

  // 運勢の文字
  ctx.fillStyle = isDaikichi ? '#2A1208' : '#FFF9F3'
  ctx.font = 'bold 36px "Noto Serif JP", "Hiragino Mincho ProN", serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(rankText, width / 2, badgeY + badgeHeight / 2)
  ctx.textBaseline = 'alphabetic'

  // 5. 祝詠・和歌ボックス
  const poemBoxY = 225
  const poemBoxHeight = 115
  ctx.fillStyle = 'rgba(133, 77, 39, 0.08)'
  ctx.beginPath()
  ctx.roundRect(60, poemBoxY, width - 120, poemBoxHeight, 12)
  ctx.fill()

  // 和歌の左アクセント線
  ctx.fillStyle = '#854D27'
  ctx.fillRect(60, poemBoxY, 6, poemBoxHeight)

  ctx.font = 'bold 12px sans-serif'
  ctx.fillStyle = '#854D27'
  ctx.textAlign = 'left'
  ctx.fillText(isJa ? '📜 祝詠（しゅくえい）' : '📜 CELEBRATION POEM', 80, poemBoxY + 30)

  const poemText = isJa ? `「 ${fortune.poemJa} 」` : `"${fortune.poemEn}"`
  ctx.font = 'italic bold 18px "Noto Serif JP", "Hiragino Mincho ProN", serif'
  ctx.fillStyle = '#854D27'
  wrapText(ctx, poemText, 80, poemBoxY + 65, width - 160, 28)

  // 6. 総合運勢
  const generalY = 370
  ctx.font = 'bold 15px "Noto Serif JP", "Hiragino Mincho ProN", serif'
  ctx.fillStyle = '#5A3215'
  const generalText = isJa ? fortune.generalJa : fortune.generalEn
  wrapText(ctx, generalText, 60, generalY, width - 120, 24)

  // 7. 4大運勢（縁・健・志・祝）のカードグリッド
  const gridY = 460
  const cardW = (width - 120 - 24) / 2
  const cardH = 150

  const categories = [
    {
      title: isJa ? '【縁】絆・出会い' : '【BOND】Connection',
      text: isJa ? fortune.bondJa : fortune.bondEn,
      x: 60,
      y: gridY,
    },
    {
      title: isJa ? '【健】心身・健康' : '【HEALTH】Wellness',
      text: isJa ? fortune.healthJa : fortune.healthEn,
      x: 60 + cardW + 24,
      y: gridY,
    },
    {
      title: isJa ? '【志】願い事・学業' : '【WISH】Aspiration',
      text: isJa ? fortune.wishJa : fortune.wishEn,
      x: 60,
      y: gridY + cardH + 16,
    },
    {
      title: isJa ? '【祝】誕生日の言霊' : '【BLESSING】Celebration',
      text: isJa ? fortune.blessingJa : fortune.blessingEn,
      x: 60 + cardW + 24,
      y: gridY + cardH + 16,
    },
  ]

  categories.forEach((cat) => {
    // カード背景
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(cat.x, cat.y, cardW, cardH, 12)
    ctx.fill()

    ctx.strokeStyle = '#D4B08C'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // カテゴリ見出し
    ctx.fillStyle = '#854D27'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(cat.title, cat.x + 16, cat.y + 32)

    // カテゴリ本文
    ctx.fillStyle = '#6E4020'
    ctx.font = '13px "Noto Serif JP", "Hiragino Mincho ProN", serif'
    wrapText(ctx, cat.text, cat.x + 16, cat.y + 60, cardW - 32, 22)
  })

  // 8. ラッキー情報（色・品・幸運数）下部バー
  const luckyY = 820
  const luckyHeight = 110
  ctx.fillStyle = 'rgba(133, 77, 39, 0.08)'
  ctx.beginPath()
  ctx.roundRect(60, luckyY, width - 120, luckyHeight, 14)
  ctx.fill()
  ctx.strokeStyle = '#D4B08C'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const luckyCols = [
    {
      label: isJa ? 'ラッキーカラー' : 'LUCKY COLOR',
      value: isJa ? fortune.luckyColorJa : fortune.luckyColorEn,
      x: 60 + (width - 120) / 6,
    },
    {
      label: isJa ? 'ラッキーアイテム' : 'LUCKY ITEM',
      value: isJa ? fortune.luckyItemJa : fortune.luckyItemEn,
      x: 60 + (width - 120) / 2,
    },
    {
      label: isJa ? '幸運数' : 'LUCKY NUMBER',
      value: String(fortune.luckyNumber),
      x: 60 + ((width - 120) * 5) / 6,
    },
  ]

  luckyCols.forEach((col) => {
    ctx.textAlign = 'center'
    ctx.fillStyle = '#854D27'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText(col.label, col.x, luckyY + 36)

    ctx.fillStyle = '#4A260F'
    ctx.font = 'bold 18px "Noto Serif JP", "Hiragino Mincho ProN", serif'
    ctx.fillText(col.value, col.x, luckyY + 74)
  })

  // 9. ユーザー名（オプション）
  if (username) {
    ctx.fillStyle = '#854D27'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      isJa ? `${username} 様の今日のご縁を祈念して` : `Dedicated to ${username}`,
      width / 2,
      970
    )
  }

  // 10. フッター・ウォーターマーク
  ctx.fillStyle = 'rgba(133, 77, 39, 0.7)'
  ctx.font = '12px "Noto Serif JP", "Hiragino Mincho ProN", serif'
  ctx.textAlign = 'center'
  ctx.fillText('大切な記念日と思い出を分かち合う空間 — Omoide (想い出箱)', width / 2, 1140)

  const finalPngUrl = canvas.toDataURL('image/png')

  if (autoDownload) {
    downloadDataUrl(finalPngUrl, filename)
  }

  return finalPngUrl
}
