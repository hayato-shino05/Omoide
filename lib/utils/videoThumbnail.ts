/**
 * 動画の Blob からサムネイルを生成する
 */
export async function generateVideoThumbnail(
  videoBlob: Blob,
  seekTime: number = 0.5
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(seekTime, video.duration)
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(video.src)
            resolve(blob)
          },
          'image/jpeg',
          0.8
        )
      } else {
        resolve(null)
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    }

    video.src = URL.createObjectURL(videoBlob)
  })
}

/**
 * 生成したサムネイルを Supabase ストレージにアップロードする
 */
export async function uploadThumbnail(
  thumbnailBlob: Blob,
  fileName: string,
  supabase: ReturnType<typeof import('@/lib/supabase/client').getSupabase>
): Promise<string | null> {
  try {
    const { error } = await supabase.storage
      .from('video-thumbnails')
      .upload(fileName, thumbnailBlob, {
        contentType: 'image/jpeg',
      })

    if (error) throw error

    const { data } = supabase.storage
      .from('video-thumbnails')
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch {
    return null
  }
}
