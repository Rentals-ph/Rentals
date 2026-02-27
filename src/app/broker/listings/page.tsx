'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import BrokerHeader from '@/components/broker/BrokerHeader'
import EditPropertyModal from '@/components/agent/EditPropertyModal'
import { brokerApi } from '../../../api'
import type { Property } from '../../../types'
import {
  FiCheckCircle,
  FiHome,
  FiSearch,
  FiSlash,
} from 'react-icons/fi'
import { resolvePropertyImage } from '@/utils/imageResolver'
import PropertiesMap from '@/components/agent/PropertiesMap'
import PropertyMapPopupCard from '@/components/common/PropertyMapPopupCard'

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

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-20">
        <BrokerHeader 
          title="Listings" 
          subtitle="Manage and track all your team's property listings." 
        />

        <div className="flex flex-col gap-4 sm:gap-4.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-lg sm:text-xl bg-orange-100 text-orange-600">
                <FiHome />
              </div>
              <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 sm:gap-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 m-0 truncate">Total Properties</h3>
                  <span className="text-xs font-semibold whitespace-nowrap text-green-600 flex-shrink-0">&nbsp;</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : totalProperties}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-lg sm:text-xl bg-blue-100 text-blue-600">
                <FiCheckCircle />
              </div>
              <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 sm:gap-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 m-0 truncate">Total Active</h3>
                  <span className="text-xs font-semibold whitespace-nowrap text-green-600 flex-shrink-0">&nbsp;</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : activeProperties}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-lg sm:text-xl bg-emerald-100 text-emerald-600">
                <FiCheckCircle />
              </div>
              <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 sm:gap-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 m-0 truncate">Total Rented</h3>
                  <span className="text-xs font-medium whitespace-nowrap text-gray-500 flex-shrink-0">&nbsp;</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : rentedProperties}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-lg sm:text-xl bg-red-100 text-red-600">
                <FiSlash />
              </div>
              <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 sm:gap-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 m-0 truncate">Total Hide</h3>
                  <span className="text-xs font-medium whitespace-nowrap text-gray-500 flex-shrink-0">&nbsp;</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 m-0 leading-none">{loading ? '...' : hiddenProperties}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-3.5">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch">
              <div className="flex-1 flex items-center gap-2 sm:gap-2.5 bg-white border border-gray-200 rounded-[10px] py-3 sm:py-3.5 px-3 sm:px-4">
                <FiSearch className="text-gray-400 text-base sm:text-lg flex-shrink-0" />
                <input className="border-0 outline-0 w-full min-w-0 text-sm sm:text-[15px] text-gray-900 bg-transparent placeholder:text-gray-400" placeholder="Search Location..." />
              </div>
              <button className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-4 sm:px-4.5 min-w-0 sm:min-w-[120px] border-0 rounded-[10px] bg-blue-600 text-white text-sm sm:text-base font-bold cursor-pointer shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]" type="button">
                <FiSearch className="flex-shrink-0" />
                <span>Find</span>
              </button>
            </div>

            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 h-64 sm:h-72 md:h-80 lg:h-[22rem] min-h-[200px]">
              <PropertiesMap 
                properties={properties}
                agentId={null}
                className="w-full h-full border-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4.5 text-gray-500 text-xs sm:text-[13px] py-1 px-0.5 overflow-x-auto scrollbar-none">
            {(() => {
              const typeCounts: Record<string, number> = {}
              properties.forEach((property) => {
                const type = property.type || 'Other'
                typeCounts[type] = (typeCounts[type] || 0) + 1
              })
              const propertyTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])
              return (
                <>
                  <label className="inline-flex items-center gap-2 sm:gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedFilter === 'all'}
                      onChange={() => setSelectedFilter('all')}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-blue-600 flex-shrink-0"
                    />
                    <span>All({totalProperties})</span>
                  </label>
                  {propertyTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`bg-transparent border-0 text-gray-500 text-xs sm:text-[13px] cursor-pointer py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg whitespace-nowrap flex-shrink-0 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 ${selectedFilter === type ? 'bg-blue-50 text-blue-600 font-semibold' : ''}`}
                      onClick={() => setSelectedFilter(type)}
                    >
                      {type}({typeCounts[type]})
                    </button>
                  ))}
                </>
              )
            })()}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 mt-1.5">
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[12px] sm:rounded-[14px] border border-gray-200 overflow-hidden shadow-sm flex flex-col sm:flex-row gap-0">
                    <div className="w-full sm:w-[140px] sm:min-w-[140px] md:w-[190px] aspect-[16/10] sm:aspect-auto sm:h-[120px] bg-gray-200 animate-pulse flex-shrink-0" />
                    <div className="p-4 flex-1 space-y-2">
                      <span className="block h-4 w-24 rounded bg-gray-200 animate-pulse" />
                      <span className="block h-5 w-full rounded bg-gray-200 animate-pulse" />
                      <span className="block h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                      <span className="block h-4 w-20 rounded bg-gray-200 animate-pulse" />
                    </div>
                  </div>
                ))}
              </>
            ) : (() => {
              const filteredListings = selectedFilter === 'all' 
                ? listings 
                : listings.filter((l) => {
                    const property = properties.find(p => p.id === l.id)
                    return property?.type === selectedFilter
                  })
              return filteredListings.length === 0 ? (
                <div className="p-6 sm:p-8 text-center col-span-full text-sm sm:text-base text-gray-600">
                  {selectedFilter === 'all' 
                    ? 'No listings yet. Create your first listing!'
                    : `No ${selectedFilter} properties found.`
                  }
                </div>
              ) : (
                filteredListings.map((l) => {
                  const property = properties.find((p) => p.id === l.id) ?? null
                  const priceTypeLabel = property?.price_type
                    ? property.price_type.charAt(0).toUpperCase() +
                      property.price_type.slice(1).toLowerCase()
                    : null
                  const priceLabel =
                    property && property.price != null
                      ? priceTypeLabel
                        ? `₱${property.price.toLocaleString('en-US')} / ${priceTypeLabel}`
                        : `₱${property.price.toLocaleString('en-US')}`
                      : null
                  return (
                    <div key={l.id} className="relative">
                      <PropertyMapPopupCard
                        id={l.id}
                        title={l.title}
                        type={property?.type ?? null}
                        location={l.address}
                        priceLabel={priceLabel}
                        imageUrl={l.image}
                      />
                      <button
                        className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
                        type="button"
                        onClick={() => handleEditClick(l.id)}
                      >
                        Edit
                      </button>
                    </div>
                  )
                })
              )
            })()}
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
