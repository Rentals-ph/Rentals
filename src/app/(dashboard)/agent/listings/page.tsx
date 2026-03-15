'use client'

import { useState, useEffect } from 'react'
import { EditPropertyModal } from '@/features/agents'
import { propertiesApi, agentsApi } from '@/api'
import type { Property } from '@/types'
import {
  FiCheckCircle,
  FiEye,
  FiHome,
  FiMapPin,
  FiSearch,
  FiSlash,
  FiCamera
} from 'react-icons/fi'
import { ASSETS } from '@/utils/assets'
import { resolvePropertyImage, resolveAgentAvatar } from '@/shared/utils/image'
import { PropertiesMap } from '@/features/agents'
import { VerticalPropertyCard } from '@/shared/components/cards'

type ListingStatus = 'active' | 'rented' | 'hidden'

interface ListingCard {
  id: number
  title: string
  address: string
  rating: number
  views: number
  image: string
  status: ListingStatus
  property?: Property
}

export default function AgentMyListings() {
  const [listings, setListings] = useState<ListingCard[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [totalProperties, setTotalProperties] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [totalInquiries, setTotalInquiries] = useState(0)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentAgentId, setCurrentAgentId] = useState<number | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string>('all') // 'all' or property type
  const [sortBy, setSortBy] = useState<string>('newest') // 'newest' or other sort options
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 3

  useEffect(() => {
    const fetchAgentListings = async () => {
      try {
        setLoading(true)
        // Get current agent
        const agent = await agentsApi.getCurrent()
        
        if (!agent) {
          console.error('No agent found. Please ensure you are logged in.')
          setLoading(false)
          return
        }
        
        if (!agent.id) {
          console.error('Agent ID is missing')
          setLoading(false)
          return
        }
        
        // Store current agent ID for filtering
        setCurrentAgentId(agent.id)
        
        // Fetch dashboard stats for views and inquiries
        try {
          const dashboardStats = await agentsApi.getDashboardStats()
          setTotalViews(dashboardStats.total_views ?? 0)
          setTotalInquiries(dashboardStats.total_inquiries ?? 0)
        } catch (err) {
          console.error('Error fetching dashboard stats:', err)
        }
        
        // Fetch properties for this agent
        const properties = await propertiesApi.getByAgentId(agent.id)
        
        // Additional safety check: filter properties to ensure they belong to this agent
        const agentProperties = properties.filter((p: Property) => p.agent_id === agent.id)
        
        if (agentProperties.length !== properties.length) {
          console.warn(`Filtered out ${properties.length - agentProperties.length} properties that don't belong to agent ${agent.id}`)
        }
        
        if (!properties || !Array.isArray(properties)) {
          console.error('Invalid properties response:', properties)
          setLoading(false)
          return
        }
        
        // Store properties for editing (only agent's properties)
        setProperties(agentProperties)
        
        // Transform properties to ListingCard format (only agent's properties)
        const transformedListings: ListingCard[] = agentProperties.map((property: Property) => {
          const address = property.street_address 
            ? `${property.street_address}, ${property.city || property.location || 'N/A'}`
            : property.location || 'Address not available'
          
          // Determine status based on property data
          let status: ListingStatus = 'active'
          if (!property.published_at) {
            status = 'hidden'
          }
          
          // Use image_url if available (from backend), otherwise fall back to resolving image
          // Priority: image_url > image_path > image > placeholder
          let imageUrl = property.image_url
          if (!imageUrl && property.image_path) {
            imageUrl = resolvePropertyImage(property.image_path, property.id)
          }
          if (!imageUrl && property.image) {
            imageUrl = resolvePropertyImage(property.image, property.id)
          }
          if (!imageUrl) {
            imageUrl = resolvePropertyImage(null, property.id)
          }
          
          return {
            id: property.id,
            title: property.title,
            address: address,
            rating: 4, // Default rating, could be fetched from reviews API
            views: property.views_count ?? 0,
            image: imageUrl,
            status: status,
            property: property
          }
        })
        
        // Sort listings
        let sortedListings = [...transformedListings]
        if (sortBy === 'newest') {
          sortedListings.sort((a, b) => {
            const dateA = a.property?.created_at ? new Date(a.property.created_at).getTime() : 0
            const dateB = b.property?.created_at ? new Date(b.property.created_at).getTime() : 0
            return dateB - dateA
          })
        } else if (sortBy === 'oldest') {
          sortedListings.sort((a, b) => {
            const dateA = a.property?.created_at ? new Date(a.property.created_at).getTime() : 0
            const dateB = b.property?.created_at ? new Date(b.property.created_at).getTime() : 0
            return dateA - dateB
          })
        } else if (sortBy === 'price-high') {
          sortedListings.sort((a, b) => {
            const priceA = a.property?.price ?? 0
            const priceB = b.property?.price ?? 0
            return priceB - priceA
          })
        } else if (sortBy === 'price-low') {
          sortedListings.sort((a, b) => {
            const priceA = a.property?.price ?? 0
            const priceB = b.property?.price ?? 0
            return priceA - priceB
          })
        }
        
        // Filter by search query
        if (searchQuery.trim()) {
          sortedListings = sortedListings.filter(l => 
            l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.address.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
        
        // Filter by property type
        const filteredListings = selectedFilter === 'all' 
          ? sortedListings 
          : sortedListings.filter((l) => l.property?.type === selectedFilter)
        
        // Calculate pagination
        const totalFiltered = filteredListings.length
        setTotalPages(Math.ceil(totalFiltered / ITEMS_PER_PAGE))
        
        // Get current page items
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginatedListings = filteredListings.slice(startIndex, endIndex)
        
        setListings(paginatedListings)
        
        // Calculate stats (only agent's properties)
        setTotalProperties(agentProperties.length)
      } catch (error: any) {
        console.error('Error fetching agent listings:', error)
        if (error.response?.status === 401) {
          console.error('Unauthorized. Please log in again.')
        } else if (error.response?.status === 404) {
          console.error('Agent not found.')
        } else {
          console.error('Failed to fetch properties:', error.message || error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAgentListings()
  }, [selectedFilter, sortBy, searchQuery, currentPage])

  const handleEditClick = async (listingId: number) => {
    try {
      // Fetch full property details
      const property = await propertiesApi.getById(listingId)
      setEditingProperty(property)
      setIsModalOpen(true)
    } catch (error: any) {
      console.error('Error fetching property details:', error)
      alert('Failed to load property details. Please try again.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingProperty(null)
  }

  const handlePropertyUpdate = () => {
    // Reset to page 1 and refresh
    setCurrentPage(1)
    // The useEffect will handle the refresh
  }

  const handlePropertyDelete = () => {
    // Refresh the listings
    handlePropertyUpdate()
  }

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

  // Get pagination pages (e.g., 1 ... 3 4 5 ... 7)
  const getPaginationPages = (): (number | 'ellipsis')[] => {
    const total = totalPages
    if (total <= 1) return []
    const current = currentPage
    const pages: (number | 'ellipsis')[] = []
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
      return pages
    }
    
    pages.push(1)
    if (current > 3) pages.push('ellipsis')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) pages.push(i)
    }
    if (current < total - 2) pages.push('ellipsis')
    if (total > 1) pages.push(total)
    return pages
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div className="bg-white rounded-xl p-5 sm:p-6 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl bg-blue-100 text-blue-600">
              <FiEye />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-700 m-0 truncate">Total Views</h3>
              <p className="text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : totalViews}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 sm:p-6 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl bg-blue-100 text-blue-600">
              <FiHome />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-700 m-0 truncate">Total Properties</h3>
              <p className="text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : totalProperties}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 sm:p-6 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl bg-blue-100 text-blue-600">
              <FiCheckCircle />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-700 m-0 truncate">Total Inquires</h3>
              <p className="text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : totalInquiries}</p>
            </div>
          </div>
        </div>

        {/* Main Content: Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 h-[500px] lg:h-[calc(100vh-200px)]">
          {/* Left: Property Listings */}
          <div className="flex-1 lg:flex-[0_0_50%] lg:max-w-[50%] flex flex-col h-full">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch mb-4 flex-shrink-0">
              <div className="flex-1 flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg py-3 px-4">
                <FiSearch className="text-gray-400 text-lg flex-shrink-0" />
                <input 
                  className="border-0 outline-0 w-full min-w-0 text-sm text-gray-900 bg-transparent placeholder:text-gray-400" 
                  placeholder="Search" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <select 
                className="bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm text-gray-900 cursor-pointer min-w-[140px]"
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="all">All Types</option>
                {(() => {
                  const typeCounts: Record<string, number> = {}
                  properties.forEach((property) => {
                    const type = property.type || 'Other'
                    typeCounts[type] = (typeCounts[type] || 0) + 1
                  })
                  const propertyTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])
                  return propertyTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))
                })()}
              </select>
              <select 
                className="bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm text-gray-900 cursor-pointer min-w-[160px]"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="newest">Sort by Newest</option>
                <option value="oldest">Sort by Oldest</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
              </select>
            </div>
            
            <div className="flex-1 overflow-y-auto lg:sticky lg:top-4 pr-2 h-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                      <div className="h-48 bg-gray-200 animate-pulse" />
                      <div className="p-3 space-y-2">
                        <span className="block h-3 w-20 rounded bg-gray-200 animate-pulse" />
                        <span className="block h-4 w-full rounded bg-gray-200 animate-pulse" />
                        <span className="block h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-600 bg-white rounded-lg border border-gray-200">
                  {selectedFilter === 'all' 
                    ? 'No listings yet. Create your first listing!'
                    : `No ${selectedFilter} properties found.`
                  }
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listings.map((l) => {
                    const property = l.property
                    if (!property) return null

                    const propertySize = property.area 
                      ? `${property.area} sqft` 
                      : `${(property.bedrooms * 15 + property.bathrooms * 5)} sqft`
                    
                    const mainImage = l.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                    const agentImage = property.agent_id
                      ? resolveAgentAvatar(
                          property.agent_id.toString()
                        )
                      : undefined

                    // Prefer created_at for "date listed", fallback to published_at
                    const listedDate = formatDate(property.created_at || property.published_at)

                    // Get agent name - try agent object first, then fallback to current agent if available
                    let rentManagerName = 'Rental.Ph Official'
                    if (property.agent?.first_name && property.agent?.last_name) {
                      rentManagerName = `${property.agent.first_name} ${property.agent.last_name}`
                    } else if (property.agent?.full_name) {
                      rentManagerName = property.agent.full_name
                    } else if (property.rent_manager?.name) {
                      rentManagerName = property.rent_manager.name
                    }

                    // Get agent role
                    let rentManagerRole = 'Property Specialist'
                    if (property.agent) {
                      rentManagerRole = getRentManagerRole(property.agent.verified)
                    } else if (property.rent_manager) {
                      rentManagerRole = getRentManagerRole(property.rent_manager.is_official)
                    }

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
                      rentManagerName,
                      rentManagerRole,
                      rentManagerImage: agentImage,
                      bedrooms: property.bedrooms,
                      bathrooms: property.bathrooms,
                      parking: 0, // Parking not in backend model, defaulting to 0
                      propertySize,
                      location: property.location,
                      city: property.city,
                      streetAddress: property.street_address,
                      stateProvince: property.state_province,
                    }

                    return (
                      <div key={l.id} className="relative">
                        <div className="absolute left-2 bottom-2 z-10 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm ring-1 ring-gray-200">
                          <FiEye className="mr-1.5 h-3.5 w-3.5" />
                          <span>{l.views ?? 0} views</span>
                        </div>
                        <div className="w-full min-w-0 [&>article]:w-full [&>article]:min-w-0 [&>article]:max-w-full [&>article]:h-full">
                          <VerticalPropertyCard {...cardProps} property={property} />
                        </div>
                        <button
                          className="absolute top-2 right-2 z-10 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(l.id)
                          }}
                        >
                          EDIT
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
                {getPaginationPages().map((page, idx) => (
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Right: Map */}
          <div className="lg:flex-[0_0_50%] lg:max-w-[50%] flex-shrink-0 h-full min-h-[500px] lg:min-h-0">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 h-full lg:sticky lg:top-4">
              <PropertiesMap 
                properties={properties}
                agentId={currentAgentId}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </div>

      <EditPropertyModal
        property={editingProperty}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handlePropertyUpdate}
        onDelete={handlePropertyDelete}
      />
    </>
  )
}

