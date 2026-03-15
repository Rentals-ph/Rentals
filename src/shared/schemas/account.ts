/**
 * Account Settings Validation Schemas
 * Zod schemas for account settings and profile editing forms
 */

import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants/validation'
import { emailSchema, phoneSchema } from './common'

/**
 * Account edit form validation schema
 */
export const editAccountSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(VALIDATION_LIMITS.MAX_NAME_LENGTH),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(VALIDATION_LIMITS.MAX_NAME_LENGTH),
  email: emailSchema,
  countryCode: z.string().min(1, 'Country code is required'),
  contactNumber: phoneSchema,
  whatsapp: phoneSchema,
  facebook: z.string().url('Please enter a valid Facebook URL').optional().or(z.literal('')),
  aboutYourself: z.string().max(1000, 'About yourself must be no more than 1000 characters').optional(),
  addressLine1: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  companyName: z.string().max(VALIDATION_LIMITS.MAX_NAME_LENGTH).optional(),
})

/**
 * Password change form validation schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(VALIDATION_LIMITS.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION_LIMITS.MIN_PASSWORD_LENGTH} characters`)
    .max(VALIDATION_LIMITS.MAX_PASSWORD_LENGTH, `Password must be no more than ${VALIDATION_LIMITS.MAX_PASSWORD_LENGTH} characters`),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

/**
 * Types inferred from schemas
 */
export type EditAccountSchema = z.infer<typeof editAccountSchema>
export type PasswordChangeSchema = z.infer<typeof passwordChangeSchema>

