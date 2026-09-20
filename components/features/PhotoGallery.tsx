'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { PhotoCard } from './PhotoCard'
import { useMediaFiles } from '@/lib/hooks/useMediaFiles'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { MediaFile } from '@/types'
import { Icon } from '@/components/ui/Icon'

const MediaViewer = dynamic(() => import('./MediaViewer').then((mod) => mod.MediaViewer), { ssr: false })
const MediaUploader = dynamic(() => import('./MediaUploader').then((mod) => mod.MediaUploader), { ssr: false })

interface PhotoGalleryProps {
  filterTag?: string
}

export function PhotoGallery({ filterTag }: PhotoGalleryProps) {
  const { files, isLoading, error, refetch } = useMediaFiles()
  const { t } = useLanguage()
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')
  const [slideshowMode, setSlideshowMode] = useState(false)
  const [showUploader, setShowUploader] = useState(false)

  // ファイルをフィルタリング
  const filteredFiles = files.filter((file) => {
    if (filter !== 'all' && file.file_type !== filter) return false
    if (filterTag && (!file.tags || !file.tags.includes(filterTag))) return false
    return true
  })

  // すべてのユニークなタグを取得
  const allTags = Array.from(
    new Set(files.flatMap((f) => f.tags || []))
  )

  if (isLoading && files.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div
          className="animate-spin"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #D4B08C',
            borderTopColor: '#854D27',
            borderRadius: '50%',
            margin: '0 auto',
          }}
        />
        <p style={{ marginTop: '16px', color: '#854D27' }}>{t('loading')}</p>
      </div>
    )
  }

  if (error && files.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* ツールバー：フィルタ ＋ アップロード ＋ スライドショー */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: '8px 16px',
                background: filter === type ? '#854D27' : '#FFF9F3',
                color: filter === type ? '#FFF9F3' : '#854D27',
                border: '2px solid #D4B08C',
                borderRadius: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85em',
                fontWeight: 600,
                textTransform: 'uppercase',
                boxShadow: '2px 2px 0 #D4B08C',
                transition: 'all 0.3s',
              }}
            >
              {type === 'all'
                ? t('allMedia')
                : type === 'image'
                ? t('photos')
                : t('videos')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* 写真・動画アップロードトグルボタン */}
          <button
            onClick={() => setShowUploader(!showUploader)}
            style={{
              padding: '8px 16px',
              background: showUploader ? '#6D3D1E' : '#854D27',
              color: '#FFF9F3',
              border: '2px solid #D4B08C',
              borderRadius: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85em',
              fontWeight: 600,
              boxShadow: '2px 2px 0 #D4B08C',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="Upload" size={16} />
            <span>{t('uploadMedia')}</span>
          </button>

          {/* スライドショーボタン */}
          {filteredFiles.length > 0 && (
            <button
              onClick={() => {
                setSelectedMedia(filteredFiles[0])
                setSlideshowMode(true)
              }}
              style={{
                padding: '8px 16px',
                background: '#854D27',
                color: '#FFF9F3',
                border: '2px solid #D4B08C',
                borderRadius: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85em',
                fontWeight: 600,
                boxShadow: '2px 2px 0 #D4B08C',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Icon name="Play" size={16} />
              <span>{t('slideshow')}</span>
            </button>
          )}
        </div>
      </div>

      {/* メディアアップローダーエリア */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <MediaUploader
              onUploadComplete={() => {
                refetch()
                setShowUploader(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          {allTags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '4px 10px',
                background: 'rgba(212, 176, 140, 0.3)',
                color: '#854D27',
                borderRadius: '12px',
                fontSize: '0.8em',
                cursor: 'pointer',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ギャラリーグリッド */}
      {filteredFiles.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#854D27',
            background: 'rgba(212, 176, 140, 0.1)',
            border: '2px dashed #D4B08C',
            marginBottom: '20px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <Icon name="Camera" size={32} />
          </div>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>
            {t('noPhotosInAlbum')}
          </p>
          <p style={{ fontSize: '0.85em', opacity: 0.8, marginBottom: '16px' }}>
            {t('uploadFirstPhoto')}
          </p>
          {!showUploader && (
            <button
              onClick={() => setShowUploader(true)}
              style={{
                padding: '10px 20px',
                background: '#854D27',
                color: '#FFF9F3',
                border: '2px solid #D4B08C',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9em',
                fontWeight: 600,
                boxShadow: '3px 3px 0 #D4B08C',
              }}
            >
              {t('uploadPhotosNow')}
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="photo-gallery-grid"
          style={{
            display: 'grid',
            gap: '12px',
          }}
        >
          {filteredFiles.map((file) => (
            <PhotoCard
              key={file.id}
              media={file}
              onClick={() => setSelectedMedia(file)}
            />
          ))}
        </motion.div>
      )}

      {/* メディアビューアモーダル */}
      {selectedMedia && (
        <MediaViewer
          media={selectedMedia}
          allMedia={filteredFiles}
          onClose={() => {
            setSelectedMedia(null)
            setSlideshowMode(false)
          }}
          onNavigate={setSelectedMedia}
          slideshowMode={slideshowMode}
          onToggleSlideshow={() => setSlideshowMode(!slideshowMode)}
        />
      )}
    </div>
  )
}
