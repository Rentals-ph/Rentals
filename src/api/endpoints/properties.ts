import apiClient from '../client'
import type { Property } from '../../types'
import type { PaginatedResponse } from '../types'

/**
 * Properties API endpoints
 */

export interface GetPropertiesParams {
  type?: string
  location?: string
  search?: string
  page?: number
  per_page?: number
  agent_id?: number
}

export const propertiesApi = {
  /**
   * Get featured properties
   */
  getFeatured: async (): Promise<Property[]> => {
    const response = await apiClient.get<Property[]>('/properties/featured')
    return response.data
  },

  /**
   * Get all properties with optional filters
   */
  getAll: async (params?: GetPropertiesParams): Promise<Property[] | PaginatedResponse<Property>> => {
    const response = await apiClient.get<Property[] | PaginatedResponse<Property>>('/properties', { params })
    
    // Backend returns paginated response with data, current_page, per_page, total, last_page
    if (Array.isArray(response.data)) {
      return response.data
    }
    
    // Return paginated response if it exists
    return response.data
  },

  /**
   * Get property by ID
   */
  getById: async (id: number): Promise<Property> => {
    const response = await apiClient.get<Property>(`/properties/${id}`)
    return response.data
  },

  /**
   * Create a new property (requires authentication)
   */
  create: async (propertyData: FormData): Promise<{ success: boolean; message: string; data: Property }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Property }>('/properties', propertyData)
    return response.data
  },

  /**
   * Create multiple properties at once (bulk create - requires authentication)
   */
  bulkCreate: async (properties: Partial<Property>[]): Promise<{ success: boolean; message: string; data: Property[]; created_count: number }> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Property[]; created_count: number }>('/properties/bulk', {
      properties,
    })
    return response.data
  },

  /**
   * Get properties by agent ID
   */
  getByAgentId: async (agentId: number): Promise<Property[]> => {
    try {
      const response = await apiClient.get<Property[] | PaginatedResponse<Property>>('/properties', { 
        params: { agent_id: agentId } 
      })
      
      // Backend returns paginated response with data, current_page, per_page, total, last_page
      if (Array.isArray(response.data)) {
        return response.data
      }
      
      // Handle paginated response
      const paginatedResponse = response.data as PaginatedResponse<Property>
      if (paginatedResponse && paginatedResponse.data && Array.isArray(paginatedResponse.data)) {
        return paginatedResponse.data
      }
      
      // Fallback: return empty array if structure is unexpected
      console.warn('Unexpected response structure from /properties endpoint:', response.data)
      return []
    } catch (error: any) {
      console.error('Error fetching properties by agent ID:', error)
      throw error
    }
  },

  /**
   * Update a property (requires authentication - agents can only update their own properties)
   */
  update: async (id: number, propertyData: FormData | Partial<Property>): Promise<{ success: boolean; message: string; data: Property }> => {
    try {
      // Debug: Log FormData contents
      if (propertyData instanceof FormData) {
        console.log('Sending FormData with keys:', Array.from(propertyData.keys()))
        for (const [key, value] of propertyData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes, type: ${value.type})`)
          } else {
            console.log(`${key}: ${value}`)
          }
        }
        
        // For FormData, use POST with _method=PUT (Laravel method spoofing)
        // This ensures FormData is parsed correctly, especially for file uploads
        // Don't append _method if it already exists
        if (!propertyData.has('_method')) {
          propertyData.append('_method', 'PUT')
        }
        
        const response = await apiClient.post<{ success: boolean; message: string; data: Property }>(`/properties/${id}`, propertyData, {
          headers: {
            // Don't set Content-Type - let browser set it with boundary for multipart/form-data
          }
        })
        return response.data
      }
      
      // For JSON data, use PUT directly
      const response = await apiClient.put<{ success: boolean; message: string; data: Property }>(`/properties/${id}`, propertyData, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      if (error.response?.data) {
        console.error('Validation errors:', error.response.data)
        console.error('Response status:', error.response.status)
        console.error('Response headers:', error.response.headers)
      }
      throw error
    }
  },

  /**
   * Delete a property (requires authentication - agents can only delete their own properties)
   */
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(`/properties/${id}`)
      return response.data
    } catch (error: any) {
      console.error('API call error:', error)
      throw error
    }
  },
}

