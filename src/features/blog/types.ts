/**
 * Blog Feature Types
 * Type definitions for blog and news features
 */

export interface Blog {
  id: number
  title: string
  content: string
  excerpt: string
  category: string
  read_time: number
  likes: number
  comments: number
  likes_count?: number
  comments_count?: number
  author: string
  image: string | null
  image_url?: string | null // Full URL to the image (computed by backend)
  published_at: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface News {
  id: number
  title: string
  content: string
  excerpt: string
  category: string
  author: string
  image: string | null
  published_at: string | null
}

export interface BlogComment {
  id: number
  blog_id: number
  user_id?: number
  parent_id?: number
  name?: string
  email?: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    id: number
    first_name: string
    last_name: string
    image_path?: string
  }
  replies?: BlogComment[]
  likes_count?: number
  display_name?: string
}

