/**
 * Authentication Validation Schemas
 * Zod schemas for login and registration forms
 */

import { z } from 'zod'
import { emailSchema, passwordSchema } from '@/shared/schemas/common'

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

/**
 * Registration form validation schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(255).optional(),
  role: z.enum(['agent', 'broker']).optional(),
})

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  email: emailSchema,
  token: z.string().min(1, 'Verification token is required'),
})

/**
 * Types inferred from schemas
 */
export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
export type EmailVerificationSchema = z.infer<typeof emailVerificationSchema>

