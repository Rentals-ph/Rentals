import apiClient from '@/api/client'
import type { LoginCredentials, RegisterCredentials } from '@/shared/forms/types/auth'

/**
 * Authentication API endpoints
 */

// Re-export for backward compatibility
export type { LoginCredentials, RegisterCredentials } from '@/shared/forms/types/auth'

export interface LoginResponse {
  success: boolean
  message: string
  data?: {
    token: string
    token_type: string
    role: string
    user?: {
      id: number
      first_name: string
      last_name: string
      email: string
      role: string
    }
    agent?: {
      id: number
      first_name: string
      last_name: string
      email: string
      phone?: string | null
      agency_name?: string | null
      prc_license_number?: string | null
      license_type?: 'broker' | 'salesperson' | null
      status?: 'pending' | 'approved' | 'rejected' | null
      verified?: boolean
    }
    admin?: {
      id: number
      first_name: string
      last_name: string
      email: string
      role: string
    }
  }
  errors?: Record<string, string[]>
}

export interface RegisterResponse {
  success: boolean
  message: string
  data?: {
    id: number
    email: string
  }
  errors?: Record<string, string[]>
}

export interface SendVerificationEmailResponse {
  success: boolean
  message: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
}

export interface CheckVerificationStatusResponse {
  success: boolean
  verified: boolean
}

export const authApi = {
  /**
   * Login user (agent or admin)
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/login', credentials)
      return response.data
    } catch (error: any) {
      console.error('Login API call error:', error)
      throw error
    }
  },

  /**
   * Login admin (uses unified login endpoint)
   */
  adminLogin: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/login', credentials)
      return response.data
    } catch (error: any) {
      console.error('Admin login API call error:', error)
      throw error
    }
  },

  /**
   * Register a new user (simplified - only email and password)
   */
  register: async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
    try {
      const response = await apiClient.post<RegisterResponse>('/register', credentials)
      return response.data
    } catch (error: any) {
      console.error('Register API call error:', error)
      throw error
    }
  },

  /**
   * Send email verification
   */
  sendVerificationEmail: async (email: string): Promise<SendVerificationEmailResponse> => {
    try {
      const response = await apiClient.post<SendVerificationEmailResponse>('/verify-email/send', { email })
      return response.data
    } catch (error: any) {
      console.error('Send verification email API call error:', error)
      throw error
    }
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (email: string, token: string): Promise<VerifyEmailResponse> => {
    try {
      const response = await apiClient.post<VerifyEmailResponse>('/verify-email/verify', { email, token })
      return response.data
    } catch (error: any) {
      console.error('Verify email API call error:', error)
      throw error
    }
  },

  /**
   * Check email verification status
   */
  checkVerificationStatus: async (email: string): Promise<CheckVerificationStatusResponse> => {
    try {
      const response = await apiClient.get<CheckVerificationStatusResponse>('/verify-email/status', {
        params: { email }
      })
      return response.data
    } catch (error: any) {
      console.error('Check verification status API call error:', error)
      throw error
    }
  },
}

