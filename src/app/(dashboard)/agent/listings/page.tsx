'use client'

import { useState, useEffect } from 'react'
import EditPropertyModal from '@/components/agent/EditPropertyModal'
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
import { resolvePropertyImage } from '@/utils/imageResolver'
import PropertiesMap from '@/components/agent/PropertiesMap'

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

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
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

        {/* Main Content: Two Column Layout */}
        <div className="flex flex-col lg:flex-row  gap-4 sm:gap-5">
          {/* Left: Property Listings */}
          <div className="flex-1 lg:flex-[0_0_40%] lg:max-w-[40%] flex flex-col gap-4">
            {loading ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <span className="block h-4 w-24 rounded bg-gray-200 animate-pulse" />
                      <span className="block h-5 w-full rounded bg-gray-200 animate-pulse" />
                      <span className="block h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </>
            ) : listings.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-600 bg-white rounded-xl border border-gray-200">
                {selectedFilter === 'all' 
                  ? 'No listings yet. Create your first listing!'
                  : `No ${selectedFilter} properties found.`
                }
              </div>
            ) : (
              listings.map((l) => {
                const property = l.property
                const priceTypeLabel = property?.price_type
                  ? property.price_type.charAt(0).toUpperCase() + property.price_type.slice(1).toLowerCase()
                  : null
                const priceLabel = property && property.price != null
                  ? priceTypeLabel
                    ? `P ${property.price.toLocaleString('en-US')}.00/${priceTypeLabel}`
                    : `P ${property.price.toLocaleString('en-US')}.00/monthly`
                  : null
                
                const bedrooms = property?.bedrooms ?? 0
                const bathrooms = property?.bathrooms ?? 0
                const area = property?.area ? `${property.area}${property.floor_area_unit || 'sqm'}` : 'N/A'
                const description = property?.description || 'Beautiful property with modern amenities and stunning views.'

                return (
                  <div key={l.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative">
                      <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
                        <img
                          src={l.image}
                          alt={l.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                          }}
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-blue-600 text-white text-xs font-semibold uppercase px-3 py-1 rounded">
                            {property?.type || 'Property'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <FiMapPin className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{l.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <FiCamera className="text-gray-400" />
                        <span>{property?.views_count ?? l.views ?? 0}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{l.title}</h3>
                      
                      {priceLabel && (
                        <p className="text-xl font-bold text-blue-600 mb-3">{priceLabel}</p>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {description}
                        <span className="text-blue-600 cursor-pointer hover:underline"> see more</span>
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span>{bedrooms}</span>
                        <span>{bathrooms}</span>
                        <span>{area}</span>
                      </div>
                      
                      <button
                        className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        type="button"
                        onClick={() => handleEditClick(l.id)}
                      >
                        EDIT
                      </button>
                    </div>
                  </div>
                )
              })
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {getPaginationPages().map((page, idx) => (
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
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
          <div className="lg:flex-[0_0_60%] lg:max-w-[60%] flex-shrink-0">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 h-[500px] lg:h-[calc(100vh-200px)] lg:sticky lg:top-4">
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

