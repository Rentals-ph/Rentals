'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import EditPropertyModal from '@/components/agent/EditPropertyModal'
import PropertyMapPopupCard from '@/components/common/PropertyMapPopupCard'
import { propertiesApi, agentsApi, messagesApi } from '@/api'
import type { Property } from '@/types'
import type { Message } from '@/api/endpoints/messages'
import { ASSETS } from '@/utils/assets'

import { 
  FiHome, 
  FiFileText,
  FiMapPin,
  FiBell,
  FiX
} from 'react-icons/fi'

interface ListingData {
  id?: number
  title: string
  image: string
  details: string
  price: string
  status: 'active' | 'pending'
}

const LOGOUT_KEYS = [
  'auth_token', 'user_token', 'user_name', 'user_email', 'user_phone', 'user_avatar', 'user_role',
  'agent_id', 'agent_name', 'agent_status', 'agent_registration_status',
  'broker_status', 'broker_registration_status', 'unread_messages_count',
]

export default function AgentDashboard() {
  const [previewListing, setPreviewListing] = useState<ListingData | null>(null)
  const [listings, setListings] = useState<ListingData[]>([])
  const [recentProperties, setRecentProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalRevenue: 0,
    unreadMessages: 0,
    totalViews: 0,
    totalInquiries: 0,
  })
  const [monthlyListings, setMonthlyListings] = useState<{ labels: string[]; counts: number[]; total: number }>({
    labels: [],
    counts: [],
    total: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [recentMessages, setRecentMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [listPage, setListPage] = useState(1)
  const [listTotalPages, setListTotalPages] = useState(0)
  const [listTotal, setListTotal] = useState(0)
  const LISTINGS_PER_PAGE = 3

  const fetchListingsPage = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const agent = await agentsApi.getCurrent()
      if (!agent?.id) {
        setLoading(false)
        return
      }
      const res = await propertiesApi.getByAgentIdPaginated(agent.id, page, LISTINGS_PER_PAGE)
      const properties = res.data ?? []
      setRecentProperties(properties)
      setListPage(res.current_page)
      setListTotalPages(res.last_page)
      setListTotal(res.total)
      const transformedListings: ListingData[] = properties.map((property: Property) => {
        const area = property.area ? `${property.area}${property.floor_area_unit || ' sqm'}` : 'N/A'
        const price = property.price_type
          ? `₱${property.price.toLocaleString('en-US')}/${property.price_type}`
          : `₱${property.price.toLocaleString('en-US')}/month`
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

  const fetchAgentData = useCallback(() => {
    return fetchListingsPage(listPage)
  }, [fetchListingsPage, listPage])

  const fetchDashboardStats = useCallback(async () => {
    try {
      const dashboardStats = await agentsApi.getDashboardStats()
      setStats({
        totalListings: dashboardStats.total_listings,
        activeListings: dashboardStats.active_listings,
        totalRevenue: dashboardStats.total_revenue,
        unreadMessages: dashboardStats.unread_messages,
        totalViews: dashboardStats.total_views ?? 0,
        totalInquiries: dashboardStats.total_inquiries ?? 0,
      })
      setMonthlyListings({
        labels: dashboardStats.monthly_listings?.labels ?? [],
        counts: dashboardStats.monthly_listings?.counts ?? [],
        total: dashboardStats.monthly_listings?.total ?? 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchRecentMessages = useCallback(async () => {
    try {
      const res = await messagesApi.getAll({})
      setRecentMessages(Array.isArray(res.data) ? res.data.slice(0, 5) : [])
    } catch {
      setRecentMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchListingsPage(listPage)
  }, [listPage, fetchListingsPage])

  useEffect(() => {
    fetchDashboardStats()
    fetchRecentMessages()
  }, [fetchDashboardStats, fetchRecentMessages])

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

  const formatMessageDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const chartLabels = monthlyListings.labels.length > 0 ? monthlyListings.labels : ['—', '—', '—', '—', '—', '—', '—']
  const chartCounts = monthlyListings.counts.length > 0 ? monthlyListings.counts : [0, 0, 0, 0, 0, 0, 0]
  const maxChartValue = Math.max(...chartCounts, 1)

  // Pagination: build page numbers to show (e.g. 1 ... 3 4 5 ... 7)
  const getPaginationPages = (): (number | 'ellipsis')[] => {
    const total = listTotalPages
    if (total <= 1) return []
    const current = listPage
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
  const paginationPages = getPaginationPages()

  return (
    <>

        {/* Top row: 4 stat cards - all from backend */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Views', value: statsLoading ? '...' : stats.totalViews, key: 'views', icon: 'map' as const },
            { label: 'Total Properties', value: statsLoading ? '...' : stats.totalListings, key: 'properties', icon: 'map' as const },
            { label: 'Total Inquires', value: statsLoading ? '...' : stats.totalInquiries, key: 'inquiries', icon: 'map' as const },
            { label: 'Unread Inquires', value: statsLoading ? '...' : stats.unreadMessages, key: 'unread', icon: 'map' as const },
          ].map(({ label, value, key, icon }) => (
            <div
              key={key}
              className="relative flex flex-shrink-0 items-start justify-between rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-medium text-gray-800">{label}</h3>
                <p className="mt-1.5 text-[26px] font-bold leading-tight text-[#2563eb]">{value}</p>
              </div>
              <div className="flex flex-shrink-0 items-center justify-center rounded-lg bg-[#2563eb] p-3 shadow-[0_2px_6px_rgba(37,99,235,0.35)]">
                {icon === 'map' ? (
                  <FiMapPin className="h-6 w-6 text-white" aria-hidden />
                ) : (
                  <FiFileText className="h-6 w-6 text-white" aria-hidden />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Middle row: Monthly Listings chart (left) + Recent Messages (right), side by side */}
        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          {/* Monthly Listings chart - from backend (last 7 days) */}
          <div className="relative flex flex-shrink-0 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-gray-800">
              Monthly Listings: {statsLoading ? '...' : monthlyListings.total}
            </h2>
            <div className="flex items-end gap-4" style={{ minHeight: 200 }}>
              <div className="flex flex-col justify-between pb-7 text-right text-xs text-gray-400" style={{ height: 200 }}>
                {[7, 6, 5, 4, 3, 2, 1].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
              <div className="flex flex-1 items-end justify-between gap-2">
                {chartLabels.map((label, i) => (
                  <div key={`${label}-${i}`} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full max-w-[48px] rounded-t bg-[#2563eb] transition-all"
                      style={{
                        height: `${(chartCounts[i] ?? 0) / maxChartValue * 180}px`,
                        minHeight: (chartCounts[i] ?? 0) ? 10 : 4,
                      }}
                    />
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-gray-500">
              {statsLoading ? '...' : monthlyListings.total} Listings
            </p>
          </div>

          {/* Recent Messages - card beside graph, match image layout */}
          <div className="relative flex min-w-0 flex-shrink-0 flex-col rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Recent Messages</h2>
              <Link href="/agent/inbox" className="text-sm text-[#2563eb] hover:underline">View All</Link>
            </div>
            <div className="flex flex-col">
              {messagesLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading messages...</div>
              ) : recentMessages.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">No messages yet.</div>
              ) : (
                recentMessages.map((msg, idx) => (
                  <Link
                    key={msg.id}
                    href="/agent/inbox"
                    className="flex items-start gap-3 border-b border-gray-100 py-4 last:border-b-0 hover:bg-gray-50/60"
                  >
                    <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                      <img
                        src={ASSETS.PLACEHOLDER_PROFILE || '/images/placeholder-avatar.png'}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-gray-800">{msg.sender_name}</span>
                        <span className="flex-shrink-0 text-xs text-gray-500">{formatMessageDate(msg.created_at)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-gray-500">{msg.message}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Listings - full width card with View All Properties */}
        <div className="mb-8">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Listings</h2>
              <Link
                href="/agent/listings"
                className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
              >
                View All Properties
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="h-40 w-full animate-pulse overflow-hidden rounded-xl bg-gray-200 sm:h-44" />
                    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                      <span className="block h-4 w-3/4 rounded bg-gray-200" />
                      <span className="block h-3 w-full rounded bg-gray-100" />
                      <span className="block h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                  </div>
                ))
              ) : listings.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No listings yet. Create your first listing!</div>
              ) : (
                listings.map((listing) => {
                  const property = recentProperties.find((p) => p.id === listing.id) ?? null
                  const location =
                    property?.location ||
                    property?.street_address ||
                    property?.city ||
                    'Address not available'

                  return (
                    <PropertyMapPopupCard
                      key={listing.id || listing.title}
                      id={listing.id}
                      title={listing.title}
                      type={property?.type ?? null}
                      location={location}
                      priceLabel={listing.price}
                      imageUrl={listing.image}
                    />
                  )
                })
              )}
            </div>
            {listTotalPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
                <button
                  type="button"
                  disabled={listPage <= 1}
                  onClick={() => setListPage((p) => Math.max(1, p - 1))}
                  className="rounded p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:hover:bg-transparent"
                  aria-label="Previous page"
                >
                  &lt;
                </button>
                {paginationPages.map((p, i) =>
                  p === 'ellipsis' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setListPage(p)}
                      className={`min-w-[2rem] rounded px-2 py-1 text-sm font-medium transition-colors ${
                        listPage === p
                          ? 'bg-[#2563eb] text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  disabled={listPage >= listTotalPages}
                  onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
                  className="rounded p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:hover:bg-transparent"
                  aria-label="Next page"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>
     
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
    </>
  )
}
