'use client'

import { useRouter } from 'next/navigation'
import { FiMapPin } from 'react-icons/fi'
import { FiHeart } from 'react-icons/fi'
import { ASSETS } from '@/utils/assets'

interface SimplePropertyCardProps {
  id?: number | string
  title?: string
  location?: string
  price?: string
  image?: string
  /** When 'chat', uses card layout with image overlays, meta line, and View Details button */
  variant?: 'default' | 'chat'
  bedrooms?: number
  bathrooms?: number
  area?: number | null
}

function SimplePropertyCard({
  id,
  title = 'Property Title',
  location,
  price = '₱0',
  image = ASSETS.PLACEHOLDER_PROPERTY_MAIN,
  variant = 'default',
  bedrooms,
  bathrooms,
  area,
}: SimplePropertyCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    if (id) {
      router.push(`/property/${id}`)
    }
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (id) {
      router.push(`/property/${id}`)
    }
  }

  if (variant === 'chat') {
    const metaParts: string[] = []
    if (bedrooms != null) metaParts.push(`${bedrooms} BED`)
    if (bathrooms != null) metaParts.push(`${bathrooms} BATH`)
    if (area != null && area > 0) metaParts.push(`${area} SQM`)
    const metaText = metaParts.join(' • ')

    return (
      <div
        className="flex flex-col rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
            }}
          />
          {/* Price badge: dark gradient behind white text for readability (reference) */}
          <div
            className="absolute bottom-0 left-0 right-0 pt-12 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none"
            aria-hidden
          />
          <button
            type="button"
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center text-gray-700 hover:bg-white hover:shadow transition-colors touch-manipulation"
            onClick={(e) => e.stopPropagation()}
            aria-label="Save property"
          >
            <FiHeart className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <div className="p-4 flex flex-col text-left flex-1">
          <h3 className="font-outfit font-semibold text-base text-gray-900 line-clamp-2 leading-snug">
            {title}
          </h3>
          {location && (
            <p className="flex items-center gap-1.5 font-outfit text-sm text-gray-500 line-clamp-1">
              <FiMapPin className="flex-shrink-0 w-3.5 h-3.5 text-gray-400" aria-hidden />
              <span className="truncate">{location}</span>
            </p>
          )}
          {metaText && (
            <p className="font-outfit text-xs text-gray-500">
              {metaText}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="font-outfit font-bold text-xl text-gray-900">
              {price}
            </p>
            <button
              type="button"
              className="font-outfit font-medium text-sm py-2 px-4 rounded-lg bg-rental-blue-600 text-white hover:bg-rental-blue-700 transition-colors flex-shrink-0 touch-manipulation"
              onClick={handleViewDetails}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-[160px] xs:min-h-[180px] w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md touch-manipulation"
      onClick={handleCardClick}
    >
      <div className="relative h-[180px] xs:h-[200px] sm:h-[200px] md:h-[180px] w-full overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-0.5 sm:gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 md:p-3">
          <div className="flex flex-col gap-0.5 sm:gap-1 rounded-md bg-black/40 px-2 py-1.5 sm:py-2 md:px-1.5 md:py-1">
            <h3 className="font-outfit text-sm sm:text-base md:text-lg font-semibold leading-snug text-white line-clamp-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] min-w-0">
              {title}
            </h3>
            {location && (
              <p
                className="flex items-center gap-1 font-outfit text-xs sm:text-sm md:text-lg font-normal text-white/90 line-clamp-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] min-w-0"
                title={location}
              >
                <FiMapPin className="flex-shrink-0 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 text-white/80" aria-hidden />
                <span className="truncate">{location}</span>
              </p>
            )}
            <p className="m-0 mt-0.5 sm:mt-1 font-outfit text-base sm:text-lg md:text-xl font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
              {price}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimplePropertyCard
