/**
 * Listing Assistant Types
 * Types for the AI-powered property listing assistant
 */

// Field Status Types
export type FieldStatus = 'empty' | 'filled' | 'skipped' | 'warning';

// Property Types
export type PropertyType = 
  | 'house' 
  | 'condo' 
  | 'apartment' 
  | 'lot' 
  | 'commercial'
  | 'townhouse'
  | 'studio'
  | 'bedspace'
  | 'warehouse'
  | 'office';

// Listing Status
export type ListingStatus = 'for_sale' | 'for_rent' | 'pre_selling';

// Furnishing Status
export type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'fully_furnished';

// Price Type (must match backend validation: Monthly, Weekly, Daily, Yearly)
export type PriceType = 'Monthly' | 'Weekly' | 'Daily' | 'Yearly';

// Conversation Status
export type ConversationStatus = 'in_progress' | 'completed' | 'submitted';

/**
 * Uploaded image data
 */
export interface UploadedImage {
  path: string;
  url: string;
  original_name: string;
  size: number;
  mime_type: string;
}

/**
 * Extracted property data from AI
 */
export interface ExtractedPropertyData {
  // Required fields
  property_name?: string | null;
  property_type?: PropertyType | null;
  location?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  
  // Optional fields
  address?: string | null;
  area_sqm?: number | null;
  lot_area_sqm?: number | null;
  parking_slots?: number | null;
  amenities?: string[] | null;
  furnishing_status?: FurnishingStatus | null;
  hoa_fee?: number | null;
  property_age?: number | null;
  floor_level?: number | null;
  title_type?: string | null;
  description?: string | null;
  status?: ListingStatus | null;
  price_type?: PriceType | null;
  description_template?: DescriptionTemplate | null;
  
  // Location coordinates
  latitude?: number | null;
  longitude?: number | null;
  
  // Images
  images?: UploadedImage[] | null;
}

/**
 * Chat message in conversation
 */
export interface ListingAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Data validation warning
 */
export interface DataWarning {
  field: string;
  message: string;
  value: unknown;
}

/**
 * API Request: Process Message
 */
export interface ProcessMessageRequest {
  message: string;
  conversation_id?: string | null;
}

/**
 * API Response: Process Message
 */
export interface ProcessMessageResponse {
  conversation_id: string;
  extracted_data: ExtractedPropertyData;
  missing_fields: string[];
  skipped_fields: string[];
  ai_response: string;
  form_ready: boolean;
  can_generate_description: boolean;
  description: string | null;
  warnings: DataWarning[];
  messages: ListingAssistantMessage[];
  current_step?: string | null;
}

/**
 * API Response: Start New Conversation
 */
export interface StartConversationResponse {
  conversation_id: string;
  ai_response: string;
  extracted_data: ExtractedPropertyData;
  missing_fields: string[];
  skipped_fields: string[];
  form_ready: boolean;
  can_generate_description: boolean;
  messages: ListingAssistantMessage[];
  current_step?: string | null;
}

/**
 * API Response: Get Conversation
 */
export interface GetConversationResponse {
  conversation_id: string;
  extracted_data: ExtractedPropertyData;
  missing_fields: string[];
  skipped_fields: string[];
  form_ready: boolean;
  can_generate_description: boolean;
  messages: ListingAssistantMessage[];
  status: ConversationStatus;
  current_step?: string | null;
}

/**
 * Description template types
 */
export type DescriptionTemplate = 
  | 'narrative'
  | 'bulleted'
  | 'short'
  | 'luxury'
  | 'storytelling';

export const DESCRIPTION_TEMPLATES: Record<DescriptionTemplate, { label: string; description: string; preview: string }> = {
  narrative: {
    label: 'Narrative',
    description: 'Professional paragraph format with flowing description',
    preview: 'Discover this stunning 3-bedroom house in Quezon City. This well-maintained property features spacious living areas, modern amenities, and excellent natural lighting throughout. Located in a prime neighborhood with easy access to schools and commercial centers, this home offers the perfect blend of comfort and convenience. Schedule your viewing today!',
  },
  bulleted: {
    label: 'Feature List',
    description: 'Organized bullet points highlighting key features',
    preview: 'Property Highlights:\n- 3 bedrooms, 2 bathrooms\n- Modern kitchen with built-in cabinets\n- Spacious living and dining areas\n\nLocation & Extras:\n- Near schools and malls\n- 24/7 security\n- 2 parking slots\n\nSchedule a viewing today!',
  },
  short: {
    label: 'Short & Punchy',
    description: 'Brief, attention-grabbing description',
    preview: 'Your dream home awaits! Beautiful 3BR/2BA house in Quezon City with modern finishes and prime location. Near top schools and malls. Call now!',
  },
  luxury: {
    label: 'Luxury',
    description: 'Sophisticated tone for high-end properties',
    preview: 'Presenting an architectural masterpiece in the heart of Quezon City. This meticulously crafted residence features resort-style amenities, bespoke finishes, and unparalleled attention to detail. Experience exclusivity and refined living at its finest. Schedule your private showing.',
  },
  storytelling: {
    label: 'Storytelling',
    description: 'Emotional, lifestyle-focused narrative',
    preview: 'Imagine waking up to sunlight streaming through your windows, the aroma of coffee filling your spacious kitchen. Picture weekend gatherings in your private garden, children playing safely in the neighborhood. This 3-bedroom home in Quezon City is where your family\'s next chapter begins. Come see yourself home.',
  },
};

