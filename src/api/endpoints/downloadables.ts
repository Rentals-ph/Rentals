import apiClient from '../client'
import api from '@/lib/api'

export interface Downloadable {
  id: number
  title: string
  description?: string
  file_path: string
  file_name: string
  file_type?: string
  file_size?: number
  category?: string
  is_active: boolean
  download_count: number
  created_at: string
  updated_at: string
}

export const downloadablesApi = {
  /**
   * Get all active downloadables (public for agents/brokers)
   */
  getAll: async (category?: string): Promise<Downloadable[]> => {
    const params = category ? { category } : undefined
    const response = await apiClient.get<{ success: boolean; data: Downloadable[] }>('/downloadables', { params })
    return response.data.success && response.data.data ? response.data.data : []
  },

  /**
   * Get all downloadables (admin only)
   */
  getAllAdmin: async (category?: string): Promise<Downloadable[]> => {
    const params = category ? { category } : undefined
    const response = await apiClient.get<{ success: boolean; data: Downloadable[] }>('/admin/downloadables', { params })
    return response.data.success && response.data.data ? response.data.data : []
  },

  /**
   * Get a specific downloadable
   */
  getById: async (id: number): Promise<Downloadable | null> => {
    const response = await apiClient.get<{ success: boolean; data: Downloadable }>(`/admin/downloadables/${id}`)
    return response.data.success && response.data.data ? response.data.data : null
  },

  /**
   * Create a new downloadable (admin only)
   */
  create: async (data: {
    title: string
    description?: string
    file: File
    category?: string
  }): Promise<Downloadable> => {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    formData.append('file', data.file)
    if (data.category) formData.append('category', data.category)

    const response = await apiClient.post<{ success: boolean; data: Downloadable; message?: string }>('/admin/downloadables', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create downloadable')
    }
    return response.data.data
  },

  /**
   * Update a downloadable (admin only)
   */
  update: async (
    id: number,
    data: {
      title?: string
      description?: string
      file?: File
      category?: string
      is_active?: boolean
    }
  ): Promise<Downloadable> => {
    const formData = new FormData()
    if (data.title) formData.append('title', data.title)
    if (data.description !== undefined) formData.append('description', data.description)
    if (data.file) formData.append('file', data.file)
    if (data.category) formData.append('category', data.category)
    if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString())

    const response = await apiClient.put<{ success: boolean; data: Downloadable; message?: string }>(`/admin/downloadables/${id}`, formData)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update downloadable')
    }
    return response.data.data
  },

  /**
   * Delete a downloadable (admin only)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/downloadables/${id}`)
  },

  /**
   * Download a file (public for agents/brokers)
   */
  download: async (id: number): Promise<void> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/downloadables/${id}/download`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to download file')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `downloadable-${id}`
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }
    
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  },
}

