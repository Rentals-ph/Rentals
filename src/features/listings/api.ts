/**
 * Listings Feature API
 * API endpoints for creating and managing property listings
 */

import apiClient from '@/api/client'
import type { Property } from '@/features/properties'
import type { PaginatedResponse } from '@/api/types'

/**
 * Create a new property listing
 */
export async function createListing(
  propertyData: FormData
): Promise<{ success: boolean; message: string; data: Property }> {
  const response = await apiClient.post<{ success: boolean; message: string; data: Property }>(
    '/properties',
    propertyData
  )
  return response.data
}

/**
 * Update a property listing
 */
export async function updateListing(
  id: number,
  propertyData: FormData | Partial<Property>
): Promise<{ success: boolean; message: string; data: Property }> {
  try {
    if (propertyData instanceof FormData) {
      if (!propertyData.has('_method')) {
        propertyData.append('_method', 'PUT')
      }
      const response = await apiClient.post<{ success: boolean; message: string; data: Property }>(
        `/properties/${id}`,
        propertyData
      )
      return response.data
    }
    
    const response = await apiClient.put<{ success: boolean; message: string; data: Property }>(
      `/properties/${id}`,
      propertyData,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )
    return response.data
  } catch (error: any) {
    console.error('API call error:', error)
    throw error
  }
}

/**
 * Bulk create multiple listings
 */
export async function bulkCreateListings(
  properties: Partial<Property>[]
): Promise<{ success: boolean; message: string; data: Property[]; created_count: number }> {
  const response = await apiClient.post<{ success: boolean; message: string; data: Property[]; created_count: number }>(
    '/properties/bulk',
    { properties }
  )
  return response.data
}


