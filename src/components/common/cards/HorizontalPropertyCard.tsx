'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ASSETS } from '@/utils/assets'
import { FiChevronLeft, FiChevronRight, FiMail, FiMapPin } from 'react-icons/fi'
import SharePopup, { type SharePlatform } from '../misc/SharePopup'

interface HorizontalPropertyCardProps {
  id?: number | string
  propertyType?: string
  date?: string
  price?: string
  title?: string
  image?: string
  images?: string[]
  rentManagerName?: string
  rentManagerRole?: string
  rentManagerImage?: string
  rentManagerEmail?: string
  rentManagerWhatsApp?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  propertySize?: string
  location?: string
  city?: string | null
  streetAddress?: string | null
  stateProvince?: string | null
}

function HorizontalPropertyCard({
  id,
  propertyType = 'Commercial Spaces',
  date = 'Sat 05, 2024',
  price = '₱1,200/Month',
  title = 'Azure Residences - 2BR Corner Suite',
  image = ASSETS.PLACEHOLDER_PROPERTY_MAIN,
  images: imagesProp,
  rentManagerName = 'Rental.Ph Official',
  rentManagerRole = 'Rent Manager',
  rentManagerImage,
  rentManagerEmail,
  rentManagerWhatsApp,
  bedrooms = 4,
  bathrooms = 2,
  parking: _parking = 2,
  propertySize = '24 sqm',
  location,
  city,
  streetAddress,
  stateProvince,
}: HorizontalPropertyCardProps) {
  const locationLine = [streetAddress, city, stateProvince].filter(Boolean).join(', ') || location
  const fullAddress = locationLine
  const router = useRouter()
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [imageHovered, setImageHovered] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const displayImages = imagesProp?.length ? imagesProp : [image]
  const currentImage = displayImages[currentImageIndex] ?? image
  const hasMultipleImages = displayImages.length > 1

  const HOVER_DELAY_MS = 1500

  const clearHoverTimers = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (hoverIntervalRef.current) {
      clearInterval(hoverIntervalRef.current)
      hoverIntervalRef.current = null
    }
  }

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((i) => (i - 1 + displayImages.length) % displayImages.length)
  }
  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentImageIndex((i) => (i + 1) % displayImages.length)
  }

  const handleImageAreaMouseEnter = () => {
    setImageHovered(true)
    if (!hasMultipleImages) return
    clearHoverTimers()
    hoverTimeoutRef.current = setTimeout(() => {
      hoverTimeoutRef.current = null
      goNext()
      hoverIntervalRef.current = setInterval(goNext, HOVER_DELAY_MS)
    }, HOVER_DELAY_MS)
  }

  const handleImageAreaMouseLeave = () => {
    setImageHovered(false)
    clearHoverTimers()
  }

  useEffect(() => {
    return () => clearHoverTimers()
  }, [])

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('svg')) {
      return
    }
    if (id) {
      router.push(`/property/${id}`)
    }
  }

  const handleShare = (platform: SharePlatform) => {
    const propertyUrl = id ? `${window.location.origin}/property/${id}` : window.location.href
      const shareText = `${title}${locationLine ? `, ${locationLine}` : ''} - ${price}`
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`, '_blank')
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${propertyUrl}`)}`, '_blank')
        break
      case 'gmail':
        window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(propertyUrl)}`, '_blank')
        break
      default:
        break
    }
  }

  return (
    <article
      onClick={handleCardClick}
      style={{ cursor: id ? 'pointer' : 'default',
        border: '1px solid #E5E7EB',
      }}
      className="w-full bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col sm:flex-row items-stretch shadow-sm hover:shadow-md transition-all duration-200 min-h-[280px] sm:min-h-[350px] max-h-none sm:max-h-[350px]"
    >
      {/* Left: Property image with hover arrows */}
      <div
        className="relative w-full sm:w-[45%] md:w-[50%] min-h-[200px] xs:min-h-[220px] sm:min-h-0 sm:flex-shrink-0 overflow-hidden rounded-t-xl sm:rounded-l-2xl sm:rounded-tr-none bg-gray-100"
        onMouseEnter={handleImageAreaMouseEnter}
        onMouseLeave={handleImageAreaMouseLeave}
      >
        <div
          className="flex h-full min-h-[180px] xs:min-h-[200px] sm:min-h-0 transition-transform duration-300 ease-out"
          style={{
            width: `${displayImages.length * 100}%`,
            transform: `translateX(-${currentImageIndex * (100 / displayImages.length)}%)`,
          }}
        >
          {displayImages.map((src, i) => (
            <div key={i} className="flex-shrink-0 h-full" style={{ width: `${100 / displayImages.length}%` }}>
              <img
                src={src}
                alt={`${title} ${i + 1}`}
                className="w-full h-full min-h-[180px] xs:min-h-[200px] sm:min-h-0 object-cover object-center"
                onError={(e) => {
                  e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                }}
              />
            </div>
          ))}
        </div>
        {hasMultipleImages && imageHovered && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-all z-10 touch-manipulation"
              aria-label="Previous image"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-all z-10 touch-manipulation"
              aria-label="Next image"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Right: Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 md:p-6 gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
        <div className="flex justify-between items-start gap-2">
          <span className="text-blue-600 text-[10px] sm:text-xs font-semibold uppercase tracking-wide truncate">{propertyType}</span>
          <span className="text-gray-400 text-[10px] sm:text-xs flex-shrink-0">{date}</span>
        </div>

        <p className="text-blue-600 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{price}</p>
        <h3 className="text-gray-900 text-base sm:text-lg font-semibold leading-snug line-clamp-2">
          {title}
        </h3>
        {locationLine ? (
          <div
            className="flex items-center gap-1.5 text-gray-500 font-normal min-w-0"
            title={fullAddress}
          >
            <FiMapPin className="w-4 h-4 flex-shrink-0 text-gray-400" aria-hidden />
            <span className="truncate" title={fullAddress}>{locationLine}</span>
          </div>
        ) : null}

        {/* Bed, bath, size */}
        <div className="flex items-center gap-2 sm:gap-4 text-gray-600 text-xs sm:text-sm flex-wrap">
          <span className="flex items-center gap-1 sm:gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0">
              <rect x="3" y="10" width="18" height="7" rx="2" />
              <rect x="7" y="7" width="4" height="3" rx="1" />
              <rect x="13" y="7" width="4" height="3" rx="1" />
              <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
            </svg>
            {bedrooms}
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <rect x="3" y="10" width="18" height="8" rx="2" />
              <rect x="5" y="18" width="2" height="2" rx="1" />
              <rect x="17" y="18" width="2" height="2" rx="1" />
              <path d="M3 18h18" />
            </svg>
            {bathrooms}
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <rect x="2" y="17" width="20" height="4" rx="1" />
              <rect x="2" y="3" width="20" height="4" rx="1" />
              <rect x="2" y="10" width="20" height="4" rx="1" />
            </svg>
            {propertySize}
          </span>
        </div>

        {/* Agent strip */}
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-100">
          <img
            src={rentManagerImage || ASSETS.PLACEHOLDER_PROFILE}
            alt={rentManagerName}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
            onError={(e) => {
              e.currentTarget.src = ASSETS.PLACEHOLDER_PROFILE
            }}
          />
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0">
            <p className="text-blue-600 text-xs sm:text-sm font-semibold truncate m-0">{rentManagerName}</p>
            <p className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-wide m-0 truncate">{rentManagerRole}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Small width: icon-only buttons */}
            <div className="flex items-center gap-1.5 md:hidden">
              {rentManagerEmail && (
                <a
                  href={`mailto:${rentManagerEmail}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
                  aria-label="Email"
                >
                  <FiMail className="w-4 h-4" />
                </a>
              )}
              {rentManagerWhatsApp && (
                <a
                  href={`https://wa.me/${rentManagerWhatsApp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              )}
              {!rentManagerEmail && !rentManagerWhatsApp && (
                <>
                  <a href="#" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200" aria-label="Email">
                    <FiMail className="w-4 h-4" />
                  </a>
                  <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200" aria-label="WhatsApp">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                </>
              )}
            </div>

            {/* Larger width: text labels instead of icons */}
            <div className="hidden md:flex items-center gap-2">
              {rentManagerEmail && (
                <a
                  href={`mailto:${rentManagerEmail}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  Email
                </a>
              )}
              {rentManagerWhatsApp && (
                <a
                  href={`https://wa.me/${rentManagerWhatsApp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors"
                >
                  WhatsApp
                </a>
              )}
              {!rentManagerEmail && !rentManagerWhatsApp && (
                <>
                  <a
                    href="#"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    Email
                  </a>
                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-auto pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (id) router.push(`/property/${id}`)
            }}
            className="flex-1 min-h-[44px] py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition-colors touch-manipulation"
          >
            Details
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg border border-gray-200 bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors touch-manipulation"
            style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#E5E7EB' }}
            aria-label="Add to favorites"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowSharePopup(!showSharePopup)
              }}
              className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
              style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#E5E7EB' }}
              aria-label="Share"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" />
              </svg>
            </button>
            <SharePopup
              isOpen={showSharePopup}
              onClose={() => setShowSharePopup(false)}
              onShare={handleShare}
              position="top"
              align="right"
            />
          </div>
        </div>
      </div>
    </article>
  )
}

export default HorizontalPropertyCard
