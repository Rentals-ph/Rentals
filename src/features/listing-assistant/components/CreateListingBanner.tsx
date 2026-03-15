'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { FiPlus, FiArrowRight } from 'react-icons/fi'
import { ASSETS } from '@/shared/utils/assets'

const BANNER_BACKGROUNDS: string[] = [
  ASSETS.BG_HERO_LANDING,
  ASSETS.BG_CONTACT_US,
  ASSETS.BG_TESTIMONIALS,
  ASSETS.BG_LOGIN,
  ASSETS.BG_BLOG,
  ASSETS.BG_NEWS,
  ASSETS.BG_CONTACT_HORIZONTAL,
  ASSETS.BG_CONTACT_VERTICAL,
].filter(Boolean)

export interface CreateListingBannerProps {
  /** Link for the "Get Started" button */
  createListingHref: string
  /** Optional title (default: "Create New Listing") */
  title?: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Optional background image URL (e.g. from ASSETS) for overlay on gradient. If not set, uses same photo as agent dashboard. */
  backgroundImage?: string
  /** Optional className for the wrapper */
  className?: string
}

const DEFAULT_TITLE = 'Create New Listing'
const DEFAULT_SUBTITLE = 'Add a new property to your portfolio and reach thousands of potential tenants.'

export function CreateListingBanner({
  createListingHref,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  backgroundImage: backgroundImageProp,
  className = '',
}: CreateListingBannerProps) {
  const backgroundImage = useMemo(() => {
    if (backgroundImageProp) return backgroundImageProp
    if (BANNER_BACKGROUNDS.length === 0) return undefined
    return BANNER_BACKGROUNDS[Math.floor(Math.random() * BANNER_BACKGROUNDS.length)]
  }, [backgroundImageProp])

  return (
    <div className={`mb-6 ${className}`}>
      <div
        className="p-6 md:p-8 shadow-lg text-white overflow-hidden rounded-xl relative bg-gradient-to-r from-blue-600 to-blue-700"
        style={{
          ...(backgroundImage && {
            backgroundImage: `linear-gradient(to right, rgba(37, 99, 235, 0.85), rgba(29, 78, 216, 0.85)), url(${backgroundImage})`,
          }),
          ...(backgroundImage && {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }),
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.25),0_0_1px_rgba(0,0,0,0.4)]">
              <FiPlus className="text-white text-2xl md:text-3xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-1 text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35), 0 0 12px rgba(0,0,0,0.2)' }}>
                {title}
              </h2>
              <p className="text-blue-100 text-sm md:text-base" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.2)' }}>
                {subtitle}
              </p>
            </div>
          </div>
          <Link
            href={createListingHref}
            className="px-6 md:px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.25)] whitespace-nowrap"
          >
            Get Started
            <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  )
}
