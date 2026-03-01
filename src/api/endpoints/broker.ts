import apiClient from '../client'
import type { Property } from '../../types'

export interface CustomStat {
  label: string
  value: string
}

export interface Award {
  title: string
  image?: string
  year?: string
}

export interface Company {
  id: number
  broker_id: number
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  hero_image?: string
  whatsapp?: string
  custom_stats?: CustomStat[]
  join_section_title?: string
  join_section_description?: string
  awards?: Award[]
  is_active: boolean
  show_team_section?: boolean
  show_broker_picks_section?: boolean
  show_awards_section?: boolean
  show_join_section?: boolean
  created_at?: string
  updated_at?: string
}

export interface Team {
  id: number
  broker_id: number
  company_id?: number
  name: string
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  company?: Company
  members?: TeamMember[]
}

export interface TeamMember {
  id: number
  team_id: number
  agent_id: number
  role?: string
  is_active: boolean
  joined_at?: string
  agent?: {
    id: number
    first_name: string
    last_name: string
    email: string
    image_path?: string
  }
}

export interface BrokerDashboard {
  subscription?: {
    id: number
    plan_name: string
    listings_used: number
    listings_limit: number
    teams_used: number
    teams_limit: number
    agents_used: number
    agents_limit: number
    status: string
    expires_at?: string
  }
  companies_count: number
  teams_count: number
  agents_count: number
  properties_count: number
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export const brokerApi = {
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
   * Get all properties for the broker (broker's own + team agents' properties)
   */
  getProperties: async (): Promise<Property[] | PaginatedResponse<Property>> => {
    const response = await apiClient.get<{ success: boolean; data: Property[] | PaginatedResponse<Property> }>('/broker/properties')
    
    if (Array.isArray(response.data.data)) {
      return response.data.data
    }
    
    return response.data.data
  },

  /**
   * Update a property
   */
  updateProperty: async (propertyId: number, propertyData: Partial<Property>): Promise<{ success: boolean; message: string; data: Property }> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: Property }>(`/broker/properties/${propertyId}`, propertyData)
    return response.data
  },
}

