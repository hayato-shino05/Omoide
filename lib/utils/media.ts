import type { MediaFile, MediaStats } from '@/types'

export function getMediaStats(files: MediaFile[]): MediaStats {
  const totalImages = files.filter((f) => f.file_type === 'image').length
  const totalVideos = files.filter((f) => f.file_type === 'video').length
  const totalSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0)

  return {
    totalFiles: files.length,
    totalImages,
    totalVideos,
    totalSize,
    recentUploads: files.slice(0, 5),
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileType(fileName: string): 'image' | 'video' | 'unknown' {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']

  if (ext && imageExts.includes(ext)) return 'image'
  if (ext && videoExts.includes(ext)) return 'video'
  return 'unknown'
}

export function validateFile(file: File, maxSizeMB: number = 50): { valid: boolean; error?: string } {
  const maxSize = maxSizeMB * 1024 * 1024

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
  }

  const fileType = getFileType(file.name)
  if (fileType === 'unknown') {
    return { valid: false, error: 'Unsupported file type' }
  }

  return { valid: true }
}

export async function compressImage(file: File, maxWidth: number = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let objectUrl: string | null = null
    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
      }
    }
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          0.85
        )
      } finally {
        cleanup()
      }
    }
    img.onerror = () => {
      cleanup()
      reject(new Error('Failed to load image'))
    }
    objectUrl = URL.createObjectURL(file)
    img.src = objectUrl
  })
}

export async function getVideoDuration(videoFile: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video')

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(0)
    }

    video.src = URL.createObjectURL(videoFile)
  })
}
