'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VerticalPropertyCard, VerticalPropertyCardSkeleton } from '@/shared/components/cards'
import { Pagination } from '@/shared/components/misc'
import { FadeInOnView } from '@/shared/components/ui'
import { propertiesApi } from '@/features/properties'
import type { Property } from '@/features/properties'
import type { PaginatedResponse } from '@/api/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/shared/utils/image'

const FeaturedProperties = () => {
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [browseProperties, setBrowseProperties] = useState<Property[]>([])
  const [citiesFromAllProperties, setCitiesFromAllProperties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [browseLoading, setBrowseLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6 // 2 rows × 3 cards per row

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

  // Fetch featured properties (respect current category filter)
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setLoading(true)
        const listingType =
          selectedCategory === 'For Rent'
            ? 'for_rent'
            : selectedCategory === 'For Sale'
              ? 'for_sale'
              : undefined

        const data = await propertiesApi.getFeatured(
          listingType ? { listing_type: listingType } : undefined,
        )
        setFeaturedProperties(data)
      } catch (error) {
        console.error('Error fetching featured properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProperties()
  }, [selectedCategory])

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
        const params: { location?: string; listing_type?: string } = {
          location: selectedLocation,
        }

        // Mirror the category filter when browsing by city
        if (selectedCategory === 'For Rent') {
          params.listing_type = 'for_rent'
        } else if (selectedCategory === 'For Sale') {
          params.listing_type = 'for_sale'
        }
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
  const allProperties = selectedLocation === 'All Locations' ? featuredProperties : browseProperties

  // Filter by category (listing_type)
  const filteredProperties = (() => {
    if (selectedCategory === 'All Categories') return allProperties
    if (selectedCategory === 'For Rent') {
      return allProperties.filter(p => p.listing_type === 'for_rent' || (!p.listing_type && p.price_type))
    }
    if (selectedCategory === 'For Sale') {
      return allProperties.filter(p => p.listing_type === 'for_sale' || (!p.listing_type && !p.price_type))
    }
    return allProperties
  })()

  // Pagination calculations
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedLocation, selectedCategory])

  return (
    <section
      id="properties"
      className="border-t-0 relative page-x py-10 sm:py-14 pb-6 bg-[#F5F9FF] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 before:to-transparent after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-gray-200 after:to-transparent"
    >
      <div className="page-w">
        {/* Header: BROWSE HOT OFFERS label, title + subtitle, category buttons */}
        <FadeInOnView
          className="relative flex flex-col gap-4 mb-6 sm:mb-8 pb-4"
          as="div"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="text-left px-0 xs:px-2 min-w-0 flex-1">
              <p className="text-[#205ED7] font-outfit text-[17px] font-medium leading-[1.26] mb-2 uppercase tracking-wide">
                BROWSE HOT OFFERS
              </p>
              <h2 className="text-[#111827] font-outfit text-2xl sm:text-3xl md:text-[40px] font-bold leading-[1em] tracking-[-0.0125em] m-0 mb-2">
                Featured Properties
              </h2>
              <p className="text-[#374151] font-outfit text-[17px] font-medium leading-[1.26] mt-2 mb-0">
                Browse featured homes by location
              </p>
            </div>
            {/* Category buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('All Categories')}
                className={`px-[29px] py-[12px] rounded-[5px] font-outfit text-[13px] font-medium leading-[1.26] transition-all ${
                  selectedCategory === 'All Categories'
                    ? 'bg-[#266FFD] text-white'
                    : 'bg-white text-[#000000] border border-black/20'
                }`}
              >
                All Categories
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('For Rent')}
                className={`px-[28px] py-[12px] rounded-[5px] font-outfit text-[13px] font-medium leading-[1.26] transition-all ${
                  selectedCategory === 'For Rent'
                    ? 'bg-[#266FFD] text-white'
                    : 'bg-white text-[#000000] border border-black/20'
                }`}
              >
                For Rent
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('For Sale')}
                className={`px-[29px] py-[12px] rounded-[5px] font-outfit text-[13px] font-medium leading-[1.26] transition-all ${
                  selectedCategory === 'For Sale'
                    ? 'bg-[#266FFD] text-white'
                    : 'bg-white text-[#000000] border border-black/20'
                }`}
              >
                For Sale
              </button>
            </div>
          </div>
        </FadeInOnView>

      {/* Location chips */}
      <FadeInOnView as="div" delayMs={120} className="mb-4 sm:mb-6 relative">
        <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden flex-nowrap sm:flex-wrap justify-start sm:justify-start p-[7px] rounded-[5px] bg-white w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              className={`subcategory-chip flex-shrink-0 px-[35px] py-[10px] rounded-[100px] font-inter text-[13px] font-medium leading-[1.21] transition-all duration-200 touch-manipulation min-h-[36px] ${
                selectedLocation === loc
                  ? 'bg-[#387CFF] text-white'
                  : 'bg-white text-[#374151]'
              }`}
              onClick={() => setSelectedLocation(loc)}
            >
              {loc}
            </button>
          ))}
        </div>
      </FadeInOnView>

      {/* 2-row grid layout */}
      <FadeInOnView
        as="div"
        delayMs={220}
        className="relative w-full mt-4 sm:mt-6"
      >
        {loading || (selectedLocation !== 'All Locations' && browseLoading) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="w-full">
                <VerticalPropertyCardSkeleton />
              </div>
            ))}
          </div>
        ) : paginatedProperties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {paginatedProperties.map((property) => {
                const propertySize = property.area 
                  ? `${property.area} sqft` 
                  : `${(property.bedrooms * 15 + property.bathrooms * 5)} sqft`
                
                const mainImage = property.image_url || property.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                const images = (property.images_url && property.images_url.length > 0)
                  ? [mainImage, ...(property.images_url || []).filter((u): u is string => !!u && u !== mainImage)]
                  : undefined

                const baseAgent = property.agent as {
                  id?: number
                  first_name?: string | null
                  last_name?: string | null
                  full_name?: string | null
                  verified?: boolean
                  phone?: string
                  email?: string
                  whatsapp?: string
                  company_image?: string | null
                  company_name?: string | null
                  profile_image?: string | null
                  image?: string | null
                  avatar?: string | null
                  image_path?: string | null
                } | undefined
                const baseRentManager = property.rent_manager as {
                  id?: number
                  name?: string | null
                  is_official?: boolean
                  phone?: string
                  email?: string
                  whatsapp?: string
                  company_image?: string | null
                  company_name?: string | null
                  profile_image?: string | null
                  image?: string | null
                  avatar?: string | null
                  image_path?: string | null
                } | undefined

                const rawAgentImage =
                  baseAgent?.profile_image ||
                  baseAgent?.image ||
                  baseAgent?.avatar ||
                  baseAgent?.image_path ||
                  baseRentManager?.profile_image ||
                  baseRentManager?.image ||
                  baseRentManager?.avatar ||
                  baseRentManager?.image_path ||
                  null
                const agentIdForAvatar = baseAgent?.id || baseRentManager?.id
                const agentImage = agentIdForAvatar
                  ? resolveAgentAvatar(rawAgentImage, agentIdForAvatar)
                  : undefined
                
                const rentManagerName = property.agent?.first_name && property.agent?.last_name
                  ? `${property.agent.first_name} ${property.agent.last_name}`
                  : property.agent?.full_name
                  || property.rent_manager?.name
                  || 'Rental.Ph Official'
                
                return (
                  <div key={property.id} className="w-full">
                    <VerticalPropertyCard
                      id={property.id}
                      propertyType={property.type}
                      listingType={property.listing_type as 'for_rent' | 'for_sale' | null}
                      priceType={formatPriceType(property.price_type)}
                      price={formatPrice(property.price)}
                      priceUnit={
                        property.listing_type === 'for_sale'
                          ? undefined
                          : (formatPriceType(property.price_type) ? `/${formatPriceType(property.price_type)}` : '/mo')
                      }
                      title={property.title}
                      description={property.description}
                      image={mainImage}
                      images={images}
                      rentManagerName={rentManagerName}
                      rentManagerRole={getRentManagerRole(property.agent?.verified || property.rent_manager?.is_official)}
                      rentManagerImage={agentImage}
                      rentManagerEmail={(property.agent as any)?.email || property.rent_manager?.email}
                      rentManagerWhatsApp={(property.agent as any)?.whatsapp}
                      companyImage={(property.agent as any)?.company_image || (property.agent as any)?.agency_image}
                      bedrooms={property.bedrooms}
                      bathrooms={property.bathrooms}
                      parking={0}
                      propertySize={propertySize}
                      location={property.location}
                      city={property.city}
                      streetAddress={property.street_address}
                      stateProvince={property.state_province}
                      property={property}
                    />
                  </div>
                )
              })}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 sm:mt-10">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center w-full min-w-0">
            {selectedLocation === 'All Locations' 
              ? 'No featured properties available' 
              : `No properties in ${selectedLocation}${selectedCategory !== 'All Categories' ? ` for ${selectedCategory}` : ''}`}
          </div>
        )}
      </FadeInOnView>

      {/* View All Properties button */}
      <FadeInOnView as="div" delayMs={300} className="mt-6 sm:mt-8 flex justify-start">
        <Link
          href="/properties"
          className="inline-flex items-center justify-center px-[28px] py-[12px] rounded-[5px] bg-[#266FFD] text-white font-outfit text-[13px] font-medium leading-[1.21] hover:bg-[#205ED7] transition-colors"
        >
          View All Properties
        </Link>
      </FadeInOnView>
      </div>
    </section>
  )
}

export default FeaturedProperties
