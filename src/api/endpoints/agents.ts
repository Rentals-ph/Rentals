import apiClient from '../client'

/**
 * Agents API endpoints
 */

export interface AgentRegistrationData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  dateOfBirth?: string
  agencyName?: string
  officeAddress?: string
  city?: string
  state?: string
  zipCode?: string
  prcLicenseNumber: string
  licenseType: 'broker' | 'salesperson'
  expirationDate: string
  yearsOfExperience?: string
  agreeToTerms: boolean
}

export interface AgentRegistrationResponse {
  success: boolean
  message: string
  data?: {
    id: number
    name: string
    email: string
    status: string
  }
  errors?: Record<string, string[]>
}

export interface Agent {
  id: number
  first_name: string | null
  last_name: string | null
  full_name?: string
  email: string
  phone?: string | null
  whatsapp?: string | null
  agency_name?: string | null
  company_name?: string | null
  description?: string | null
  company_image?: string | null
  office_address?: string | null
  city?: string | null
  state?: string | null
  prc_license_number?: string | null
  license_type?: 'broker' | 'salesperson' | null
  status?: 'pending' | 'approved' | 'rejected' | null
  verified?: boolean
  properties_count?: number
  image?: string | null
  image_path?: string | null
  avatar?: string | null
  profile_image?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface GetAllAgentsResponse {
  success: boolean
  data: Agent[]
}

export const agentsApi = {
  /**
   * Get all approved agents
   */
  getAll: async (): Promise<Agent[]> => {
    try {
      const response = await apiClient.get<GetAllAgentsResponse>('/agents')
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get current authenticated agent
   */
  getCurrent: async (): Promise<Agent> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Agent }>('/agents/me')
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get agent by ID
   */
  getById: async (id: number): Promise<Agent> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Agent }>(`/agents/${id}`)
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Register a new agent
   */
  register: async (data: AgentRegistrationData, file?: File): Promise<AgentRegistrationResponse> => {
    const formData = new FormData()
    
    // Append all form fields
    formData.append('firstName', data.firstName)
    formData.append('lastName', data.lastName)
    formData.append('email', data.email)
    formData.append('password', data.password)
    if (data.phone) formData.append('phone', data.phone)
    if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth)
    if (data.agencyName) formData.append('agencyName', data.agencyName)
    if (data.officeAddress) formData.append('officeAddress', data.officeAddress)
    if (data.city) formData.append('city', data.city)
    if (data.state) formData.append('state', data.state)
    if (data.zipCode) formData.append('zipCode', data.zipCode)
    formData.append('prcLicenseNumber', data.prcLicenseNumber)
    formData.append('licenseType', data.licenseType)
    formData.append('expirationDate', data.expirationDate)
    if (data.yearsOfExperience) formData.append('yearsOfExperience', data.yearsOfExperience)
    formData.append('agreeToTerms', data.agreeToTerms.toString())
    
    // Append file if provided
    if (file) {
      formData.append('licenseDocument', file)
    }

    try {
      const response = await apiClient.post<AgentRegistrationResponse>('/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get agent dashboard statistics
   */
  getDashboardStats: async (): Promise<{
    total_listings: number
    active_listings: number
    total_revenue: number
    unread_messages: number
    total_views?: number
    total_inquiries?: number
    timeseries?: {
      labels: string[]
      listings: number[]
      views: number[]
      inquiries: number[]
    }
  }> => {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: {
          total_listings: number
          active_listings: number
          total_revenue: number
          unread_messages: number
          total_views?: number
          total_inquiries?: number
          timeseries?: {
            labels: string[]
            listings: number[]
            views: number[]
            inquiries: number[]
          }
        }
      }>('/agents/dashboard/stats')
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Update agent profile
   */
  update: async (data: {
    first_name?: string
    last_name?: string
    phone?: string
    city?: string
    state?: string
    office_address?: string
    image?: File
  }): Promise<Agent> => {
    const formData = new FormData()
    
    // Always send these fields, even if empty (backend handles null/empty)
    formData.append('first_name', data.first_name !== undefined ? (data.first_name || '') : '')
    formData.append('last_name', data.last_name !== undefined ? (data.last_name || '') : '')
    formData.append('phone', data.phone !== undefined ? (data.phone || '') : '')
    formData.append('city', data.city !== undefined ? (data.city || '') : '')
    formData.append('state', data.state !== undefined ? (data.state || '') : '')
    formData.append('office_address', data.office_address !== undefined ? (data.office_address || '') : '')
    if (data.image) formData.append('image', data.image)
    
    // Use POST with _method=PUT for FormData (Laravel method spoofing)
    // This ensures FormData is parsed correctly, especially for file uploads
    if (!formData.has('_method')) {
      formData.append('_method', 'PUT')
    }
    
    // Debug: Log what's being sent
    console.log('FormData being sent:', {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      city: formData.get('city'),
      state: formData.get('state'),
      office_address: formData.get('office_address'),
      hasImage: !!formData.get('image'),
      allKeys: Array.from(formData.keys())
    })

    try {
      // Use POST with method spoofing for FormData (same as property update)
      const response = await apiClient.post<{ success: boolean; data: Agent }>('/agents/me', formData, {
        headers: {
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        },
      })
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },
}
