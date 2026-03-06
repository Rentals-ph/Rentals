'use client'

/**
 * useListingConversation
 *
 * Single source of truth for the unified listing form.
 * Bridges the manual form's CreateListingData field names with the AI assistant's
 * conversation-backed ExtractedPropertyData, so both views always stay in sync.
 *
 * Usage:
 *   const { formData, updateField, bulkFill, submit, conversationId, isInitializing } =
 *     useListingConversation('agent')
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { listingAssistantApi } from '@/api/endpoints/listingAssistant'
import type { ExtractedPropertyData } from '@/types/listingAssistant'
import { LISTING_ROLE_CONFIG } from '@/config/listingRoles'

// ─── Form Data Shape ─────────────────────────────────────────────────────────
// Field names mirror CreateListingContext.CreateListingData so the manual form
// needs zero changes when rewired to this hook.
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
  uploadedImages: Array<{ path: string; url: string; original_name: string; size: number; mime_type: string }>
  videoUrl: string
  // Pricing
  price: string
  priceType: 'Monthly' | 'Weekly' | 'Daily' | 'Yearly'
  // Attributes
  amenities: string[]
  furnishing?: string
}

const DEFAULT_FORM_DATA: ListingFormData = {
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
  price: '',
  priceType: 'Monthly',
  amenities: [],
  furnishing: undefined,
}

// ─── Field Mapping Helpers ────────────────────────────────────────────────────

/**
 * Maps CreateListingData category labels → ExtractedPropertyData property_type values
 */
const CATEGORY_TO_TYPE: Record<string, string> = {
  'Apartment / Condo': 'condo',
  House: 'house',
  Townhouse: 'townhouse',
  Studio: 'studio',
  Bedspace: 'bedspace',
  Commercial: 'commercial',
  Office: 'office',
  Warehouse: 'warehouse',
}

const TYPE_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_TO_TYPE).map(([k, v]) => [v, k])
)

/**
 * Convert ListingFormData fields → ExtractedPropertyData for backend sync.
 * Images (File[]) are excluded — they are uploaded separately.
 */
function formDataToExtracted(data: ListingFormData): Partial<ExtractedPropertyData> {
  return {
    property_name: data.title || null,
    property_type: (CATEGORY_TO_TYPE[data.category] as ExtractedPropertyData['property_type']) || null,
    description: data.description || null,
    bedrooms: data.bedrooms || null,
    bathrooms: data.bathrooms || null,
    area_sqm: data.floorArea > 0 ? data.floorArea : null,
    lot_area_sqm: data.lotArea > 0 ? data.lotArea : null,
    price: data.price ? Number(data.price) : null,
    price_type: data.priceType as ExtractedPropertyData['price_type'],
    amenities: data.amenities.length > 0 ? data.amenities : null,
    furnishing_status: (data.furnishing as ExtractedPropertyData['furnishing_status']) || null,
    address: data.street || null,
    location: [data.city, data.state].filter(Boolean).join(', ') || null,
    latitude: data.latitude ? Number(data.latitude) : null,
    longitude: data.longitude ? Number(data.longitude) : null,
  }
}

/**
 * Merge ExtractedPropertyData back into ListingFormData.
 * Only non-null values overwrite existing form data.
 */
