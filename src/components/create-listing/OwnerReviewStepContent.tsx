'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateListing } from '../../contexts/CreateListingContext'
import { compressImage, uploadWithProgress } from '@/shared/utils/image'
import { formatPrice } from '@/shared/utils/format'
import { getApiBaseUrl } from '@/shared/config/api'
import {
  FiArrowLeft,
  FiArrowRight,
  FiEdit,
  FiDollarSign,
  FiChevronDown,
} from 'react-icons/fi'

export interface OwnerReviewStepContentProps {
  /** Map of section key to route for Edit buttons (e.g. category -> /agent/create-listing/basic-info) */
  editStepMap: Record<string, string>
  /** Path to redirect after successful publish (e.g. /agent/listings) */
  successRedirectPath: string
  /** Path for Previous button */
  prevStepPath: string
  /** localStorage key for registration status (e.g. agent_registration_status) */
  registrationStatusKey: string
  /** localStorage key for account status (e.g. agent_status) */
  statusKey: string
  /** When true, show price/priceType inputs and use them on publish (agent flow). When false, use context data (broker flow). */
  showPricingFields?: boolean
  /** Optional: append broker-specific fields to FormData before upload (e.g. zoom_level, furnishing) */
  appendExtraFormData?: (formData: FormData) => void
}

