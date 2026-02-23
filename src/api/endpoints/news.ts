import apiClient from '../client'
import type { PaginatedResponse } from '../types'

/**
 * News API endpoints
 */

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

export interface GetNewsParams {
  category?: string
  search?: string
  page?: number
  per_page?: number
}

export const newsApi = {
  /**
   * Get all news articles
   */
  getAll: async (params?: GetNewsParams): Promise<News[]> => {
    try {
      const response = await apiClient.get<News[] | PaginatedResponse<News>>('/news', { params })
      
      // Handle both direct array response and wrapped response
      const news = Array.isArray(response.data) 
        ? response.data 
        : (response.data as PaginatedResponse<News>).data || []
      
      return news
    } catch (error: any) {
      console.error('Error fetching news:', error)
      throw error
    }
  },

  /**
   * Get news article by ID
   */
  getById: async (id: number): Promise<News> => {
    const response = await apiClient.get<News>(`/news/${id}`)
    return response.data
  },
}

