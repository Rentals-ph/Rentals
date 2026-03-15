/**
 * Property Listing Validation Schemas
 * Zod schemas for property listing forms
 */

import { z } from 'zod'
import { VALIDATION_LIMITS } from '../constants/validation'
import { PROPERTY_CATEGORIES, PRICE_TYPES, LISTING_STATUS } from '../constants/property'

/**
 * Property listing form validation schema
 */
export const listingFormSchema = z.object({
  // Category
  category: z.string().refine(
    (val) => PROPERTY_CATEGORIES.includes(val as any),
    { message: 'Please select a valid property category' }
  ),

  // Details
  title: z
    .string()
    .min(1, 'Property title is required')
    .max(VALIDATION_LIMITS.MAX_TITLE_LENGTH, `Title must be no more than ${VALIDATION_LIMITS.MAX_TITLE_LENGTH} characters`),
  
  description: z
    .string()
    .max(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH, `Description must be no more than ${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} characters`)
    .optional(),
  
  bedrooms: z
    .number()
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms must be 0 or greater')
    .max(VALIDATION_LIMITS.MAX_BEDROOMS, `Bedrooms cannot exceed ${VALIDATION_LIMITS.MAX_BEDROOMS}`),
  
  bathrooms: z
    .number()
    .int('Bathrooms must be a whole number')
    .min(0, 'Bathrooms must be 0 or greater')
    .max(VALIDATION_LIMITS.MAX_BATHROOMS, `Bathrooms cannot exceed ${VALIDATION_LIMITS.MAX_BATHROOMS}`),
  
  garage: z
    .number()
    .int('Garage spaces must be a whole number')
    .min(0, 'Garage spaces must be 0 or greater')
    .max(VALIDATION_LIMITS.MAX_PARKING, `Garage spaces cannot exceed ${VALIDATION_LIMITS.MAX_PARKING}`),
  
  floorArea: z
    .number()
    .min(0, 'Floor area must be 0 or greater'),
  
  floorUnit: z.enum(['Square Meters', 'Square Feet'], {
    errorMap: () => ({ message: 'Please select a floor unit' }),
  }),
  
  lotArea: z
    .number()
    .min(0, 'Lot area must be 0 or greater')
    .optional(),

  // Location
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State/Province is required'),
  city: z.string().min(1, 'City is required'),
  street: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  zoom: z.string().optional(),

  // Images
  images: z.array(z.instanceof(File)).max(VALIDATION_LIMITS.MAX_IMAGES, `Cannot upload more than ${VALIDATION_LIMITS.MAX_IMAGES} images`),
  uploadedImages: z.array(z.object({
    path: z.string(),
    url: z.string(),
    original_name: z.string(),
    size: z.number(),
    mime_type: z.string(),
  })).optional(),
  videoUrl: z.string().url('Please enter a valid video URL').optional().or(z.literal('')),

  // Pricing
  listingType: z.enum([LISTING_STATUS.FOR_RENT, LISTING_STATUS.FOR_SALE], {
    errorMap: () => ({ message: 'Please select a listing type' }),
  }),
  
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= VALIDATION_LIMITS.MIN_PRICE && num <= VALIDATION_LIMITS.MAX_PRICE
    }, `Price must be between ${VALIDATION_LIMITS.MIN_PRICE} and ${VALIDATION_LIMITS.MAX_PRICE}`),
  
  priceType: z.enum([
    PRICE_TYPES.MONTHLY,
    PRICE_TYPES.WEEKLY,
    PRICE_TYPES.DAILY,
    PRICE_TYPES.YEARLY,
  ] as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a price type' }),
  }),

  // Attributes
  amenities: z.array(z.string()).optional(),
  furnishing: z.string().optional(),
})

/**
 * Type inferred from listing form schema
 */
export type ListingFormSchema = z.infer<typeof listingFormSchema>

