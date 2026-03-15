/**
 * Common Validation Schemas
 * Reusable validators for email, phone, password, etc.
 */

import { z } from 'zod'
import { VALIDATION_LIMITS, VALIDATION_PATTERNS } from '../constants/validation'

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(VALIDATION_LIMITS.MAX_EMAIL_LENGTH, `Email must be no more than ${VALIDATION_LIMITS.MAX_EMAIL_LENGTH} characters`)
  .email('Please enter a valid email address')
  .regex(VALIDATION_PATTERNS.EMAIL, 'Invalid email format')

/**
 * Phone number validation schema
 */
export const phoneSchema = z
  .string()
  .max(VALIDATION_LIMITS.MAX_PHONE_LENGTH, `Phone must be no more than ${VALIDATION_LIMITS.MAX_PHONE_LENGTH} characters`)
  .regex(VALIDATION_PATTERNS.PHONE, 'Please enter a valid phone number')
  .optional()

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION_LIMITS.MIN_PASSWORD_LENGTH} characters`)
  .max(VALIDATION_LIMITS.MAX_PASSWORD_LENGTH, `Password must be no more than ${VALIDATION_LIMITS.MAX_PASSWORD_LENGTH} characters`)

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(VALIDATION_LIMITS.MIN_NAME_LENGTH, `Name must be at least ${VALIDATION_LIMITS.MIN_NAME_LENGTH} characters`)
  .max(VALIDATION_LIMITS.MAX_NAME_LENGTH, `Name must be no more than ${VALIDATION_LIMITS.MAX_NAME_LENGTH} characters`)

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .regex(VALIDATION_PATTERNS.URL, 'Invalid URL format')
  .optional()

/**
 * Positive number validation schema
 */
export const positiveNumberSchema = z
  .number()
  .min(0, 'Must be a positive number')
  .max(VALIDATION_LIMITS.MAX_PRICE, `Must be no more than ${VALIDATION_LIMITS.MAX_PRICE}`)

/**
 * Non-negative integer validation schema
 */
export const nonNegativeIntegerSchema = z
  .number()
  .int('Must be a whole number')
  .min(0, 'Must be 0 or greater')
  .max(20, 'Value seems unusually high')

