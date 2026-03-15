import { getApiBaseUrl } from '../shared/config/api'

// Get API base URL (respects USE_LOCAL_API env var to switch between local and remote)
const API_BASE_URL = getApiBaseUrl()

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken()
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Only add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // For FormData, don't set Content-Type (browser will set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      // Try to parse error response as JSON, but handle non-JSON responses
      let errorData: any = {}
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json()
        } else {
          errorData = { message: `Server error: ${response.status} ${response.statusText}` }
        }
      } catch {
        errorData = { message: `Server error: ${response.status} ${response.statusText}` }
      }
      
      return {
        success: false,
        message: errorData.message || 'An error occurred',
        errors: errorData.errors,
      }
    }

    // Parse JSON response
    let data: any
    try {
      data = await response.json()
    } catch (parseError) {
      return {
        success: false,
        message: 'Invalid response format from server',
      }
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    }
  } catch (error) {
    console.error('API request failed:', error)
    
    // Check if it's a connection error
    const isConnectionError = error instanceof TypeError && 
      (error.message.includes('Failed to fetch') || 
       error.message.includes('NetworkError') ||
       error.message.includes('ERR_CONNECTION_REFUSED'))
    
    if (isConnectionError) {
      return {
        success: false,
        message: 'Unable to connect to the server. Please make sure the backend server is running.',
      }
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred',
    }
  }
}

// Search API response types
export interface PropertySearchResponse {
  query: string
  criteria: Record<string, any>
  properties: any[]
  ai_response: string
  count: number
  conversation_id?: string
  response_type: 'search' | 'conversational'
  is_search: boolean
}

// Conversation types
export interface ConversationMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  metadata?: {
    query_type?: 'search' | 'conversational'
    response_type?: 'search' | 'conversational'
    criteria?: Record<string, any>
    properties?: any[]
    count?: number
  }
  created_at: string
}

export interface Conversation {
  id: number
  conversation_id: string
  title: string | null
  messages: ConversationMessage[]
  context?: {
    preferences?: Record<string, any>
    facts?: Record<string, any>
    search_criteria?: Record<string, any>
    property_interests?: Record<string, any>
    user_info?: Record<string, any>
  }
  created_at: string
  updated_at: string
  last_message_at?: string
  message_count?: number
}

export interface ConversationListItem {
  id: number
  conversation_id: string
  title: string
  last_message_at: string
  created_at: string
  message_count: number
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, body?: any) => {
    const isFormData = body instanceof FormData
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    })
  },
  
  put: <T>(endpoint: string, body?: any) => {
    const isFormData = body instanceof FormData
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    })
  },
  
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
  
  // Property search API
  searchProperties: async (query: string, conversationId?: string): Promise<ApiResponse<PropertySearchResponse>> => {
    return api.post<PropertySearchResponse>('/property/search', {
      query,
      conversation_id: conversationId,
    })
  },
  
  // Conversation management APIs
  listConversations: async (): Promise<ApiResponse<ConversationListItem[]>> => {
    return api.get<ConversationListItem[]>('/property/search/conversations')
  },
  
  getConversation: async (conversationId: string): Promise<ApiResponse<Conversation>> => {
    return api.get<Conversation>(`/property/search/conversation/${conversationId}`)
  },
  
  deleteConversation: async (conversationId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return api.delete<{ success: boolean; message: string }>(`/property/search/conversation/${conversationId}`)
  },
  
  clearConversationContext: async (conversationId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return api.delete<{ success: boolean; message: string }>(`/property/search/conversation/${conversationId}/context`)
  },

  /** AI-generated suggested prompts for the chat UI. data.prompts = strings, data.fromAI = true when from AI. */
  getSuggestedPrompts: async (): Promise<ApiResponse<{ prompts: string[]; fromAI: boolean }>> => {
    return api.get<{ prompts: string[]; fromAI: boolean }>('/property/search/suggested-prompts')
  },

  /** Generate property description from category + title (backend only; no API keys in client). */
  generatePropertyDescription: async (category: string, title: string): Promise<ApiResponse<string>> => {
    return api.post<string>('/property/search/generate-property-description', { category, title })
  },
}

export default api