function extractedToFormData(
  extracted: Partial<ExtractedPropertyData>,
  current: ListingFormData
): ListingFormData {
  const updated = { ...current }

  if (extracted.property_name != null)
    updated.title = String(extracted.property_name)

  if (extracted.property_type != null)
    updated.category = TYPE_TO_CATEGORY[extracted.property_type] || current.category

  if (extracted.description != null)
    updated.description = String(extracted.description)

  if (extracted.bedrooms != null)
    updated.bedrooms = Number(extracted.bedrooms)

  if (extracted.bathrooms != null)
    updated.bathrooms = Number(extracted.bathrooms)

  if (extracted.area_sqm != null)
    updated.floorArea = Number(extracted.area_sqm)

  if (extracted.lot_area_sqm != null)
    updated.lotArea = Number(extracted.lot_area_sqm)

  if (extracted.price != null)
    updated.price = String(extracted.price)

  if (extracted.price_type != null)
    updated.priceType = extracted.price_type as ListingFormData['priceType']

  if (extracted.amenities != null)
    updated.amenities = extracted.amenities as string[]

  if (extracted.furnishing_status != null)
    updated.furnishing = extracted.furnishing_status

  if (extracted.address != null)
    updated.street = String(extracted.address)

  if (extracted.latitude != null)
    updated.latitude = String(extracted.latitude)

  if (extracted.longitude != null)
    updated.longitude = String(extracted.longitude)

  if (extracted.images != null)
    updated.uploadedImages = extracted.images as ListingFormData['uploadedImages']

  return updated
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseListingConversationReturn {
  /** Conversation ID from the backend — null until initialized */
  conversationId: string | null
  /** True while starting the conversation on mount */
  isInitializing: boolean
  /** Current form data */
  formData: ListingFormData
  /** Update a single field and queue an auto-save */
  updateField: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void
  /** Update multiple fields at once (e.g. from AI extraction) and save immediately */
  bulkFill: (extracted: Partial<ExtractedPropertyData>, filledFields?: string[]) => Promise<void>
  /** Submit the listing via the conversation endpoint and redirect */
  submit: () => Promise<void>
  /** Upload local image files to the conversation */
  uploadImages: (files: File[]) => Promise<void>
  /** Remove an uploaded image by index */
  removeUploadedImage: (index: number) => Promise<void>
  /** Whether submit is in progress */
  isSubmitting: boolean
  /** Whether image upload is in progress */
  isUploadingImages: boolean
  /** Last error message */
  error: string | null
  /** Clear the last error */
  clearError: () => void
  /** Fields that were just auto-filled by AI (cleared after a timeout for highlight animation) */
  recentlyFilledFields: string[]
}

export interface UseListingConversationOptions {
  /** Called after a successful submission instead of the default router.push redirect. */
  onSubmitSuccess?: () => void
}

export function useListingConversation(
  role: string,
  options?: UseListingConversationOptions,
): UseListingConversationReturn {
  const router = useRouter()
  const roleConfig = LISTING_ROLE_CONFIG[role] ?? LISTING_ROLE_CONFIG['agent']

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [formData, setFormData] = useState<ListingFormData>(DEFAULT_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentlyFilledFields, setRecentlyFilledFields] = useState<string[]>([])

  // Debounce auto-save timer
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const conversationIdRef = useRef<string | null>(null)

  // Keep ref in sync so callbacks always see the latest value
  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  // ── Initialize conversation on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      setIsInitializing(true)
      try {
        const response = await listingAssistantApi.startNewConversation()
        if (!cancelled) {
          setConversationId(response.conversation_id)
          // Pre-populate formData if the new conversation already carries data
          if (response.extracted_data && Object.keys(response.extracted_data).length > 0) {
            setFormData((prev) => extractedToFormData(response.extracted_data, prev))
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to start a listing session.')
        }
      } finally {
        if (!cancelled) setIsInitializing(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  // ── Auto-save (debounced 1.5 s) ──────────────────────────────────────────────
  const queueAutoSave = useCallback((data: ListingFormData) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      const id = conversationIdRef.current
      if (!id) return
      try {
        await listingAssistantApi.autoSave(id, undefined, formDataToExtracted(data) as Partial<ExtractedPropertyData>)
      } catch {
        // Auto-save failures are silent — do not surface to user
      }
    }, 1500)
  }, [])

  // ── updateField ──────────────────────────────────────────────────────────────
  const updateField = useCallback(<K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      queueAutoSave(next)
      return next
    })
  }, [queueAutoSave])

  // ── bulkFill ─────────────────────────────────────────────────────────────────
  const bulkFill = useCallback(async (
    extracted: Partial<ExtractedPropertyData>,
    filledFields?: string[]
  ) => {
    const id = conversationIdRef.current
    setFormData((prev) => extractedToFormData(extracted, prev))

    // Highlight fields that were just filled
    const affected = filledFields ?? Object.keys(extracted).filter(
      (k) => extracted[k as keyof ExtractedPropertyData] != null
    )
    if (affected.length > 0) {
      setRecentlyFilledFields(affected)
      setTimeout(() => setRecentlyFilledFields([]), 3000)
    }

    if (!id) return
    try {
      await listingAssistantApi.updateData(id, extracted)
    } catch {
      // Non-critical — local state is already updated
    }
  }, [])

  // ── uploadImages ─────────────────────────────────────────────────────────────
  const uploadImages = useCallback(async (files: File[]) => {
    const id = conversationIdRef.current
    if (!id || files.length === 0) return
    setIsUploadingImages(true)
    setError(null)
    try {
      const response = await listingAssistantApi.uploadImages(id, files)
      setFormData((prev) => ({
        ...prev,
        uploadedImages: response.images,
      }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload images.')
    } finally {
      setIsUploadingImages(false)
    }
  }, [])

  // ── removeUploadedImage ──────────────────────────────────────────────────────
  const removeUploadedImage = useCallback(async (index: number) => {
    const id = conversationIdRef.current
    if (!id) return
    setError(null)
    try {
      const response = await listingAssistantApi.deleteImage(id, index)
      setFormData((prev) => ({ ...prev, uploadedImages: response.images }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove image.')
    }
  }, [])

  // ── submit ───────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    const id = conversationIdRef.current
    if (!id) {
      setError('No active listing session. Please refresh the page.')
      return
    }
    setIsSubmitting(true)
    setError(null)

    // Push latest form state to backend before submitting
    try {
      await listingAssistantApi.updateData(id, formDataToExtracted(formData) as Partial<ExtractedPropertyData>)
    } catch {
      // Best-effort; continue to submit
    }

    try {
      const response = await listingAssistantApi.submitListing(id)
      if (response.success) {
        if (options?.onSubmitSuccess) {
          options.onSubmitSuccess()
        } else {
          router.push(roleConfig.successRedirect)
        }
      } else {
        const missingList = response.missing_fields?.join(', ')
        setError(
          response.error ||
          (missingList ? `Please fill in: ${missingList}` : 'Failed to submit listing.')
        )
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting.')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, roleConfig.successRedirect, router])

  const clearError = useCallback(() => setError(null), [])

  return {
    conversationId,
    isInitializing,
    formData,
    updateField,
    bulkFill,
    submit,
    uploadImages,
    removeUploadedImage,
    isSubmitting,
    isUploadingImages,
    error,
    clearError,
    recentlyFilledFields,
  }
}

