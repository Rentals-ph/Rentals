/**
 * Property-related constants
 * Property types, statuses, categories, amenities, etc.
 */

export const PROPERTY_CATEGORIES = [
  'Apartment / Condo',
  'House',
  'Townhouse',
  'Studio',
  'Bedspace',
  'Commercial',
  'Office',
  'Warehouse',
] as const

export type PropertyCategory = typeof PROPERTY_CATEGORIES[number]

export const PROPERTY_TYPES = {
  HOUSE: 'house',
  CONDO: 'condo',
  APARTMENT: 'apartment',
  LOT: 'lot',
  COMMERCIAL: 'commercial',
  TOWNHOUSE: 'townhouse',
  STUDIO: 'studio',
  BEDSPACE: 'bedspace',
  WAREHOUSE: 'warehouse',
  OFFICE: 'office',
} as const

export type PropertyType = typeof PROPERTY_TYPES[keyof typeof PROPERTY_TYPES]

export const LISTING_STATUS = {
  FOR_RENT: 'for_rent',
  FOR_SALE: 'for_sale',
  PRE_SELLING: 'pre_selling',
} as const

export type ListingStatus = typeof LISTING_STATUS[keyof typeof LISTING_STATUS]

export const FURNISHING_STATUS = {
  UNFURNISHED: 'unfurnished',
  SEMI_FURNISHED: 'semi_furnished',
  FULLY_FURNISHED: 'fully_furnished',
} as const

export type FurnishingStatus = typeof FURNISHING_STATUS[keyof typeof FURNISHING_STATUS]

export const PRICE_TYPES = {
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  YEARLY: 'Yearly',
} as const

export type PriceType = typeof PRICE_TYPES[keyof typeof PRICE_TYPES]

export const AMENITIES_LIST = [
  'Air Conditioning',
  'Breakfast',
  'Kitchen',
  'Parking',
  'Pool',
  'Wi-Fi Internet',
  'Pet-Friendly',
] as const

export type Amenity = typeof AMENITIES_LIST[number]

export const FURNISHING_OPTIONS = [
  'Fully Furnished',
  'Semi Furnished',
  'Unfurnished',
] as const

/**
 * Property type labels for display
 */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PROPERTY_TYPES.HOUSE]: 'House',
  [PROPERTY_TYPES.CONDO]: 'Condo',
  [PROPERTY_TYPES.APARTMENT]: 'Apartment',
  [PROPERTY_TYPES.LOT]: 'Lot',
  [PROPERTY_TYPES.COMMERCIAL]: 'Commercial',
  [PROPERTY_TYPES.TOWNHOUSE]: 'Townhouse',
  [PROPERTY_TYPES.STUDIO]: 'Studio',
  [PROPERTY_TYPES.BEDSPACE]: 'Bedspace',
  [PROPERTY_TYPES.WAREHOUSE]: 'Warehouse',
  [PROPERTY_TYPES.OFFICE]: 'Office',
}

/**
 * Furnishing status labels for display
 */
export const FURNISHING_LABELS: Record<FurnishingStatus, string> = {
  [FURNISHING_STATUS.UNFURNISHED]: 'Unfurnished',
  [FURNISHING_STATUS.SEMI_FURNISHED]: 'Semi Furnished',
  [FURNISHING_STATUS.FULLY_FURNISHED]: 'Fully Furnished',
}

/**
 * Listing status labels for display
 */
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  [LISTING_STATUS.FOR_RENT]: 'For Rent',
  [LISTING_STATUS.FOR_SALE]: 'For Sale',
  [LISTING_STATUS.PRE_SELLING]: 'Pre-Selling',
}

