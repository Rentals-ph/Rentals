'use client'

import { useRouter } from 'next/navigation'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'

interface AgentCardProps {
  id: number
  name: string
  role: string
  location: string
  listings?: number
  email?: string
  phone?: string
  whatsapp?: string
  image?: string | null
  companyImage?: string | null
  companyName?: string | null
  description?: string | null
  viewMode?: 'grid' | 'list'
  /** URL path to navigate to (e.g., '/agents/123' or '/rent-managers/123'). Defaults to '/agents/{id}' */
  linkUrl?: string
  /** Show contact info buttons (email, whatsapp) - defaults to true if email or whatsapp is provided */
  showContactInfo?: boolean
  /** Show listings count - defaults to true if listings is provided */
  showListings?: boolean
  /** Show company image section (with placeholder if no image) - defaults to true */
  showCompanyImage?: boolean
  /** Show View Details button - defaults to true */
  showCTA?: boolean
  /** CTA button text */
  ctaText?: string
}

const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

const getAgentImageUrl = (imagePath: string | null | undefined, agentId?: number): string => {
  return resolveAgentAvatar(imagePath, agentId)
}

/** Normalize phone/whatsapp for wa.me: digits only, ensure PH country code 63 */
const toWhatsAppHref = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  const withCountry = digits.startsWith('63') ? digits : digits.startsWith('0') ? '63' + digits.slice(1) : '63' + digits
  return `https://wa.me/${withCountry}`
}

