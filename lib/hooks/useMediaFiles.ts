'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { uploadCommunityMedia } from '@/lib/supabase/communityMedia'
import type { MediaFile, MediaStats } from '@/types'

const CACHE_EXPIRY_TIME = 60000

interface MediaSubmission {
  id: number
  sender: string
  object_path: string
  media_kind: 'image' | 'video' | 'audio'
  original_name: string
  size_bytes: number
  description: string | null
  created_at: string
}

interface UseMediaFilesReturn {
  files: MediaFile[]
  isLoading: boolean
  error: string | null
  stats: MediaStats | null
  refetch: () => Promise<void>
  uploadFile: (file: File) => Promise<MediaFile | null>
}

function toMediaFile(submission: MediaSubmission): MediaFile {
  const { data } = getSupabase().storage.from('community-media').getPublicUrl(submission.object_path)

  return {
    id: submission.id,
    file_name: submission.original_name,
    file_path: data.publicUrl,
    file_type: submission.media_kind,
    file_size: submission.size_bytes,
    description: submission.description ?? undefined,
    uploaded_by: submission.sender,
    created_at: submission.created_at,
  }
}

export function useMediaFiles(): UseMediaFilesReturn {
  const { t } = useLanguage()
  const tRef = useRef(t)
  const cacheTimeRef = useRef(0)
  const filesLengthRef = useRef(0)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [files, setFiles] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<MediaStats | null>(null)
  const [cacheTime, setCacheTime] = useState(0)

  cacheTimeRef.current = cacheTime
  filesLengthRef.current = files.length

  const fetchFiles = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    if (!forceRefresh && cacheTimeRef.current > 0 && now - cacheTimeRef.current < CACHE_EXPIRY_TIME && filesLengthRef.current > 0) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await getSupabase()
        .from('media_submissions')
        .select('id, sender, object_path, media_kind, original_name, size_bytes, description, created_at')
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      const mediaFiles = (data as MediaSubmission[]).map(toMediaFile)
      const albumFiles = mediaFiles.filter((file) => file.file_type !== 'audio')
      const totalImages = albumFiles.filter((file) => file.file_type === 'image').length
      const totalVideos = albumFiles.filter((file) => file.file_type === 'video').length

      setFiles(albumFiles)
      setStats({
        totalFiles: albumFiles.length,
        totalImages,
        totalVideos,
        totalSize: albumFiles.reduce((sum, file) => sum + file.file_size, 0),
        recentUploads: albumFiles.slice(0, 5),
      })
      setCacheTime(now)
    } catch (err) {
      setError(err instanceof Error ? err.message : tRef.current('mediaLoadError'))
      setFiles([])
      setStats({ totalFiles: 0, totalImages: 0, totalVideos: 0, totalSize: 0, recentUploads: [] })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchFiles()
  }, [fetchFiles])

  const uploadFile = useCallback(async (file: File): Promise<MediaFile | null> => {
    try {
      const data = await uploadCommunityMedia({ file, sender: 'Guest' })

      setCacheTime(0)
      await fetchFiles(true)
      return toMediaFile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : tRef.current('uploadFileFailed'))
      return null
    }
  }, [fetchFiles])

  return { files, isLoading, error, stats, refetch: () => fetchFiles(true), uploadFile }
}
