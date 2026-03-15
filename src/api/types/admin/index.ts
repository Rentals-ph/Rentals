/**
 * Admin API Types
 * Type definitions for admin-specific API endpoints
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

