/**
 * Agent Registration Form Types
 * Types for agent registration and profile forms
 */

/**
 * Agent registration form data
 */
export interface AgentRegistrationData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  dateOfBirth?: string
  agencyName?: string
  officeAddress?: string
  city?: string
  state?: string
  zipCode?: string
  prcLicenseNumber: string
  licenseType: 'broker' | 'salesperson'
  expirationDate: string
  yearsOfExperience?: string
  agreeToTerms: boolean
}

