import apiClient from '../client'
import type { Property } from '../../types'
import type {
  CustomStat,
  Award,
  Company,
  Team,
  TeamMember,
  BrokerDashboard,
  Broker,
  TeamProductivityRow,
} from '../types/broker'
import type { PaginatedResponse } from '../types/shared'

/**
 * Broker API endpoints
 */

// Re-export types for backward compatibility
export type {
  CustomStat,
  Award,
  Company,
  Team,
  TeamMember,
  BrokerDashboard,
  Broker,
  TeamProductivityRow,
} from '../types/broker'

// Re-export PaginatedResponse from shared
export type { PaginatedResponse } from '../types/shared'


export const brokerApi = {
  /**
   * Get current authenticated broker
   */
  getCurrent: async (): Promise<Broker> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Broker }>('/broker/me')
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Update broker profile
   */
  update: async (data: {
    first_name?: string
    last_name?: string
    phone?: string
    city?: string
    state?: string
    office_address?: string
    company_name?: string
    image?: File
    company_image?: File
  }): Promise<Broker> => {
    const formData = new FormData()
    
    // Always send these fields, even if empty (backend handles null/empty)
    formData.append('first_name', data.first_name !== undefined ? (data.first_name || '') : '')
    formData.append('last_name', data.last_name !== undefined ? (data.last_name || '') : '')
    formData.append('phone', data.phone !== undefined ? (data.phone || '') : '')
    formData.append('city', data.city !== undefined ? (data.city || '') : '')
    formData.append('state', data.state !== undefined ? (data.state || '') : '')
    formData.append('office_address', data.office_address !== undefined ? (data.office_address || '') : '')
    if (data.company_name !== undefined) formData.append('company_name', data.company_name || '')
    if (data.image) formData.append('image', data.image)
    if (data.company_image) formData.append('company_image', data.company_image)
    
    // Use POST with _method=PUT for FormData (Laravel method spoofing)
    if (!formData.has('_method')) {
      formData.append('_method', 'PUT')
    }

    try {
      // Use POST with method spoofing for FormData
      const response = await apiClient.post<{ success: boolean; data: Broker }>('/broker/me', formData, {
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

  /**
   * Get broker dashboard data
   */
  getDashboard: async (): Promise<BrokerDashboard> => {
    const response = await apiClient.get<{ success: boolean; data: BrokerDashboard }>('/broker/dashboard')
    return response.data.data
  },

  /**
   * Get all companies for the broker
   */
  getCompanies: async (): Promise<Company[]> => {
    const response = await apiClient.get<{ success: boolean; data: Company[] }>('/broker/companies')
    return response.data.data
  },

  /**
   * Create a new company
   */
  createCompany: async (companyData: Partial<Company>): Promise<{ success: boolean; message: string; data: Company }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Company }>('/broker/companies', companyData)
    return response.data
  },

  /**
   * Update a company
   */
  updateCompany: async (companyId: number, companyData: Partial<Company>): Promise<{ success: boolean; message: string; data: Company }> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: Company }>(`/broker/companies/${companyId}`, companyData)
    return response.data
  },

  /**
   * Get broker's first/primary company (for company profile page)
   */
  getPrimaryCompany: async (): Promise<Company | null> => {
    const companies = await brokerApi.getCompanies()
    return companies.length > 0 ? companies[0] : null
  },

  /**
   * Get all teams for the broker
   */
  getTeams: async (): Promise<Team[]> => {
    const response = await apiClient.get<{ success: boolean; data: Team[] }>('/broker/teams')
    return response.data.data
  },

  /**
   * Create a new team
   */
  createTeam: async (teamData: Partial<Team>): Promise<{ success: boolean; message: string; data: Team }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Team }>('/broker/teams', teamData)
    return response.data
  },

  /**
   * Update a team (name, description, company_id).
   */
  updateTeam: async (teamId: number, teamData: Partial<Team>): Promise<{ success: boolean; message: string; data: Team }> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: Team }>(`/broker/teams/${teamId}`, teamData)
    return response.data
  },

  /**
   * Delete a team (members are removed from the team but remain in broker's pool).
   */
  deleteTeam: async (teamId: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/broker/teams/${teamId}`)
    return response.data
  },

  /**
   * Assign agent to team
   */
  assignAgentToTeam: async (teamId: number, agentId: number, role?: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/broker/teams/${teamId}/agents/${agentId}`, { role })
    return response.data
  },

  /**
   * Remove agent from team
   */
  removeAgentFromTeam: async (teamId: number, agentId: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/broker/teams/${teamId}/agents/${agentId}`)
    return response.data
  },

  /**
   * Get all agents managed by the broker
   */
  getAgents: async (): Promise<any[]> => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/broker/agents')
    return response.data.data
  },

  /**
   * Search for registered agents (platform-wide) that can be invited to the broker's pool.
   * Returns agents not already managed by this broker.
   */
  searchAgentsToInvite: async (query: string): Promise<any[]> => {
    if (!query || query.trim().length < 2) return []
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      '/broker/agents/search',
      { params: { q: query.trim() } }
    )
    return response.data.data ?? []
  },

  /**
   * Invite an already-registered agent to the broker's pool (adds them to Available Agents).
   */
  inviteAgent: async (agentId: number): Promise<{ success: boolean; message: string; data?: any }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data?: any }>(
      '/broker/agents/invite',
      { agent_id: agentId }
    )
    return response.data
  },

  /**
   * Create a new agent account (brokers create agents directly)
   */
  createAgent: async (agentData: {
    first_name: string
    last_name: string
    email: string
    password: string
    password_confirmation: string
    phone?: string
    company_id?: number
  }): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: any }>('/broker/agents', agentData)
    return response.data
  },

  /**
   * Get all properties for the broker (broker's own + all managed agents' properties).
   * @param options.per_page - Use a high value (e.g. 1000) for team overview so counts include all listings.
   */
  getProperties: async (options?: { per_page?: number }): Promise<Property[] | PaginatedResponse<Property>> => {
    const params = options?.per_page != null ? { per_page: options.per_page } : undefined
    const response = await apiClient.get<{ success: boolean; data: Property[] | PaginatedResponse<Property> }>('/broker/properties', { params })
    const data = response.data.data
    if (Array.isArray(data)) {
      return data
    }
    // Paginated: { data: Property[], total, current_page, ... }
    if (data && typeof data === 'object' && Array.isArray((data as PaginatedResponse<Property>).data)) {
      return data as PaginatedResponse<Property>
    }
    return data as PaginatedResponse<Property>
  },

  /**
   * Update a property
   */
  updateProperty: async (propertyId: number, propertyData: Partial<Property>): Promise<{ success: boolean; message: string; data: Property }> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: Property }>(`/broker/properties/${propertyId}`, propertyData)
    return response.data
  },

  /**
   * Team productivity report: listings and inquiry counts per managed agent (and broker).
   */
  getTeamProductivityReport: async (): Promise<TeamProductivityRow[]> => {
    const response = await apiClient.get<{ success: boolean; data: TeamProductivityRow[] }>('/broker/reports/team-productivity')
    return response.data.data ?? []
  },

  /**
   * Get property type distribution for reports
   */
  getPropertyTypeDistribution: async (): Promise<{
    type: string
    count: number
    percentage: number
  }[]> => {
    const response = await apiClient.get<{ success: boolean; data: Array<{ type: string; count: number; percentage: number }>; total: number }>('/broker/reports/property-type-distribution')
    return response.data.data ?? []
  },

  /**
   * Get location performance for reports
   */
  getLocationPerformance: async (): Promise<{
    city: string
    property_count: number
    total_views: number
    inquiry_count: number
    performance_score: number
  }[]> => {
    const response = await apiClient.get<{ success: boolean; data: Array<{ city: string; property_count: number; total_views: number; inquiry_count: number; performance_score: number }> }>('/broker/reports/location-performance')
    return response.data.data ?? []
  },

  /**
   * Get conversion rate and response time statistics
   */
  getConversionAndResponseStats: async (): Promise<{
    conversion_rate: number
    total_inquiries: number
    total_conversions: number
    average_response_time_minutes: number
    average_response_time_display: string
  }> => {
    const response = await apiClient.get<{ success: boolean; data: { conversion_rate: number; total_inquiries: number; total_conversions: number; average_response_time_minutes: number; average_response_time_display: string } }>('/broker/reports/conversion-stats')
    return response.data.data ?? { conversion_rate: 0, total_inquiries: 0, total_conversions: 0, average_response_time_minutes: 0, average_response_time_display: '—' }
  },
}

// Re-export TeamProductivityRow from types
export type { TeamProductivityRow } from '../types/broker'

