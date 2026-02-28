'use client'

import { useRouter } from 'next/navigation'
import { FiMapPin } from 'react-icons/fi'
import { ASSETS } from '@/utils/assets'

interface SimplePropertyCardProps {
  id?: number | string
  title?: string
  location?: string
  price?: string
  image?: string
}

function SimplePropertyCard({
  id,
  title = 'Property Title',
  location,
  price = '₱0',
  image = ASSETS.PLACEHOLDER_PROPERTY_MAIN,
}: SimplePropertyCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    if (id) {
      router.push(`/property/${id}`)
    }
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
