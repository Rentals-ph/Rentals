'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import VerticalPropertyCard from '../common/VerticalPropertyCard'
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
  const [loading, setLoading] = useState(true)

  const locations = [
    'All Locations',
    'Makati City',
    'BGC',
    'Quezon City',
    'Manila',
    'Cebu City',
    'Davao City',
  ]

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

  // Fetch properties for browse section based on location
  useEffect(() => {
    const fetchBrowseProperties = async () => {
      try {
        const params: { location?: string } = {}
        if (selectedLocation !== 'All Locations') {
          params.location = selectedLocation
        }
        const dataResponse = await propertiesApi.getAll(params)
        // Handle both array response and paginated response
        const data: Property[] = Array.isArray(dataResponse)
          ? dataResponse
          : (dataResponse as PaginatedResponse<Property>).data || []
        setBrowseProperties(data.slice(0, 8)) // Limit to 8 for carousel
      } catch (error) {
        console.error('Error fetching browse properties:', error)
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

  // Auto-scroll property-carousel with seamless infinite loop
  useEffect(() => {
    const carousel = propertyCarouselRef.current
    if (!carousel || loading || featuredProperties.length === 0) return

    const scrollSpeed = 1 // pixels per frame
    let animationFrameId: number | null = null
    let isRunning = true

    const scroll = () => {
      if (!isRunning || !carousel) {
        return
      }

      // Only scroll if not paused
      if (!isPaused) {
        const firstSlot = carousel.querySelector('.featured-property-card-slot') as HTMLElement
        if (firstSlot) {
          const cardWidth = firstSlot.offsetWidth
          const gap = 40 // gap-10 = 2.5rem
          const itemWidth = cardWidth + gap
          const totalItems = 6 // one set of cards
          const resetPoint = itemWidth * totalItems

          carousel.scrollLeft += scrollSpeed

          if (carousel.scrollLeft >= resetPoint) {
            carousel.scrollLeft = 0
          }
        }
      }
      
      // Always continue the animation loop (even when paused)
      animationFrameId = requestAnimationFrame(scroll)
    }

    // Start the animation after a delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (carousel) {
        // Force a reflow to ensure scrollWidth is calculated correctly
        carousel.offsetHeight
        animationFrameId = requestAnimationFrame(scroll)
      }
    }, 500)

    return () => {
      isRunning = false
      clearTimeout(timeoutId)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isPaused, loading, featuredProperties.length])

  return (
    <section id="properties" className="bg-gradient-to-b from-[#e8f0ff] to-white border-t-0 relative min-h-[60vh] flex px-6 md:px-10 lg:px-[150px] flex-col justify-center py-12 pb-4 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 before:to-transparent after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-gray-200 after:to-transparent">
      <div className="w-full">
        <div className="flex justify-between items-end mb-4 relative">
          <div>
            <h2 className="font-outfit text-3xl font-bold text-gray-900 m-0 leading-tight tracking-tight">
              Featured Properties
            </h2>
            <p className="text-gray-600 font-outfit text-base font-light mt-2">
              Handpicked properties from our verified agents
            </p>
          </div>

          <Link href="/properties" className="text-rental-blue-600 font-outfit text-base font-medium no-underline flex items-center gap-2 hover:text-rental-orange-500 transition-colors border-2 border-rental-blue-600 rounded-lg px-4 py-2 hover:border-rental-orange-500">
            View More Properties <span>→</span>
          </Link>
        </div>
      </div>

      <div className="relative w-full mt-6 overflow-hidden">
        <div 
          className="flex gap-10 overflow-x-auto overflow-y-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2"
          ref={propertyCarouselRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ scrollBehavior: 'auto' }}
        >
          {loading ? (
            <div className="p-8 text-center w-full min-w-0">Loading properties...</div>
          ) : featuredProperties.length > 0 ? (
            // Render items multiple times for seamless infinite loop; each card in a fixed-width slot so they display properly
            Array.from({ length: 4 }).map((_, setIndex) => (
              featuredProperties.slice(0, 6).map((property) => {
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
                    className="featured-property-card-slot flex-shrink-0 w-[320px] min-w-[320px] mx-1"
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
            <div className="p-8 text-center w-full min-w-0">No featured properties available</div>
          )}
        </div>
      </div>

      {/* Browse Properties by Location Section */}
      
    </section>
  )
}

export default FeaturedProperties
