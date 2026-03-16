import apiClient from '@/api/client'
import type { Testimonial } from '@/shared/types'
import type { PaginatedResponse } from '@/api/types'

/**
 * Testimonials API endpoints
 */

export const testimonialsApi = {
  /**
   * Get all testimonials
   */
  getAll: async (): Promise<Testimonial[]> => {
    const response = await apiClient.get<Testimonial[] | PaginatedResponse<Testimonial>>('/testimonials')
    
    // Handle both array and paginated response formats
    if (Array.isArray(response.data)) {
      return response.data
    }
    
    // If it's a paginated response, extract the data array
    const paginatedResponse = response.data as PaginatedResponse<Testimonial>
    if (paginatedResponse?.data && Array.isArray(paginatedResponse.data)) {
      return paginatedResponse.data
    }
    
    // Fallback to empty array if structure is unexpected
    console.warn('Unexpected response structure from /testimonials endpoint:', response.data)
    return []
  },

  /**
   * Get testimonial by ID
   */
  getById: async (id: number): Promise<Testimonial> => {
    const response = await apiClient.get<Testimonial>(`/testimonials/${id}`)
    return response.data
  },
}

