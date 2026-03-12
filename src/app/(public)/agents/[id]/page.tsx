'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import HorizontalPropertyCard from '@/components/common/HorizontalPropertyCard'
import { propertiesApi, agentsApi, messagesApi } from '@/api'
import type { Property } from '@/types'
import type { PaginatedResponse } from '@/api/types'
import type { Agent } from '@/api/endpoints/agents'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar, resolveImageUrl } from '@/utils/imageResolver'
import { EmptyState, EmptyStateAction } from '@/components/common'
import Pagination from '@/components/common/Pagination'
import { FiPhone, FiMail } from 'react-icons/fi'

export default function AgentDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const agentId = Number(id)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<Agent | null>(null)

  useEffect(() => {
    const fetchAgentAndProperties = async () => {
      try {
        const agents = await agentsApi.getAll()
        const foundAgent = agents.find(a => a.id === agentId)
        if (!foundAgent) {
          setAgent(null)
          setProperties([])
          setLoading(false)
          return
        }
        setAgent(foundAgent)
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
        setAgent(null)
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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
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

  const agentName = agent?.full_name || 
    (agent?.first_name || agent?.last_name
      ? `${agent.first_name || ''} ${agent.last_name || ''}`.trim()
      : 'Unknown Agent')
  const agencyName = agent?.agency_name || agent?.company_name || 'CondorHome RealEstate Agency'
  const agentPhone = agent?.phone || '099548238356'
  const agentEmail = agent?.email || 'locaylocay@gmail.com'
  const agentWhatsApp = agent?.whatsapp || '+44 20 7946 0958'
  const agentDescription = agent?.description || 'Beautiful corner suite with modern amenities, floor-to-ceiling windows, and stunning city views. Located in the heart of IT Park with easy access to shopping, dining, and transportation.'

  const filteredAndSortedProperties = useMemo(() => {
    if (!agent) return []
    return [...properties].sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
      return dateB - dateA // newest first
    })
  }, [properties, agent])

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedProperties.length / itemsPerPage)
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedProperties.slice(startIndex, endIndex)
  }, [filteredAndSortedProperties, currentPage, itemsPerPage])

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

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
    if (!agent) return
    try {
      await messagesApi.send({
        recipient_id: agent.id,
        sender_name: formData.name,
        sender_email: formData.email,
        sender_phone: formData.phone,
        message: formData.message,
        type: 'contact',
        subject: `Contact from ${formData.name}`,
      })
      
      // Store customer profile in localStorage so inquiries link appears
      // Replace email if different, keep if same
      if (typeof window !== 'undefined') {
        try {
          const existingProfile = localStorage.getItem('temp_chat_profile_v1')
          let shouldUpdate = true
          
          if (existingProfile) {
            try {
              const parsed = JSON.parse(existingProfile)
              // Only update if email is different
              if (parsed?.email === formData.email) {
                shouldUpdate = false
              }
            } catch {
              // If parsing fails, update anyway
            }
          }
          
          if (shouldUpdate) {
            const profile = {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            }
            localStorage.setItem('temp_chat_profile_v1', JSON.stringify(profile))
            // Trigger storage event to update navbar
            window.dispatchEvent(new Event('storage'))
          }
        } catch {
          // ignore localStorage errors
        }
      }
      
      alert('Message sent successfully!')
      setFormData({ name: '', phone: '', email: '', message: '' })
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(error.response?.data?.message || 'Failed to send message. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-10 px-6 sm:px-10 lg:px-20">
          <p className="text-gray-600 text-sm sm:text-base">Loading agent profile...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 sm:px-10 lg:px-20 py-4 bg-white">
          <nav className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
            <Link href="/properties" className="text-blue-600 hover:text-blue-800">Properties</Link>
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

  const reviewsCount = reviews.length
  const agentProfileUrl = typeof window !== 'undefined' ? `${window.location.origin}/agents/${agentId}` : ''
  const companyImage = agent?.company_image ? resolveImageUrl(agent.company_image) : null

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Breadcrumb - matching news details page */}
      <section className="w-full bg-white page-x pt-4 pb-5">
        <div className="page-w">
          <nav className="flex items-center gap-2 text-sm mb-4 flex-wrap" aria-label="Breadcrumb">
            <Link href="/properties" className="text-gray-500 hover:text-gray-800 font-outfit transition-colors">
              Properties
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-[#205ED7] font-outfit truncate max-w-xs sm:max-w-none" title={agentName}>
              {agentName}
            </span>
          </nav>
        </div>
      </section>

      <main className="page-x py-6 sm:py-8">
        <div className="page-w">

          {/* Two-column layout: Agent Profile (left) and Contact Form (right) */}
          <section className="mb-6 sm:mb-8 md:mb-10" aria-label="Agent profile">
            <div className="grid grid-cols-1 lg:grid-cols-[75%_25%] gap-6 sm:gap-8 items-start">
              {/* Left Column: Agent Profile */}
              <div >
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 relative">
                {/* QR Code - Absolute Position Top Right */}
                {agentProfileUrl && (
                  <div className="absolute top-7 right-7 z-10">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 bg-white border-2 border-gray-300 rounded flex items-center justify-center shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(agentProfileUrl)}`}
                        alt="QR code to agent profile"
                        className="w-full h-full rounded object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col pb-5 sm:flex-row gap-6 w-full">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={getAgentImageUrl(agent.image || agent.avatar || agent.profile_image)}
                        alt={agentName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div
                        className="w-full h-full flex items-center justify-center text-blue-600 font-semibold text-2xl hidden"
                        style={{ backgroundColor: '#E5E7EB' }}
                      >
                        {getInitials(agentName)}
                      </div>
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                      {agentName}
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base mb-4">
                      {agencyName}
                    </p>

                    {/* Contact Information */}
                    <div className="space-y-2 mb-4">
                      {agentPhone && (
                        <div className="flex items-center gap-2">
                          <FiPhone className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <a href={`tel:${agentPhone}`} className="text-orange-500 text-sm sm:text-base hover:underline">
                            {agentPhone}
                          </a>
                        </div>
                      )}
                      {agentEmail && (
                        <div className="flex items-center gap-2">
                          <FiMail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <a href={`mailto:${agentEmail}`} className="text-blue-600 text-sm sm:text-base hover:underline">
                            {agentEmail}
                          </a>
                        </div>
                      )}
                      {agentWhatsApp && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          <a href={`https://wa.me/${agentWhatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-500 text-sm sm:text-base hover:underline">
                            {agentWhatsApp}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Listings and Reviews Counts - Blue Button Design with Company Image */}
                    <div className="flex items-center justify-between gap-3 mb-4 w-full">
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => setActiveTab('listing')}
                          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          {properties.length} Listings
                        </button>
                        <button
                          onClick={() => setActiveTab('reviews')}
                          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          {reviewsCount} Reviews
                        </button>
                      </div>
                        {/* Company Image - at the right */}
                        {companyImage && (
                          <div className=" absolute bottom-77 right-7">
                            <img
                              src={companyImage}
                              alt={agencyName}
                              className="h-20 w-auto object-contain max-w-[350px]"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* About Me Section */}
                <div className="pt-6 border-t border-gray-200" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <h2 className="text-lg font-bold text-gray-800 mb-3">About Me</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {agentDescription}
                  </p>
                </div>
                </div>
                {/* Listings Container - Matched to profile container width */}
          <div className="grid grid-cols-1  gap-6 sm:gap-8">
            
            <section id="listings" >
            <div className="flex items-center my-5 w-full">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('listing')}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation rounded ${activeTab === 'listing' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:text-gray-800 border border-gray-300'}`}
                  type="button"
                >
                  {properties.length} Listings
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 font-semibold transition-colors whitespace-nowrap text-sm sm:text-base touch-manipulation rounded ${activeTab === 'reviews' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:text-gray-800 border border-gray-300'}`}
                  type="button"
                >
                  {reviewsCount} Reviews
                </button>
              </div>

              <div style={{ flex: 1, marginLeft: '1.5rem', borderTop: '1px solid #E5E7EB' }} />
            </div>
            {activeTab === 'listing' ? (
              <div className="min-w-0 bg-white rounded-xl shadow-md p-4 sm:p-6 scroll-mt-4 sm:scroll-mt-6">
                <div className={`min-w-0 overflow-hidden space-y-4 sm:space-y-6`}>
                  {paginatedProperties.length > 0 ? (
                    paginatedProperties.map((p) => {
                      const propertySize = p.area ? `${p.area} sqft` : `${(p.bedrooms * 15 + p.bathrooms * 5)} sqft`
                      const mainImg = p.image_url || p.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                      const images = (p.images_url && p.images_url.length > 0) ? [mainImg, ...(p.images_url || []).filter((u): u is string => !!u && u !== mainImg)] : undefined
                      const agentImage = agent.image || agent.avatar || agent.profile_image
                      const agentImageUrl = agentImage ? getAgentImageUrl(agentImage) : undefined
                      const priceUnit = p.listing_type === 'for_sale' ? undefined : (formatPriceType(p.price_type) ? `/${formatPriceType(p.price_type)}` : '/mo')
                      return (
                        <div key={p.id} className="min-w-0 w-full [&>article]:min-w-0 [&>article]:w-full [&>article]:max-w-full">
                          <HorizontalPropertyCard id={p.id} propertyType={p.type} listingType={p.listing_type as 'for_rent' | 'for_sale' | null} date={formatDate(p.published_at)} price={formatPrice(p.price)} priceUnit={priceUnit} title={p.title} description={p.description || undefined} image={mainImg} images={images} rentManagerName={agentName} rentManagerRole="Agent" rentManagerImage={agentImageUrl} rentManagerEmail={agentEmail} rentManagerWhatsApp={agentWhatsApp} companyImage={companyImage || undefined} bedrooms={p.bedrooms} bathrooms={p.bathrooms} parking={0} propertySize={propertySize} location={p.location} city={p.city} streetAddress={p.street_address} stateProvince={p.state_province} />
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
            </section>

            {/* Pagination - Outside listings container, below it */}
            {activeTab === 'listing' && filteredAndSortedProperties.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredAndSortedProperties.length}
                itemsPerPage={itemsPerPage}
                showInfo={false}
                className="mt-4"
              />
            )}
          <div></div>
          </div>
              </div>
              
              {/* Right Column: Contact Form */}
              <aside
                id="contact-manager"
                className="rounded-xl overflow-hidden bg-white shadow-sm scroll-mt-4 sm:scroll-mt-6"
                style={{ border: '1px solid #e5e7eb' }}
              >
                <div className="bg-[#205ed7] text-white px-5 py-3 font-semibold text-base">
                  Contact {agentName.split(' ')[agentName.split(' ').length - 1]}
                </div>
                <div className="p-5">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Isaac Locaylocay"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]"
                        style={{ border: '1px solid #d1d5db' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your number</label>
                      <div className="flex items-center rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#205ed7]" style={{ border: '1px solid #d1d5db' }}>
                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 flex-shrink-0" style={{ borderRight: '1px solid #d1d5db' }}>
                          <span className="text-base leading-none">🇵🇭</span>
                          <span className="text-sm text-gray-600">+63</span>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="(999) 1231-2131"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2.5 text-sm border-none  bg-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your email</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="isaaclocaylocay@gmail.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]"
                        style={{ border: '1px solid #d1d5db' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your message</label>
                      <textarea
                        name="message"
                        placeholder="I'm interested in this property and I'd like to know more details."
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]"
                        rows={4}
                        style={{ minHeight: '100px', resize: 'vertical', border: '1px solid #d1d5db' }}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#205ed7] text-white py-3 rounded-lg font-semibold hover:bg-[#1a4bb5] transition-colors text-sm"
                    >
                      Send Inquiry
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          </section>

          
        </div>
      </main>
      <Footer />
    </div>
  )
}