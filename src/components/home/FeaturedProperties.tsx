'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SimpleVerticalPropertyCard } from '@/components/common'
import FadeInOnView from '@/components/common/FadeInOnView'
import { VerticalPropertyCardSkeleton } from '../common/VerticalPropertyCardSkeleton'
import { propertiesApi } from '../../api'
import type { Property } from '../../types'
import type { PaginatedResponse } from '../../api/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'

const FeaturedProperties = () => {
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const propertyCarouselRef = useRef<HTMLDivElement>(null)
  const isPausedRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [browseProperties, setBrowseProperties] = useState<Property[]>([])
  const [citiesFromAllProperties, setCitiesFromAllProperties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [browseLoading, setBrowseLoading] = useState(false)

  // Only include city names that are 1-2 words (exclude long address-like strings)
  const isShortCityName = (s: string) => s.trim().split(/\s+/).length <= 2

  // Derive location options from both featured and all properties (city only), limited to 1-2 word names
  const locations = (() => {
    const set = new Set<string>()
    featuredProperties.forEach((p) => {
      const city = p.city?.trim()
      if (city && isShortCityName(city)) set.add(city)
    })
    citiesFromAllProperties.forEach((city) => {
      const c = city?.trim()
      if (c && isShortCityName(c)) set.add(c)
    })
    return ['All Locations', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  })()

  // Reset selection only if the selected city is no longer in the locations list (e.g. after data change)
  useEffect(() => {
    if (selectedLocation === 'All Locations') return
    const set = new Set<string>()
    featuredProperties.forEach((p) => {
      const city = p.city?.trim()
      if (city && isShortCityName(city)) set.add(city)
    })
    citiesFromAllProperties.forEach((city) => {
      const c = city?.trim()
      if (c && isShortCityName(c)) set.add(c)
    })
    const locList = ['All Locations', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
    if (!locList.includes(selectedLocation)) setSelectedLocation('All Locations')
  }, [featuredProperties, citiesFromAllProperties, selectedLocation])

  // Fetch featured properties
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const data = await propertiesApi.getFeatured()
        setFeaturedProperties(data)
      } catch (error) {
        console.error('Error fetching featured properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProperties()
  }, [])

  // Fetch first page of all properties to get unique cities for subcategory (so Manila, Cebu, etc. all appear)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const dataResponse = await propertiesApi.getAll({ per_page: 100 })
        const list: Property[] = Array.isArray(dataResponse)
          ? dataResponse
          : (dataResponse as PaginatedResponse<Property>).data || []
        const cities = list
          .map((p) => p.city?.trim())
          .filter((c): c is string => !!c)
        setCitiesFromAllProperties([...new Set(cities)])
      } catch (error) {
        console.error('Error fetching cities for subcategory:', error)
      }
    }
    fetchCities()
  }, [])

  // Fetch properties by location when a city is selected (same API as properties page)
  useEffect(() => {
    const fetchBrowseProperties = async () => {
      if (selectedLocation === 'All Locations') {
        setBrowseProperties([])
        return
      }
      setBrowseLoading(true)
      try {
        const params: { location?: string } = { location: selectedLocation }
        const dataResponse = await propertiesApi.getAll(params)
        const data: Property[] = Array.isArray(dataResponse)
          ? dataResponse
          : (dataResponse as PaginatedResponse<Property>).data || []
        setBrowseProperties(data.slice(0, 12))
      } catch (error) {
        console.error('Error fetching browse properties:', error)
        setBrowseProperties([])
      } finally {
        setBrowseLoading(false)
      }
    }

    fetchBrowseProperties()
  }, [selectedLocation])

  // Helper function to format price
  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString('en-US')}`
  }

  // Helper function to format price type
  const formatPriceType = (priceType: string | null | undefined): string | undefined => {
    if (!priceType) return undefined
    // Capitalize first letter and make rest lowercase for consistency
    return priceType.charAt(0).toUpperCase() + priceType.slice(1).toLowerCase()
  }

  // Helper function to format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Date not available'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Helper function to get rent manager role
  const getRentManagerRole = (isOfficial: boolean | undefined): string => {
    return isOfficial ? 'Rent Manager' : 'Property Specialist'
  }

  // Helper function to get image URL
  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.PLACEHOLDER_PROPERTY_MAIN
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.startsWith('/') ? image.slice(1) : image}`
    }
    return image
  }

  // When "All Locations": show featured. When a city is selected: show properties in that city from API (same as properties page)
  const carouselProperties =
    selectedLocation === 'All Locations' ? featuredProperties : browseProperties

  // Infinite loop: 1 property = show once (no duplicate). 2–5 = 2 sets. 6+ = 4 sets. Auto-scroll when 2+.
  const setsForLoop = carouselProperties.length >= 6 ? 4 : carouselProperties.length >= 2 ? 2 : 1
  const cardsPerSet = Math.min(6, carouselProperties.length)
  const shouldAutoScroll = carouselProperties.length >= 2

  // Infinite slide to the left: auto-scroll when not hovered; reset scroll to 0 after one set width for seamless loop
  useEffect(() => {
    const carousel = propertyCarouselRef.current
    if (!carousel || loading || carouselProperties.length === 0 || !shouldAutoScroll) return

    const scrollSpeed = 0.8 // pixels per frame (smooth slow scroll)
    let scrollAccumulator = 0
    let animationFrameId: number | null = null
    let isRunning = true

    const scroll = () => {
      if (!isRunning || !carousel) return
      // Only scroll when carousel is not hovered (read current value from ref so we don't restart effect on hover)
      if (!isPausedRef.current) {
        const firstSlot = carousel.querySelector('.featured-property-card-slot') as HTMLElement
        if (firstSlot) {
          const cardWidth = firstSlot.offsetWidth
          const computed = window.getComputedStyle(carousel)
          const gapPx = parseFloat(computed.gap) || parseFloat(computed.columnGap) || 20
          const itemWidth = cardWidth + gapPx
          const resetPoint = itemWidth * cardsPerSet

          scrollAccumulator += scrollSpeed
          const step = Math.floor(scrollAccumulator)
          scrollAccumulator -= step
          if (step > 0) {
            carousel.scrollLeft += step
          }
          // Seamless infinite loop: jump back to start once we've scrolled one full set
          if (carousel.scrollLeft >= resetPoint) {
            carousel.scrollLeft = 0
          }
        }
      }

      animationFrameId = requestAnimationFrame(scroll)
    }

    const timeoutId = setTimeout(() => {
      if (carousel && carousel.querySelector('.featured-property-card-slot')) {
        carousel.offsetHeight
        animationFrameId = requestAnimationFrame(scroll)
      }
    }, 300)

    return () => {
      isRunning = false
      clearTimeout(timeoutId)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [loading, carouselProperties.length, shouldAutoScroll, cardsPerSet])

  return (
    <section
      id="properties"
      className="border-t-0 relative min-h-[50vh] sm:min-h-[60vh] flex px-3 xs:px-4 sm:px-6 md:px-10 lg:px-[150px] flex-col justify-center py-6 sm:py-12 pb-4 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 before:to-transparent after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-gray-200 after:to-transparent"
    >
      <div className="w-full">
        {/* Header: title + subtitle; on mobile stack with View More below, on sm+ link aligned right */}
        <FadeInOnView
          className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8 pb-4"
          as="div"
        >
          <div className="text-left px-0 xs:px-2 min-w-0 flex-1 max-w-xl">
            <h2 className="text-gray-900 font-outfit text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight m-0 mb-2">
              Featured Properties
            </h2>
            <p className="text-gray-600 font-outfit text-sm sm:text-base md:text-lg leading-relaxed mt-1 sm:mt-2 mb-0">
              Handpicked properties from our verified agents
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full border-2 border-rental-blue-500 text-rental-blue-600 font-outfit text-sm sm:text-base font-semibold bg-white hover:bg-blue-50 transition-colors touch-manipulation"
            >
              View More Properties
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M7 4L13 10L7 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </FadeInOnView>
      </div>

      {/* Location chips: horizontal scroll on mobile when many, wrap on larger screens */}
      <div className="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-3 relative">
        <div className="flex items-center justify-between gap-2 px-1 sm:px-0">
          <p className="text-gray-700 font-outfit text-xs sm:text-sm md:text-base font-medium m-0">
            Browse featured homes by location
          </p>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400 font-outfit">
            Swipe to explore
          </span>
        </div>
        <div
          className="subcategory-row flex items-center gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden flex-nowrap sm:flex-wrap justify-start sm:justify-start p-1.5 sm:p-2 rounded-full sm:rounded-2xl bg-white/80 shadow-[0_1px_4px_rgba(148,163,184,0.25)] w-auto sm:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              className={`subcategory-chip flex-shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-manipulation min-h-[36px] sm:min-h-[40px] ${
                selectedLocation === loc
                  ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]'
                  : 'bg-transparent text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
              onClick={() => setSelectedLocation(loc)}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Carousel: responsive card widths; touch-friendly scroll on mobile */}
      <div className="relative w-full mt-4 sm:mt-6 overflow-hidden -mx-3 xs:-mx-4 sm:mx-0 px-2 sm:px-0">
        <div
          className="flex gap-2 sm:gap-5 overflow-x-auto overflow-y-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2 sm:pb-3 snap-x snap-mandatory touch-pan-x"
          ref={propertyCarouselRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          {loading || (selectedLocation !== 'All Locations' && browseLoading) ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="featured-property-card-slot flex-shrink-0 w-[260px] min-w-[260px] xs:w-[280px] xs:min-w-[280px] sm:w-[360px] sm:min-w-[360px] md:w-[420px] md:min-w-[420px] mx-0.5 sm:mx-1 snap-start"
              >
                <VerticalPropertyCardSkeleton />
              </div>
            ))
          ) : carouselProperties.length > 0 ? (
            // When 6+ properties: render 4 sets for seamless infinite loop; otherwise show each property once (no duplication)
            Array.from({ length: setsForLoop }).map((_, setIndex) => (
              carouselProperties.slice(0, 6).map((property) => {
                const propertySize = property.area 
                  ? `${property.area} sqft` 
                  : `${(property.bedrooms * 15 + property.bathrooms * 5)} sqft`
                
                const mainImage = property.image_url || property.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                const images = (property.images_url && property.images_url.length > 0)
                  ? [mainImage, ...(property.images_url || []).filter((u): u is string => !!u && u !== mainImage)]
                  : undefined
                const agentImage = property.agent
                  ? resolveAgentAvatar(
                      (property.agent as any).image || (property.agent as any).avatar || (property.agent as any).profile_image,
                      property.agent.id
                    )
                  : undefined
                return (
                  <div
                    key={`property-${setIndex}-${property.id}`}
                    className="featured-property-card-slot flex-shrink-0 w-[260px] min-w-[260px] xs:w-[280px] xs:min-w-[280px] sm:w-[360px] sm:min-w-[360px] md:w-[420px] md:min-w-[420px] mx-0.5 sm:mx-1 snap-start"
                  >
                    <SimpleVerticalPropertyCard
                      id={property.id}
                      propertyType={property.type}
                      priceType={formatPriceType(property.price_type)}
                      price={formatPrice(property.price)}
                      title={property.title}
                      image={mainImage}
                      bedrooms={property.bedrooms}
                      bathrooms={property.bathrooms}
                      parking={0}
                      propertySize={propertySize}
                      location={property.location}
                      city={property.city}
                      streetAddress={property.street_address}
                      stateProvince={property.state_province}
                    />
                  </div>
                )
              })
            ))
          ) : (
            <div className="p-8 text-center w-full min-w-0">
              {selectedLocation === 'All Locations' ? 'No featured properties available' : `No properties in ${selectedLocation}`}
            </div>
          )}
        </div>
      </div>

      {/* Browse Properties by Location Section */}
      
    </section>
  )
}

export default FeaturedProperties
