import apiClient from '../client'

/**
 * Messages API endpoints
 */

export interface Message {
  id: number
  sender_id: number | null
  recipient_id: number | null
  conversation_id: number | null
  property_id: number | null
  sender_name: string
  sender_email: string
  sender_phone: string | null
  subject: string | null
  message: string
  type: 'contact' | 'property_inquiry' | 'general' | 'team_invitation' | 'broker_invitation' | 'broker_invitation'
  metadata?: {
    team_id?: number
    team_name?: string
    team_member_id?: number
    role?: string
    broker_id?: number
    broker_name?: string
  } | null
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
  conversation?: InquiryConversation
}

export interface InquiryConversation {
  id: number
  agent_id: number | null
  broker_id: number | null
  customer_email: string
  customer_name: string
  property_id: number | null
  type: 'contact' | 'property_inquiry' | 'general' | 'team_invitation' | 'broker_invitation'
  subject: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
  property?: {
    id: number
    title: string
    image: string | null
  } | null
  agent?: {
    id: number
    name: string
    email: string
  } | null
  broker?: {
    id: number
    name: string
    email: string
  } | null
  latestMessage?: Message
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

export interface ReplyMessageData {
  message: string
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
  getAll: async (params?: GetMessagesParams): Promise<{ success: boolean; data: Message[]; conversations?: InquiryConversation[]; unread_count: number }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Message[]; conversations?: InquiryConversation[]; unread_count: number }>('/messages', { params })
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
   * Mark all messages as read
   */
  markAllAsRead: async (): Promise<{ success: boolean; message: string; count: number }> => {
    try {
      const response = await apiClient.put<{ success: boolean; message: string; count: number }>('/messages/read-all')
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

  /**
   * Get customer inquiries by email (public endpoint)
   */
  getCustomerInquiries: async (email: string): Promise<{ success: boolean; data: Message[]; conversations?: InquiryConversation[]; unread_count: number }> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Message[]; conversations?: InquiryConversation[]; unread_count: number }>(`/messages/customer/${encodeURIComponent(email)}`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get conversation messages by conversation ID
   * @param conversationId - The conversation ID
   * @param customerEmail - Optional customer email for public access (when not authenticated)
   */
  getConversationMessages: async (conversationId: number, customerEmail?: string): Promise<{ success: boolean; data: Message[]; conversation: InquiryConversation }> => {
    try {
      const params = customerEmail ? { email: customerEmail } : undefined
      const response = await apiClient.get<{ success: boolean; data: Message[]; conversation: InquiryConversation }>(`/conversations/${conversationId}/messages`, { params })
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Reply to a message (agent/broker only)
   */
  reply: async (id: number, data: ReplyMessageData): Promise<{ success: boolean; message: string; data: Message }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data: Message }>(`/messages/${id}/reply`, data)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Mark conversation as read for customer
   * @param conversationId - The conversation ID
   * @param customerEmail - Customer email
   */
  markConversationAsRead: async (conversationId: number, customerEmail: string): Promise<{ success: boolean; message: string; count: number }> => {
    try {
      const response = await apiClient.put<{ success: boolean; message: string; count: number }>(`/conversations/${conversationId}/mark-read`, null, {
        params: { email: customerEmail }
      })
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Accept a team invitation
   */
  acceptTeamInvitation: async (messageId: number): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data?: any }>(`/agents/team-invitations/${messageId}/accept`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Reject a team invitation
   */
  rejectTeamInvitation: async (messageId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(`/agents/team-invitations/${messageId}/reject`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },
}

