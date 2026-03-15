/**
 * Agent API Types
 * Type definitions for agent-specific API endpoints
 */

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
  team?: {
    id: number
    name: string
    role: string
  } | null
  created_at?: string | null
  updated_at?: string | null
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

export interface GetAllAgentsResponse {
  success: boolean
  data: Agent[]
}

