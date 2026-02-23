'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../../../components/common/AppSidebar'
import AgentHeader from '../../../../components/agent/AgentHeader'
import { useCreateListing } from '../../../../contexts/CreateListingContext'
import { compressImage } from '../../../../utils/imageCompression'
import { uploadWithProgress } from '../../../../utils/uploadProgress'
import { getApiBaseUrl } from '../../../../config/api'

import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiDollarSign,
  FiEdit
} from 'react-icons/fi'

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
    <div className="aclc-progress">
      <svg height={radius * 2} width={radius * 2} className="aclc-progress-svg">
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
          className="aclc-progress-ring"
        />
      </svg>
      <div className="aclc-progress-text">{percent}%</div>
    </div>
  )
}

export default function AgentCreateListingPricing() {
  const router = useRouter()
  const { data, updateData, resetData } = useCreateListing()
  const [price, setPrice] = useState(data.price)
  const [priceType, setPriceType] = useState<'Monthly' | 'Weekly' | 'Daily' | 'Yearly'>(data.priceType)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    setPrice(data.price)
    setPriceType(data.priceType)
  }, [data])

  const handlePublish = async () => {
    setIsSubmitting(true)
    setIsCompressing(true)
    setSubmitError(null)
    setUploadProgress(0)

    try {
      // Update pricing first
      updateData({ price, priceType })

      // Compress images
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

      // Create FormData
      const formDataObj = new FormData()
      
      const propertyDataObj = {
        title: data.title,
        description: data.description,
        type: data.category,
        location: data.street || data.city || data.state || data.country,
        price: price,
        price_type: priceType,
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
      
      const locationData = {
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
      
      if (data.videoUrl) {
        formDataObj.append('video_url', data.videoUrl)
      }
      
      if (compressedImage) {
        formDataObj.append('image', compressedImage)
      }
      
      // Upload with progress
      const API_BASE_URL = getApiBaseUrl()
      const token = localStorage.getItem('auth_token')
      
      const response = await uploadWithProgress(
        `${API_BASE_URL}/properties`,
        formDataObj,
        token,
        (progress) => {
          setUploadProgress(progress.percent)
        }
      )
      
      const responseData = await response.json()
      
      if (response.ok && responseData.success) {
        resetData()
        setUploadProgress(100)
        setTimeout(() => {
          window.alert('Listing published successfully!')
          router.push('/agent/listings')
        }, 300)
      } else {
        setSubmitError(responseData.message || 'Failed to publish listing. Please try again.')
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Error publishing listing:', error)
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while publishing. Please try again.')
    } finally {
      setIsSubmitting(false)
      setIsCompressing(false)
    }
  }

  // Streamlined 4-step flow
  const stepLabels = [
    'Basic Information',
    'Visuals & Features',
    'Owner Info & Review',
    'Pricing'
  ]

  return (
    <div className="agent-dashboard">
      <AppSidebar/>

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="Create Listing" 
          subtitle="Set property pricing." 
        />

        <div className="aclc-breadcrumb">
          <span className="aclc-breadcrumb-strong">Create Listing</span>
          <span className="aclc-breadcrumb-sep">&gt;</span>
          <span className="aclc-breadcrumb-muted">Pricing</span>
        </div>

        <div className="section-card aclc-stepper-card">
          <div className="aclc-stepper-left">
            <ProgressRing percent={100} />
            <div className="aclc-stepper-left-text">
              <div className="aclc-stepper-left-title">Completion Status</div>
            </div>
          </div>

          <div className="aclc-steps">
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 4
              const isDone = step < 4
              return (
                <div className="aclc-step" key={label}>
                  <div className="aclc-step-top">
                    <div className={`aclc-step-circle ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                      {isDone ? <FiCheck /> : step}
                    </div>
                    {step !== stepLabels.length && (
                      <div className={`aclc-step-line ${step < 4 ? 'done' : ''}`} />
                    )}
                  </div>
                  <div className={`aclc-step-label ${isActive ? 'active' : ''}`}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="section-card aclc-form-card px-7 pb-6 pt-7">
          <h2 className="aclc-form-title">Pricing</h2>

          {submitError && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
              {submitError}
            </div>
          )}

          {(isSubmitting || isCompressing) && (
            <div className="mb-4 rounded-lg bg-gray-100 p-4">
              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>{isCompressing ? 'Compressing images...' : 'Uploading listing...'}</span>
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

          <div className="mt-3 grid grid-cols-[1.1fr_0.9fr] gap-6 lg:grid-cols-1">
            <div className="flex flex-col">
              <div className="mb-3 text-base font-semibold text-gray-900">Price</div>
              <div className="mb-0">
                <div className="relative flex max-w-full items-center">
                  <div className="pointer-events-none absolute left-4 z-10 flex items-center justify-center text-xl text-gray-500">
                    <FiDollarSign />
                  </div>
                  <input
                    id="price"
                    type="text"
                    className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 pl-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="mb-3 text-base font-semibold text-gray-900">Price Type</div>
              <div className="mb-0">
                <div className="aclc-select-wrap">
                  <select
                    id="price-type"
                    className="aclc-select"
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value as 'Monthly' | 'Weekly' | 'Daily' | 'Yearly')}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Daily">Daily</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                  <div className="aclc-select-caret">▼</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between gap-3 md:flex-col md:items-stretch">
            <button
              className="acld-prev-btn md:w-full md:justify-center"
              onClick={() => router.push('/agent/create-listing/owner-review')}
              type="button"
            >
              <FiArrowLeft />
              <span>Previous</span>
            </button>
            <button
              className="aclc-next-btn md:w-full md:justify-center"
              onClick={handlePublish}
              type="button"
              disabled={isSubmitting || isCompressing || !price}
            >
              <span>
                {isCompressing 
                  ? 'Compressing images...' 
                  : isSubmitting 
                    ? `Publishing... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` 
                    : 'Publish Listing'}
              </span>
              <FiArrowRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