export default function AgentCard({
  id,
  name,
  role,
  location,
  listings,
  email,
  phone,
  whatsapp,
  image,
  companyImage,
  companyName,
  description,
  viewMode = 'grid',
  linkUrl,
  showContactInfo = !!(email || whatsapp),
  showListings = listings !== undefined,
  showCompanyImage = true,
  showCTA = true,
  ctaText = 'View Details',
}: AgentCardProps) {
  const router = useRouter()
  const defaultLinkUrl = `/agents/${id}`
  const finalLinkUrl = linkUrl || defaultLinkUrl

  const handleCardClick = () => {
    router.push(finalLinkUrl)
  }

  if (viewMode === 'list') {
    return (
      <div
        className="flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-200 shadow-[0_6px_18px_rgba(15,23,42,0.07)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all cursor-pointer"
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
        tabIndex={0}
        role="button"
      >
        <div className="w-full sm:w-48 flex-shrink-0">
          <div className="relative w-full aspect-square overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
            <img
              src={getAgentImageUrl(image, id)}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center text-white font-bold bg-rental-blue-600"
              style={{
                display: image ? 'none' : 'flex',
                fontSize: 'clamp(20px, 5vw, 28px)',
              }}
            >
              <span>{getInitials(name)}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3
                className="font-bold truncate flex-1"
                style={{
                  fontSize: 'clamp(16px, 4vw, 20px)',
                  color: '#374151',
                }}
              >
                {name}
              </h3>
              {showListings && listings !== undefined && (
                <span
                  className="font-medium flex-shrink-0 ml-2"
                  style={{
                    fontSize: 'clamp(12px, 3vw, 16px)',
                    color: '#2563EB',
                  }}
                >
                  {listings} Listings
                </span>
              )}
            </div>
            <p
              className="mb-2"
              style={{
                fontSize: 'clamp(12px, 3vw, 14px)',
                color: '#2563EB',
              }}
            >
              {role}
            </p>
            {showContactInfo && (email || whatsapp) && (
              <div className="flex items-center gap-2 mb-2">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-[12px] py-[4px] rounded-[5px] border border-[#205ED7] text-[#205ED7] text-[9px] font-medium leading-[1.26] hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Email
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={toWhatsAppHref(whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-[11.02px] py-[4.13px] rounded-[5px] border border-[#22C55E] text-[#22C55E] text-[9px] font-medium leading-[1.26] hover:bg-green-50 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
          {showCTA && (
            <button
              className="sm:w-auto w-full text-white font-bold flex items-center justify-center gap-2 transition-colors duration-200"
              style={{
                backgroundColor: '#1D4ED8',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: 'clamp(12px, 3vw, 14px)',
              }}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleCardClick()
              }}
            >
              <span>{ctaText || 'View Details'}</span>
              <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-[0_6px_18px_rgba(15,23,42,0.07)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all overflow-hidden flex flex-col min-w-0 cursor-pointer"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      tabIndex={0}
      role="button"
    >
      {/* Card image */}
      <div className="w-full pt-0 pb-4">
        <div
          className="relative overflow-hidden flex-shrink-0 w-full aspect-[4/4] rounded-t-2xl"
          style={{
            backgroundColor: 'rgb(255, 255, 255)',
          }}
        >
          <img
            src={getAgentImageUrl(image, id)}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center text-white font-bold bg-rental-blue-600"
            style={{
              display: image ? 'none' : 'flex',
              fontSize: 'clamp(20px, 5vw, 28px)',
            }}
          >
            <span>{getInitials(name)}</span>
          </div>
          {/* Listings badge - top left */}
          {showListings && listings !== undefined && (
            <div className="absolute top-[8px] left-[8px]">
              <div className="bg-[#266FFD] rounded-[5px] px-[12px] py-[6px]">
                <span className="text-white text-[11px] font-semibold leading-[1.26]">
                  {listings} Listings
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="px-3 sm:px-8 pb-3 sm:pb-4 flex-1 flex flex-col">
        {/* Name Row with Company Image - sharing the same row */}
        <div className="flex items-center justify-between mb-1 gap-2">
          <h3
            className="font-bold truncate flex-1"
            style={{
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              color: '#2563EB',
            }}
          >
            {name}
          </h3>
          {/* Company Image - on the same row as name */}
          {showCompanyImage && (
            <div className="relative w-[86.76px] h-[50px] rounded-[5px] bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {companyImage ? (
                <>
                  <img
                    src={companyImage}
                    alt="Company"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                      if (placeholder) {
                        placeholder.style.display = 'flex'
                      }
                    }}
                  />
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center hidden">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-400">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 3v18" />
                    </svg>
                  </div>
                </>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 3v18" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Company Name - below agent name */}
        {companyName && (
          <p
            className="mb-2 text-black"
            style={{
              fontSize: 'clamp(11px, 2.5vw, 13px)',
            }}
          >
            {companyName}
          </p>
        )}

        {/* Description - can be blank */}
        {description && (
          <p
            className="mb-3 sm:mb-4 text-gray-600"
            style={{
              fontSize: 'clamp(11px, 2.5vw, 13px)',
              lineHeight: '1.5',
            }}
          >
            {description}
          </p>
        )}

        {/* Bottom Row: View Details, Email, WhatsApp buttons */}
        <div className="flex items-center gap-2 mt-auto">
          {/* View Details Button - left, wider */}
          {showCTA && (
            <button
              className="flex-1 text-white font-bold flex items-center justify-center gap-2 transition-colors duration-200"
              style={{
                backgroundColor: '#1D4ED8',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: 'clamp(12px, 3vw, 14px)',
              }}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleCardClick()
              }}
            >
              <span>{ctaText}</span>
              <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {/* Email Button */}
          {showContactInfo && email && (
            <a
              href={`mailto:${email}`}
              onClick={(e) => e.stopPropagation()}
              className="px-[12px] py-[4px] rounded-[5px] border border-[#205ED7] text-[#205ED7] text-[9px] font-medium leading-[1.26] hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Email
            </a>
          )}
          {/* WhatsApp Button */}
          {showContactInfo && whatsapp && (
            <a
              href={toWhatsAppHref(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-[11.02px] py-[4.13px] rounded-[5px] border border-[#22C55E] text-[#22C55E] text-[9px] font-medium leading-[1.26] hover:bg-green-50 transition-colors whitespace-nowrap flex-shrink-0"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

