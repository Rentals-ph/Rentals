'use client'

import { useRouter } from 'next/navigation'
import { FiMapPin } from 'react-icons/fi'
import { ASSETS } from '@/utils/assets'
import { resolvePropertyImage } from '@/shared/utils/image'

interface ModernPropertyCardProps {
  id?: number | string
  propertyType?: string
  date?: string
  price?: string
  title?: string
  image?: string
  rentManagerName?: string
  rentManagerRole?: string
  rentManagerImage?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  propertySize?: string
  location?: string
}

function ModernPropertyCard({
  id,
  propertyType = 'Commercial Spaces',
  date = 'Sat 05, 2024',
  price = '$1200/Month',
  title = 'Azure Residences - 2BR Corner Suite',
  image = ASSETS.PLACEHOLDER_PROPERTY_MAIN,
  rentManagerName = 'Rental.Ph Official',
  rentManagerRole = 'Rent Manager',
  rentManagerImage,
  bedrooms = 4,
  bathrooms = 2,
  parking: _parking = 2,
  propertySize = '24 sqft',
  location,
}: ModernPropertyCardProps) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('svg')) {
      return
    }
    if (id) {
      router.push(`/property/${id}`)
    }
  }

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.08),0px_1px_4px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1.5 hover:shadow-[0px_12px_32px_rgba(0,0,0,0.12),0px_4px_8px_rgba(0,0,0,0.08)]"
      onClick={handleCardClick}
      style={{ cursor: id ? 'pointer' : 'default' }}
    >
      <div className="relative h-[280px] w-full overflow-hidden bg-gray-100 md:h-60 xs:h-[220px]">
        <img
          src={resolvePropertyImage(image, id)}
          alt={title}
          className="h-full w-full object-cover object-center transition-transform duration-400 hover:scale-108"
          onError={(e) => {
            e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
          }}
        />
        <div className="absolute inset-0 flex items-start justify-end bg-gradient-to-b from-black/30 via-transparent to-black/40 p-4 opacity-0 transition-opacity hover:opacity-100">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/95 backdrop-blur-lg transition-all hover:scale-110 hover:bg-white" aria-label="Add to favorites">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
        <div className="absolute left-4 top-4 z-10 rounded-full bg-rental-blue-600/95 px-3.5 py-1.5 font-outfit text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-lg">
          {propertyType}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 md:gap-2.5 md:p-4 xs:p-3.5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-outfit text-3xl font-bold leading-tight tracking-tight text-rental-blue-600 md:text-2xl xs:text-xl">
              {price}
            </span>
            <span className="font-outfit text-xs font-medium text-gray-400">
              {date}
            </span>
          </div>
        </div>

        <h3 className="m-0 min-h-[50px] font-outfit text-lg font-semibold leading-snug text-gray-900 line-clamp-2 md:min-h-[44px] md:text-base xs:min-h-[42px] xs:text-sm">
          {title}
        </h3>
        {location ? (
          <div
            className="flex items-center gap-1.5 font-outfit text-sm text-gray-500 min-w-0 md:text-xs"
            title={location}
          >
            <FiMapPin className="h-4 w-4 flex-shrink-0 text-gray-400 md:h-3.5 md:w-3.5" aria-hidden />
            <span className="truncate" title={location}>{location}</span>
          </div>
        ) : null}

        <div className="flex gap-5 border-y border-gray-100 py-3 md:gap-4 md:py-2.5 xs:gap-3">
          <div className="flex items-center gap-2 font-outfit text-sm font-semibold text-gray-700 md:text-xs md:gap-1.5 xs:text-xs">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 flex-shrink-0 text-gray-500 md:h-4 md:w-4">
              <path d="M3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{bedrooms}</span>
          </div>
          <div className="flex items-center gap-2 font-outfit text-sm font-semibold text-gray-700 md:text-xs md:gap-1.5 xs:text-xs">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 flex-shrink-0 text-gray-500 md:h-4 md:w-4">
              <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 6H21C22.1046 6 23 6.89543 23 8V20C23 21.1046 22.1046 22 21 22H3C1.89543 22 1 21.1046 1 20V8C1 6.89543 1.89543 6 3 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{bathrooms}</span>
          </div>
          <div className="flex items-center gap-2 font-outfit text-sm font-semibold text-gray-700 md:text-xs md:gap-1.5 xs:text-xs">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 flex-shrink-0 text-gray-500 md:h-4 md:w-4">
              <path d="M3 3H21V21H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{propertySize}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            <img
              src={rentManagerImage || ASSETS.PLACEHOLDER_PROFILE}
              alt={rentManagerName}
              className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-rental-blue-600 bg-white object-cover"
              onError={(e) => {
                e.currentTarget.src = ASSETS.PLACEHOLDER_PROFILE
              }}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap font-outfit text-xs font-semibold leading-tight text-rental-blue-600">
                {rentManagerName}
              </p>
              <p className="m-0 font-outfit text-xs font-normal uppercase leading-tight tracking-wider text-blue-400">
                {rentManagerRole}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 transition-all hover:-translate-y-0.5 hover:border-rental-blue-600 hover:bg-blue-50" aria-label="Email">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#205ED7" strokeWidth="2" />
                <path d="M3 7L12 13L21 7" stroke="#205ED7" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 transition-all hover:-translate-y-0.5 hover:border-rental-blue-600 hover:bg-blue-50" aria-label="Share">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5">
                <circle cx="18" cy="5" r="3" fill="#205ED7" />
                <circle cx="6" cy="12" r="3" fill="#205ED7" />
                <circle cx="18" cy="19" r="3" fill="#205ED7" />
                <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="#205ED7" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ModernPropertyCard
