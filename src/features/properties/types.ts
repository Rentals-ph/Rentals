/**
 * Properties Feature Types
 * Type definitions specific to the properties feature
 */

export interface Property {
  id: number
  title: string
  description: string
  type: string
  listing_type?: 'for_rent' | 'for_sale' | null
  location: string
  price: number
  price_type?: string | null
  bedrooms: number
  bathrooms: number
  garage?: number | null
  area: number | null
  lot_area?: number | null
  floor_area_unit?: string | null
  amenities?: string[] | null
  furnishing?: string | null
  image: string | null
  image_path?: string | null // Storage path for the image
  image_url?: string | null // Full URL to the image (computed by backend)
  images?: string[] | null // Gallery images (array of storage paths)
  images_url?: string[] | null // Full URLs to gallery images (computed by backend)
  video_url?: string | null
  latitude?: string | null
  longitude?: string | null
  zoom_level?: string | null
  country?: string | null
  state_province?: string | null
  city?: string | null
  street_address?: string | null
  is_featured: boolean
  agent_id?: number | null
  agent?: User | null
  rent_manager?: RentManager | null // Legacy support
  published_at: string | null
  views_count?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface RentManager {
  id: number
  name: string
  email: string
  is_official: boolean
}

export interface User {
  id: number
  first_name: string | null
  last_name: string | null
  full_name?: string
  name?: string | null // Legacy support
  email: string
  phone?: string | null
  date_of_birth?: string | null
  role: 'agent' | 'admin' | 'super_admin' | 'moderator' | 'broker' | 'tenant'
  agency_name?: string | null
  office_address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  prc_license_number?: string | null
  license_type?: 'broker' | 'salesperson' | null
  expiration_date?: string | null
  years_of_experience?: string | null
  license_document_path?: string | null
  status?: 'pending' | 'approved' | 'rejected' | null
  verified?: boolean
  is_active?: boolean
  email_verified_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}


