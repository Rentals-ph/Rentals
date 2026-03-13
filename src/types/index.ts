/**
 * Types Index
 * Central export point for all TypeScript types
 * 
 * Note: Shared types have been moved to @/shared/types
 * This file re-exports them for backward compatibility
 */

// Re-export shared types from new location
export type {
  Property,
  RentManager,
  User,
  Testimonial,
  Blog,
} from '@/shared/types'

// Feature-specific types (still here)
export * from './listingAssistant'
