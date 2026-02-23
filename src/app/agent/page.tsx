'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AppSidebar from '../../components/common/AppSidebar'
import AgentHeader from '../../components/agent/AgentHeader'
import EditPropertyModal from '../../components/agent/EditPropertyModal'
import { propertiesApi, agentsApi } from '../../api'
import type { Property } from '../../types'
import { ASSETS } from '@/utils/assets'

import { 
  FiHome, 
  FiPlus,
  FiList,
  FiBarChart2,
  FiFileText,
  FiEdit3,
  FiEye,
  FiMail,
  FiDownload,
  FiCreditCard,
  FiArrowRight,
  FiCheckCircle,
  FiDollarSign,
  FiBookOpen,
  FiX
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind

const BANNER_BACKGROUNDS: string[] = [
  ASSETS.BG_HERO_LANDING,
  ASSETS.BG_CONTACT_US,
  ASSETS.BG_TESTIMONIALS,
  ASSETS.BG_LOGIN,
  ASSETS.BG_BLOG,
  ASSETS.BG_NEWS,
  ASSETS.BG_CONTACT_HORIZONTAL,
  ASSETS.BG_CONTACT_VERTICAL,
].filter(Boolean)

interface ListingData {
  id?: number
  title: string
  image: string
  details: string
  price: string
  status: 'active' | 'pending'
}

export default function AgentDashboard() {
  const [previewListing, setPreviewListing] = useState<ListingData | null>(null)
  const [listings, setListings] = useState<ListingData[]>([])
  const [recentProperties, setRecentProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalRevenue: 0,
    unreadMessages: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [createBannerBg] = useState(() =>
    BANNER_BACKGROUNDS.length > 0
      ? BANNER_BACKGROUNDS[Math.floor(Math.random() * BANNER_BACKGROUNDS.length)]
      : undefined
  )

  const fetchAgentData = useCallback(async () => {
    try {
      const agent = await agentsApi.getCurrent()
      if (!agent?.id) {
        setLoading(false)
        return
      }
      const properties = await propertiesApi.getByAgentId(agent.id)
      if (!properties || !Array.isArray(properties)) {
        setLoading(false)
        return
      }
      const recent = properties.slice(0, 3)
      setRecentProperties(recent)
      const transformedListings: ListingData[] = recent.map((property: Property) => {
        const area = property.area ? `${property.area}${property.floor_area_unit || ' sqm'}` : 'N/A'
        const price = property.price_type
          ? `₱${property.price.toLocaleString()}/${property.price_type}`
          : `₱${property.price.toLocaleString()}/month`
        const imageUrl = property.image_url || property.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
        return {
          id: property.id,
          title: property.title,
          image: imageUrl,
          details: `${property.bedrooms} Bedrooms • ${property.bathrooms} Bathroom${property.bathrooms > 1 ? 's' : ''} • ${area}`,
          price: price,
          status: property.published_at ? 'active' : 'pending'
        }
      })
      setListings(transformedListings)
    } catch (error: any) {
      console.error('Error fetching agent listings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDashboardStats = useCallback(async () => {
    try {
      const dashboardStats = await agentsApi.getDashboardStats()
      setStats({
        totalListings: dashboardStats.total_listings,
        activeListings: dashboardStats.active_listings,
        totalRevenue: dashboardStats.total_revenue,
        unreadMessages: dashboardStats.unread_messages
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgentData()
    fetchDashboardStats()
  }, [fetchAgentData, fetchDashboardStats])

  const handleViewClick = (listing: ListingData) => {
    setPreviewListing(listing)
  }

  const handleClosePreview = () => {
    setPreviewListing(null)
  }

  const handleEditClick = (listingId: number | undefined) => {
    if (listingId == null) return
    const property = recentProperties.find((p) => p.id === listingId) ?? null
    setEditingProperty(property)
    setIsEditModalOpen(true)
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setEditingProperty(null)
  }

  const handlePropertyUpdate = () => {
    fetchAgentData()
    fetchDashboardStats()
  }

  const handlePropertyDelete = () => {
    handleEditModalClose()
    fetchAgentData()
    fetchDashboardStats()
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar/>

      <main className="main-with-sidebar flex-1 min-h-screen p-6 lg:p-6 md:p-4 md:pt-14 md:pb-6">
        <AgentHeader 
          title="Dashboard" 
          subtitle="Welcome back, manage your rental properties." 
        />

        {/* Stats Cards (2x2) and Recent Messages Side by Side */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-1 xl:grid-cols-[600px_1fr]">
          {/* Left: Stats Cards in 2x2 Grid - compact */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-2.5 flex items-center gap-2 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0 bg-orange-100 text-orange-600">
                <FiHome />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-medium text-gray-600 mb-0.5 leading-tight">Total Listings</h3>
                <p className="text-lg font-bold text-gray-900 leading-tight">{statsLoading ? '...' : stats.totalListings}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2.5 flex items-center gap-2 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0 bg-blue-100 text-blue-600">
                <FiCheckCircle />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-medium text-gray-600 mb-0.5 leading-tight">Active</h3>
                <p className="text-lg font-bold text-gray-900 leading-tight">{statsLoading ? '...' : stats.activeListings}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2.5 flex items-center gap-2 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0 bg-emerald-100 text-emerald-600">
                <FiDollarSign />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-medium text-gray-600 mb-0.5 leading-tight">Revenue</h3>
                <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                  {statsLoading ? '...' : stats.totalRevenue >= 1000 
                    ? `₱${(stats.totalRevenue / 1000).toFixed(0)}K`
                    : `₱${stats.totalRevenue}`}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2.5 flex items-center gap-2 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0 bg-purple-100 text-purple-600">
                <FiMail />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-medium text-gray-600 mb-0.5 leading-tight">Unread</h3>
                <p className="text-lg font-bold text-gray-900 leading-tight">{statsLoading ? '...' : stats.unreadMessages}</p>
              </div>
            </div>
          </div>

          {/* Right: Recent Messages - takes remaining width */}
          <div className="bg-white rounded-2xl p-6 shadow-sm min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Messages</h2>
              <Link href="/agent/inbox" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
            </div>
            <div>
              {stats.unreadMessages === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No new messages
                </div>
              ) : (
                <div className="py-8 text-center text-gray-700">
                  <p className="text-lg font-semibold mb-1">{stats.unreadMessages}</p>
                  <p className="text-sm text-gray-500">unread message{stats.unreadMessages !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create New Listing Banner */}
        <div className="mb-8 px-10">
          <div
            className="p-6 md:p-8 shadow-lg text-white overflow-hidden rounded-xl relative bg-gradient-to-r from-blue-600 to-blue-700"
            style={{
              ...(createBannerBg && {
                backgroundImage: `linear-gradient(to right, rgba(37, 99, 235, 0.85), rgba(29, 78, 216, 0.85)), url(${createBannerBg})`,
              }),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.25),0_0_1px_rgba(0,0,0,0.4)]">
                  <FiPlus className="text-white text-2xl md:text-3xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1 text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35), 0 0 12px rgba(0,0,0,0.2)' }}>Create New Listing</h2>
                  <p className="text-blue-100 text-sm md:text-base" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.2)' }}>Add a new property to your portfolio and reach thousands of potential tenants.</p>
                </div>
              </div>
              <Link href="/agent/create-listing" className="px-6 md:px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.25)] whitespace-nowrap">
                Get Started
                <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Listings */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Listings</h2>
              <Link href="/agent/listings" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
            </div>
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading listings...</div>
              ) : listings.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No listings yet. Create your first listing!</div>
              ) : (
                listings.map((listing) => (
                  <div key={listing.id || listing.title} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="w-full sm:w-32 h-40 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={listing.image} 
                        alt={listing.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                        }} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 mb-1 truncate">{listing.title}</h4>
                      <p className="text-sm text-gray-600 mb-1 line-clamp-2">{listing.details}</p>
                      <p className="text-base font-bold text-blue-600">{listing.price}</p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${listing.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {listing.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg bg-white hover:bg-blue-50 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors duration-200 border border-gray-200"
                          title="Edit"
                          onClick={() => handleEditClick(listing.id)}
                        >
                          <FiEdit3 />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg bg-white hover:bg-blue-50 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors duration-200 border border-gray-200" 
                          title="View"
                          onClick={() => handleViewClick(listing)}
                        >
                          <FiEye />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rental Management Tools */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rental Management Tools</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <Link href="/agent/create-listing" className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center gap-3">
              <FiPlus className="text-4xl" />
              <h3 className="text-lg font-bold">Create Listing</h3>
              <p className="text-orange-100 text-sm">Add new property</p>
            </Link>
            <Link href="/agent/listings" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center gap-3">
              <FiList className="text-4xl" />
              <h3 className="text-lg font-bold">My Listings</h3>
              <p className="text-blue-100 text-sm">Manage properties</p>
            </Link>
          </div>
        </div>
      </main>

     
      <EditPropertyModal
        property={editingProperty}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onUpdate={handlePropertyUpdate}
        onDelete={handlePropertyDelete}
      />

      {previewListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClosePreview}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors duration-200 shadow-lg" onClick={handleClosePreview}>
              <FiX className="text-xl text-gray-700" />
            </button>
            <div className="w-full h-64 rounded-t-2xl overflow-hidden">
              <img src={previewListing.image} alt={previewListing.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{previewListing.title}</h3>
              <p className="text-base text-gray-600 mb-4">{previewListing.details}</p>
              <p className="text-3xl font-bold text-blue-600 mb-4">
                {previewListing.price}
                <span className="text-lg text-gray-500 font-normal">/month</span>
              </p>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${previewListing.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {previewListing.status === 'active' ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

