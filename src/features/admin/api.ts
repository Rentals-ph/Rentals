import apiClient from '@/api/client'
import type {
  AdminAgent,
  AdminProperty,
  CreateAgentData,
  UpdateAgentData,
  CreatePropertyData,
  UpdatePropertyData,
} from '@/api/types/admin'

/**
 * Admin API endpoints
 */

// Re-export types for backward compatibility
export type {
  AdminAgent,
  AdminProperty,
  CreateAgentData,
  UpdateAgentData,
  CreatePropertyData,
  UpdatePropertyData,
} from '@/api/types/admin'

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

