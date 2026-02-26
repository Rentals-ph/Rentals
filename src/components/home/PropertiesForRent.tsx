'use client'

import { useState, useEffect } from 'react'
import VerticalPropertyCard from '../common/VerticalPropertyCard'
import { VerticalPropertyCardSkeleton } from '../common/VerticalPropertyCardSkeleton'
import { propertiesApi } from '../../api'
import type { Property } from '../../types'
import type { PaginatedResponse } from '../../api/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'

function PropertiesForRent() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const dataResponse = await propertiesApi.getAll({ per_page: 6 })
        // Handle both array response and paginated response
        const data: Property[] = Array.isArray(dataResponse)
          ? dataResponse
          : (dataResponse as PaginatedResponse<Property>).data || []
        setProperties(data)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

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

  return (
    <section id="properties-for-rent" className="bg-white py-20 md:py-15">
      <div className="mx-auto max-w-7xl px-16 lg:px-10 md:px-5">
        <div className="mb-10 flex items-center justify-between md:mb-8">
          <div>
            <h2 className="mb-2.5 font-outfit text-4xl font-bold leading-10 tracking-tight text-gray-900 md:text-3xl md:leading-8">
              Properties for Rent
            </h2>
            <p className="font-outfit text-lg font-normal leading-6 tracking-tight text-gray-600 md:text-base md:leading-5.5">
              Explore our wide selection of rental properties
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-3 justify-items-center gap-8 lg:grid-cols-2 lg:gap-6 md:grid-cols-1 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full max-w-[420px]">
                <VerticalPropertyCardSkeleton />
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-3 justify-items-center gap-8 lg:grid-cols-2 lg:gap-6 md:grid-cols-1 md:gap-5">
            {properties.map((property) => {
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
                <VerticalPropertyCard
                  key={property.id}
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
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <p>No properties available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default PropertiesForRent

