'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import VerticalPropertyCard from '../common/VerticalPropertyCard'
import { VerticalPropertyCardSkeleton } from '../common/VerticalPropertyCardSkeleton'
import { propertiesApi } from '../../api'
import type { Property } from '../../types'
import type { PaginatedResponse } from '../../api/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'

const FeaturedProperties = () => {
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const propertyCarouselRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
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

  // Auto-scroll property-carousel with seamless infinite loop (4 sets of 6 cards; reset after 6 so loop is seamless)
  useEffect(() => {
    const carousel = propertyCarouselRef.current
    if (!carousel || loading || carouselProperties.length === 0) return

    const scrollSpeed = 0.8 // pixels per frame (smooth slow scroll)
    let scrollAccumulator = 0
    let animationFrameId: number | null = null
    let isRunning = true

    const scroll = () => {
      if (!isRunning || !carousel) return

      if (!isPaused) {
        const firstSlot = carousel.querySelector('.featured-property-card-slot') as HTMLElement
        if (firstSlot) {
          const cardWidth = firstSlot.offsetWidth
          const computed = window.getComputedStyle(carousel)
          const gapPx = parseFloat(computed.gap) || parseFloat(computed.columnGap) || 20
          const itemWidth = cardWidth + gapPx
          const itemsPerSet = 6 // we render 4 sets of 6 cards; reset after one set for seamless loop
          const resetPoint = itemWidth * itemsPerSet

          scrollAccumulator += scrollSpeed
          const step = Math.floor(scrollAccumulator)
          scrollAccumulator -= step
          if (step > 0) {
            carousel.scrollLeft += step
          }

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
    }, 500)

    return () => {
      isRunning = false
      clearTimeout(timeoutId)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [isPaused, loading, carouselProperties.length])

  return (
    <section
      id="properties"
      className="border-t-0 relative min-h-[50vh] sm:min-h-[60vh] flex px-4 sm:px-6 md:px-10 lg:px-[150px] flex-col justify-center py-8 sm:py-12 pb-4 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 before:to-transparent after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-gray-200 after:to-transparent"
    >
      <div className="w-full">
      <div className="relative flex justify-left items-end mb-4"
      style={{ borderBottom: '2px solid #E5E7EB' }}>
        <div className="text-left px-2">
          <h2 className="font-outfit text-2xl sm:text-4xl md:text-4xl font-bold text-gray-900 m-0 leading-tight tracking-tight">
            Featured Properties
          </h2>
          <p className="text-gray-600 font-outfit text-sm sm:text-base md:text-lg font-light mb-4 sm:mb-5 mt-2">
            Handpicked properties from our verified agents
          </p>
        </div>
      </div>
      </div>

      {/* Location filter row + View More - stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:items-center gap-3 sm:gap-2 mb-2 relative">
        <div className="subcategory-row flex items-center gap-0 flex-wrap justify-center p-1 rounded-lg w-full sm:w-auto" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#E5E7EB' }}>
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              className={`subcategory-chip px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                selectedLocation === loc
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedLocation(loc)}
            >
              {loc}
            </button>
          ))}
        </div>
        <Link
          href="/properties"
          className="order-first sm:order-none sm:absolute sm:right-4 md:right-10 lg:right-[150px] text-rental-blue-500 bg-white font-outfit text-sm sm:text-base font-medium no-underline flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors border-2 border-rental-blue-500 rounded-2xl px-4 py-2 sm:px-5 sm:py-2"
          style={{ border: '2px solid #205ED7' }}
        >
          View More Properties
        </Link>
      </div>

      <div className="relative w-full mt-4 sm:mt-6 overflow-hidden -mx-4 sm:mx-0 px-2 sm:px-0">
        <div 
          className="flex gap-3 sm:gap-5 overflow-x-auto overflow-y-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2 snap-x snap-mandatory"
          ref={propertyCarouselRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ scrollBehavior: 'auto' }}
        >
          {loading || (selectedLocation !== 'All Locations' && browseLoading) ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="featured-property-card-slot flex-shrink-0 w-[280px] min-w-[280px] sm:w-[360px] sm:min-w-[360px] md:w-[420px] md:min-w-[420px] mx-1 snap-start"
              >
                <VerticalPropertyCardSkeleton />
              </div>
            ))
          ) : carouselProperties.length > 0 ? (
            // Render items multiple times for seamless infinite loop; each card in a fixed-width slot so they display properly
            Array.from({ length: 4 }).map((_, setIndex) => (
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
                    className="featured-property-card-slot flex-shrink-0 w-[280px] min-w-[280px] sm:w-[360px] sm:min-w-[360px] md:w-[420px] md:min-w-[420px] mx-1 snap-start"
                  >
                    <VerticalPropertyCard 
                      id={property.id}
                      propertyType={property.type}
                      priceType={formatPriceType(property.price_type)}
                      price={formatPrice(property.price)}
                      title={property.title}
                      image={mainImage}
                      images={images}
                      rentManagerName={property.agent?.first_name && property.agent?.last_name
                        ? `${property.agent.first_name} ${property.agent.last_name}`
                        : property.agent?.full_name
                        || property.rent_manager?.name
                        || 'Rental.Ph Official'}
                      rentManagerRole={property.agent
                        ? getRentManagerRole(property.agent.verified)
                        : getRentManagerRole(property.rent_manager?.is_official)}
                      rentManagerImage={agentImage}
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
