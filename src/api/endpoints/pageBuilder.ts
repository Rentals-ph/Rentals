import apiClient from '../client'

/**
 * Page Builder API endpoints
 */

export interface PageBuilderData {
  id?: number
  user_id?: number
  user?: { id: number; name?: string; first_name?: string; last_name?: string; email?: string }
  user_type: 'agent' | 'broker'
  page_type: 'profile' | 'property'
  page_slug?: string
  page_url?: string
  
  // Profile mode fields
  selected_theme?: string
  bio?: string
  show_bio?: boolean
  show_contact_number?: boolean
  show_experience_stats?: boolean
  show_featured_listings?: boolean
  show_testimonials?: boolean
  profile_image?: string | null
  contact_info?: {
    email?: string
    phone?: string
    message?: string
    website?: string
  }
  experience_stats?: Array<{
    label: string
    value: string
  }>
  
  // Property mode fields
  hero_image?: string
  main_heading?: string
  tagline?: string
  overall_darkness?: number
  property_description?: string
  property_images?: string[]
  property_price?: string
  property_bedrooms?: number
  property_bathrooms?: number
  property_garage?: number
  property_area?: string
  property_amenities?: string[]
  contact_phone?: string
  contact_email?: string
  
  // Profile card fields
  profile_card_name?: string
  profile_card_role?: string
  profile_card_bio?: string
  profile_card_image?: string
  
  // Layout fields
  section_visibility?: {
    hero?: boolean
    propertyDescription?: boolean
    propertyImages?: boolean
    propertyDetails?: boolean
    amenities?: boolean
    contact?: boolean
    experience?: boolean
    featured?: boolean
    testimonialsSection?: boolean
    readyToView?: boolean
    profileCard?: boolean
  }
  layout_sections?: Array<{
    id: string
    name: string
    visible: boolean
  }>
  profile_layout_sections?: Array<{
    id: string
    name: string
    visible: boolean
  }>
  
  // Design fields
  selected_brand_color?: string
  selected_corner_radius?: string
  global_design?: {
    fontFamily?: string
    fontSize?: string
    spacing?: string
    borderStyle?: string
    shadow?: string
  }
  section_styles?: Record<string, {
    layoutTemplate?: string
    fontFamily?: string
    fontSize?: string
    textColor?: string
    backgroundColor?: string
    padding?: string
    borderStyle?: string
    borderColor?: string
    shadow?: string
  }>
  
  // Additional fields
  featured_listings?: any[]
  testimonials?: any[]
  is_published?: boolean
  published_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface PageBuilderResponse {
  success: boolean
  message?: string
  data?: PageBuilderData
  errors?: Record<string, string[]>
}

export interface PageBuilderListResponse {
  success: boolean
  data: PageBuilderData[]
}

export const pageBuilderApi = {
  /**
   * Get all page builders for the authenticated user
   */
  getAll: async (userType?: 'agent' | 'broker', pageType?: 'profile' | 'property'): Promise<PageBuilderData[]> => {
    try {
      const params = new URLSearchParams()
      if (userType) params.append('user_type', userType)
      if (pageType) params.append('page_type', pageType)
      
      const queryString = params.toString()
      const url = `/page-builder${queryString ? `?${queryString}` : ''}`
      
      const response = await apiClient.get<PageBuilderListResponse>(url)
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get a specific page builder by ID or slug
   */
  getById: async (id: string | number): Promise<PageBuilderData> => {
    try {
      const response = await apiClient.get<PageBuilderResponse>(`/page-builder/${id}`)
      if (!response.data.data) {
        throw new Error('Page builder not found')
      }
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get a published page by slug (public access)
   */
  getBySlug: async (slug: string): Promise<PageBuilderData> => {
    try {
      const response = await apiClient.get<PageBuilderResponse>(`/page/${slug}`)
      if (!response.data.data) {
        throw new Error('Page not found')
      }
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Get a page builder by slug (for editing, public access)
   */
  getBySlugForEdit: async (slug: string): Promise<PageBuilderData> => {
    try {
      const response = await apiClient.get<PageBuilderResponse>(`/page-builder/${slug}`)
      if (!response.data.data) {
        throw new Error('Page builder not found')
      }
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Create or update a page builder
   * Now accepts page_data structure: { user_type, page_type, page_data }
   */
  save: async (data: { user_type: 'agent' | 'broker', page_type: 'profile' | 'property', page_data: Partial<PageBuilderData>, page_slug?: string }): Promise<PageBuilderData> => {
    try {
      const response = await apiClient.post<PageBuilderResponse>('/page-builder/save', data)
      if (!response.data.data) {
        throw new Error('Failed to save page builder')
      }
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Update a page builder
   * Now accepts page_data structure: { page_data, page_slug? }
   */
  update: async (id: number, data: { page_data: Partial<PageBuilderData>, page_slug?: string }): Promise<PageBuilderData> => {
    try {
      const response = await apiClient.put<PageBuilderResponse>(`/page-builder/${id}`, data)
      if (!response.data.data) {
        throw new Error('Failed to update page builder')
      }
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Delete a page builder
   */
  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/page-builder/${id}`)
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Publish/unpublish a page builder by ID
   */
  publish: async (id: number, publish: boolean = true): Promise<PageBuilderData> => {
    try {
      const response = await apiClient.post<PageBuilderResponse>(`/page-builder/id/${id}/publish`, {
        is_published: publish
      })
      if (!response.data.data) {
        throw new Error('Failed to publish page builder')
      }
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },

  /**
   * Publish a page builder by slug
   */
  publishBySlug: async (slug: string): Promise<PageBuilderData> => {
    try {
      const response = await apiClient.post<PageBuilderResponse>(`/page-builder/${slug}/publish`)
      if (!response.data.data) {
        throw new Error('Failed to publish page builder')
      }
      return response.data.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },
}

