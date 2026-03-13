'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateListing } from '@/contexts/CreateListingContext'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi'
import { ProgressRing } from '@/shared/components/ui'

export default function AgentCreateListingAttributes() {
  const router = useRouter()
  const { data, updateData } = useCreateListing()
  const [amenities, setAmenities] = useState<string[]>(data.amenities)

  useEffect(() => {
    setAmenities(data.amenities)
  }, [data])

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

  const amenitiesList = [
    'Air Conditioning',
    'Breakfast',
    'Kitchen',
    'Parking',
    'Pool',
    'Wi-Fi Internet',
    'Pet-Friendly'
  ]

  const handleAmenityChange = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    )
  }

  return (
    <>

        <div className="aclc-breadcrumb">
          <span className="aclc-breadcrumb-strong">Create Listing</span>
          <span className="aclc-breadcrumb-sep">&gt;</span>
          <span className="aclc-breadcrumb-muted">Attributes</span>
        </div>

        <div className="section-card aclc-stepper-card">
          <div className="aclc-stepper-left">
            <ProgressRing percent={70} />
            <div className="aclc-stepper-left-text">
              <div className="aclc-stepper-left-title">Completion Status</div>
            </div>
          </div>

          <div className="aclc-steps">
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 6
              const isDone = step < 6
              return (
                <div className="aclc-step" key={label}>
                  <div className="aclc-step-top">
                    <div className={`aclc-step-circle ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                      {isDone ? <FiCheck /> : step}
                    </div>
                    {step !== stepLabels.length && (
                      <div className={`aclc-step-line ${step < 6 ? 'done' : ''}`} />
                    )}
                  </div>
                  <div className={`aclc-step-label ${isActive ? 'active' : ''}`}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="section-card aclc-form-card">
          <h2 className="aclc-form-title">Attributes</h2>

          <div className="mb-6 last:mb-0">
            <h3 className="mb-3 text-base font-semibold text-gray-900">Amenities</h3>
            <div className="grid grid-cols-4 gap-4 xl:grid-cols-3 md:grid-cols-2 xs:grid-cols-1">
              {amenitiesList.map((amenity) => (
                <label key={amenity} className="flex cursor-pointer select-none items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-5 w-5 flex-shrink-0 cursor-pointer accent-blue-600"
                    checked={amenities.includes(amenity)}
                    onChange={() => handleAmenityChange(amenity)}
                  />
                  <span className="text-sm font-medium text-gray-900">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

    

          <div className="mt-6 flex justify-between gap-3 md:flex-col md:items-stretch">
            <button
              className="acld-prev-btn md:w-full md:justify-center"
              onClick={() => router.push('/agent/create-listing/pricing')}
              type="button"
            >
              <FiArrowLeft />
              <span>Previous</span>
            </button>
            <button
              className="aclc-next-btn md:w-full md:justify-center"
              onClick={() => {
                updateData({ amenities })
                router.push('/agent/create-listing/manual#section-review')
              }}
              type="button"
            >
              <span>Next</span>
              <FiArrowRight />
            </button>
          </div>
        </div>
    </>
  )
}

