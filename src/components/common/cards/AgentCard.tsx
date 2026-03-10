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
        className="flex flex-col md:flex-row bg-white rounded-2xl border border-gray-200 shadow-[0_6px_18px_rgba(15,23,42,0.07)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all cursor-pointer overflow-hidden"
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
        {/* Left: Agent photo with listings badge (matches property card look) */}
        <div className="w-full md:w-[290px] lg:w-[320px] flex-shrink-0">
          <div className="relative w-full h-full min-h-[190px] md:h-[220px] lg:h-[240px] overflow-hidden">
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
            {/* Fallback initials when no image */}
            <div
              className="absolute inset-0 flex items-center justify-center text-white font-bold bg-rental-blue-600"
              style={{
                display: image ? 'none' : 'flex',
                fontSize: 'clamp(20px, 5vw, 28px)',
              }}
            >
              <span>{getInitials(name)}</span>
            </div>

            {/* Listings badge in the top-left (blue ribbon) */}
            {showListings && listings !== undefined && (
              <div className="absolute top-0 left-0 m-0 z-10">
                <div
                  className="rounded-tl-[5px] rounded-br-[5px]"
                  style={{
                    backgroundColor: '#266FFD',
                    padding: '7.99px 18px',
                  }}
                >
                  <span
                    className="text-white font-semibold uppercase tracking-wide"
                    style={{
                      fontSize: '10px',
                      lineHeight: '1.26',
                    }}
                  >
                    {listings} Listings
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right: Text content and actions (layout inspired by design screenshot) */}
        <div className="flex-1 px-4 py-4 md:px-6 md:py-5 flex flex-col gap-3 md:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3
                className="font-outfit font-semibold truncate"
                style={{
                  fontSize: 'clamp(18px, 3.6vw, 22px)',
                  color: '#205ED7',
                }}
              >
                {name}
              </h3>
              {companyName && (
                <p
                  className="mt-0.5 font-outfit text-gray-900"
                  style={{
                    fontSize: 'clamp(12px, 2.6vw, 14px)',
                    fontWeight: 500,
                  }}
                >
                  {companyName}
                </p>
              )}
              <p
                className="mt-1 font-outfit text-gray-600 line-clamp-3"
                style={{
                  fontSize: 'clamp(12px, 2.6vw, 13px)',
                }}
              >
                {description ||
                  `${role}${location ? ` • ${location}` : ''}`}
              </p>
            </div>

            {/* Company logo on the far right (like Filipino Homes logo) */}
            {companyImage && (
              <div className="ml-2 flex-shrink-0">
                <div className="w-[88px] h-[40px] md:w-[100px] md:h-[44px] rounded-[5px] bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={companyImage}
                    alt={companyName || 'Company'}
                    className="w-full h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action row: View Details (primary), Email, WhatsApp */}
          <div className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {showCTA && (
              <button
                className="sm:w-auto w-full text-white font-semibold flex items-center justify-center gap-2 transition-colors duration-200"
                style={{
                  backgroundColor: '#205ED7',
                  borderRadius: '8px',
                  padding: '10px 16px',
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

            {showContactInfo && email && (
              <a
                href={`mailto:${email}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-[5px] text-[#205ED7] hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0 flex items-center justify-center"
                style={{
                  padding: '10px 16px',
                  border: '1px solid #205ED7',
                  fontSize: '11px',
                  fontWeight: 500,
                  lineHeight: '1.26',
                }}
              >
                Email
              </a>
            )}
            {showContactInfo && whatsapp && (
              <a
                href={toWhatsAppHref(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-[5px] text-[#22C55E] hover:bg-green-50 transition-colors whitespace-nowrap flex-shrink-0 flex items-center justify-center"
                style={{
                  padding: '10px 16px',
                  border: '1px solid #22C55E',
                  fontSize: '11px',
                  fontWeight: 500,
                  lineHeight: '1.26',
                }}
              >
                WhatsApp
              </a>
            )}
          </div>
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
          
          {/* Listings count badge - top left (like property type badge) */}
          {showListings && listings !== undefined && (
            <div className="absolute top-0 left-0 m-0 z-10">
              <div 
                className="rounded-tl-[5px] rounded-br-[5px]"
                style={{
                  backgroundColor: '#266FFD',
                  padding: '7.99px 18px',
                }}
              >
                <span 
                  className="text-white font-semibold uppercase tracking-wide"
                  style={{
                    fontSize: '10px',
                    lineHeight: '1.26',
                  }}
                >
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

        {/* Description - always show section */}
        {description && (
          <p
            className="mb-3 sm:mb-4 text-gray-600 line-clamp-3"
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
              className="rounded-[5px] text-[#205ED7] hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0 flex items-center justify-center"
              style={{
                padding: '10px 12px',
                border: '1px solid #205ED7',
                fontSize: '9px',
                fontWeight: 500,
                lineHeight: '1.26',
                height: '100%',
              }}
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
              className="rounded-[5px] text-[#22C55E] hover:bg-green-50 transition-colors whitespace-nowrap flex-shrink-0 flex items-center justify-center"
              style={{
                padding: '10px 12px',
                border: '1px solid #22C55E',
                fontSize: '9px',
                fontWeight: 500,
                lineHeight: '1.26',
                height: '100%',
              }}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

