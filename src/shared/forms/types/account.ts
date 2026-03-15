/**
 * Account Settings Form Types
 * Types for user account settings and profile editing forms
 */

/**
 * User profile data (read-only display)
 */
export interface ProfileData {
  name: string
  email: string
  phone: string
  role: string
  avatar: string
}

/**
 * Account edit form data
 */
export interface EditFormData {
  firstName: string
  lastName: string
  email: string
  countryCode: string
  contactNumber: string
  whatsapp?: string
  facebook?: string
  aboutYourself: string
  addressLine1: string
  country: string
  region: string
  province: string
  city: string
  companyName?: string
}

/**
 * Password change form data
 */
export interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

