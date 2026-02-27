'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../../../components/common/AppSidebar'
import AgentHeader from '../../../../components/agent/AgentHeader'
import { useCreateListing } from '../../../../contexts/CreateListingContext'
import api from '../../../../lib/api'
import { compressImage } from '../../../../utils/imageCompression'
import { uploadWithProgress } from '../../../../utils/uploadProgress'
import { uploadPropertyMainImage } from '../../../../utils/imageUpload'
import { getApiBaseUrl } from '../../../../config/api'
import { formatPrice } from '../../../../utils/format'

import {
  FiCheck,
  FiEdit,
  FiArrowLeft
} from 'react-icons/fi'
// import '../AgentCreateListingCategory.css' // Converted to Tailwind

function ProgressRing({ percent }: { percent: number }) {
  const { radius, stroke, normalizedRadius, circumference, strokeDashoffset } = useMemo(() => {
    const r = 26
    const s = 6
    const nr = r - s / 2
    const c = nr * 2 * Math.PI
    const offset = c - (percent / 100) * c
    return {
      radius: r,
      stroke: s,
      normalizedRadius: nr,
      circumference: c,
      strokeDashoffset: offset
    }
  }, [percent])

  return (
    <div className="relative w-13 h-13 flex-shrink-0"> {/* aclc-progress */}
      <svg height={radius * 2} width={radius * 2} className="-rotate-90"> {/* aclc-progress-svg */}
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#2563EB"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-250 ease-in" // aclc-progress-ring
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">{percent}%</div> {/* aclc-progress-text */}
    </div>
  )
}

