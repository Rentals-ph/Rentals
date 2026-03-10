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
  priceUnit?: string
  title?: string
  description?: string
  image?: string
  images?: string[]
  rentManagerName?: string
  rentManagerRole?: string
  rentManagerImage?: string
  rentManagerEmail?: string
  rentManagerWhatsApp?: string
  companyImage?: string
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
  propertyType = 'Apartment',
  date = 'Sat 05, 2024',
  price = '$ 25000.00',
  priceUnit = '/monthly',
  title = 'Azure Residences - 2BR Corner Suite',
  description = 'Beautiful corner suite with modern amenities, floor-to-ceiling windows, and stunning city views. Located in the heart of IT Park with easy access to shopping, dining, and transportation....',
  image = ASSETS.PLACEHOLDER_PROPERTY_MAIN,
  images: imagesProp,
  rentManagerName = 'Isaac Locaylocay',
  rentManagerRole = 'Rent Manager',
  rentManagerImage,
  rentManagerEmail,
  rentManagerWhatsApp,
  companyImage,
  bedrooms = 4,
  bathrooms = 2,
  parking: _parking = 2,
  propertySize = '2sqm',
  location,
  city,
  streetAddress,
  stateProvince,
}: HorizontalPropertyCardProps) {
  const locationLine = [streetAddress, city, stateProvince].filter(Boolean).join(', ') || location
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
      style={{ cursor: id ? 'pointer' : 'default' }}
      className="w-full max-w-[726px] bg-white border border-black/20 rounded-[5px] overflow-hidden flex flex-row items-stretch shadow-sm hover:shadow-md transition-all duration-200 h-[222px]"
    >
      {/* Left: Property image */}
      <div
        className="relative w-[304px] h-full flex-shrink-0 overflow-hidden rounded-l-[5px] bg-gray-100"
        onMouseEnter={handleImageAreaMouseEnter}
        onMouseLeave={handleImageAreaMouseLeave}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
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
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Gradient overlay at bottom - fades from black at bottom to transparent at center */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.05) 55%, transparent 60%)',
            filter: 'blur(0.5px)'
          }}
        />
        
        {/* Property type badge - top left */}
        <div className="absolute top-0 left-0 m-0">
          <div className="bg-[#266FFD] rounded-tl-[5px] rounded-br-[5px] px-[18px] py-[7.99px]">
            <span className="text-white text-[10px] font-semibold leading-[1.26] uppercase tracking-wide">
              {propertyType}
            </span>
          </div>
        </div>

        {/* Heart icon - top right */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-[8px] right-[8px] w-[25px] h-[25px] rounded-[5px] bg-white flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          aria-label="Add to favorites"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[11px] h-[11px] text-[#6B7280]">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Location overlay - bottom left */}
        {locationLine && (
          <div className="absolute bottom-[6px] left-[18px] flex items-center gap-[2px]">
            <FiMapPin className="w-[16px] h-[16px] text-white" aria-hidden />
            <span className="text-white text-[10px] font-semibold leading-[1.26]">{locationLine}</span>
          </div>
        )}

        {/* Image count indicator - bottom right */}
        {hasMultipleImages && (
          <div className="absolute bottom-[4px] right-[18px] flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px] text-white">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            <span className="text-white text-[10px] font-semibold leading-[1.26]">{displayImages.length}</span>
          </div>
        )}

        {hasMultipleImages && imageHovered && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-all z-10 touch-manipulation"
              aria-label="Previous image"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-all z-10 touch-manipulation"
              aria-label="Next image"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Right: Content */}
      <div className="flex flex-col flex-1 w-[422px] p-[14px] gap-[4px] min-w-0 overflow-hidden">
        {/* Title with Email, WhatsApp, Share buttons */}
        <div className="flex items-center gap-[4px]">
          <h3 className="text-black text-[9px] font-medium leading-[1.26] line-clamp-1 flex-1 min-w-0">
            {title}
          </h3>
          <div className="flex items-center gap-[4px] flex-shrink-0">
            {rentManagerEmail && (
              <a
                href={`mailto:${rentManagerEmail}`}
                onClick={(e) => e.stopPropagation()}
                className="px-[12px] py-[4px] rounded-[5px] border border-[#205ED7] text-[#205ED7] text-[9px] font-medium leading-[1.26] hover:bg-blue-50 transition-colors whitespace-nowrap"
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
                className="px-[11.02px] py-[4.13px] rounded-[5px] border border-[#22C55E] text-[#22C55E] text-[9px] font-medium leading-[1.26] hover:bg-green-50 transition-colors whitespace-nowrap"
              >
                WhatsApp
              </a>
            )}
            {!rentManagerEmail && !rentManagerWhatsApp && (
              <>
                <a
                  href="#"
                  onClick={(e) => e.stopPropagation()}
                  className="px-[12px] py-[4px] rounded-[5px] border border-[#205ED7] text-[#205ED7] text-[9px] font-medium leading-[1.26] hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  Email
                </a>
                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-[11.02px] py-[4.13px] rounded-[5px] border border-[#22C55E] text-[#22C55E] text-[9px] font-medium leading-[1.26] hover:bg-green-50 transition-colors whitespace-nowrap"
                >
                  WhatsApp
                </a>
              </>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSharePopup(!showSharePopup)
                }}
                className="w-[15px] h-[15px] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="Share"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
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

        {/* Price */}
        <div className="flex items-baseline gap-[6px]">
          <p className="text-[#387CFF] text-[20px] font-medium leading-[1.26]">{price}</p>
          <span className="text-[#FE8E0A] text-[15px] font-medium leading-[1.26]">{priceUnit}</span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-[#999999] text-[9px] font-medium leading-[1.26] line-clamp-3">
            {description}
          </p>
        )}

        {/* Property details: Bed, Bath, Size */}
        <div className="flex items-center gap-[20px] text-[#374151] text-[9px] font-medium leading-[1.26]">
          <span className="flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[11px] flex-shrink-0">
              <rect x="3" y="10" width="18" height="7" rx="2" />
              <rect x="7" y="7" width="4" height="3" rx="1" />
              <rect x="13" y="7" width="4" height="3" rx="1" />
              <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
            </svg>
            {bedrooms}
          </span>
          <span className="flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[11px] flex-shrink-0">
              <rect x="3" y="10" width="18" height="8" rx="2" />
              <rect x="5" y="18" width="2" height="2" rx="1" />
              <rect x="17" y="18" width="2" height="2" rx="1" />
              <path d="M3 18h18" />
            </svg>
            {bathrooms}
          </span>
          <span className="flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[11px] flex-shrink-0">
              <rect x="2" y="17" width="20" height="4" rx="1" />
              <rect x="2" y="3" width="20" height="4" rx="1" />
              <rect x="2" y="10" width="20" height="4" rx="1" />
            </svg>
            <span className="font-semibold">{propertySize}</span>
          </span>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-black/10" />

        {/* Agent section */}
        <div className="flex items-center gap-[8px]">
          <img
            src={rentManagerImage || ASSETS.PLACEHOLDER_PROFILE}
            alt={rentManagerName}
            className="w-[41.47px] h-[41.47px] rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = ASSETS.PLACEHOLDER_PROFILE
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-black text-[11px] font-medium leading-[1.26] truncate">
              By {rentManagerName}
            </p>
          </div>
          {/* Company image placeholder */}
          <div className="w-[86.76px] h-[50px] rounded-[5px] bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {companyImage ? (
              <img
                src={companyImage}
                alt="Company"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const placeholder = target.parentElement?.querySelector('.company-placeholder')
                  if (placeholder) {
                    (placeholder as HTMLElement).style.display = 'flex'
                  }
                }}
              />
            ) : null}
            <div className={`company-placeholder w-full h-full flex items-center justify-center ${companyImage ? 'hidden' : 'flex'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 3v18" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default HorizontalPropertyCard
