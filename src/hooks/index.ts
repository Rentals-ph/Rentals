/**
 * Hooks Index
 * Central export point for all custom hooks
 * 
 * Note: Shared hooks have been moved to @/shared/hooks
 * This file re-exports them for backward compatibility
 */

// Re-export shared hooks from new location
export { useApi, useAsyncEffect } from '@/shared/hooks'

// Feature-specific hooks (still here)
export { useListingConversation } from './useListingConversation'
export type { UseListingConversationReturn, ListingFormData } from './useListingConversation'
export { useSavedProperties } from './useSavedProperties'

