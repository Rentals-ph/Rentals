/**
 * Broker API Types
 * Type definitions for broker-specific API endpoints
 */

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
  /**
   * Optional visual configuration for teams.
   * These fields are persisted if supported by the backend.
   */
  team_color?: string
  team_icon?: 'home' | 'key' | 'grid' | 'star'
  focus_area?: string
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
  total_views?: number
  total_inquiries?: number
  timeseries?: {
    labels: string[]
    teams: {
      team_id: number
      team_name: string
      daily_listings: number[]
    }[]
  }
  top_agents?: Array<{
    agent_id: number
    agent_name: string
    listings_count: number
    views_count: number
  }>
}

export interface Broker {
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

export interface TeamProductivityRow {
  agent_id: number
  name: string
  total_listings: number
  total_inquiries: number
  most_popular_listing: string
  inquiry_to_listing_ratio: number
}

