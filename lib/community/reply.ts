import { validateMusicTrackReference } from '@/lib/music/server'
import { createServiceClient } from '@/lib/time-capsule/server'

export interface BirthdayReplyInput {
  postId: number
  sender: string
  content: string | null
  musicTrackId: string | null
}

export async function createBirthdayReply(input: BirthdayReplyInput): Promise<unknown> {
  const musicTrackId = input.musicTrackId ? await validateMusicTrackReference(input.musicTrackId) : null
  if (input.musicTrackId && !musicTrackId) throw new Error('楽曲参照が無効です')

  const { data, error } = await createServiceClient().rpc('create_birthday_reply', {
    p_post_id: input.postId,
    p_sender: input.sender,
    p_content: input.content,
    p_music_track_id: musicTrackId,
  })
  if (error) throw error
  return data
}
