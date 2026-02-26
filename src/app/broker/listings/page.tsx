'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import BrokerHeader from '../../../components/broker/BrokerHeader'
import EditPropertyModal from '../../../components/agent/EditPropertyModal'
import { brokerApi } from '../../../api'
import type { Property } from '../../../types'
import {
  FiCheckCircle,
  FiEye,
  FiHome,
  FiMapPin,
  FiSearch,
  FiSlash,
} from 'react-icons/fi'
import { ASSETS } from '@/utils/assets'
import { resolvePropertyImage } from '@/utils/imageResolver'
import PropertiesMap from '../../../components/agent/PropertiesMap'
// import './page.css' // Removed - converted to Tailwind

type ListingStatus = 'active' | 'rented' | 'hidden'

interface ListingCard {
  id: number
  title: string
  address: string
  rating: number
  views: number
  image: string
  status: ListingStatus
}

export default function ListingsPage() {
  const [listings, setListings] = useState<ListingCard[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [totalProperties, setTotalProperties] = useState(0)
  const [activeProperties, setActiveProperties] = useState(0)
  const [rentedProperties, setRentedProperties] = useState(0)
  const [hiddenProperties, setHiddenProperties] = useState(0)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all') // 'all' or property type

  useEffect(() => {
    const fetchBrokerListings = async () => {
      try {
        setLoading(true)
        // Get broker's properties (broker's own + team agents' properties)
        const propertiesResponse = await brokerApi.getProperties()
        const propertiesArray = Array.isArray(propertiesResponse) ? propertiesResponse : (propertiesResponse as any).data || []
        
        setProperties(propertiesArray)
        
        // Transform properties to ListingCard format
        const transformedListings: ListingCard[] = propertiesArray.map((property: Property) => {
          const address = property.street_address 
            ? `${property.street_address}, ${property.city || property.location || 'N/A'}`
            : property.location || 'Address not available'
          
          // Determine status based on property data
          let status: ListingStatus = 'active'
          if (!property.published_at) {
            status = 'hidden'
          }
          
          // Use image_url if available (from backend), otherwise fall back to resolving image
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
            views: 0, // Could be tracked separately
            image: imageUrl,
            status: status
          }
        })
        
        setListings(transformedListings)
        
        // Calculate stats
        setTotalProperties(propertiesArray.length)
        setActiveProperties(propertiesArray.filter((p: Property) => p.published_at).length)
        setRentedProperties(0) // Would need additional data
        setHiddenProperties(propertiesArray.filter((p: Property) => !p.published_at).length)
      } catch (error: any) {
        console.error('Error fetching broker listings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBrokerListings()
  }, [])

  const handleEditClick = async (listingId: number) => {
    try {
      // Fetch full property details - use broker API to ensure access control
      const property = properties.find(p => p.id === listingId)
      if (property) {
        setEditingProperty(property)
        setIsModalOpen(true)
      } else {
        alert('Property not found.')
      }
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
    // Refresh the listings
    const fetchBrokerListings = async () => {
      try {
        const propertiesResponse = await brokerApi.getProperties()
        const propertiesArray = Array.isArray(propertiesResponse) ? propertiesResponse : (propertiesResponse as any).data || []
        
        setProperties(propertiesArray)
        
        const transformedListings: ListingCard[] = propertiesArray.map((property: Property) => {
          const address = property.street_address 
            ? `${property.street_address}, ${property.city || property.location || 'N/A'}`
            : property.location || 'Address not available'
          
          let status: ListingStatus = 'active'
          if (!property.published_at) {
            status = 'hidden'
          }
          
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
            rating: 4,
            views: 0,
            image: imageUrl,
            status: status
          }
        })
        
        setListings(transformedListings)
        setTotalProperties(propertiesArray.length)
        setActiveProperties(propertiesArray.filter((p: Property) => p.published_at).length)
        setHiddenProperties(propertiesArray.filter((p: Property) => !p.published_at).length)
      } catch (error) {
        console.error('Error refreshing listings:', error)
      }
    }
    fetchBrokerListings()
  }

  const handlePropertyDelete = () => {
    // Refresh the listings
    handlePropertyUpdate()
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5"> {/* aml-rating */}
        {Array.from({ length: 5 }).map((_, idx) => {
          const starNumber = idx + 1
          return (
            <span
              key={starNumber}
              className={`text-lg leading-none ${starNumber <= rating ? 'text-[#FFC107]' : 'text-gray-300'}`} /* aml-star */
              aria-hidden="true"
            >
              ★
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* agent-dashboard */}
      <AppSidebar/>
      <main className="main-with-sidebar flex-1 min-h-screen"> {/* broker-main */}
        <div className="p-8 lg:py-6 md:py-4 md:pt-20">
          <BrokerHeader 
            title="Listings" 
            subtitle="Manage and track all your team's property listings." 
          />

          <div className="flex flex-col gap-4.5"> {/* aml-page */}
            <div className="grid grid-cols-4 gap-6 lg:grid-cols-2 md:grid-cols-1"> {/* aml-stats */}
              <div className="bg-white rounded-xl p-6 flex items-start gap-4 shadow-sm border border-gray-100"> {/* metric-card orange */}
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl bg-orange-100 text-orange-600"> {/* metric-icon */}
                  <FiHome />
                </div>
                <div className="flex-1 flex flex-col gap-1"> {/* metric-content */}
                  <div className="flex justify-between items-baseline gap-3"> {/* aml-stat-top */}
                    <h3 className="text-sm font-semibold text-gray-700 m-0">Total Properties</h3>
                    <span className="text-xs font-semibold whitespace-nowrap text-green-600">&nbsp;</span> {/* aml-stat-delta positive */}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : totalProperties}</p> {/* metric-value */}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 flex items-start gap-4 shadow-sm border border-gray-100"> {/* metric-card blue */}
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl bg-blue-100 text-blue-600"> {/* metric-icon */}
                  <FiCheckCircle />
                </div>
                <div className="flex-1 flex flex-col gap-1"> {/* metric-content */}
                  <div className="flex justify-between items-baseline gap-3"> {/* aml-stat-top */}
                    <h3 className="text-sm font-semibold text-gray-700 m-0">Total Active</h3>
                    <span className="text-xs font-semibold whitespace-nowrap text-green-600">&nbsp;</span> {/* aml-stat-delta positive */}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : activeProperties}</p> {/* metric-value */}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 flex items-start gap-4 shadow-sm border border-gray-100"> {/* metric-card green */}
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl bg-emerald-100 text-emerald-600"> {/* metric-icon */}
                  <FiCheckCircle />
                </div>
                <div className="flex-1 flex flex-col gap-1"> {/* metric-content */}
                  <div className="flex justify-between items-baseline gap-3"> {/* aml-stat-top */}
                    <h3 className="text-sm font-semibold text-gray-700 m-0">Total Rented</h3>
                    <span className="text-xs font-medium whitespace-nowrap text-gray-500">&nbsp;</span> {/* aml-stat-delta muted */}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : rentedProperties}</p> {/* metric-value */}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 flex items-start gap-4 shadow-sm border border-gray-100"> {/* metric-card red */}
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl bg-red-100 text-red-600"> {/* metric-icon */}
                  <FiSlash />
                </div>
                <div className="flex-1 flex flex-col gap-1"> {/* metric-content */}
                  <div className="flex justify-between items-baseline gap-3"> {/* aml-stat-top */}
                    <h3 className="text-sm font-semibold text-gray-700 m-0">Total Hide</h3>
                    <span className="text-xs font-medium whitespace-nowrap text-gray-500">&nbsp;</span> {/* aml-stat-delta muted */}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : hiddenProperties}</p> {/* metric-value */}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3.5"> {/* aml-search-map */}
              <div className="flex gap-3 items-stretch"> {/* aml-search-row */}
                <div className="flex-1 flex items-center gap-2.5 bg-white border border-gray-200 rounded-[10px] py-3.5 px-4"> {/* aml-search */}
                  <FiSearch className="text-gray-400 text-lg" /> {/* aml-search-icon */}
                  <input className="border-0 outline-0 w-full text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400" placeholder="Search Location..." /> {/* aml-search-input */}
                </div>
                <button className="inline-flex items-center gap-2.5 px-4.5 min-w-[120px] border-0 rounded-[10px] bg-blue-600 text-white font-bold cursor-pointer shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]" type="button"> {/* aml-find-btn */}
                  <FiSearch />
                  <span>Find</span>
                </button>
              </div>

              <div className="bg-white rounded-xl overflow-hidden border border-gray-200 h-[400px]"> {/* aml-map */}
                <PropertiesMap 
                  properties={properties}
                  agentId={null}
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-4.5 text-gray-500 text-[13px] py-1 px-0.5 overflow-x-auto scrollbar-none"> {/* aml-filters */}
              {(() => {
                // Calculate property type counts
                const typeCounts: Record<string, number> = {}
                properties.forEach((property) => {
                  const type = property.type || 'Other'
                  typeCounts[type] = (typeCounts[type] || 0) + 1
                })
                
                // Get unique property types sorted by count (descending)
                const propertyTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])
                
                return (
                  <>
                    <label className="inline-flex items-center gap-2.5 cursor-pointer"> {/* aml-filter */}
                      <input 
                        type="checkbox" 
                        checked={selectedFilter === 'all'}
                        onChange={() => setSelectedFilter('all')}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span>All({totalProperties})</span>
                    </label>
                    {propertyTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`bg-transparent border-0 text-gray-500 text-[13px] cursor-pointer py-1.5 px-2 rounded-lg whitespace-nowrap flex-shrink-0 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 ${selectedFilter === type ? 'bg-blue-50 text-blue-600 font-semibold' : ''}`} /* aml-filter-pill */
                        onClick={() => setSelectedFilter(type)}
                      >
                        {type}({typeCounts[type]})
                      </button>
                    ))}
                  </>
                )
              })()}
            </div>

            <div className="grid grid-cols-2 gap-5.5 mt-1.5 lg:grid-cols-1"> {/* aml-grid */}
              {loading ? (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[14px] border border-gray-200 overflow-hidden shadow-sm flex gap-0">
                      <div className="w-[190px] min-w-[190px] h-[120px] bg-gray-200 animate-pulse" />
                      <div className="flex-1 p-4 space-y-2">
                        <span className="block h-4 w-20 rounded bg-gray-200 animate-pulse" />
                        <span className="block h-5 w-full rounded bg-gray-200 animate-pulse" />
                        <span className="block h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                        <span className="block h-4 w-24 rounded bg-gray-200 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (() => {
                // Filter listings based on selected filter
                const filteredListings = selectedFilter === 'all' 
                  ? listings 
                  : listings.filter((l) => {
                      const property = properties.find(p => p.id === l.id)
                      return property?.type === selectedFilter
                    })
                
                return filteredListings.length === 0 ? (
                  <div className="p-8 text-center col-span-full">
                    {selectedFilter === 'all' 
                      ? 'No listings yet. Create your first listing!'
                      : `No ${selectedFilter} properties found.`
                    }
                  </div>
                ) : (
                  filteredListings.map((l) => (
                  <div key={l.id} className="bg-white rounded-[14px] border border-gray-200 overflow-hidden shadow-sm flex gap-0"> {/* aml-card */}
                  <div className="relative w-[190px] min-w-[190px] bg-gray-100"> {/* aml-card-media */}
                    <img
                      src={l.image}
                      alt={l.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center text-blue-600 text-sm shadow-sm" title="Pinned"> {/* aml-pin */}
                      <FiMapPin />
                    </div>
                    <button 
                      className="absolute bottom-2.5 right-2.5 bg-blue-600 text-white text-xs font-semibold py-1.5 px-3.5 rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700 active:scale-95" 
                      type="button"
                      onClick={() => handleEditClick(l.id)}
                    > {/* aml-edit-btn */}
                      Edit
                    </button>
                  </div>

                  <div className="flex-1 p-4 flex flex-col gap-2.5"> {/* aml-card-body */}
                    <div className="font-semibold text-base text-gray-900 leading-snug line-clamp-2">{l.title}</div> {/* aml-card-title */}
                    <div className="flex items-start gap-1.5 text-gray-600 text-sm"> {/* aml-card-address */}
                      <FiMapPin className="flex-shrink-0 mt-0.5 text-base" /> {/* aml-address-icon */}
                      <span className="line-clamp-2">{l.address}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-gray-100"> {/* aml-card-meta */}
                      {renderStars(l.rating)}
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs"> {/* aml-views */}
                        <FiEye className="text-sm" />
                        <span>Viewed({l.views})</span>
                      </div>
                    </div>
                  </div>
                </div>
                  ))
                )
              })()}
            </div>
          </div>
        </div>
      </main>

      <EditPropertyModal
        property={editingProperty}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handlePropertyUpdate}
        onDelete={handlePropertyDelete}
      />
    </div>
  )
}
