'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, Upload, Download, RotateCcw, X, Plus } from 'lucide-react'
import { photoStrips, frameCategories, PhotoStripConfig } from '@/config/frames'
import { useToast } from '@/components/ui/Toast'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function PhotoFrame() {
  const { t } = useLanguage()
  const toast = useToast()
  const [selectedStrip, setSelectedStrip] = useState<PhotoStripConfig>(photoStrips[0])
  const [selectedCategory, setSelectedCategory] = useState<string>('trending')
  const [userImages, setUserImages] = useState<(string | null)[]>([null, null, null, null])
  const [activeSlot, setActiveSlot] = useState<number>(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [finalImage, setFinalImage] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const filteredStrips = photoStrips.filter(f => f.category === selectedCategory)

  // フレーム変更時に画像をリセットする
  useEffect(() => {
    setUserImages(Array(selectedStrip.photoCount).fill(null))
    setNoteText('')
  }, [selectedStrip])

  // 画像を読み込む補助関数
  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })
  }

  // キャンバスにフォトフレームを描画する
  const drawStrip = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const strip = selectedStrip
    canvas.width = strip.width
    canvas.height = strip.height

    // 背景は画像を優先し、なければ単色を使う
    if (strip.bgImage) {
      const bgImg = await loadImage(strip.bgImage)
      if (bgImg) {
        // キャンバス全体を覆う背景画像を描画する
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
      } else {
        // 画像の読み込みに失敗したら単色にフォールバックする
        ctx.fillStyle = strip.bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    } else {
      ctx.fillStyle = strip.bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 枠線を描画する
    ctx.strokeStyle = strip.borderColor
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)

    // タイトルを描画する
    ctx.font = `bold 28px Arial`
    ctx.fillStyle = strip.titleColor
    ctx.textAlign = 'center'
    ctx.fillText(strip.title, canvas.width / 2, 50)

    // 写真スロットを描画する
    const photoHeight = (canvas.height - 180) / strip.photoCount
    const photoWidth = canvas.width - 80
    const startY = 70
    const startX = 40

    for (let i = 0; i < strip.photoCount; i++) {
      const y = startY + i * photoHeight + 10
      const slotHeight = photoHeight - 20

      // 写真枠の背景を描画する
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(startX, y, photoWidth, slotHeight)

      // 写真枠の境界を描画する
      ctx.strokeStyle = strip.borderColor
      ctx.lineWidth = 3
      ctx.strokeRect(startX, y, photoWidth, slotHeight)

      // ユーザー画像またはプレースホルダーを描画する
      if (userImages[i]) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const imgRatio = img.width / img.height
            const slotRatio = photoWidth / slotHeight
            let sx = 0, sy = 0, sw = img.width, sh = img.height

            if (imgRatio > slotRatio) {
              sw = img.height * slotRatio
              sx = (img.width - sw) / 2
            } else {
              sh = img.width / slotRatio
              sy = (img.height - sh) / 2
            }

            ctx.drawImage(img, sx, sy, sw, sh, startX + 3, y + 3, photoWidth - 6, slotHeight - 6)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = userImages[i]!
        })
      } else {
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(startX + 3, y + 3, photoWidth - 6, slotHeight - 6)
        ctx.fillStyle = '#999'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(t('photoPlaceholder', { index: i + 1 }), canvas.width / 2, y + slotHeight / 2 + 5)
      }
    }

    // 装飾を描画する
    for (const dec of strip.decorations) {
      const px = dec.x * canvas.width
      const py = dec.y * canvas.height

      ctx.save()
      if (dec.rotation) {
        ctx.translate(px, py)
        ctx.rotate((dec.rotation * Math.PI) / 180)
        ctx.translate(-px, -py)
      }

      if (dec.type === 'image' && dec.src) {
        // 装飾画像を読み込んで描画する
        const decImg = await loadImage(dec.src)
        if (decImg) {
          const width = dec.width || 60
          const height = dec.height || 60
          ctx.drawImage(decImg, px, py, width, height)
        }
      } else if (dec.type === 'emoji' || dec.type === 'text') {
        ctx.font = `${dec.fontSize || 24}px Arial`
        ctx.fillStyle = dec.color || '#000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(dec.content || '', px, py)
      }
      ctx.restore()
    }

    // メモ欄を描画する
    const noteY = canvas.height - 90
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.strokeStyle = strip.borderColor
    ctx.lineWidth = 2
    roundRect(ctx, 30, noteY, canvas.width - 60, 60, 10)
    ctx.fill()
    ctx.stroke()

    if (noteText) {
      ctx.fillStyle = strip.titleColor
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(noteText, canvas.width / 2, noteY + 35)
    } else {
      ctx.fillStyle = '#aaa'
      ctx.font = 'italic 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(t('notePlaceholder'), canvas.width / 2, noteY + 35)
    }

    setFinalImage(canvas.toDataURL('image/png'))
  }, [selectedStrip, userImages, noteText, t])

  useEffect(() => {
    drawStrip()
  }, [drawStrip])

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const newImages = [...userImages]
      newImages[activeSlot] = ev.target?.result as string
      setUserImages(newImages)
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 720 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCapturing(true)
    } catch (err) {
      console.error('Camera error:', err)
      toast.error(t('cameraAccessError'))
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = videoRef.current.videoWidth
    tempCanvas.height = videoRef.current.videoHeight
    const ctx = tempCanvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const newImages = [...userImages]
      newImages[activeSlot] = tempCanvas.toDataURL('image/jpeg')
      setUserImages(newImages)
    }
    stopCamera()
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }, [])

  // コンポーネントアンマウント時のストリームクリーンアップ
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const downloadImage = () => {
    if (!finalImage) return
    const link = document.createElement('a')
    link.download = `photobook-${selectedStrip.id}-${Date.now()}.png`
    link.href = finalImage
    link.click()
  }

  const removeImage = (index: number) => {
    const newImages = [...userImages]
    newImages[index] = null
    setUserImages(newImages)
  }

  const resetAll = () => {
    setUserImages(Array(selectedStrip.photoCount).fill(null))
    setNoteText('')
  }

  const hasAnyImage = userImages.some(img => img !== null)

  return (
    <div className="photoframe-container">

      <div className="photoframe-categories">
        {frameCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id)
              const firstInCat = photoStrips.find(s => s.category === cat.id)
              if (firstInCat) setSelectedStrip(firstInCat)
            }}
            className={`photoframe-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
          >
            {cat.id === 'trending'
              ? t('frameCategoryTrending')
              : cat.id === 'classic'
              ? t('frameCategoryClassic')
              : cat.id === 'cute'
              ? t('frameCategoryCute')
              : t('frameCategoryElegant')}
          </button>
        ))}
      </div>


      <div className="photoframe-strips">
        {filteredStrips.map(strip => (
          <button
            key={strip.id}
            onClick={() => setSelectedStrip(strip)}
            className={`photoframe-strip-btn ${selectedStrip.id === strip.id ? 'active' : ''}`}
            style={{
              background: selectedStrip.id === strip.id ? strip.bgColor : undefined,
              borderColor: selectedStrip.id === strip.id ? strip.borderColor : undefined,
              color: selectedStrip.id === strip.id ? strip.titleColor : undefined,
            }}
          >
            {strip.name}
          </button>
        ))}
      </div>


      <div className="photoframe-main">

        <div className="photoframe-preview">
          {isCapturing ? (
            <div className="photoframe-camera">
              <video ref={videoRef} autoPlay playsInline muted className="photoframe-video" />
              <div className="photoframe-camera-btns">
                <button onClick={capturePhoto} className="photoframe-btn capture" aria-label={t('capture')}>
                  <Camera size={18} /> {t('capture')}
                </button>
                <button onClick={stopCamera} className="photoframe-btn cancel" aria-label={t('cancel')}>
                  <X size={18} /> {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <canvas ref={canvasRef} className="photoframe-canvas" />
          )}
        </div>


        <div className="photoframe-controls">

          <p className="photoframe-label">{t('choosePhotoSlot')}</p>
          <div className="photoframe-slots">
            {Array(selectedStrip.photoCount).fill(0).map((_, i) => (
              <div key={i} className="photoframe-slot-wrapper">
                <button
                  onClick={() => setActiveSlot(i)}
                  className={`photoframe-slot ${activeSlot === i ? 'active' : ''}`}
                  style={{ borderColor: activeSlot === i ? selectedStrip.borderColor : undefined }}
                  aria-label={t('photoPlaceholder', { index: i + 1 })}
                >
                  {userImages[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userImages[i]!} alt={t('photoPlaceholder', { index: i + 1 })} />
                  ) : (
                    <Plus size={20} color="#999" />
                  )}
                </button>
                {userImages[i] && (
                  <button
                    onClick={() => removeImage(i)}
                    className="photoframe-slot-remove"
                    aria-label={t('reset')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>


          <div className="photoframe-upload-btns">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} className="photoframe-btn primary">
              <Upload size={16} /> {t('library')}
            </button>
            <button onClick={startCamera} className="photoframe-btn primary">
              <Camera size={16} /> {t('takePhoto')}
            </button>
          </div>


          <div className="photoframe-note">
            <label htmlFor="photoframe-note-input">{t('noteLabel')}</label>
            <input
              id="photoframe-note-input"
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t('notePlaceholder')}
              maxLength={40}
            />
          </div>


          <div className="photoframe-actions">
            {hasAnyImage && (
              <button onClick={resetAll} className="photoframe-btn secondary">
                <RotateCcw size={16} /> {t('reset')}
              </button>
            )}
            <button onClick={downloadImage} disabled={!hasAnyImage} className="photoframe-btn success">
              <Download size={16} /> {t('download')}
            </button>
          </div>
        </div>
      </div>

      <p className="photoframe-hint">{t('photoframeHint')}</p>

      <style jsx>{`
        .photoframe-container {
          width: 100%;
        }

        .photoframe-categories {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          overflow-x: auto;
          padding-bottom: 6px;
          -webkit-overflow-scrolling: touch;
        }

        .photoframe-cat-btn {
          min-height: 44px;
          padding: 8px 16px;
          background: #FFFDF9;
          color: #854D27;
          border: 2px solid #D4B08C;
          border-radius: 8px;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 0.85em;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s ease-out;
        }

        .photoframe-cat-btn.active {
          background: #854D27;
          color: #FFF9F3;
          border-color: #854D27;
          box-shadow: 0 4px 12px rgba(133, 77, 39, 0.25);
        }

        .photoframe-strips {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          overflow-x: auto;
          padding-bottom: 6px;
          -webkit-overflow-scrolling: touch;
        }

        .photoframe-strip-btn {
          min-height: 44px;
          padding: 8px 14px;
          background: #FFF9F3;
          color: #854D27;
          border: 2px solid #D4B08C;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8em;
          font-weight: 600;
          white-space: nowrap;
          min-width: 90px;
          flex-shrink: 0;
          transition: all 0.2s ease-out;
        }

        .photoframe-strip-btn.active {
          border-width: 2.5px;
          border-color: #854D27;
          box-shadow: 0 4px 12px rgba(133, 77, 39, 0.2);
        }

        .photoframe-main {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .photoframe-preview {
          flex: 0 0 auto;
          text-align: center;
        }

        .photoframe-canvas {
          width: 170px;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(44, 24, 16, 0.2);
        }

        .photoframe-camera {
          text-align: center;
        }

        .photoframe-video {
          width: 200px;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          border: 3px solid #D4B08C;
        }

        .photoframe-camera-btns {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 12px;
        }

        .photoframe-controls {
          flex: 1;
          min-width: 220px;
        }

        .photoframe-label {
          color: #854D27;
          font-weight: 700;
          margin-bottom: 8px;
          font-size: 0.9em;
        }

        .photoframe-slots {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .photoframe-slot-wrapper {
          position: relative;
        }

        .photoframe-slot {
          width: 52px;
          height: 52px;
          border: 2px solid #D4B08C;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          background: #FFFDF9;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .photoframe-slot.active {
          border-width: 2.5px;
          box-shadow: 0 0 0 2px rgba(133, 77, 39, 0.3);
        }

        .photoframe-slot img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photoframe-slot-remove {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #D95D39;
          color: #FFFDF9;
          border: 2px solid #FFFDF9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          transition: transform 0.15s;
        }

        .photoframe-slot-remove:hover {
          transform: scale(1.15);
          background: #C64C28;
        }

        .photoframe-upload-btns {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .photoframe-btn {
          min-height: 44px;
          padding: 10px 18px;
          border: 2px solid #D4B08C;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.85em;
          font-weight: 700;
          font-family: var(--font-body);
          transition: all 0.2s ease-out;
        }

        .photoframe-btn.primary {
          background: #854D27;
          color: #FFF9F3;
          border-color: #854D27;
          box-shadow: 0 4px 12px rgba(133, 77, 39, 0.2);
        }

        .photoframe-btn.primary:hover {
          background: #6D3D1E;
          transform: translateY(-1px);
        }

        .photoframe-btn.secondary {
          background: #FFFDF9;
          color: #854D27;
          border: 2px solid #D4B08C;
        }

        .photoframe-btn.secondary:hover {
          background: rgba(212, 176, 140, 0.2);
        }

        .photoframe-btn.success {
          background: #2D5A27;
          color: #FFFDF9;
          border: 2px solid #2D5A27;
          box-shadow: 0 4px 12px rgba(45, 90, 39, 0.25);
        }

        .photoframe-btn.success:hover:not(:disabled) {
          background: #23471E;
          transform: translateY(-1px);
        }

        .photoframe-btn.success:disabled {
          background: #D4B08C/40;
          border-color: #D4B08C/40;
          color: #854D27/50;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .photoframe-btn.capture {
          background: #2D5A27;
          color: #FFFDF9;
          border: 2px solid #2D5A27;
          border-radius: 9999px;
          min-height: 44px;
        }

        .photoframe-btn.cancel {
          background: #D95D39;
          color: #FFFDF9;
          border: 2px solid #D95D39;
          border-radius: 9999px;
          min-height: 44px;
        }

        .photoframe-note {
          margin-bottom: 16px;
        }

        .photoframe-note label {
          color: #854D27;
          font-weight: 700;
          font-size: 0.85em;
          display: block;
          margin-bottom: 6px;
        }

        .photoframe-note input {
          width: 100%;
          min-height: 44px;
          padding: 8px 12px;
          border: 2px solid #D4B08C;
          border-radius: 8px;
          background: #FFFDF9;
          color: #2C1810;
          font-size: 0.9em;
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.2s;
        }

        .photoframe-note input:focus {
          border-color: #854D27;
        }

        .photoframe-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .photoframe-hint {
          text-align: center;
          color: #854D27;
          opacity: 0.7;
          margin-top: 16px;
          font-size: 0.8em;
        }

        @media (max-width: 480px) {
          .photoframe-main {
            flex-direction: column;
            align-items: center;
          }

          .photoframe-canvas {
            width: 150px;
          }

          .photoframe-controls {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
