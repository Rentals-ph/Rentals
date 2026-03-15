import apiClient from '@/api/client'
import type { Blog, BlogComment } from './types'
import type { PaginatedResponse } from '@/api/types'

/**
 * Blogs API endpoints
 */

export interface GetBlogsParams {
  category?: string
  search?: string
  page?: number
  per_page?: number
}

export interface CreateBlogData {
  title: string
  content: string
  excerpt?: string
  category?: string
  author?: string
  image?: File | string | null
  published_at?: string | null
  internal_title?: string
  url_slug?: string
  country?: string
  publish_date?: string
  publish_time?: string
  target_platforms?: string[]
  content_blocks?: any[]
}

export interface UpdateBlogData extends Partial<CreateBlogData> {
  id: number
}

export const blogsApi = {
  /**
   * Get all blogs
   */
  getAll: async (params?: GetBlogsParams): Promise<Blog[]> => {
    try {
      const response = await apiClient.get<Blog[] | PaginatedResponse<Blog>>('/blogs', { params })
      
      // Handle both direct array response and wrapped response
      const blogs = Array.isArray(response.data) 
        ? response.data 
        : (response.data as PaginatedResponse<Blog>).data || []
      
      return blogs
    } catch (error: any) {
      console.error('Error fetching blogs:', error)
      console.error('Response:', error.response?.data)
      throw error
    }
  },

  /**
   * Get blog by ID or slug
   */
  getById: async (id: number | string): Promise<Blog> => {
    const response = await apiClient.get<Blog>(`/blogs/${id}`)
    return response.data
  },
  
  /**
   * Get blog by slug
   */
  getBySlug: async (slug: string): Promise<Blog> => {
    const response = await apiClient.get<Blog>(`/blogs/${slug}`)
    return response.data
  },

  /**
   * Create a new blog post
   */
  create: async (data: CreateBlogData): Promise<Blog> => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('content', data.content)
    if (data.excerpt) formData.append('excerpt', data.excerpt)
    if (data.category) formData.append('category', data.category)
    if (data.author) formData.append('author', data.author)
    if (data.image instanceof File) {
      formData.append('image', data.image)
    }
    if (data.published_at) formData.append('published_at', data.published_at)
    
    const response = await apiClient.post<{ success: boolean; data: Blog }>('/blogs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  /**
   * Update a blog post
   */
  update: async (id: number, data: Partial<CreateBlogData>): Promise<Blog> => {
    const formData = new FormData()
    if (data.title) formData.append('title', data.title)
    if (data.content) formData.append('content', data.content)
    if (data.excerpt !== undefined) formData.append('excerpt', data.excerpt || '')
    if (data.category) formData.append('category', data.category)
    if (data.author) formData.append('author', data.author)
    if (data.image instanceof File) {
      formData.append('image', data.image)
    }
    if (data.published_at !== undefined) {
      formData.append('published_at', data.published_at || '')
    }
    
    const response = await apiClient.put<{ success: boolean; data: Blog }>(`/blogs/${id}`, formData)
    return response.data.data
  },

  /**
   * Delete a blog post
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/blogs/${id}`)
  },

  /**
   * Get blog likes
   */
  getLikes: async (blogId: number): Promise<{ liked: boolean; likes_count: number }> => {
    const response = await apiClient.get<{ success: boolean; data: { liked: boolean; likes_count: number } }>(`/blogs/${blogId}/likes`)
    return response.data.data
  },

  /**
   * Toggle blog like
   */
  toggleLike: async (blogId: number): Promise<{ liked: boolean; likes_count: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: { liked: boolean; likes_count: number } }>(`/blogs/${blogId}/likes`)
      return response.data.data
    } catch (error: any) {
      // Re-throw with better error message for rate limiting
      if (error.response?.status === 429) {
        throw new Error(error.response?.data?.message || 'Please wait a moment before liking again.')
      }
      throw error
    }
  },

  /**
   * Get blog comments
   */
  getComments: async (blogId: number): Promise<BlogComment[]> => {
    const response = await apiClient.get<{ success: boolean; data: BlogComment[] }>(`/blogs/${blogId}/comments`)
    return response.data.data || []
  },

  /**
   * Post a comment
   */
  postComment: async (blogId: number, data: { content: string; name?: string; email?: string; parent_id?: number }): Promise<BlogComment> => {
    const response = await apiClient.post<{ success: boolean; data: { comment: BlogComment; comments_count: number } }>(`/blogs/${blogId}/comments`, data)
    return response.data.data.comment
  },

  /**
   * Delete a comment
   */
  deleteComment: async (blogId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/blogs/${blogId}/comments/${commentId}`)
  },

  /**
   * Get comment likes
   */
  getCommentLikes: async (blogId: number, commentId: number): Promise<{ liked: boolean; likes_count: number }> => {
    const response = await apiClient.get<{ success: boolean; data: { liked: boolean; likes_count: number } }>(`/blogs/${blogId}/comments/${commentId}/likes`)
    return response.data.data
  },

  /**
   * Toggle comment like
   */
  toggleCommentLike: async (blogId: number, commentId: number): Promise<{ liked: boolean; likes_count: number }> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: { liked: boolean; likes_count: number } }>(`/blogs/${blogId}/comments/${commentId}/likes`)
      return response.data.data
    } catch (error: any) {
      // Re-throw with better error message for rate limiting
      if (error.response?.status === 429) {
        throw new Error(error.response?.data?.message || 'Please wait a moment before liking again.')
      }
      throw error
    }
  },
}

// BlogComment type is exported from ./types

