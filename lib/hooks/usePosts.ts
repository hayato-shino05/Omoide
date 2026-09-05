'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export interface Post {
  id: string
  sender: string
  message: string
  media_object_path: string | null
  media_url?: string
  birthday_person: string | null
  celebration_date: string | null
  timezone: string | null
  is_system_generated: boolean
  created_at: string
  likes: number
  replies_count?: number
}

type PostRecord = Omit<Post, 'media_url' | 'replies_count' | 'likes' | 'celebration_date' | 'timezone' | 'is_system_generated'> & {
  likes?: number
  post_replies?: { count: number }[]
  celebration_date?: string | null
  timezone?: string | null
  is_system_generated?: boolean
}

interface PostsQueryError {
  message?: string | null
  code?: string | null
}

interface PostsQueryResult {
  data: PostRecord[] | null
  error: PostsQueryError | null
}

function toPost(post: PostRecord): Post {
  const { data } = post.media_object_path
    ? getSupabase().storage.from('community-media').getPublicUrl(post.media_object_path)
    : { data: undefined }

  return {
    ...post,
    media_url: data?.publicUrl,
    likes: post.likes ?? 0,
    replies_count: post.post_replies?.[0]?.count ?? 0,
    celebration_date: post.celebration_date ?? null,
    timezone: post.timezone ?? null,
    is_system_generated: post.is_system_generated ?? false,
  }
}

export function usePosts() {
  const { t } = useLanguage()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let queryResult: PostsQueryResult = await getSupabase()
        .from('bulletin_posts')
        .select('id, sender, message, media_object_path, birthday_person, celebration_date, timezone, is_system_generated, created_at, likes, post_replies(count)')
        .order('created_at', { ascending: false })

      if (queryResult.error && (queryResult.error.message?.includes('likes') || queryResult.error.code === '42703')) {
        queryResult = await getSupabase()
          .from('bulletin_posts')
          .select('id, sender, message, media_object_path, birthday_person, celebration_date, timezone, is_system_generated, created_at, post_replies(count)')
          .order('created_at', { ascending: false })
      }

      if (queryResult.error) throw queryResult.error
      setPosts((queryResult.data ?? []).map((post) => toPost(post as PostRecord)))
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      setError(tRef.current('postsLoadError'))
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createPost = useCallback(async (
    sender: string,
    message: string,
    birthdayPerson?: string,
    mediaObjectPath?: string
  ) => {
    try {
      const { data, error: createError } = await getSupabase()
        .from('bulletin_posts')
        .insert({
          sender,
          message,
          birthday_person: birthdayPerson || null,
          media_object_path: mediaObjectPath || null,
        })
        .select('id, sender, message, media_object_path, birthday_person, created_at')
        .single()

      if (createError) throw createError
      setPosts((prev) => [{ ...toPost(data as PostRecord), replies_count: 0 }, ...prev])
      return true
    } catch (err) {
      console.error('Failed to create post:', err)
      return false
    }
  }, [])

  const likePost = useCallback(async (postId: string) => {
    const { data: likes, error: likeError } = await getSupabase()
      .rpc('increment_bulletin_post_likes', { p_post_id: postId })

    if (likeError || typeof likes !== 'number') return false

    setPosts((prev) => prev.map((post) => (
      post.id === postId ? { ...post, likes } : post
    )))
    return true
  }, [])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts,
    createPost,
    likePost,
  }
}