export default function AgentCreateListingPublish() {
  const router = useRouter()
  const { data, resetData } = useCreateListing()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)

  useEffect(() => {
    // Check if agent account is processing
    const registrationStatus = localStorage.getItem('agent_registration_status')
    const agentStatus = localStorage.getItem('agent_status')
    
    if (registrationStatus === 'processing' || 
        agentStatus === 'processing' || 
        agentStatus === 'pending' || 
        agentStatus === 'under_review') {
      setIsProcessing(true)
    }
  }, [])

  const stepLabels = [
    'Category',
    'Details',
    'Location',
    'Property Images',
    'Pricing',
    'Attributes',
    'Owner Info',
    'Publish'
  ]

  const propertyData = {
    category: data.category || 'Not Set',
    title: data.title || 'Not Set',
    price: data.price != null ? formatPrice(Number(data.price)) : 'Not Set',
    priceType: data.priceType || 'Monthly',
    location: data.street 
      ? `${data.street}, ${data.city || ''}, ${data.state || ''}`.trim()
      : data.city || data.state || 'Not Set',
    bedrooms: data.bedrooms?.toString() || '0',
    bathrooms: data.bathrooms?.toString() || '0',
    floorArea: data.floorArea ? `${data.floorArea} ${data.floorUnit}` : 'Not Set',
    video: data.videoUrl || 'Not Provided'
  }

  const handleEdit = (section: string) => {
    // Navigate to the appropriate step based on the section
    const stepMap: Record<string, string> = {
      category: '/agent/create-listing/category',
      title: '/agent/create-listing/details',
      price: '/agent/create-listing/pricing',
      location: '/agent/create-listing/location',
      bedrooms: '/agent/create-listing/details',
      bathrooms: '/agent/create-listing/details',
      floorArea: '/agent/create-listing/details',
      video: '/agent/create-listing/property-images'
    }
    const route = stepMap[section] || '/agent/create-listing/category'
    router.push(route)
  }

  return (
    <div className="agent-dashboard">
      <AppSidebar/>

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="Create Listing" 
          subtitle="Review and publish your listing." 
        />

        <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 my-1.5 mx-0 mb-4"> {/* aclc-breadcrumb */}
          <span className="text-gray-900">Create Listing</span> {/* aclc-breadcrumb-strong */}
          <span className="text-gray-400 font-medium">&gt;</span> {/* aclc-breadcrumb-sep */}
          <span className="text-gray-400 font-semibold">Publish</span> {/* aclc-breadcrumb-muted */}
        </div>

        <div className="flex items-center gap-4 p-5 mb-6 bg-white rounded-xl shadow-sm md:flex-col md:items-start"> {/* section-card aclc-stepper-card */}
          <div className="flex items-center gap-3 min-w-[220px]"> {/* aclc-stepper-left */}
            <ProgressRing percent={90} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div> {/* aclc-stepper-left-title */}
          </div>

          <div className="flex-1 grid grid-cols-4 items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start"> {/* aclc-steps */}
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 8
              const isDone = step < 8
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}> {/* aclc-step */}
                  <div className="w-full flex items-center relative"> {/* aclc-step-top */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}> {/* aclc-step-circle */}
                      {isDone ? <FiCheck className="text-lg" /> : step}
                    </div>
                    {step !== stepLabels.length && (
                      <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 ${step < 8 ? 'bg-blue-600' : 'bg-gray-200'}`} /> // aclc-step-line
                    )}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div> {/* aclc-step-label */}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-7 pb-6 bg-white rounded-xl shadow-sm max-w-full"> {/* section-card aclc-form-card */}
          <h2 className="m-0 mb-4 text-3xl font-bold text-gray-900">Review and Publish</h2> {/* aclc-form-title */}
          
          {/* Error Message */}
          {submitError && (
            <div className="p-4 mb-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
              {submitError}
            </div>
          )}

          {/* Upload Progress Bar */}
          {(isSubmitting || isCompressing) && (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <div className="flex justify-between mb-2 text-sm text-gray-500">
                <span>{isCompressing ? 'Compressing images...' : 'Uploading listing...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Processing Account Notice */}
          {isProcessing && (
            <div className="bg-rental-orange-50 border border-rental-orange-400 rounded-lg p-4 px-5 my-6 flex items-start gap-3"> {/* acpu-processing-notice */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#FE8E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 6V10M10 14H10.01" stroke="#FE8E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-rental-orange-900 font-outfit text-sm font-normal leading-relaxed">
                <strong className="text-rental-orange-400 font-semibold">Note:</strong> Your account is currently under review. Your listing will be saved but won't be visible to users until your account is approved by our admin team.
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg overflow-hidden border border-gray-200"> {/* acpu-summary-section */}
            <div className="bg-blue-600 p-4 px-5"> {/* acpu-summary-header */}
              <h3 className="m-0 text-base font-bold text-white">Property & Summary</h3> {/* acpu-summary-title */}
            </div>

            <div className="p-5 bg-white"> {/* acpu-summary-content */}
              <div className="grid grid-cols-[200px_1fr] gap-5 items-center py-4 border-b border-gray-100 last:border-b-0"> {/* acpu-summary-row */}
                <div className="text-sm font-semibold text-gray-900">Category</div> {/* acpu-summary-label */}
                <div className="flex items-center gap-3"> {/* acpu-summary-value-group */}
                  <div className="flex-1 p-2.5 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 min-h-[40px] flex items-center">{propertyData.category}</div> {/* acpu-summary-value */}
                  <button
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(37,99,235,0.2)]" // acpu-edit-btn
                    onClick={() => handleEdit('category')}
                    type="button"
                  >
                    <FiEdit className="text-base" /> {/* acpu-edit-icon */}
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-5 items-center py-4 border-b border-gray-100 last:border-b-0"> {/* acpu-summary-row */}
                <div className="text-sm font-semibold text-gray-900">Title</div> {/* acpu-summary-label */}
                <div className="flex items-center gap-3"> {/* acpu-summary-value-group */}
                  <div className="flex-1 p-2.5 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 min-h-[40px] flex items-center">{propertyData.title}</div> {/* acpu-summary-value */}
                  <button
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(37,99,235,0.2)]" // acpu-edit-btn
                    onClick={() => handleEdit('title')}
                    type="button"
                  >
                    <FiEdit className="text-base" /> {/* acpu-edit-icon */}
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-5 items-center py-4 border-b border-gray-100 last:border-b-0"> {/* acpu-summary-row */}
                <div className="text-sm font-semibold text-gray-900">Price</div> {/* acpu-summary-label */}
                <div className="flex items-center gap-3"> {/* acpu-summary-value-group */}
                  <div className="flex-1 p-2.5 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 min-h-[40px] flex items-center">
                    {propertyData.price} ({propertyData.priceType})
                  </div> {/* acpu-summary-value */}
                  <button
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(37,99,235,0.2)]" // acpu-edit-btn
                    onClick={() => handleEdit('price')}
                    type="button"
                  >
                    <FiEdit className="text-base" /> {/* acpu-edit-icon */}
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-5 items-center py-4 border-b border-gray-100 last:border-b-0"> {/* acpu-summary-row */}
                <div className="text-sm font-semibold text-gray-900">Location</div> {/* acpu-summary-label */}
                <div className="flex items-center gap-3"> {/* acpu-summary-value-group */}
                  <div className="flex-1 p-2.5 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 min-h-[40px] flex items-center">{propertyData.location}</div> {/* acpu-summary-value */}
                  <button
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(37,99,235,0.2)]" // acpu-edit-btn
                    onClick={() => handleEdit('location')}
                    type="button"
                  >
                    <FiEdit className="text-base" /> {/* acpu-edit-icon */}
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-5 items-center py-4 border-b border-gray-100 last:border-b-0"> {/* acpu-summary-row */}
                <div className="text-sm font-semibold text-gray-900">Bedrooms</div> {/* acpu-summary-label */}
                <div className="flex items-center gap-3"> {/* acpu-summary-value-group */}
                  <div className="flex-1 p-2.5 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 min-h-[40px] flex items-center">{propertyData.bedrooms}</div> {/* acpu-summary-value */}
                  <button
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(37,99,235,0.2)]" // acpu-edit-btn
                    onClick={() => handleEdit('bedrooms')}
                    type="button"
                  >
                    <FiEdit className="text-base" /> {/* acpu-edit-icon */}
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-5 items-center py-4 border-b border-gray-100 last:border-b-0"> {/* acpu-summary-row */}
                <div className="text-sm font-semibold text-gray-900">Bathrooms</div> {/* acpu-summary-label */}
                <div className="flex items-center gap-3"> {/* acpu-summary-value-group */}
                  <div className="flex-1 p-2.5 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 min-h-[40px] flex items-center">{propertyData.bathrooms}</div> {/* acpu-summary-value */}
                  <button
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(37,99,235,0.2)]" // acpu-edit-btn
                    onClick={() => handleEdit('bathrooms')}
                    type="button"
                  >
                    <FiEdit className="text-base" /> {/* acpu-edit-icon */}
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-5 items-center py-4 border-b border-gray-100 last:border-b-0"> {/* acpu-summary-row */}
                <div className="text-sm font-semibold text-gray-900">Floor Area</div> {/* acpu-summary-label */}
                <div className="flex items-center gap-3"> {/* acpu-summary-value-group */}
                  <div className="flex-1 p-2.5 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 min-h-[40px] flex items-center">{propertyData.floorArea}</div> {/* acpu-summary-value */}
                  <button
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(37,99,235,0.2)]" // acpu-edit-btn
                    onClick={() => handleEdit('floorArea')}
                    type="button"
                  >
                    <FiEdit className="text-base" /> {/* acpu-edit-icon */}
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[200px_1fr] gap-5 items-center py-4 border-b border-gray-100 last:border-b-0 md:grid-cols-1 md:gap-3"> {/* acpu-summary-row */}
                <div className="text-sm font-semibold text-gray-900">Video</div> {/* acpu-summary-label */}
                <div className="flex items-center gap-3 md:flex-col md:items-stretch"> {/* acpu-summary-value-group */}
                  <div className="flex-1 p-2.5 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 min-h-[40px] flex items-center">{propertyData.video}</div> {/* acpu-summary-value */}
                  <button
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(37,99,235,0.2)] md:w-full md:justify-center" // acpu-edit-btn
                    onClick={() => handleEdit('video')}
                    type="button"
                  >
                    <FiEdit className="text-base" /> {/* acpu-edit-icon */}
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between gap-3 md:flex-col md:items-stretch"> {/* acpu-footer-actions */}
            <button
              className="acld-prev-btn"
              onClick={() => router.push('/agent/create-listing/owner-info')}
              type="button"
            >
              <FiArrowLeft />
              <span>Previous</span>
            </button>
            <button
              className="py-3 px-6 bg-blue-600 text-white border-none rounded-lg text-sm font-bold cursor-pointer transition-all duration-150 ease-in-out shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-px hover:shadow-xl hover:shadow-blue-600/25 md:w-full md:justify-center" // acpu-publish-btn
              onClick={async () => {
                setIsSubmitting(true)
                setIsCompressing(true)
                setSubmitError(null)
                setUploadProgress(0)

                try {
                  // Step 1: Compress all images before upload (reduces upload time significantly)
                  const compressedImages: File[] = []
                  if (data.images.length > 0) {
                    for (const originalImage of data.images) {
                      // Validate original image
                      if (!originalImage || originalImage.size === 0) {
                        continue // Skip invalid images
                      }
                      
                      // Check file type
                      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                      if (!originalImage.type || !validTypes.includes(originalImage.type.toLowerCase())) {
                        console.warn(`Skipping invalid image type: ${originalImage.type}`)
                        continue
                      }
                      
                      try {
                        const compressed = await compressImage(originalImage, {
                          maxWidth: 1920,
                          maxHeight: 1920,
                          quality: 0.85,
                          maxSizeMB: 10,
                        })
                        compressedImages.push(compressed)
                      } catch (compressError) {
                        console.warn('Image compression failed, using original:', compressError)
                        // Use original file if compression fails
                        compressedImages.push(originalImage)
                      }
                    }
                    
                    if (compressedImages.length === 0) {
                      throw new Error('No valid images to upload. Please select at least one valid image.')
                    }
                  } else {
                    throw new Error('Please upload at least one property image.')
                  }
                  setIsCompressing(false)

                  // Step 2: Create FormData efficiently
                  const formData = new FormData()
                  
                  // Basic property info (batch append)
                  const propertyData = {
                    title: data.title,
                    description: data.description,
                    type: data.category,
                    location: data.street || data.city || data.state || data.country,
                    price: data.price,
                    price_type: data.priceType,
                    bedrooms: data.bedrooms.toString(),
                    bathrooms: data.bathrooms.toString(),
                    garage: data.garage.toString(),
                    area: data.floorArea.toString(),
                    lot_area: data.lotArea.toString(),
                    floor_area_unit: data.floorUnit,
                  }
                  
                  Object.entries(propertyData).forEach(([key, value]) => {
                    formData.append(key, value)
                  })
                  
                  // Amenities as JSON string
                  if (data.amenities.length > 0) {
                    formData.append('amenities', JSON.stringify(data.amenities))
                  }
                  
                  // Location details (batch append)
                  const locationData = {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    country: data.country,
                    state_province: data.state,
                    city: data.city,
                    street_address: data.street,
                  }
                  
                  Object.entries(locationData).forEach(([key, value]) => {
                    if (value) formData.append(key, value)
                  })
                  
                  // Video URL
                  if (data.videoUrl) {
                    formData.append('video_url', data.videoUrl)
                  }
                  
                  // Append all images to FormData (multiple images support)
                  // Laravel expects indexed array keys: images[0], images[1], etc.
                  compressedImages.forEach((imageFile, index) => {
                    if (imageFile.size > 0 && imageFile.type.startsWith('image/')) {
                      // Ensure file has proper extension for Laravel validation
                      const extension = imageFile.name.split('.').pop()?.toLowerCase() || 
                                       (imageFile.type.includes('jpeg') ? 'jpg' : 
                                        imageFile.type.includes('png') ? 'png' : 
                                        imageFile.type.includes('gif') ? 'gif' : 
                                        imageFile.type.includes('webp') ? 'webp' : 'jpg')
                      const fileName = imageFile.name || `image-${index}.${extension}`
                      formData.append(`images[${index}]`, imageFile, fileName)
                    }
                  })
                  
                  // Don't send 'image' field when we have images[] array
                  // The backend will use the first image from images[] as the main image
                  // This prevents duplicate uploads
                  
                  // Step 3: Create property with image
                  const API_BASE_URL = getApiBaseUrl()
                  const token = localStorage.getItem('auth_token')
                  
                  // Create property with image included in FormData
                  const createResponse = await uploadWithProgress(
                    `${API_BASE_URL}/properties`,
                    formData,
                    token,
                    (progress) => {
                      // Update progress for property creation (includes image upload)
                      setUploadProgress(progress.percent)
                    }
                  )
                  
                  const createResponseData = await createResponse.json()
                  
                  if (!createResponse.ok || !createResponseData.success) {
                    // Extract detailed error messages if available
                    const errorMessage = createResponseData.message || 'Failed to create property'
                    const errorMessages = createResponseData.error_messages || []
                    const errors = createResponseData.errors || {}
                    
                    let fullErrorMessage = errorMessage
                    if (errorMessages.length > 0) {
                      fullErrorMessage += '\n' + errorMessages.join('\n')
                    }
                    if (Object.keys(errors).length > 0) {
                      const errorDetails = Object.entries(errors)
                        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                        .join('\n')
                      fullErrorMessage += '\n' + errorDetails
                    }
                    
                    throw new Error(fullErrorMessage)
                  }
                  
                  // Get property ID from response
                  const propertyId = createResponseData.data?.id || createResponseData.property?.id || createResponseData.id
                  
                  if (!propertyId) {
                    throw new Error('Property created but no ID returned')
                  }
                  
                  // Images are already uploaded with the property creation, no need for separate upload
                  
                  resetData()
                  setUploadProgress(100)
                  setTimeout(() => {
                    window.alert('Listing published successfully!')
                    router.push('/agent/listings')
                  }, 300)
                } catch (error) {
                  console.error('Error publishing listing:', error)
                  setSubmitError(error instanceof Error ? error.message : 'An error occurred while publishing. Please try again.')
                } finally {
                  setIsSubmitting(false)
                  setIsCompressing(false)
                }
              }}
              type="button"
              disabled={isSubmitting || isCompressing}
            >
              <span>
                {isCompressing 
                  ? 'Compressing images...' 
                  : isSubmitting 
                    ? `Publishing... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` 
                    : 'Publish Listing'}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

