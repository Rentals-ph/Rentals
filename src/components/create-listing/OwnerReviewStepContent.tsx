'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateListing } from '../../contexts/CreateListingContext'
import { compressImage } from '../../utils/imageCompression'
import { uploadWithProgress } from '../../utils/uploadProgress'
import { getApiBaseUrl } from '../../config/api'
import {
  FiArrowLeft,
  FiArrowRight,
  FiEdit,
  FiUpload,
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

  const [formData, setFormData] = useState({
    firstname: data.ownerFirstname,
    lastname: data.ownerLastname,
    phone: data.ownerPhone,
    email: data.ownerEmail,
    country: data.ownerCountry,
    state: data.ownerState,
    city: data.ownerCity,
    streetAddress: data.ownerStreetAddress,
  })
  const [countryCode, setCountryCode] = useState('+63')
  const [rapaFile, setRapaFile] = useState<File | null>(data.rapaFile)
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
    setFormData({
      firstname: data.ownerFirstname,
      lastname: data.ownerLastname,
      phone: data.ownerPhone,
      email: data.ownerEmail,
      country: data.ownerCountry,
      state: data.ownerState,
      city: data.ownerCity,
      streetAddress: data.ownerStreetAddress,
    })
    setRapaFile(data.rapaFile)
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setRapaFile(e.target.files[0])
  }

  const displayPrice = showPricingFields ? price : data.price
  const displayPriceType = showPricingFields ? priceType : data.priceType

  const propertyData = {
    category: data.category || 'Not Set',
    title: data.title || 'Not Set',
    price: displayPrice ? `₱${displayPrice}` : 'Not Set',
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

      updateData({
        ownerFirstname: formData.firstname,
        ownerLastname: formData.lastname,
        ownerPhone: formData.phone,
        ownerEmail: formData.email,
        ownerCountry: formData.country,
        ownerState: formData.state,
        ownerCity: formData.city,
        ownerStreetAddress: formData.streetAddress,
        rapaFile,
        ...(showPricingFields && { price: finalPrice, priceType: finalPriceType }),
      })

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
      const propertyDataObj = {
        title: data.title,
        description: data.description,
        type: data.category,
        location: data.street || data.city || data.state || data.country,
        price: finalPrice,
        price_type: finalPriceType,
        bedrooms: data.bedrooms.toString(),
        bathrooms: data.bathrooms.toString(),
        garage: data.garage.toString(),
        area: data.floorArea.toString(),
        lot_area: data.lotArea.toString(),
        floor_area_unit: data.floorUnit,
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
          Owner Information & Review
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Complete owner details and review your listing before publishing
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
            <h3 className="text-lg font-semibold text-gray-900">
              Property Owner Information
            </h3>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                RAPA Upload
              </h4>
              <input
                type="file"
                id="rapa-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
              <label
                htmlFor="rapa-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <FiUpload className="w-4 h-4" />
                <span>Choose File</span>
              </label>
              <div className="text-sm text-gray-600 mt-2">
                {rapaFile ? (
                  <span className="font-medium text-gray-900">{rapaFile.name}</span>
                ) : (
                  <span className="text-gray-500">No file chosen</span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Lessor/Property Owner Info
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstname" className={labelClass}>
                    Firstname
                  </label>
                  <input
                    id="firstname"
                    type="text"
                    className={inputClass}
                    placeholder="Enter First Name"
                    value={formData.firstname}
                    onChange={(e) =>
                      handleInputChange('firstname', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="lastname" className={labelClass}>
                    Lastname
                  </label>
                  <input
                    id="lastname"
                    type="text"
                    className={inputClass}
                    placeholder="Enter Last Name"
                    value={formData.lastname}
                    onChange={(e) =>
                      handleInputChange('lastname', e.target.value)
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className={labelClass}>
                    Phone
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-40 flex-shrink-0">
                      <select
                        className={selectClass}
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                      >
                        <option value="+63">(+63) Philippines</option>
                        <option value="+1">(+1) United States</option>
                        <option value="+44">(+44) United Kingdom</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      className={`flex-1 ${inputClass}`}
                      placeholder="Enter Phone Number"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={inputClass}
                    placeholder="Enter Email"
                    value={formData.email}
                    onChange={(e) =>
                      handleInputChange('email', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="ownerCountry" className={labelClass}>
                    Country
                  </label>
                  <select
                    id="ownerCountry"
                    className={selectClass}
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange('country', e.target.value)
                    }
                  >
                    <option value="Philippines">Philippines</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ownerState" className={labelClass}>
                    State/Province
                  </label>
                  <select
                    id="ownerState"
                    className={selectClass}
                    value={formData.state}
                    onChange={(e) =>
                      handleInputChange('state', e.target.value)
                    }
                  >
                    <option value="">--Select State/Province--</option>
                    <option value="Metro Manila">Metro Manila</option>
                    <option value="Calabarzon">Calabarzon</option>
                    <option value="Central Luzon">Central Luzon</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ownerCity" className={labelClass}>
                    City
                  </label>
                  <select
                    id="ownerCity"
                    className={selectClass}
                    value={formData.city}
                    onChange={(e) =>
                      handleInputChange('city', e.target.value)
                    }
                  >
                    <option value="">--Select City--</option>
                    <option value="Manila">Manila</option>
                    <option value="Makati">Makati</option>
                    <option value="Quezon City">Quezon City</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="streetAddress" className={labelClass}>
                    Street Address
                  </label>
                  <input
                    id="streetAddress"
                    type="text"
                    className={inputClass}
                    placeholder="Enter Street Address"
                    value={formData.streetAddress}
                    onChange={(e) =>
                      handleInputChange('streetAddress', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

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
