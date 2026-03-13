import apiClient from '../client'

/**
 * Contact API endpoints
 */

export interface ContactInquiry {
  id: number
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  is_read: boolean
  read_at: string | null
  read_by: number | null
  created_at: string
  updated_at: string
  readBy?: {
    id: number
    first_name: string
    last_name: string
    email: string
  } | null
}

export interface SubmitContactData {
  name: string
  email: string
  phone?: string | null
  subject: string
  message: string
}

export interface GetContactInquiriesParams {
  is_read?: boolean
  page?: number
  per_page?: number
}

export const contactApi = {
  /**
   * Submit a contact inquiry (public endpoint)
   */
  submit: async (data: SubmitContactData): Promise<{ success: boolean; message: string; data: ContactInquiry }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data: ContactInquiry }>('/contact', data)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get all contact inquiries (admin only)
   */
  getInquiries: async (params?: GetContactInquiriesParams): Promise<{ success: boolean; data: ContactInquiry[] | { data: ContactInquiry[]; current_page: number; last_page: number; per_page: number; total: number } }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: ContactInquiry[] | { data: ContactInquiry[]; current_page: number; last_page: number; per_page: number; total: number } }>('/admin/contact-inquiries', { params })
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get a specific contact inquiry (admin only)
   */
  getInquiry: async (id: number): Promise<{ success: boolean; data: ContactInquiry }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: ContactInquiry }>(`/admin/contact-inquiries/${id}`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Mark contact inquiry as read (admin only)
   */
  markAsRead: async (id: number): Promise<{ success: boolean; message: string; data: ContactInquiry }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data: ContactInquiry }>(`/admin/contact-inquiries/${id}/read`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Delete a contact inquiry (admin only)
   */
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/admin/contact-inquiries/${id}`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },
}

