/**
 * Validation constants
 * Validation rules, limits, patterns, etc.
 */

/**
 * Common validation limits
 */
export const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 255,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_TITLE_LENGTH: 255,
  MIN_PRICE: 0,
  MAX_PRICE: 999999999,
  MAX_BEDROOMS: 20,
  MAX_BATHROOMS: 20,
  MAX_PARKING: 20,
  MAX_IMAGES: 20,
  MAX_IMAGE_SIZE_MB: 10,
} as const

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be no more than ${max}`,
  INVALID_FORMAT: 'Invalid format',
} as const

