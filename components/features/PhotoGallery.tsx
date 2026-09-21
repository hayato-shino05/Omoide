'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { RotateCcw } from 'lucide-react'
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
      <div className="w-full py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-[#FFF9F3] border-2 border-[#D4B08C]/30 rounded-md animate-pulse relative overflow-hidden"
              role="status"
              aria-label={t('loading')}
            >
              <div className="w-full h-full bg-[#D4B08C]/15" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && files.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-[#FFF9F3] border-2 border-[#D4B08C]/40 rounded-xl my-4" role="alert">
        <p className="text-sm font-bold text-red-600 mb-4">{error}</p>
        <button
          onClick={() => refetch()}
          className="min-h-11 px-6 py-2.5 bg-[#854D27] text-[#FFF9F3] text-sm font-bold rounded-lg border border-[#D4B08C] shadow-md hover:bg-[#6D3D1E] active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw size={16} />
          {t('retry')}
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* ツールバー：フィルタ ＋ アップロード ＋ スライドショー */}
      <div className="flex gap-2.5 mb-5 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`min-h-11 px-4 py-2 font-bold text-xs sm:text-sm tracking-wide rounded-md border-2 transition-all cursor-pointer shadow-xs ${
                filter === type
                  ? 'bg-[#854D27] text-[#FFF9F3] border-[#854D27] shadow-sm'
                  : 'bg-[#FFF9F3] text-[#854D27] border-[#D4B08C] hover:bg-white'
              }`}
            >
              {type === 'all'
                ? t('allMedia')
                : type === 'image'
                ? t('photos')
                : t('videos')}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* 写真・動画アップロードトグルボタン */}
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="min-h-11 px-4 py-2 bg-[#854D27] text-[#FFF9F3] font-bold text-xs sm:text-sm rounded-md border-2 border-[#D4B08C] shadow-xs hover:bg-[#6D3D1E] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
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
              className="min-h-11 px-4 py-2 bg-[#854D27] text-[#FFF9F3] font-bold text-xs sm:text-sm rounded-md border-2 border-[#D4B08C] shadow-xs hover:bg-[#6D3D1E] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
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
        <div className="flex gap-2 mb-5 flex-wrap items-center">
          {allTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1.5 bg-[#D4B08C]/30 text-[#854D27] rounded-full text-xs font-bold border border-[#D4B08C]/50 hover:bg-[#D4B08C]/50 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ギャラリーグリッド */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 px-4 text-[#854D27] bg-[#D4B08C]/10 border-2 border-dashed border-[#D4B08C] rounded-xl mb-5">
          <div className="mb-3 text-[#854D27]/80 flex justify-center">
            <Icon name="Camera" size={36} />
          </div>
          <p className="font-bold text-base mb-2">
            {t('noPhotosInAlbum')}
          </p>
          <p className="text-xs sm:text-sm opacity-80 mb-5 max-w-md mx-auto">
            {t('uploadFirstPhoto')}
          </p>
          {!showUploader && (
            <button
              onClick={() => setShowUploader(true)}
              className="min-h-11 px-6 py-2.5 bg-[#854D27] text-[#FFF9F3] text-sm font-bold rounded-lg border-2 border-[#D4B08C] shadow-sm hover:bg-[#6D3D1E] active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Icon name="Upload" size={16} />
              {t('uploadPhotosNow')}
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="photo-gallery-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
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
