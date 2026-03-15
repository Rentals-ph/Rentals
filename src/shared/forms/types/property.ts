/**
 * Property Listing Form Types
 * Types for property listing creation and editing forms
 */

/**
 * Base property listing form data
 * Used by both manual form and AI-assisted listing creation
 */
export interface ListingFormData {
  // Category
  category: string
  
  // Details
  title: string
  description: string
  bedrooms: number
  bathrooms: number
  garage: number
  floorArea: number
  floorUnit: 'Square Meters' | 'Square Feet'
  lotArea: number
  
  // Location
  country: string
  state: string
  city: string
  street: string
  latitude: string
  longitude: string
  zoom: string
  
  // Images (File[] kept in local state – uploaded separately via uploadImages())
  images: File[]
  // Images already uploaded to the conversation (URLs returned from the API)
  uploadedImages: Array<{
    path: string
    url: string
    original_name: string
    size: number
    mime_type: string
  }>
  videoUrl: string
  
  // Pricing
  listingType: 'for_rent' | 'for_sale'
  price: string
  priceType: 'Monthly' | 'Weekly' | 'Daily' | 'Yearly'
  
  // Attributes
  amenities: string[]
  furnishing?: string
}

/**
 * Default/empty listing form data
 */
export const DEFAULT_LISTING_FORM_DATA: ListingFormData = {
  category: '',
  title: '',
  description: '',
  bedrooms: 0,
  bathrooms: 0,
  garage: 0,
  floorArea: 1,
  floorUnit: 'Square Meters',
  lotArea: 0,
  country: 'Philippines',
  state: '',
  city: '',
  street: '',
  latitude: '17.586030',
  longitude: '120.628619',
  zoom: '15',
  images: [],
  uploadedImages: [],
  videoUrl: '',
  listingType: 'for_rent',
  price: '',
  priceType: 'Monthly',
  amenities: [],
  furnishing: undefined,
}

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use ListingFormData instead
 */
export type CreateListingData = ListingFormData

