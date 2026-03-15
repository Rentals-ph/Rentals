/**
 * Agent Registration Validation Schemas
 * Zod schemas for agent registration forms
 */

import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants/validation'
import { emailSchema, phoneSchema, passwordSchema, nameSchema } from './common'

/**
 * Agent registration form validation schema
 */
export const agentRegistrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  dateOfBirth: z.string().optional(),
  agencyName: z.string().max(VALIDATION_LIMITS.MAX_NAME_LENGTH).optional(),
  officeAddress: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  prcLicenseNumber: z
    .string()
    .min(1, 'PRC License Number is required')
    .max(50, 'PRC License Number is too long'),
  licenseType: z.enum(['broker', 'salesperson'], {
    errorMap: () => ({ message: 'Please select a license type' }),
  }),
  expirationDate: z
    .string()
    .min(1, 'Expiration date is required')
    .refine((val) => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    }, 'Please enter a valid date'),
  yearsOfExperience: z.string().optional(),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the terms and conditions'),
})

/**
 * Type inferred from agent registration schema
 */
export type AgentRegistrationSchema = z.infer<typeof agentRegistrationSchema>

