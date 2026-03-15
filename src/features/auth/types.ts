/**
 * Authentication Form Types
 * Types for login, registration, and authentication forms
 */

/**
 * Login form credentials
 */
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

/**
 * Registration form credentials
 */
export interface RegisterCredentials {
  email: string
  password: string
  name?: string
  role?: 'agent' | 'broker'
}

