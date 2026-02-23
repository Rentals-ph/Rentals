import apiClient from '../client'
import type { Blog } from '../../types'
import type { PaginatedResponse } from '../types'

/**
 * Blogs API endpoints
 */

export interface GetBlogsParams {
  category?: string
  search?: string
  page?: number
  per_page?: number
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
   * Get blog by ID
   */
  getById: async (id: number): Promise<Blog> => {
    const response = await apiClient.get<Blog>(`/blogs/${id}`)
    return response.data
  },
}

