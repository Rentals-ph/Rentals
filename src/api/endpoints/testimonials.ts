import apiClient from '../client'
import type { Testimonial } from '../../types'

/**
 * Testimonials API endpoints
 */

export const testimonialsApi = {
  /**
   * Get all testimonials
   */
  getAll: async (): Promise<Testimonial[]> => {
    const response = await apiClient.get<Testimonial[]>('/testimonials')
    return response.data
  },

  /**
   * Get testimonial by ID
   */
  getById: async (id: number): Promise<Testimonial> => {
    const response = await apiClient.get<Testimonial>(`/testimonials/${id}`)
    return response.data
  },
}