/**
 * API Response: Generate Description
 */
export interface GenerateDescriptionResponse {
  success: boolean;
  description?: string;
  extracted_data?: ExtractedPropertyData;
  error?: string;
  template?: DescriptionTemplate;
  ai_generated_description?: string;
}

/**
 * API Response: Update Data
 */
export interface UpdateDataResponse {
  success: boolean;
  conversation_id: string;
  extracted_data: ExtractedPropertyData;
  missing_fields: string[];
  form_ready: boolean;
  can_generate_description: boolean;
  warnings: DataWarning[];
}

/**
 * API Response: Submit Listing
 */
export interface SubmitListingResponse {
  success: boolean;
  property_id?: number;
  message?: string;
  error?: string;
  missing_fields?: string[];
}

/**
 * API Response: Upload Images
 */
export interface UploadImagesResponse {
  success: boolean;
  images: UploadedImage[];
  message: string;
}

/**
 * API Response: Delete Image
 */
export interface DeleteImageResponse {
  success: boolean;
  images: UploadedImage[];
  message: string;
}

/**
 * Conversation list item for user's conversations
 */
export interface ConversationListItem {
  conversation_id: string;
  status: ConversationStatus;
  form_ready: boolean;
  property_name: string | null;
  property_type: PropertyType | null;
  location: string | null;
  last_message_at: string;
  created_at: string;
}

/**
 * API Response: List Conversations
 */
export interface ListConversationsResponse {
  conversations: ConversationListItem[];
}

/**
 * Required fields for a complete listing
 */
export const REQUIRED_FIELDS: (keyof ExtractedPropertyData)[] = [
  'property_name',
  'property_type',
  'location',
  'price',
  'price_type',
  'bedrooms',
  'bathrooms',
];

/**
 * Optional fields that can be extracted
 */
export const OPTIONAL_FIELDS: (keyof ExtractedPropertyData)[] = [
  'address',
  'area_sqm',
  'lot_area_sqm',
  'parking_slots',
  'amenities',
  'furnishing_status',
  'hoa_fee',
  'property_age',
  'floor_level',
  'title_type',
  'description',
  'status',
  'price_type',
];

/**
 * Field labels for display
 */
export const FIELD_LABELS: Record<keyof ExtractedPropertyData, string> = {
  property_name: 'Property Name',
  property_type: 'Property Type',
  location: 'Location',
  price: 'Price',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  address: 'Full Address',
  area_sqm: 'Floor Area (sqm)',
  lot_area_sqm: 'Lot Area (sqm)',
  parking_slots: 'Parking Slots',
  amenities: 'Amenities',
  furnishing_status: 'Furnishing',
  hoa_fee: 'HOA Fee',
  property_age: 'Property Age (years)',
  floor_level: 'Floor Level',
  title_type: 'Title Type',
  description: 'Description',
  status: 'Listing Status',
  price_type: 'Price Type',
  description_template: 'Description Template',
  latitude: 'Latitude',
  longitude: 'Longitude',
  images: 'Images',
};

/**
 * Property type display labels
 */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: 'House',
  condo: 'Condominium',
  apartment: 'Apartment',
  lot: 'Lot',
  commercial: 'Commercial',
  townhouse: 'Townhouse',
  studio: 'Studio',
  bedspace: 'Bedspace',
  warehouse: 'Warehouse',
  office: 'Office',
};

/**
 * Furnishing status display labels
 */
export const FURNISHING_LABELS: Record<FurnishingStatus, string> = {
  unfurnished: 'Unfurnished',
  semi_furnished: 'Semi-Furnished',
  fully_furnished: 'Fully Furnished',
};

/**
 * Listing status display labels
 */
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  for_sale: 'For Sale',
  for_rent: 'For Rent',
  pre_selling: 'Pre-Selling',
};

/**
 * Helper: Format price in Philippine Peso
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  return `₱${price.toLocaleString('en-US')}`;
}

/**
 * Helper: Get field status
 */
export function getFieldStatus(
  field: keyof ExtractedPropertyData,
  data: ExtractedPropertyData,
  skippedFields: string[],
  warnings: DataWarning[]
): FieldStatus {
  if (skippedFields.includes(field)) return 'skipped';
  
  const hasWarning = warnings.some(w => w.field === field);
  if (hasWarning) return 'warning';
  
  const value = data[field];
  if (value === null || value === undefined || value === '') return 'empty';
  if (Array.isArray(value) && value.length === 0) return 'empty';
  
  return 'filled';
}
