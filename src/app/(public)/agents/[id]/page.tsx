'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import HorizontalPropertyCard from '@/components/common/HorizontalPropertyCard'
import VerticalPropertyCard from '@/components/common/VerticalPropertyCard'
import { propertiesApi, agentsApi, messagesApi } from '@/api'
import type { Property } from '@/types'
import type { PaginatedResponse } from '@/api/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import PageHeader from '@/components/layout/PageHeader'
import DigitalProfileCard from '@/components/common/DigitalProfileCard'
import { EmptyState, EmptyStateAction } from '@/components/common'

export default function AgentDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const agentId = Number(id)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [manager, setManager] = useState<{ id: number; name: string; role: string; listings: Property[]; image?: string | null } | null>(null)

  useEffect(() => {
    const fetchAgentAndProperties = async () => {
      try {
        const agents = await agentsApi.getAll()
        const agent = agents.find(a => a.id === agentId)
        if (!agent) {
          setManager(null)
          setProperties([])
          setLoading(false)
          return
        }
        const agentImage = agent.image || agent.avatar || agent.profile_image
        const agentName = agent.full_name ||
          (agent.first_name || agent.last_name
            ? `${agent.first_name || ''} ${agent.last_name || ''}`.trim()
            : 'Unknown Agent')
        setManager({
          id: agent.id,
          name: agentName,
          role: 'Agent',
          listings: [],
          image: agentImage
        })
        const allPropertiesResponse = await propertiesApi.getAll()
        const allProperties: Property[] = Array.isArray(allPropertiesResponse)
          ? allPropertiesResponse
          : (allPropertiesResponse as PaginatedResponse<Property>).data || []
        const managerProperties = allProperties.filter(p => {
          const propertyAgentId = (p as any).agent_id
          if (propertyAgentId === agentId) return true
          const propertyAgent = (p as any).agent
          if (propertyAgent?.id === agentId) return true
          if (p.rent_manager?.id === agentId) return true
          return false
        })
        setProperties(managerProperties)
      } catch (error) {
        console.error('Error fetching agent and properties:', error)
        setManager(null)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    if (Number.isFinite(agentId)) {
      fetchAgentAndProperties()
    }
  }, [agentId])

  const [activeTab, setActiveTab] = useState<'listing' | 'reviews'>('listing')
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [moreFilters, setMoreFilters] = useState({
    propertyType: 'all',
    bedrooms: 'all',
    bathrooms: 'all',
    parking: 'all',
  })
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: '',
  })

  const formatPrice = (price: number): string => `₱${price.toLocaleString('en-US')}`
  const formatPriceType = (priceType: string | null | undefined): string | undefined => {
    if (!priceType) return undefined
    return priceType.charAt(0).toUpperCase() + priceType.slice(1).toLowerCase()
  }
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Date not available'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const getAgentImageUrl = (imagePath: string | null | undefined): string =>
    resolveAgentAvatar(imagePath, agentId)
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const filteredAndSortedProperties = useMemo(() => {
    if (!manager) return []
    let filtered = [...properties]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query)
      )
    }
    if (priceFilter !== 'all') {
      filtered = filtered.filter(p => {
        const price = p.price
        switch (priceFilter) {
          case 'under-20k': return price < 20000
          case '20k-40k': return price >= 20000 && price < 40000
          case '40k-60k': return price >= 40000 && price < 60000
          case '60k-80k': return price >= 60000 && price < 80000
          case 'over-80k': return price >= 80000
          default: return true
        }
      })
    }
    if (moreFilters.propertyType !== 'all') filtered = filtered.filter(p => p.type === moreFilters.propertyType)
    if (moreFilters.bedrooms !== 'all') filtered = filtered.filter(p => p.bedrooms === parseInt(moreFilters.bedrooms))
    if (moreFilters.bathrooms !== 'all') filtered = filtered.filter(p => p.bathrooms === parseInt(moreFilters.bathrooms))
    filtered.sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
    return filtered
  }, [properties, searchQuery, priceFilter, sortOrder, moreFilters, manager])

  const reviews = [
    { id: 1, reviewerName: 'Sarah Johnson', rating: 5, date: 'Jan 20, 2026', comment: 'Excellent service! Very professional and responsive. They helped us find the perfect property quickly and handled all the paperwork smoothly.' },
    { id: 2, reviewerName: 'Michael Chen', rating: 5, date: 'Jan 15, 2026', comment: 'Outstanding agent! They made the entire rental process stress-free. Highly recommend their services.' },
  ]
  const overallRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const roundedRating = Math.round(overallRating * 10) / 10

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manager) return
    try {
      await messagesApi.send({
        recipient_id: manager.id,
        sender_name: `${formData.firstName} ${formData.lastName}`,
        sender_email: formData.email,
        sender_phone: formData.phone,
        message: formData.message,
        type: 'contact',
        subject: `Contact from ${formData.firstName} ${formData.lastName}`,
      })
      alert('Message sent successfully!')
      setFormData({ firstName: '', lastName: '', phone: '', email: '', message: '' })
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(error.response?.data?.message || 'Failed to send message. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="AGENT PROFILE" />
        <div className="text-center py-10 px-6 sm:px-10 lg:px-20">
          <p className="text-gray-600 text-sm sm:text-base">Loading agent profile...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!manager) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="AGENT PROFILE" />
        <div className="px-6 sm:px-10 lg:px-20 py-4 bg-white">
          <nav className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            <span className="text-gray-400">&gt;</span>
            <Link href="/agents" className="text-blue-600 hover:text-blue-800">Agents</Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-600">Not Found</span>
          </nav>
        </div>
        <main className="px-6 sm:px-10 lg:px-20 py-8">
          <div className="max-w-2xl mx-auto">
            <EmptyState
              variant="notFound"
              title="Agent not found"
              description="This agent profile may have been removed or the link might be incorrect."
              action={<EmptyStateAction href="/agents" primary>Back to agents</EmptyStateAction>}
            />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const activeListingsCount = properties.length
  const totalSold = '1,276'
  const yearsExperience = '8+'
  const networkSize = '729'

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <main className="px-6 sm:px-10 lg:px-20 min-w-0">
        <div className="mx-auto max-w-full min-w-0">
          {/* Breadcrumb - mobile friendly */}
          <nav className="py-3 sm:py-4 flex items-center gap-2 text-xs sm:text-sm flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            <span className="text-gray-400" aria-hidden="true">&gt;</span>
            <Link href="/agents" className="text-blue-600 hover:text-blue-800">Agents</Link>
            <span className="text-gray-400" aria-hidden="true">&gt;</span>
            <span className="text-gray-600 truncate max-w-[140px] sm:max-w-none" title={manager.name}>{manager.name}</span>
          </nav>

          {/* Profile hero - gradient background with three translucent containers */}
          <section
            className="relative mb-6 sm:mb-8 md:mb-10 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-[150px] bg-gradient-to-r from-blue-700 via-blue-500 to-orange-400"
            aria-label="Agent profile hero"
          >
            <div className="mx-auto px-6 sm:px-10 lg:px-20 py-8 sm:py-10 md:py-12" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 40%, #f97316 100%)' }}>
              {/* Top row: 3 columns on large screens */}
              <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
                {/* Left column: avatar + main info + company + QR */}
                <div className="relative bg-white/10 backdrop-blur-md rounded-3xl px-5 sm:px-6 md:px-7 lg:px-8 py-5 sm:py-6 md:py-7 shadow-lg">
                  {/* Company badge in top-right */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-right">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                      <span className="text-[10px] sm:text-xs font-semibold text-blue-700">
                        Company
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <p className="m-0 text-xs sm:text-sm font-semibold text-white">Filipino Homes</p>
                      <p className="m-0 text-[11px] sm:text-xs text-blue-100/90">Cebu City</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-44 md:w-48 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg ring-4 ring-white/40 bg-white">
                      <img
                        src={getAgentImageUrl(manager.image)}
                        alt={manager.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-semibold text-2xl sm:text-3xl rounded-2xl hidden"
                       
                      >
                        {getInitials(manager.name)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h1 className="m-0 text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
                        {manager.name}
                      </h1>
                      <p className="m-0 mt-1 text-xs sm:text-sm md:text-base text-blue-100 font-medium">
                        Property Agent
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-blue-50 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-semibold">{roundedRating.toFixed(1)}</span>
                          <span className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < Math.round(overallRating) ? 'text-yellow-300' : 'text-blue-200/60'}`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                          </span>
                        </span>
                        <span className="opacity-80">Top Rated Agent</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href="#listings"
                      className="inline-flex items-center justify-center rounded-full bg-white text-blue-700 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold shadow-md hover:bg-blue-50 transition-colors"
                    >
                      View Listings
                    </a>
                    <a
                      href="#contact-manager"
                      className="inline-flex items-center justify-center rounded-full bg-emerald-500/90 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-emerald-400 transition-colors"
                    >
                      WhatsApp
                    </a>
                    <a
                      href="#contact-manager"
                      className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                    >
                      Email
                    </a>
                  </div>

                  {/* Bottom-right QR code */}
                  <div className="mt-5 flex items-center justify-end gap-3">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white flex items-center justify-center shadow-md">
                      <div className="w-14 h-14 border-2 border-gray-900 grid grid-cols-3 grid-rows-3 gap-0.5">
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={i}
                            className={i % 2 === 0 ? 'bg-gray-900' : 'bg-transparent'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="m-0 text-[11px] sm:text-xs text-blue-100/90">
                      Scan to view my profile
                    </p>
                  </div>
                </div>

                {/* Right column: contact form */}
                <aside
                  id="contact-manager"
                  className="bg-white/10 backdrop-blur-md rounded-3xl px-5 sm:px-6 lg:px-7 py-5 sm:py-6 lg:py-7 shadow-lg scroll-mt-4 sm:scroll-mt-6 min-w-0"
                >
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white">
                    Contact {manager.name}
                  </h3>
                  <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <input
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 sm:py-3 border border-white/40 bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm sm:text-base min-h-[44px] placeholder:text-blue-100 text-white"
                        required
                      />
                      <input
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 sm:py-3 border border-white/40 bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm sm:text-base min-h-[44px] placeholder:text-blue-100 text-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <input
                        name="phone"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 sm:py-3 border border-white/40 bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm sm:text-base min-h-[44px] placeholder:text-blue-100 text-white"
                        required
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 sm:py-3 border border-white/40 bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm sm:text-base min-h-[44px] placeholder:text-blue-100 text-white"
                        required
                      />
                    </div>
                    <textarea
                      name="message"
                      placeholder="Your message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 sm:py-3 border border-white/40 bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm sm:text-base min-h-[100px] placeholder:text-blue-100 text-white"
                      rows={4}
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-white text-blue-700 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors min-h-[44px] touch-manipulation"
                    >
                      Contact
                    </button>
                  </form>
                </aside>
              </div>

              {/* Bottom full-width stats row */}
              <div className="mt-4 sm:mt-6 lg:mt-8 max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl px-5 sm:px-6 md:px-7 lg:px-10 py-5 sm:py-6 md:py-7 shadow-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5 sm:gap-x-8 sm:gap-y-6 text-left text-xs sm:text-sm md:text-base text-blue-50">
                  <div>
                    <p className="m-0 text-[10px] sm:text-xs uppercase tracking-wide text-blue-100/80">
                      Active Listings
                    </p>
                    <p className="m-0 mt-1 text-xl sm:text-2xl font-extrabold text-white">
                      {activeListingsCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] sm:text-xs uppercase tracking-wide text-blue-100/80">
                      Total Properties Sold
                    </p>
                    <p className="m-0 mt-1 text-xl sm:text-2xl font-extrabold text-white">
                      {totalSold}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] sm:text-xs uppercase tracking-wide text-blue-100/80">
                      Years of Experience
                    </p>
                    <p className="m-0 mt-1 text-xl sm:text-2xl font-extrabold text-white">
                      {yearsExperience}
                    </p>
                  </div>
                  <div>
                    <p className="m-0 text-[10px] sm:text-xs uppercase tracking-wide text-blue-100/80">
                      Agent Network Size
                    </p>
                    <p className="m-0 mt-1 text-xl sm:text-2xl font-extrabold text-white">
                      {networkSize}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tabs + Listings */}
          <section id="listings" className="bg-white rounded-xl shadow-md p-4 sm:p-6 scroll-mt-4 sm:scroll-mt-6">
            <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              <button
                className={`flex-1 sm:flex-none min-w-0 sm:min-w-[auto] px-4 sm:px-6 py-2.5 sm:py-3 font-semibold border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation ${activeTab === 'listing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('listing')}
                type="button"
              >
                Listing ({properties.length})
              </button>
              <button
                className={`flex-1 sm:flex-none min-w-0 sm:min-w-[auto] px-4 sm:px-6 py-2.5 sm:py-3 font-semibold border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation ${activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('reviews')}
                type="button"
              >
                Reviews
              </button>
            </div>

            {activeTab === 'listing' ? (
              <div className="min-w-0">
                <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                  <div className="relative min-w-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true">🔍</span>
                    <input
                      className="w-full min-w-0 pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                      placeholder="Search properties..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <select className="flex-1 min-w-0 sm:flex-initial sm:min-w-[auto] px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]" value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                      <option value="all">All Prices</option>
                      <option value="under-20k">Under ₱20,000</option>
                      <option value="20k-40k">₱20,000 - ₱40,000</option>
                      <option value="40k-60k">₱40,000 - ₱60,000</option>
                      <option value="60k-80k">₱60,000 - ₱80,000</option>
                      <option value="over-80k">Over ₱80,000</option>
                    </select>
                    <select className="flex-1 min-w-0 sm:flex-initial sm:min-w-[auto] px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    <button type="button" onClick={() => setShowMoreFilters(!showMoreFilters)} className={`flex-1 min-w-0 sm:flex-initial sm:min-w-[auto] px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm min-h-[40px] sm:min-h-[44px] touch-manipulation ${showMoreFilters ? 'bg-blue-50 border-blue-500' : ''}`}>
                      More Filters
                    </button>
                    <div className="flex gap-1 border border-gray-300 rounded-lg p-1 shrink-0">
                      <button type="button" aria-label="List view" onClick={() => setViewMode('horizontal')} className={`p-2 rounded transition-colors touch-manipulation ${viewMode === 'horizontal' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                      <button type="button" aria-label="Grid view" onClick={() => setViewMode('vertical')} className={`p-2 rounded transition-colors touch-manipulation ${viewMode === 'vertical' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                      </button>
                    </div>
                  </div>

                  {showMoreFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div><label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-700">Property Type</label><select className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={moreFilters.propertyType} onChange={(e) => setMoreFilters({ ...moreFilters, propertyType: e.target.value })}><option value="all">All Types</option><option value="Condominium">Condominium</option><option value="Apartment">Apartment</option><option value="House">House</option><option value="Studio">Studio</option><option value="TownHouse">TownHouse</option><option value="Commercial Spaces">Commercial Spaces</option><option value="Bed Space">Bed Space</option></select></div>
                      <div><label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-700">Bedrooms</label><select className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={moreFilters.bedrooms} onChange={(e) => setMoreFilters({ ...moreFilters, bedrooms: e.target.value })}><option value="all">All</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></div>
                      <div><label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-700">Bathrooms</label><select className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={moreFilters.bathrooms} onChange={(e) => setMoreFilters({ ...moreFilters, bathrooms: e.target.value })}><option value="all">All</option><option value="1">1</option><option value="2">2</option><option value="3">3+</option></select></div>
                      <div><label className="block text-xs sm:text-sm font-semibold mb-1.5 text-gray-700">Parking</label><select className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={moreFilters.parking} onChange={(e) => setMoreFilters({ ...moreFilters, parking: e.target.value })}><option value="all">All</option><option value="0">0</option><option value="1">1</option><option value="2">2+</option></select></div>
                    </div>
                  )}
                </div>

                <div className={`mt-4 sm:mt-6 min-w-0 overflow-hidden ${viewMode === 'vertical' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-4 sm:space-y-6'}`}>
                  {filteredAndSortedProperties.length > 0 ? (
                    filteredAndSortedProperties.map((p) => {
                      const propertySize = p.area ? `${p.area} sqft` : `${(p.bedrooms * 15 + p.bathrooms * 5)} sqft`
                      const mainImg = p.image_url || p.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                      const images = (p.images_url && p.images_url.length > 0) ? [mainImg, ...(p.images_url || []).filter((u): u is string => !!u && u !== mainImg)] : undefined
                      const managerImage = manager.image ? getAgentImageUrl(manager.image) : undefined
                      return viewMode === 'horizontal' ? (
                        <div key={p.id} className="min-w-0 w-full [&>article]:min-w-0 [&>article]:w-full [&>article]:max-w-full">
                          <HorizontalPropertyCard id={p.id} propertyType={p.type} date={formatDate(p.published_at)} price={formatPrice(p.price)} title={p.title} image={mainImg} images={images} rentManagerName={manager.name} rentManagerRole={manager.role} rentManagerImage={managerImage} bedrooms={p.bedrooms} bathrooms={p.bathrooms} parking={0} propertySize={propertySize} location={p.location} city={p.city} streetAddress={p.street_address} stateProvince={p.state_province} />
                        </div>
                      ) : (
                        <div key={p.id} className="w-full min-w-0 [&>article]:w-full [&>article]:min-w-0 [&>article]:max-w-full">
                          <VerticalPropertyCard id={p.id} propertyType={p.type} priceType={formatPriceType(p.price_type)} price={formatPrice(p.price)} title={p.title} image={mainImg} images={images} rentManagerName={manager.name} rentManagerRole={manager.role} rentManagerImage={managerImage} bedrooms={p.bedrooms} bathrooms={p.bathrooms} parking={0} propertySize={propertySize} location={p.location} city={p.city} streetAddress={p.street_address} stateProvince={p.state_province} />
                        </div>
                      )
                    })
                  ) : (
                    <EmptyState
                      variant="empty"
                      title="No properties listed"
                      description="This agent doesn't have any listed properties at the moment."
                      compact
                    />
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200">
                  <div className="text-center"><div className="text-3xl sm:text-4xl font-bold text-gray-800">{roundedRating}</div><div className="text-xs sm:text-sm text-gray-500">out of 5</div></div>
                  <div className="flex items-center gap-1 justify-center sm:justify-start">{[...Array(5)].map((_, i) => (<div key={i} className="relative"><svg width="28" height="28" className="sm:w-8 sm:h-8 text-gray-300" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1" /></svg><div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${i < Math.floor(overallRating) ? 100 : i === Math.floor(overallRating) && overallRating % 1 !== 0 ? (overallRating % 1) * 100 : 0}%` }}><svg width="28" height="28" className="sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg></div></div>))}</div>
                  <div className="text-gray-600 text-sm sm:text-base text-center sm:text-left">{reviews.length} reviews</div>
                </div>
                <div className="space-y-4 sm:space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2 sm:mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base">{review.reviewerName.charAt(0)}</div>
                          <div><div className="font-semibold text-gray-800 text-sm sm:text-base">{review.reviewerName}</div><div className="text-xs sm:text-sm text-gray-500">{review.date}</div></div>
                        </div>
                        <div className="flex gap-1">{[...Array(5)].map((_, i) => (<svg key={i} width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill={i < review.rating ? '#FBBF24' : '#E5E7EB'}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>))}</div>
                      </div>
                      <div className="text-gray-600 leading-relaxed text-sm sm:text-base">{review.comment}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation text-sm" type="button">←</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm touch-manipulation" type="button">1</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm touch-manipulation" type="button">→</button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
