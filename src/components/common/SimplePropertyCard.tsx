'use client'

import { useRouter } from 'next/navigation'
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
      className="min-h-[200px] w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:min-h-[180px]" 
      onClick={handleCardClick}
    >
      <div className="relative h-[220px] w-full overflow-hidden bg-gray-100 md:h-[180px]">
        <img 
          src={image} 
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            // Fallback to default image if the provided image fails to load
            e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-3">
          <div className="flex flex-col gap-1">
            <h3 className="m-0 font-outfit text-base font-semibold leading-snug text-white line-clamp-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] md:text-sm">
              {title}
            </h3>
            {location && (
              <p className="m-0 font-outfit text-sm font-normal leading-snug text-white/90 line-clamp-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] md:text-xs">
                {location}
              </p>
            )}
            <p className="m-0 mt-1 font-outfit text-lg font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.4)] md:text-base">
              {price}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimplePropertyCard
