import apiClient from '@/api/client'

/**
 * Notifications API endpoints
 */

export interface UserNotification {
  id: number
  user_id: number
  type: string
  title: string
  body: string | null
  data: Record<string, any> | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

export const notificationsApi = {
  /**
   * Get all notifications for the authenticated user
   */
  getAll: async (params?: { is_read?: boolean }): Promise<{ success: boolean; data: UserNotification[]; unread_count: number }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: UserNotification[]; unread_count: number }>('/notifications', { params })
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get unread notification count only (lightweight endpoint)
   */
  getUnreadCount: async (): Promise<{ success: boolean; unread_count: number }> => {
    try {
      const response = await apiClient.get<{ success: boolean; unread_count: number }>('/notifications/unread-count')
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: number): Promise<{ success: boolean; data: UserNotification }> => {
    try {
      const response = await apiClient.put<{ success: boolean; data: UserNotification }>(`/notifications/${id}/mark-as-read`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.put<{ success: boolean; message: string }>('/notifications/mark-all-as-read')
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Delete a notification
   */
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/notifications/${id}`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },
}
