'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useMediaFiles } from '@/lib/hooks/useMediaFiles'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { validateFile } from '@/lib/utils/media'
import { Icon } from '@/components/ui/Icon'

interface MediaUploaderProps {
  onUploadComplete?: () => void
}

export function MediaUploader({ onUploadComplete }: MediaUploaderProps) {
  const { uploadFile } = useMediaFiles()
  const { t } = useLanguage()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      setError(null)
      setIsUploading(true)
      setUploadProgress(0)

      const totalFiles = files.length
      let uploadedCount = 0

      for (const file of Array.from(files)) {
        const validation = validateFile(file)
        if (!validation.valid) {
          setError(
            file.size > 50 * 1024 * 1024
              ? t('fileTooLargeWithLimit', { size: 50 })
              : t('fileTypeError')
          )
          continue
        }

        const result = await uploadFile(file)
        if (result) {
          uploadedCount++
          setUploadProgress(Math.round((uploadedCount / totalFiles) * 100))
        }
      }

      setIsUploading(false)
      setUploadProgress(0)

      if (uploadedCount > 0 && onUploadComplete) {
        onUploadComplete()
      }
    },
    [uploadFile, onUploadComplete, t]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    },
    [handleFiles]
  )

  return (
    <div>
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? '#854D27' : '#D4B08C',
          background: isDragging ? 'rgba(133, 77, 39, 0.1)' : '#FFF9F3',
        }}
        style={{
          border: '3px dashed #D4B08C',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          id="media-upload-input"
          disabled={isUploading}
        />

        <label
          htmlFor="media-upload-input"
          className="block w-full"
          style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
        >
          {isUploading ? (
            <div role="status" aria-live="polite">
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  border: '4px solid #D4B08C',
                  borderTopColor: '#854D27',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p className="text-[#854D27] font-bold text-base m-0">
                {t('uploadProgress', { progress: uploadProgress })}
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 text-[#854D27] flex justify-center">
                <Icon name="FolderOpen" size={44} />
              </div>
              <p className="text-[#854D27] text-base font-bold mb-1.5">
                {t('dropMediaHere')}
              </p>
              <p className="text-[#854D27]/80 text-xs sm:text-sm m-0">
                {t('orChooseFile')}
              </p>
              <p className="text-[#854D27]/60 text-xs mt-3">
                {t('supportedMediaFormats')}
              </p>
            </div>
          )}
        </label>
      </motion.div>

      {error && (
        <p className="text-red-600 text-xs sm:text-sm font-bold mt-3 text-center" role="alert">
          {error}
        </p>
      )}

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
