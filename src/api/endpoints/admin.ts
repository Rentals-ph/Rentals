import apiClient from '../client'

/**
 * Admin API endpoints
 */

export interface AdminAgent {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  agency_name?: string
  prc_license_number?: string
  license_type?: string
  status: string
  verified: boolean
  created_at: string
  company?: { id: number; name: string }
}

export interface AdminProperty {
  id: number
  slug?: string
  title: string
  description?: string
  type?: string
  listing_type?: string
  price?: number
  price_type?: string
  bedrooms?: number
  bathrooms?: number
  garage?: number
  area?: number
  lot_area?: number
  city?: string
  state_province?: string
  street_address?: string
  agent_id?: number
  status?: string
  draft_status?: string
  is_featured?: boolean
  created_at: string
  agent?: AdminAgent
}

export interface CreateAgentData {
  first_name: string
  last_name: string
  email: string
  password: string
  phone?: string
  role?: 'agent'
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'
  is_active?: boolean
}

export interface UpdateAgentData {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  phone?: string
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'
  is_active?: boolean
}

export interface CreatePropertyData {
  title: string
  description?: string
  type?: string
  listing_type?: 'for_rent' | 'for_sale'
  price?: number
  price_type?: 'monthly' | 'yearly' | 'per_sqm' | 'total'
  bedrooms?: number
  bathrooms?: number
  garage?: number
  area?: number
  lot_area?: number
  city?: string
  state_province?: string
  street_address?: string
  agent_id?: number
  status?: 'available' | 'rented' | 'under_negotiation' | 'unlisted'
  draft_status?: 'draft' | 'published'
  is_featured?: boolean
}

export interface UpdatePropertyData extends Omit<CreatePropertyData, 'title'> {
  title?: string
}

export const adminApi = {
  /**
   * Get all agents
   */
  getAgents: async (status?: string): Promise<AdminAgent[]> => {
    const params = status ? `?status=${status}` : ''
    const response = await apiClient.get<{ success: boolean; data: AdminAgent[] }>(`/admin/agents${params}`)
    return response.data.data
  },

  /**
   * Get agent by ID
   */
  getAgent: async (id: number): Promise<AdminAgent> => {
    const response = await apiClient.get<{ success: boolean; data: AdminAgent }>(`/admin/agents/${id}`)
    return response.data.data
  },

  /**
   * Create a new agent
   */
  createAgent: async (data: CreateAgentData): Promise<AdminAgent> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: AdminAgent }>('/admin/agents', {
      ...data,
      role: 'agent',
    })
    return response.data.data
  },

  /**
   * Update an agent
   */
  updateAgent: async (id: number, data: UpdateAgentData): Promise<AdminAgent> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: AdminAgent }>(`/admin/agents/${id}`, data)
    return response.data.data
  },

  /**
   * Delete an agent
   */
  deleteAgent: async (id: number): Promise<void> => {
    await apiClient.delete<{ success: boolean; message: string }>(`/admin/agents/${id}`)
  },

  /**
   * Get all properties
   */
  getProperties: async (params?: { status?: string; draft_status?: string; agent_id?: number }): Promise<AdminProperty[]> => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.draft_status) queryParams.append('draft_status', params.draft_status)
    if (params?.agent_id) queryParams.append('agent_id', params.agent_id.toString())
    
    const queryString = queryParams.toString()
    const url = `/admin/properties${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get<{ success: boolean; data: AdminProperty[] }>(url)
    return response.data.data
  },

  /**
   * Get property by ID or slug
   */
  getProperty: async (identifier: number | string): Promise<AdminProperty> => {
    const response = await apiClient.get<{ success: boolean; data: AdminProperty }>(`/admin/properties/${identifier}`)
    return response.data.data
  },

  /**
   * Create a new property
   */
  createProperty: async (data: CreatePropertyData): Promise<AdminProperty> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: AdminProperty }>('/admin/properties', data)
    return response.data.data
  },

  /**
   * Update a property
   */
  updateProperty: async (identifier: number | string, data: UpdatePropertyData): Promise<AdminProperty> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: AdminProperty }>(`/admin/properties/${identifier}`, data)
    return response.data.data
  },

  /**
   * Delete a property
   */
  deleteProperty: async (identifier: number | string): Promise<void> => {
    await apiClient.delete<{ success: boolean; message: string }>(`/admin/properties/${identifier}`)
  },
}

