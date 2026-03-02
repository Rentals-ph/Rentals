'use client'

import { useRouter } from 'next/navigation'
import { ASSETS } from '@/utils/assets'

interface SimpleVerticalPropertyCardProps {
  id?: number | string
  propertyType?: string
  priceType?: string
  price?: string
  /** Display string for when the property was listed (e.g. "Jan 5, 2026") */
  dateListed?: string
  title?: string
  image?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  propertySize?: string
  /** Full location string (fallback when city/street/state not provided) */
  location?: string
  city?: string | null
  streetAddress?: string | null
  stateProvince?: string | null
}

function SimpleVerticalPropertyCard({
  id,
  propertyType = 'Commercial Spaces',
  priceType,
  price = '₱1,200',
  dateListed,
  title = 'Azure Residences - 2BR Corner Suite',
  image = ASSETS.PLACEHOLDER_PROPERTY_MAIN,
  bedrooms = 4,
  bathrooms = 2,
  parking = 2,
  propertySize = '24 sqm',
  location,
  city,
  streetAddress,
  stateProvince,
}: SimpleVerticalPropertyCardProps) {
  const router = useRouter()
  const locationLine = [streetAddress, city].filter(Boolean).join(' ') || location
  const fullAddress =
    [streetAddress, city, stateProvince].filter(Boolean).join(', ') || location || locationLine

  const handleCardClick = () => {
    if (id) {
      router.push(`/property/${id}`)
    }
  }

  return (
    <article
      className="group bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden flex flex-col w-full max-w-[550px] h-full shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
      style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgb(229, 231, 235)' }}
    >
      {/* Property image */}
      <div className="relative w-full aspect-[4/2] min-h-[140px] overflow-hidden rounded-t-lg sm:rounded-t-xl bg-gray-100">
        <img
          src={image || ASSETS.PLACEHOLDER_PROPERTY_MAIN}
          alt={title}
          className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          onError={(e) => {
            e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
          }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 gap-2 overflow-hidden">
        <div>
          <div className="flex justify-between items-center gap-2">
          <span className="text-blue-600 text-[10px] sm:text-xs font-semibold uppercase tracking-wide truncate">
            {propertyType}
          </span>
          {dateListed && (
            <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium whitespace-nowrap flex-shrink-0">
              {dateListed}
            </span>
          )}
          </div>

          <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <p className="text-blue-600 text-xl sm:text-2xl md:text-4xl font-bold leading-tight whitespace-nowrap">
              {price}
            </p>
            {priceType && (
              <span className="text-orange-500 text-xs sm:text-lg font-medium whitespace-nowrap">
                /{priceType}
              </span>
            )}
          </div>

          <div className="min-w-0 mt-1">
            <h3 className="text-gray-900 text-base sm:text-xl font-semibold leading-snug line-clamp-1">
              {title}
            </h3>
            {locationLine ? (
              <div
                className="flex items-center gap-1.5 text-gray-500 font-normal min-w-0 text-xs sm:text-sm"
                title={fullAddress}
              >
                <span className="truncate line-clamp-1" title={fullAddress}>
                  {locationLine}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bed, bath, size */}
        <div className="mt-1 flex items-center gap-2 sm:gap-4 text-gray-600 text-xs sm:text-sm flex-wrap">
          <span className="flex items-center gap-1 sm:gap-1.5">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
            >
              <rect x="3" y="10" width="18" height="7" rx="2" />
              <rect x="7" y="7" width="4" height="3" rx="1" />
              <rect x="13" y="7" width="4" height="3" rx="1" />
              <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
            </svg>
            {bedrooms}
            <span className="text-gray-500 font-normal">Bed</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
            >
              <rect x="3" y="10" width="18" height="8" rx="2" />
              <rect x="5" y="18" width="2" height="2" rx="1" />
              <rect x="17" y="18" width="2" height="2" rx="1" />
              <path d="M3 18h18" />
            </svg>
            {bathrooms}
            <span className="text-gray-500 font-normal">Bath</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
            >
              <rect x="2" y="17" width="20" height="4" rx="1" />
              <rect x="2" y="3" width="20" height="4" rx="1" />
              <rect x="2" y="10" width="20" height="4" rx="1" />
            </svg>
            {propertySize}
            <span className="text-gray-500 font-normal">Size</span>
          </span>
        </div>

        {/* Parking row below stats */}
        <div className="mt-1 flex items-center gap-1 sm:gap-1.5 text-gray-600 text-xs sm:text-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
          >
            <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
            <path d="M6 22h12" />
            <path d="M10 14v4" />
            <path d="M14 14v4" />
          </svg>
          {parking}
          <span className="text-gray-500 font-normal">Parking</span>
        </div>
      </div>
    </article>
  )
}

export default SimpleVerticalPropertyCard

