'use client'

import { useState, useMemo } from 'react'
import Footer from '@/components/layout/Footer'
import VerticalPropertyCard from '@/components/common/VerticalPropertyCard'
import HorizontalPropertyCard from '@/components/common/HorizontalPropertyCard'
import { VerticalPropertyCardSkeleton } from '@/components/common/VerticalPropertyCardSkeleton'
import { HorizontalPropertyCardSkeleton } from '@/components/common/HorizontalPropertyCardSkeleton'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { useSavedProperties } from '@/hooks/useSavedProperties'
import type { Property } from '@/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'

export default function SavedListingsPage() {
  const { savedProperties } = useSavedProperties()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [sortByPrice, setSortByPrice] = useState('')
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal')
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'for_rent' | 'for_sale'>('all')

  // Helper function to format price
  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString('en-US')}`
  }

  // Helper function to format price type
  const formatPriceType = (priceType: string | null | undefined): string | undefined => {
    if (!priceType) return undefined
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

  // Filter properties by search query
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return savedProperties
    
    const query = searchQuery.toLowerCase()
    return savedProperties.filter(property => {
      const title = property.title?.toLowerCase() || ''
      const description = property.description?.toLowerCase() || ''
      const location = property.location?.toLowerCase() || ''
      const city = property.city?.toLowerCase() || ''
      const type = property.type?.toLowerCase() || ''
      
      return title.includes(query) || 
             description.includes(query) || 
             location.includes(query) || 
             city.includes(query) ||
             type.includes(query)
    })
  }, [savedProperties, searchQuery])

  // Filter by listing type
  const filteredByType = useMemo(() => {
    if (listingTypeFilter === 'all') return filteredBySearch
    
    return filteredBySearch.filter(property => {
      const hasListingType = property.listing_type === 'for_rent' || property.listing_type === 'for_sale'
      if (listingTypeFilter === 'for_rent') {
        return property.listing_type === 'for_rent' || (!hasListingType && property.price_type)
      } else {
        return property.listing_type === 'for_sale' || (!hasListingType && !property.price_type)
      }
    })
  }, [filteredBySearch, listingTypeFilter])

  // Sort properties
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredByType]
    
    // Price sorting takes priority if selected
    if (sortByPrice === 'price-low') {
      return sorted.sort((a, b) => a.price - b.price)
    } else if (sortByPrice === 'price-high') {
      return sorted.sort((a, b) => b.price - a.price)
    }
    
    // Date sorting
    if (sortBy === 'newest') {
      return sorted.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0)
        const dateB = b.published_at ? new Date(b.published_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0)
        return dateB - dateA
      })
    } else if (sortBy === 'oldest') {
      return sorted.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0)
        const dateB = b.published_at ? new Date(b.published_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0)
        return dateA - dateB
      })
    }
    
    return sorted
  }, [filteredByType, sortBy, sortByPrice])


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Properties</h1>
            <p className="text-gray-600">View and manage your saved property listings</p>
          </div>

          {/* Search, Sort, and View Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="flex-1 w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search saved properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters and Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* For Rent / For Sale Filter */}
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-white">
                  <button
                    type="button"
                    onClick={() => setListingTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      listingTypeFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingTypeFilter('for_rent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      listingTypeFilter === 'for_rent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    For Rent
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingTypeFilter('for_sale')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      listingTypeFilter === 'for_sale'
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    For Sale
                  </button>
                </div>

                {/* Sort */}
                <span className="text-sm text-gray-600 font-outfit hidden sm:inline">Sort by</span>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                  value={sortByPrice || sortBy}
                  onChange={(e) => {
                    if (e.target.value === 'newest' || e.target.value === 'oldest') {
                      setSortBy(e.target.value)
                      setSortByPrice('')
                    } else {
                      setSortByPrice(e.target.value)
                      setSortBy('newest')
                    }
                  }}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex rounded-lg border border-gray-200 p-1 bg-white">
                  <button
                    className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'vertical' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'}`}
                    onClick={() => setViewMode('vertical')}
                    aria-label="Grid view"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="5" height="5" rx="1"/>
                      <rect x="9" y="2" width="5" height="5" rx="1"/>
                      <rect x="2" y="9" width="5" height="5" rx="1"/>
                      <rect x="9" y="9" width="5" height="5" rx="1"/>
                    </svg>
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'}`}
                    onClick={() => setViewMode('horizontal')}
                    aria-label="List view"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="2" y1="4" x2="14" y2="4"/>
                      <line x1="2" y1="8" x2="14" y2="8"/>
                      <line x1="2" y1="12" x2="14" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Results count */}
            {sortedProperties.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {sortedProperties.length} of {savedProperties.length} saved propert{savedProperties.length === 1 ? 'y' : 'ies'}
              </div>
            )}
          </div>

          {/* Properties List */}
          {sortedProperties.length === 0 ? (
            <EmptyState
              variant="empty"
              title={savedProperties.length === 0 ? "No saved properties" : "No properties match your filters"}
              description={savedProperties.length === 0 
                ? "Start saving properties you're interested in by clicking the heart icon on any property card."
                : "Try adjusting your search or filters to see more listings."}
              action={
                savedProperties.length === 0 ? (
                  <EmptyStateAction href="/properties" primary>
                    Browse Properties
                  </EmptyStateAction>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setListingTypeFilter('all')
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all hover:opacity-90 active:scale-[0.98] bg-white text-rental-blue-600 border-2 border-rental-blue-200 hover:bg-rental-blue-50"
                  >
                    Clear Filters
                  </button>
                )
              }
            />
          ) : (
            <div className={viewMode === 'horizontal' 
              ? 'properties-list flex flex-col gap-4 sm:gap-6' 
              : 'properties-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6'}>
              {sortedProperties.map(property => {
                const propertySize = property.area 
                  ? `${property.area} sqft` 
                  : `${(property.bedrooms * 15 + property.bathrooms * 5)} sqft`
                
                const mainImage = property.image_url || property.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                const agentImage = property.agent
                  ? resolveAgentAvatar(property.agent.id.toString())
                  : undefined

                const listedDate = formatDate(property.created_at || property.published_at)

                const cardProps = {
                  id: property.id,
                  propertyType: property.type,
                  listingType: property.listing_type as 'for_rent' | 'for_sale' | null,
                  date: listedDate,
                  dateListed: listedDate,
                  priceType: formatPriceType(property.price_type),
                  priceUnit: property.listing_type === 'for_sale' ? undefined : (formatPriceType(property.price_type) ? `/${formatPriceType(property.price_type)}` : '/mo'),
                  price: formatPrice(property.price),
                  title: property.title,
                  image: mainImage,
                  images: (property.images_url && property.images_url.length > 0)
                    ? [mainImage, ...(property.images_url || []).filter((u): u is string => !!u && u !== mainImage)]
                    : undefined,
                  rentManagerName: property.agent?.first_name && property.agent?.last_name
                    ? `${property.agent.first_name} ${property.agent.last_name}`
                    : property.agent?.full_name
                    || property.rent_manager?.name
                    || 'Rental.Ph Official',
                  rentManagerRole: property.agent
                    ? getRentManagerRole(property.agent.verified)
                    : getRentManagerRole(property.rent_manager?.is_official),
                  rentManagerImage: agentImage,
                  bedrooms: property.bedrooms,
                  bathrooms: property.bathrooms,
                  parking: 0,
                  propertySize,
                  location: property.location,
                  city: property.city,
                  streetAddress: property.street_address,
                  stateProvince: property.state_province,
                  property,
                }

                return viewMode === 'horizontal' ? (
                  <div key={property.id} className="w-full min-w-0 [&>article]:w-full [&>article]:min-w-0 [&>article]:max-w-full">
                    <HorizontalPropertyCard {...cardProps} />
                  </div>
                ) : (
                  <div key={property.id} className="w-full min-w-0 [&>article]:w-full [&>article]:min-w-0 [&>article]:max-w-full [&>article]:h-full">
                    <VerticalPropertyCard {...cardProps} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

