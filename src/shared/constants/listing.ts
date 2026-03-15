/**
 * Listing-related constants
 * Listing types, validation rules, field labels, etc.
 */

import { PROPERTY_TYPES, type PropertyType } from './property'

/**
 * Category to property type mapping
 */
export const CATEGORY_TO_TYPE: Record<string, PropertyType> = {
  'Apartment / Condo': PROPERTY_TYPES.APARTMENT,
  'House': PROPERTY_TYPES.HOUSE,
  'Townhouse': PROPERTY_TYPES.TOWNHOUSE,
  'Studio': PROPERTY_TYPES.STUDIO,
  'Bedspace': PROPERTY_TYPES.BEDSPACE,
  'Commercial': PROPERTY_TYPES.COMMERCIAL,
  'Office': PROPERTY_TYPES.OFFICE,
  'Warehouse': PROPERTY_TYPES.WAREHOUSE,
}

/**
 * Property type to category mapping
 */
export const TYPE_TO_CATEGORY: Record<PropertyType, string> = Object.fromEntries(
  Object.entries(CATEGORY_TO_TYPE).map(([category, type]) => [type, category])
) as Record<PropertyType, string>

/**
 * Field labels for listing forms
 */
export const FIELD_LABELS: Record<string, string> = {
  property_name: 'Property Name',
  property_type: 'Property Type',
  location: 'Location',
  price: 'Price',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  address: 'Address',
  area_sqm: 'Area (sqm)',
  lot_area_sqm: 'Lot Area (sqm)',
  parking_slots: 'Parking Slots',
  amenities: 'Amenities',
  furnishing_status: 'Furnishing Status',
  hoa_fee: 'HOA Fee',
  property_age: 'Property Age',
  floor_level: 'Floor Level',
  title_type: 'Title Type',
  description: 'Description',
  status: 'Listing Status',
  price_type: 'Price Type',
}

