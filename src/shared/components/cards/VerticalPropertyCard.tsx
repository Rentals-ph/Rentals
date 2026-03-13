'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ASSETS } from '@/utils/assets'
import { FiMail, FiMapPin } from 'react-icons/fi'
import SharePopup, { type SharePlatform } from '../misc/SharePopup'
import { useSavedProperties } from '@/hooks/useSavedProperties'
import type { Property } from '@/types'

interface VerticalPropertyCardProps {
  id?: number | string
  propertyType?: string
  listingType?: 'for_rent' | 'for_sale' | null
  priceType?: string
  price?: string
  priceUnit?: string
  /** Display string for when the property was listed (e.g. "Jan 5, 2026") */
  dateListed?: string
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
  /** Full location string (fallback when city/street/state not provided) */
  location?: string
  city?: string | null
  streetAddress?: string | null
  stateProvince?: string | null
  /** Full property object for saving functionality */
  property?: Property
}

function VerticalPropertyCard({
  id,
  propertyType = 'Apartment',
  listingType,
  priceType,
  price = '$ 25000.00',
  priceUnit,
  dateListed,
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
  property,
}: VerticalPropertyCardProps) {
  const locationLine = [streetAddress, city, stateProvince].filter(Boolean).join(', ') || location
  const router = useRouter()
  const [showSharePopup, setShowSharePopup] = useState(false)
  const { isSaved, toggleSave } = useSavedProperties()
  
  const propertyId = typeof id === 'number' ? id : (typeof id === 'string' ? parseInt(id, 10) : null)
  const isPropertySaved = propertyId !== null && property ? isSaved(propertyId) : false

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (property && propertyId !== null) {
      toggleSave(property)
    }
  }

  const displayImages = imagesProp?.length ? imagesProp : [image]
  const hasMultipleImages = displayImages.length > 1
  const mainImage = displayImages[0] || image

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
      className="w-full bg-white border border-black/20 rounded-[5px] overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Image Section */}
      <div className="relative w-full h-[210px] sm:h-[230px] lg:h-[260px] xl:h-[280px] overflow-hidden bg-gray-100">
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
          }}
        />
        
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
        {property && propertyId !== null && (
          <button
            type="button"
            onClick={handleHeartClick}
            className="absolute top-[12.99px] right-[12.99px] w-[24.99px] h-[24.99px] rounded-[5px] bg-white flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            aria-label={isPropertySaved ? "Remove from favorites" : "Add to favorites"}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill={isPropertySaved ? "currentColor" : "none"} 
              stroke="currentColor" 
              strokeWidth="2" 
              className={`w-[11px] h-[11px] ${isPropertySaved ? 'text-red-500' : 'text-[#6B7280]'}`}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}

        {/* Location overlay - bottom left */}
        {locationLine && (
          <div className="absolute bottom-[10px] left-[19px] flex items-center gap-[4px]">
            <FiMapPin className="w-[15.99px] h-[15.99px] text-white" aria-hidden />
            <span className="text-white text-[10px] font-semibold leading-[1.26]">{locationLine}</span>
          </div>
        )}

        {/* Image count indicator - bottom right */}
        {hasMultipleImages && (
          <div className="absolute bottom-[10px] right-[19px] flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px] text-white">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            <span className="text-white text-[10px] font-semibold leading-[1.26]">{displayImages.length}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-[19px] sm:p-[20px] lg:p-[22px] gap-[10px]">
        {/* Title with Email, WhatsApp, Share buttons */}
        <div className="flex items-center gap-[4px]">
          <h3 className="text-black text-[10px] sm:text-[11px] lg:text-[12px] font-medium leading-[1.26] line-clamp-1 flex-1 min-w-0">
            {title}
          </h3>
          <div className="flex items-center gap-[4px] flex-shrink-0">
            {rentManagerEmail && (
              <a
                href={`mailto:${rentManagerEmail}`}
                onClick={(e) => e.stopPropagation()}
                className="px-[12px] py-[4px] rounded-[5px] text-[#205ED7] text-[9px] sm:text-[10px] font-medium leading-[1.26] hover:bg-blue-50 transition-colors whitespace-nowrap"
                style={{ border: '1px solid #205ED7' }}
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
                className="px-[11.02px] py-[4.13px] rounded-[5px] text-[#22C55E] text-[9px] sm:text-[10px] font-medium leading-[1.26] hover:bg-green-50 transition-colors whitespace-nowrap"
                style={{ border: '1px solid #22C55E' }}
              >
                WhatsApp
              </a>
            )}
            {!rentManagerEmail && !rentManagerWhatsApp && (
              <>
                <a
                  href="#"
                  onClick={(e) => e.stopPropagation()}
                  className="px-[12px] py-[4px] rounded-[5px] text-[#205ED7] text-[9px] sm:text-[10px] font-medium leading-[1.26] hover:bg-blue-50 transition-colors whitespace-nowrap"
                  style={{ border: '1px solid #205ED7' }}
                >
                  Email
                </a>
                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-[11.02px] py-[4.13px] rounded-[5px] text-[#22C55E] text-[9px] sm:text-[10px] font-medium leading-[1.26] hover:bg-green-50 transition-colors whitespace-nowrap"
                  style={{ border: '1px solid #22C55E' }}
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
                className="w-[14.99px] h-[14.99px] flex items-center justify-center text-[#374151] hover:opacity-80 transition-opacity"
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
          <p className="text-[#387CFF] text-[20px] sm:text-[22px] lg:text-[24px] font-medium leading-[1.26]">{price}</p>
          {listingType === 'for_sale' ? (
            <span className="text-[#22C55E] text-[11px] sm:text-[12px] font-semibold leading-[1.26] uppercase tracking-wide">For Sale</span>
          ) : (
            <span className="text-[#FE8E0A] text-[14px] sm:text-[15px] lg:text-[16px] font-medium leading-[1.26]">
              {priceUnit || (priceType ? `/${priceType}` : '/mo')}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-[#999999] text-[10px] sm:text-[11px] font-medium leading-[1.4] line-clamp-2">
            {description}
          </p>
        )}

        {/* Property details: Bed, Bath, Size */}
      <div className="flex items-center gap-[20px] text-[#374151] text-[10px] sm:text-[11px] font-medium leading-[1.26]">
          <span className="flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[10.99px] flex-shrink-0">
              <rect x="3" y="10" width="18" height="7" rx="2" />
              <rect x="7" y="7" width="4" height="3" rx="1" />
              <rect x="13" y="7" width="4" height="3" rx="1" />
              <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
            </svg>
            {bedrooms}
          </span>
          <span className="flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15.99px] h-[10.99px] flex-shrink-0">
              <rect x="3" y="10" width="18" height="8" rx="2" />
              <rect x="5" y="18" width="2" height="2" rx="1" />
              <rect x="17" y="18" width="2" height="2" rx="1" />
              <path d="M3 18h18" />
            </svg>
            {bathrooms}
          </span>
          <span className="flex items-center gap-[4px]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[16px] h-[10.99px] flex-shrink-0">
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
            className="w-[36.99px] h-[36.99px] rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = ASSETS.PLACEHOLDER_PROFILE
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-black text-[12px] sm:text-[13px] font-medium leading-[1.26] truncate">
              By {rentManagerName}
            </p>
          </div>
          {/* Company image placeholder */}
          <div className="w-[79.88px] h-[46.03px] rounded-[5px] bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
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

export default VerticalPropertyCard
