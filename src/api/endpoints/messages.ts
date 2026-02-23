import apiClient from '../client'

/**
 * Messages API endpoints
 */

export interface Message {
  id: number
  sender_id: number | null
  recipient_id: number
  property_id: number | null
  sender_name: string
  sender_email: string
  sender_phone: string | null
  subject: string | null
  message: string
  type: 'contact' | 'property_inquiry' | 'general'
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
  property?: {
    id: number
    title: string
    image: string | null
  } | null
  sender?: {
    id: number
    name: string
    email: string
  } | null
}

export interface SendMessageData {
  recipient_id: number
  property_id?: number | null
  sender_name: string
  sender_email: string
  sender_phone?: string | null
  subject?: string | null
  message: string
  type?: 'contact' | 'property_inquiry' | 'general'
}

export interface GetMessagesParams {
  type?: 'contact' | 'property_inquiry' | 'general'
  is_read?: boolean
  property_id?: number
}

export const messagesApi = {
  /**
   * Send a message (public endpoint)
   */
  send: async (data: SendMessageData): Promise<{ success: boolean; message: string; data: Message }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data: Message }>('/messages', data)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get messages for authenticated user
   */
  getAll: async (params?: GetMessagesParams): Promise<{ success: boolean; data: Message[]; unread_count: number }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Message[]; unread_count: number }>('/messages', { params })
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get message by ID
   */
  getById: async (id: number): Promise<{ success: boolean; data: Message }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Message }>(`/messages/${id}`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Mark message as read
   */
  markAsRead: async (id: number): Promise<{ success: boolean; message: string; data: Message }> => {
    try {
      const response = await apiClient.put<{ success: boolean; message: string; data: Message }>(`/messages/${id}/read`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Delete a message
   */
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/messages/${id}`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },
}

