'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/layout/Navbar'
import Footer from '../../../components/layout/Footer'
import HorizontalPropertyCard from '../../../components/common/HorizontalPropertyCard'
import VerticalPropertyCard from '../../../components/common/VerticalPropertyCard'
import { propertiesApi, agentsApi, messagesApi } from '../../../api'
import { getApiBaseUrl } from '../../../config/api'
import type { Property } from '../../../types'
import type { Agent } from '../../../api/endpoints/agents'
import type { PaginatedResponse } from '../../../api/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import PageHeader from '../../../components/layout/PageHeader'
// import './page.css' // Removed - converted to Tailwind

export default function RentManagerDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const managerId = Number(id)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [manager, setManager] = useState<{ id: number; name: string; role: string; listings: Property[]; image?: string | null } | null>(null)

  useEffect(() => {
    const fetchManagerAndProperties = async () => {
      try {
        // First, fetch the agent directly from the agents API
        const agents = await agentsApi.getAll()
        const agent = agents.find(a => a.id === managerId)
        
        if (!agent) {
          // Agent not found
          setManager(null)
          setProperties([])
          setLoading(false)
          return
        }
        
        // Set manager info from agent
        const agentImage = agent.image || agent.avatar || agent.profile_image
        // Construct name from full_name, or first_name + last_name, or fallback
        const agentName = agent.full_name || 
          (agent.first_name || agent.last_name 
            ? `${agent.first_name || ''} ${agent.last_name || ''}`.trim()
            : 'Unknown Agent')
        setManager({
          id: agent.id,
          name: agentName,
          role: 'Rent Manager', // All agents from backend are approved, so they're rent managers
          listings: [],
          image: agentImage
        })
        
        // Now fetch properties and filter by agent ID
        const allPropertiesResponse = await propertiesApi.getAll()
        
        // Handle both array response and paginated response
        const allProperties: Property[] = Array.isArray(allPropertiesResponse)
          ? allPropertiesResponse
          : (allPropertiesResponse as PaginatedResponse<Property>).data || []
        
        // Filter properties by agent ID - check both agent and rent_manager for backward compatibility
        const managerProperties = allProperties.filter(p => {
          // Check agent_id field
          const propertyAgentId = (p as any).agent_id
          if (propertyAgentId === managerId) return true
          
          // Check agent relationship
          const propertyAgent = (p as any).agent
          if (propertyAgent?.id === managerId) return true
          
          // Check rent_manager relationship (legacy)
          if (p.rent_manager?.id === managerId) return true
          
          return false
        })
        
        setProperties(managerProperties)
      } catch (error) {
        console.error('Error fetching manager and properties:', error)
        setManager(null)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    if (Number.isFinite(managerId)) {
      fetchManagerAndProperties()
    }
  }, [managerId])

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

  // Helper functions
  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString('en-US')}`
  }

  // Helper function to format price type
  const formatPriceType = (priceType: string | null | undefined): string | undefined => {
    if (!priceType) return undefined
    // Capitalize first letter and make rest lowercase for consistency
    return priceType.charAt(0).toUpperCase() + priceType.slice(1).toLowerCase()
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Date not available'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

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

  // Helper function to get agent image URL using the resolver
  const getAgentImageUrl = (imagePath: string | null | undefined): string => {
    return resolveAgentAvatar(imagePath, managerId)
  }

  // Helper function to get initials for fallback avatar
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Filter and sort properties - must be called before any conditional returns
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
          case 'under-20k':
            return price < 20000
          case '20k-40k':
            return price >= 20000 && price < 40000
          case '40k-60k':
            return price >= 40000 && price < 60000
          case '60k-80k':
            return price >= 60000 && price < 80000
          case 'over-80k':
            return price >= 80000
          default:
            return true
        }
      })
    }

    if (moreFilters.propertyType !== 'all') {
      filtered = filtered.filter(p => p.type === moreFilters.propertyType)
    }
    if (moreFilters.bedrooms !== 'all') {
      const beds = parseInt(moreFilters.bedrooms)
      filtered = filtered.filter(p => p.bedrooms === beds)
    }
    if (moreFilters.bathrooms !== 'all') {
      const baths = parseInt(moreFilters.bathrooms)
      filtered = filtered.filter(p => p.bathrooms === baths)
    }
    // Parking filter - disabled for now, will be used later
    // if (moreFilters.parking !== 'all') {
    //   const park = parseInt(moreFilters.parking)
    //   filtered = filtered.filter(p => p.parking === park)
    // }

    filtered.sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [properties, searchQuery, priceFilter, sortOrder, moreFilters, manager])

  const reviews = [
    {
      id: 1,
      reviewerName: 'Sarah Johnson',
      rating: 5,
      date: 'Jan 20, 2026',
      comment: 'Excellent service! Glaiza and Jerome were very professional and responsive. They helped us find the perfect property quickly and handled all the paperwork smoothly.',
    },
    {
      id: 2,
      reviewerName: 'Michael Chen',
      rating: 5,
      date: 'Jan 15, 2026',
      comment: 'Outstanding rent managers! They made the entire rental process stress-free. Highly recommend their services.',
    },
  ]

  const overallRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const roundedRating = Math.round(overallRating * 10) / 10

  // Handler functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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

  // Conditional returns - must come after all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageHeader title="MY LISTING" />
        <div className="text-center py-10 px-6 md:px-10 lg:px-[150px]">
          <p>Loading rent manager details...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!manager) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageHeader title="MY LISTING" />

        <div className="px-6 md:px-10 lg:px-[150px] py-4 bg-white">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
            <span className="text-gray-400">&gt;</span>
            <Link href="/rent-managers" className="text-blue-600 hover:text-blue-800">RM</Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-600">Not Found</span>
          </div>
        </div>
        <main className="px-6 md:px-10 lg:px-[150px] py-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Rent Manager not found</h2>
              <p className="text-gray-600 mb-6">Please go back and select a valid rent manager.</p>
              <Link className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" href="/rent-managers">Back to Rent Managers</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="px-6 md:px-10 lg:px-[150px] py-8">
        <div className="mx-auto">
          {/* Top Section - Profile and Contact Form */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <img 
                    src={getAgentImageUrl(manager.image)} 
                    alt={manager.name}
                    className="w-24 h-24 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                  <div 
                    className="w-24 h-24 rounded-lg bg-blue-600 flex items-center justify-center text-white text-2xl font-bold hidden"
                  >
                    <span>{getInitials(manager.name)}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{manager.name}</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{manager.role}</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{properties.length} Listings</span>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="w-16 h-16 bg-white border-2 border-gray-300 rounded"></div>
                </div>
              </div>

              {/* Awards/Badges */}
              <div className="flex gap-2 mb-6">
                <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <span>⭐</span>
                  <span>CUSTOMER'S CHOICE</span>
                </div>
                <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <span>⭐</span>
                  <span>5 STAR RENT MANAGER</span>
                </div>
              </div>

              {/* About Section */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">ABOUT US</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {manager.name} is a {manager.role} with {properties.length} property listings.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-600">Proven Expertise: Skilled in overseeing rental properties, maintaining smooth operations, and maximizing property value.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-600">Strong Credentials: Knowledgeable in landlord-tenant laws, financial management, and effective communication strategies.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-600">Client-Centered Approach: Committed to fostering positive tenant relationships and ensuring seamless property management.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <aside className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Contact {manager.name}</h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  name="message"
                  placeholder="Your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors" type="submit">Contact</button>
              </form>
            </aside>
          </section>

          {/* Tabs Section */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'listing' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('listing')}
                type="button"
              >
                Listing ({properties.length})
              </button>
              <button
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'reviews' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('reviews')}
                type="button"
              >
                Reviews
              </button>
            </div>

            {activeTab === 'listing' ? (
              <div>
                {/* Search and Filters */}
                <div className="mb-6 space-y-4">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">🔍</span>
                    <input
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search properties by name, location"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                    >
                      <option value="all">All Prices</option>
                      <option value="under-20k">Under ₱20,000</option>
                      <option value="20k-40k">₱20,000 - ₱40,000</option>
                      <option value="40k-60k">₱40,000 - ₱60,000</option>
                      <option value="60k-80k">₱60,000 - ₱80,000</option>
                      <option value="over-80k">Over ₱80,000</option>
                    </select>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    <button
                      className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
                        showMoreFilters ? 'bg-blue-50 border-blue-500' : ''
                      }`}
                      type="button"
                      onClick={() => setShowMoreFilters(!showMoreFilters)}
                    >
                      More Filters
                    </button>
                    <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
                      <button
                        className={`p-2 rounded transition-colors ${
                          viewMode === 'horizontal' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        type="button"
                        aria-label="List View"
                        onClick={() => setViewMode('horizontal')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button
                        className={`p-2 rounded transition-colors ${
                          viewMode === 'vertical' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        type="button"
                        aria-label="Grid View"
                        onClick={() => setViewMode('vertical')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                          <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                          <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                          <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {showMoreFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Property Type</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={moreFilters.propertyType}
                          onChange={(e) => setMoreFilters({ ...moreFilters, propertyType: e.target.value })}
                        >
                          <option value="all">All Types</option>
                          <option value="Condominium">Condominium</option>
                          <option value="Apartment">Apartment</option>
                          <option value="House">House</option>
                          <option value="Studio">Studio</option>
                          <option value="TownHouse">TownHouse</option>
                          <option value="Commercial Spaces">Commercial Spaces</option>
                          <option value="Bed Space">Bed Space</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Bedrooms</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={moreFilters.bedrooms}
                          onChange={(e) => setMoreFilters({ ...moreFilters, bedrooms: e.target.value })}
                        >
                          <option value="all">All</option>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Bathrooms</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={moreFilters.bathrooms}
                          onChange={(e) => setMoreFilters({ ...moreFilters, bathrooms: e.target.value })}
                        >
                          <option value="all">All</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Parking</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={moreFilters.parking}
                          onChange={(e) => setMoreFilters({ ...moreFilters, parking: e.target.value })}
                        >
                          <option value="all">All</option>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2+</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Property Listings */}
                <div className={`mt-6 ${viewMode === 'vertical' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-4 sm:space-y-6'}`}>
                  {filteredAndSortedProperties.length > 0 ? (
                    filteredAndSortedProperties.map((p) => {
                      const propertySize = p.area 
                        ? `${p.area} sqft` 
                        : `${(p.bedrooms * 15 + p.bathrooms * 5)} sqft`
                      
                      const mainImg = p.image_url || p.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                      const images = (p.images_url && p.images_url.length > 0)
                        ? [mainImg, ...(p.images_url || []).filter((u): u is string => !!u && u !== mainImg)]
                        : undefined
                      const managerImage = manager.image ? getAgentImageUrl(manager.image) : undefined
                      return viewMode === 'horizontal' ? (
                        <HorizontalPropertyCard
                          key={p.id}
                          id={p.id}
                          propertyType={p.type}
                          date={formatDate(p.published_at)}
                          price={formatPrice(p.price)}
                          title={p.title}
                          image={mainImg}
                          images={images}
                          rentManagerName={manager.name}
                          rentManagerRole={manager.role}
                          rentManagerImage={managerImage}
                          bedrooms={p.bedrooms}
                          bathrooms={p.bathrooms}
                          parking={0}
                          propertySize={propertySize}
                          location={p.location}
                          city={p.city}
                          streetAddress={p.street_address}
                          stateProvince={p.state_province}
                        />
                      ) : (
                        <div key={p.id} className="w-full min-w-0 [&>article]:w-full [&>article]:min-w-0 [&>article]:max-w-full [&>article]:h-full">
                          <VerticalPropertyCard
                            id={p.id}
                            propertyType={p.type}
                            priceType={formatPriceType(p.price_type)}
                            price={formatPrice(p.price)}
                            title={p.title}
                            image={mainImg}
                            images={images}
                            rentManagerName={manager.name}
                            rentManagerRole={manager.role}
                            rentManagerImage={managerImage}
                            bedrooms={p.bedrooms}
                            bathrooms={p.bathrooms}
                            parking={0}
                            propertySize={propertySize}
                            location={p.location}
                            city={p.city}
                            streetAddress={p.street_address}
                            stateProvince={p.state_province}
                          />
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>No properties found matching your filters.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {/* Overall Rating */}
                <div className="flex items-center gap-8 mb-8 pb-8 border-b border-gray-200">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800">{roundedRating}</div>
                    <div className="text-sm text-gray-500">out of 5</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, index) => {
                      const starValue = index + 1
                      let fillPercentage = 0
                      if (starValue <= Math.floor(overallRating)) {
                        fillPercentage = 100
                      } else if (starValue === Math.ceil(overallRating) && overallRating % 1 !== 0) {
                        fillPercentage = (overallRating % 1) * 100
                      }

                      return (
                        <div key={index} className="relative">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="text-gray-300"
                          >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1" />
                          </svg>
                          <div
                            className="absolute top-0 left-0 overflow-hidden"
                            style={{ width: `${fillPercentage}%` }}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="#FBBF24"
                            >
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-gray-600">{reviews.length} reviews</div>
                </div>
                
                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {review.reviewerName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{review.reviewerName}</div>
                            <div className="text-sm text-gray-500">{review.date}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, index) => (
                            <svg
                              key={index}
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill={index < review.rating ? '#FBBF24' : '#E5E7EB'}
                            >
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="text-gray-600 leading-relaxed">
                        {review.comment}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t border-gray-200">
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" type="button">←</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold" type="button">1</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" type="button">2</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" type="button">3</button>
              <span className="px-2 text-gray-500">...</span>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" type="button">50</button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" type="button">→</button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