export function OwnerReviewStepContent({
  editStepMap,
  successRedirectPath,
  prevStepPath,
  registrationStatusKey,
  statusKey,
  showPricingFields = false,
  appendExtraFormData,
}: OwnerReviewStepContentProps) {
  const router = useRouter()
  const { data, updateData, resetData } = useCreateListing()

  const [price, setPrice] = useState(data.price)
  const [priceType, setPriceType] = useState<
    'Monthly' | 'Weekly' | 'Daily' | 'Yearly'
  >(data.priceType)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    setPrice(data.price)
    setPriceType(data.priceType)

    const registrationStatus = localStorage.getItem(registrationStatusKey)
    const accountStatus = localStorage.getItem(statusKey)
    if (
      registrationStatus === 'processing' ||
      accountStatus === 'processing' ||
      accountStatus === 'pending' ||
      accountStatus === 'under_review'
    ) {
      setIsProcessing(true)
    }
  }, [
    data,
    registrationStatusKey,
    statusKey,
  ])

  const displayPrice = showPricingFields ? price : data.price
  const displayPriceType = showPricingFields ? priceType : data.priceType

  const propertyData = {
    category: data.category || 'Not Set',
    title: data.title || 'Not Set',
    price: displayPrice != null && displayPrice !== '' ? formatPrice(Number(displayPrice)) : 'Not Set',
    priceType: displayPriceType || 'Monthly',
    location: data.street
      ? `${data.street}, ${data.city || ''}, ${data.state || ''}`.trim()
      : data.city || data.state || 'Not Set',
    bedrooms: data.bedrooms?.toString() ?? '0',
    bathrooms: data.bathrooms?.toString() ?? '0',
    floorArea: data.floorArea
      ? `${data.floorArea} ${data.floorUnit}`
      : 'Not Set',
  }

  const handleEdit = (section: string) => {
    const route = editStepMap[section]
    if (route) router.push(route)
  }

  const handlePublish = async () => {
    setIsSubmitting(true)
    setIsCompressing(true)
    setSubmitError(null)
    setUploadProgress(0)

    try {
      const finalPrice = showPricingFields ? price : data.price
      const finalPriceType = showPricingFields ? priceType : data.priceType

      if (showPricingFields) {
        updateData({ price: finalPrice, priceType: finalPriceType })
      }

      let compressedImage: File | null = null
      if (data.images.length > 0) {
        try {
          compressedImage = await compressImage(data.images[0], {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            maxSizeMB: 2,
          })
        } catch (compressError) {
          console.warn('Image compression failed, using original:', compressError)
          compressedImage = data.images[0]
        }
      }
      setIsCompressing(false)

      const formDataObj = new FormData()
      const propertyDataObj: Record<string, string> = {
        title: data.title,
        description: data.description,
        type: data.category,
        location: data.street || data.city || data.state || data.country,
        listing_type: data.listingType,
        price: finalPrice,
        bedrooms: data.bedrooms.toString(),
        bathrooms: data.bathrooms.toString(),
        garage: data.garage.toString(),
        area: data.floorArea.toString(),
        lot_area: data.lotArea.toString(),
        floor_area_unit: data.floorUnit,
      }
      // Only include price_type for rental properties
      if (data.listingType !== 'for_sale') {
        propertyDataObj.price_type = finalPriceType
      }
      Object.entries(propertyDataObj).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })
      if (data.amenities.length > 0) {
        formDataObj.append('amenities', JSON.stringify(data.amenities))
      }
      const locationData: Record<string, string> = {
        latitude: data.latitude,
        longitude: data.longitude,
        country: data.country,
        state_province: data.state,
        city: data.city,
        street_address: data.street,
      }
      Object.entries(locationData).forEach(([key, value]) => {
        if (value) formDataObj.append(key, value)
      })
      if (data.videoUrl) formDataObj.append('video_url', data.videoUrl)
      if (compressedImage) formDataObj.append('image', compressedImage)

      appendExtraFormData?.(formDataObj)

      const API_BASE_URL = getApiBaseUrl()
      const token = localStorage.getItem('auth_token')
      const response = await uploadWithProgress(
        `${API_BASE_URL}/properties`,
        formDataObj,
        token,
        (progress) => setUploadProgress(progress.percent)
      )
      const responseData = await response.json()

      if (response.ok && responseData.success) {
        resetData()
        setUploadProgress(100)
        setTimeout(() => {
          window.alert('Listing published successfully!')
          router.push(successRedirectPath)
        }, 300)
      } else {
        setSubmitError(
          responseData.message || 'Failed to publish listing. Please try again.'
        )
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Error publishing listing:', error)
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'An error occurred while publishing. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
      setIsCompressing(false)
    }
  }

  const inputClass =
    'w-full h-11 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
  const labelClass = 'block text-sm font-semibold text-gray-900 mb-2'
  const selectClass =
    'w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">
          Review & Publish
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Review your listing and publish. Listed by Agent — contact is through you as the listing agent.
        </p>
      </div>

      {(submitError || isSubmitting || isCompressing) && (
        <div className="px-6 pt-4 space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 text-sm">
              {submitError}
            </div>
          )}
          {(isSubmitting || isCompressing) && (
            <div className="rounded-lg bg-gray-100 p-4">
              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>
                  {isCompressing
                    ? 'Compressing images...'
                    : 'Uploading listing...'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="flex-shrink-0 mt-0.5"
          >
            <path
              d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
              stroke="#FE8E0A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 6V10M10 14H10.01"
              stroke="#FE8E0A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-amber-800">
            <strong>Note:</strong> Your account is currently under review. Your
            listing will be saved but won&apos;t be visible to users until your
            account is approved.
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {showPricingFields && (
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Pricing
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiDollarSign className="w-5 h-5" />
                      </div>
                      <input
                        id="price"
                        type="text"
                        className={`${inputClass} pl-11`}
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Price Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="price-type"
                        className={selectClass}
                        value={priceType}
                        onChange={(e) =>
                          setPriceType(
                            e.target.value as
                              | 'Monthly'
                              | 'Weekly'
                              | 'Daily'
                              | 'Yearly'
                          )
                        }
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Daily">Daily</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Property Summary
            </h3>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 sticky top-6">
              <div className="space-y-4">
                {(
                  [
                    ['category', 'Category', propertyData.category],
                    ['title', 'Title', propertyData.title],
                    ['price', 'Price', `${propertyData.price} (${propertyData.priceType})`],
                    ['location', 'Location', propertyData.location],
                    ['bedrooms', 'Bedrooms', propertyData.bedrooms],
                    ['bathrooms', 'Bathrooms', propertyData.bathrooms],
                    ['floorArea', 'Floor Area', propertyData.floorArea],
                  ] as const
                ).map(([key, label, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0"
                  >
                    <div className="text-sm font-semibold text-gray-600">
                      {label}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900 text-right max-w-xs truncate">
                        {value}
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        onClick={() => handleEdit(key)}
                      >
                        <FiEdit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold text-sm rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
          onClick={() => router.push(prevStepPath)}
          disabled={isSubmitting}
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          onClick={handlePublish}
          disabled={
            isSubmitting ||
            isCompressing ||
            (showPricingFields && !price)
          }
        >
          <span>
            {isCompressing
              ? 'Compressing images...'
              : isSubmitting
                ? `Publishing... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}`
                : 'Publish Listing'}
          </span>
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
