'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '../../../../components/layout/Footer'
import VerticalPropertyCard from '@/shared/components/cards/VerticalPropertyCard'
import SharePopup, { type SharePlatform, type ShareOption } from '@/shared/components/misc/SharePopup'
import PropertyLocationMap from '@/shared/components/maps/PropertyLocationMap'
import { EmptyState, EmptyStateAction } from '@/shared/components/misc'
import { propertiesApi, messagesApi, agentsApi } from '../../../../api'
import type { Property } from '../../../../shared/types'
import { ASSETS } from '../../../../shared/utils/assets'
import { resolveAgentAvatar, resolveImageUrl } from '@/shared/utils/image'

export default function PropertyDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [fetchedAgent, setFetchedAgent] = useState<{ id: number; first_name?: string | null; last_name?: string | null; full_name?: string; verified?: boolean } | null>(null)
  const [similarProperties, setSimilarProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)

  // Inquiry form state
  const [inquiryData, setInquiryData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  })

  // Review form state
  const [reviewData, setReviewData] = useState({
    name: '',
    email: '',
    review: ''
  })

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return
      try {
        const propertyId = parseInt(id)
        if (isNaN(propertyId)) {
          console.error('Invalid property ID')
          return
        }
        const data = await propertiesApi.getById(propertyId)

        // Record a view for analytics (owner views are ignored by backend)
        try {
          void propertiesApi.recordView(propertyId)
        } catch (viewError) {
          console.error('Error recording property view:', viewError)
        }

        setProperty(data)
        setFetchedAgent(null)
        setInquiryData(prev => ({
          ...prev,
          message: `I'm Interested In This Property ${data.title} And I'd Like To Know More Details.`
        }))

        if (data.agent_id && !data.agent && !data.rent_manager) {
          try {
            const agentData = await agentsApi.getById(data.agent_id)
            setFetchedAgent(agentData)
          } catch {
            setFetchedAgent(null)
          }
        }

        const allPropertiesResponse = await propertiesApi.getAll()
        const allProperties = Array.isArray(allPropertiesResponse)
          ? allPropertiesResponse
          : allPropertiesResponse.data || []
        const similar = allProperties
          .filter((p: Property) => p.id !== propertyId && (p.type === data.type || p.location === data.location))
          .slice(0, 3)
        setSimilarProperties(similar)
      } catch (error) {
        console.error('Error fetching property:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [id])

  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString('en-US')}`
  }

  const formatPriceType = (priceType: string | null | undefined): string | undefined => {
    if (!priceType) return undefined
    return priceType.charAt(0).toUpperCase() + priceType.slice(1).toLowerCase()
  }

  const getRentManagerRole = (isOfficial: boolean | undefined): string => {
    return isOfficial ? 'Rent Manager' : 'Property Specialist'
  }

  const getImageUrl = (image: string | null | undefined): string => {
    if (!image) return ASSETS.PLACEHOLDER_PROPERTY_MAIN
    if (image.startsWith('http://') || image.startsWith('https://')) return image
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin.replace('/api', '').replace(':3000', ':8000')
        : 'http://localhost:8000'
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `${baseUrl}/${image.startsWith('/') ? image.slice(1) : image}`
    }
    if (image.startsWith('images/')) return `${baseUrl}/storage/${image}`
    return `${baseUrl}/storage/${image}`
  }

  const getPropertyImages = (property: Property): string[] => {
    const images: string[] = []
    if (property.images_url && Array.isArray(property.images_url) && property.images_url.length > 0) {
      property.images_url.forEach(img => { if (img) images.push(img) })
    } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      property.images.forEach(img => { if (img) images.push(getImageUrl(img)) })
    }
    if (images.length === 0) {
      const mainImage = property.image_url || getImageUrl(property.image)
      if (mainImage && mainImage !== ASSETS.PLACEHOLDER_PROPERTY_MAIN) images.push(mainImage)
    }
    if (images.length === 0) return [ASSETS.PLACEHOLDER_PROPERTY_MAIN]
    return images
  }

  const getShareUrl = (): string => {
    if (typeof window !== 'undefined') return window.location.href
    return ''
  }

  const getShareText = (): string => {
    if (!property) return ''
    return `Check out this ${property.type}: ${property.title} - ${formatPrice(property.price)}`
  }

  const handleShare = (platform: SharePlatform) => {
    const url = getShareUrl()
    const text = getShareText()
    const encodedUrl = encodeURIComponent(url)
    const encodedText = encodeURIComponent(text)
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, '_blank', 'width=600,height=400')
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank')
        break
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(property?.title || 'Property Listing')}&body=${encodedText}%20${encodedUrl}`
        break
      case 'copy':
        navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!')).catch(() => alert('Failed to copy link'))
        break
      case 'print':
        window.print()
        break
      case 'gmail':
        window.open(`mailto:?subject=${encodeURIComponent(property?.title || 'Property Listing')}&body=${encodedText}%20${encodedUrl}`, '_blank')
        break
    }
  }

  const shareOptions: ShareOption[] = [
    {
      platform: 'facebook',
      label: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="#1877F2" />
        </svg>
      ),
    },
    {
      platform: 'twitter',
      label: 'Twitter',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="#1DA1F2" />
        </svg>
      ),
    },
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2c-.151.504.335.99.839.839l3.032-.892A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#25D366" />
          <path d="M9.5 8.5c-.15-.35-.3-.36-.45-.36h-.4c-.15 0-.4.05-.6.3-.2.25-.75.75-.75 1.8s.75 2.1.85 2.25c.1.15 1.5 2.3 3.65 3.2.5.2.9.35 1.2.45.5.15.95.15 1.3.1.4-.05 1.25-.5 1.4-1s.15-1 .1-1.05c-.05-.1-.2-.15-.4-.25l-1.2-.6c-.2-.1-.35-.15-.5.15-.15.3-.6.75-.75.9-.15.15-.25.15-.45.05-.2-.1-.85-.3-1.6-1-.6-.55-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4.1-.1.2-.25.3-.35.1-.1.15-.2.2-.3.05-.1.05-.2 0-.3-.05-.1-.5-1.2-.7-1.65z" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      platform: 'email',
      label: 'Email',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" fill="#EA4335" />
          <path d="M22 6L12 13L2 6" fill="#FFFFFF" />
        </svg>
      ),
    },
    {
      platform: 'copy',
      label: 'Copy Link',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      ),
    },
    {
      platform: 'print',
      label: 'Print',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      ),
    },
  ]

  const handleInquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setInquiryData(prev => ({ ...prev, [name]: value }))
  }

  const handleReviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setReviewData(prev => ({ ...prev, [name]: value }))
  }

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property || !property.agent_id) {
      alert('Property agent information is missing. Please try again later.')
      return
    }
    try {
      await messagesApi.send({
        recipient_id: property.agent_id,
        property_id: property.id,
        sender_name: inquiryData.name,
        sender_email: inquiryData.email,
        sender_phone: inquiryData.phone,
        message: inquiryData.message,
        type: 'property_inquiry',
        subject: `Inquiry about ${property.title}`,
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
              if (parsed?.email === inquiryData.email) {
                shouldUpdate = false
              }
            } catch {
              // If parsing fails, update anyway
            }
          }
          
          if (shouldUpdate) {
            const profile = {
              name: inquiryData.name,
              email: inquiryData.email,
              phone: inquiryData.phone,
            }
            localStorage.setItem('temp_chat_profile_v1', JSON.stringify(profile))
            // Trigger storage event to update navbar
            window.dispatchEvent(new Event('storage'))
          }
        } catch {
          // ignore localStorage errors
        }
      }
      
      alert('Inquiry submitted successfully!')
      setInquiryData({ name: '', phone: '', email: '', message: '' })
    } catch (error: any) {
      console.error('Error sending inquiry:', error)
      alert(error.response?.data?.message || 'Failed to send inquiry. Please try again.')
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property || !property.agent_id) {
      alert('Property information is missing. Please try again later.')
      return
    }
    try {
      await messagesApi.send({
        recipient_id: property.agent_id,
        property_id: property.id,
        sender_name: reviewData.name,
        sender_email: reviewData.email,
        sender_phone: '',
        message: reviewData.review,
        type: 'general',
        subject: `Review for ${property.title}`,
      })
      alert('Review submitted successfully!')
      setReviewData({ name: '', email: '', review: '' })
    } catch (error: any) {
      console.error('Error submitting review:', error)
      alert(error.response?.data?.message || 'Failed to submit review. Please try again.')
    }
  }

  // Keyboard navigation for image modal
  useEffect(() => {
    if (!showImageModal || !property) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const images = getPropertyImages(property)
      if (e.key === 'ArrowRight' && modalImageIndex < images.length - 1) {
        setModalImageIndex(prev => prev + 1)
      } else if (e.key === 'ArrowLeft' && modalImageIndex > 0) {
        setModalImageIndex(prev => prev - 1)
      } else if (e.key === 'Escape') {
        setShowImageModal(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown) }
  }, [showImageModal, modalImageIndex, property])

  return (
    <div className="min-h-screen bg-white">
      {loading ? (
        /* ── Loading Skeleton ── */
        <div>
          <div className="w-full bg-gray-300 animate-pulse" style={{ height: '380px' }} />
          <div className="page-x py-8"><div className="page-w">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden" style={{ height: '480px' }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 animate-pulse" />
                  ))}
                </div>
                <div className="h-5 bg-gray-200 animate-pulse rounded w-1/3 mt-4" />
                <div className="space-y-2 pt-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-100 animate-pulse rounded" style={{ width: `${90 - i * 12}%` }} />
                  ))}
                </div>
              </div>
              <div className="lg:w-[360px] shrink-0 space-y-4">
                <div className="h-40 bg-gray-200 animate-pulse rounded-xl" />
                <div className="h-[380px] bg-gray-200 animate-pulse rounded-xl" />
              </div>
            </div>
          </div></div>
        </div>
      ) : !property ? (
        <div className="px-6 sm:px-10 lg:px-20 py-10 max-w-2xl mx-auto">
          <EmptyState
            variant="notFound"
            title="Property not found"
            description="This listing may have been removed or the link might be incorrect."
            action={
              <>
                <EmptyStateAction href="/properties" primary>Browse properties</EmptyStateAction>
                <EmptyStateAction href="/" primary={false}>Go to home</EmptyStateAction>
              </>
            }
          />
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════ */}
          {/* HERO SECTION                                        */}
          {/* ════════════════════════════════════════════════════ */}
          {(() => {
            const heroImage = getPropertyImages(property)[0]
            const locationStr =
              [property.street_address, property.city, property.state_province].filter(Boolean).join(', ') ||
              property.location
            return (
              <section className="relative w-full overflow-hidden" style={{ height: '380px' }}>
                <img
                  src={heroImage}
                  alt={property.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                  onContextMenu={e => e.preventDefault()}
                  onError={e => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }}
                />
                {/* Bottom-to-center dark gradient — multi-stop for smooth, blur-like edge */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.75) 12%, rgba(0,0,0,0.58) 25%, rgba(0,0,0,0.38) 38%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.06) 62%, rgba(0,0,0,0) 72%)',
                }} />

                <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-8 md:px-12 lg:px-20 pb-6 sm:pb-8 md:pb-10">
                  <span className="inline-flex items-center bg-[#205ed7] text-white text-xs font-semibold px-3 py-1 rounded w-fit mb-3">
                    {property.type}
                  </span>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight max-w-3xl">
                    {property.title}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6">
                    <div>
                      <p className="flex items-center gap-1.5 text-white/85 text-sm md:text-base mb-2">
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        {locationStr}
                      </p>
                      <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-sky-300">
                        {formatPrice(property.price)}
                        {formatPriceType(property.price_type) && (
                          <span className="text-sm sm:text-base md:text-xl font-semibold text-orange-400 ml-1.5">
                            /{formatPriceType(property.price_type)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href="#inquiry-form"
                        className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:bg-white/15 transition-colors"
                        style={{ border: '1px solid rgba(255,255,255,0.8)' }}
                      >
                        Email
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(getShareText() + ' ' + getShareUrl())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:bg-white/15 transition-colors flex items-center gap-1.5"
                        style={{ border: '1px solid rgba(255,255,255,0.8)' }}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2c-.151.504.335.99.839.839l3.032-.892A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                        </svg>
                        WhatsApp
                      </a>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowShareMenu(!showShareMenu)}
                          className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:bg-white/15 transition-colors flex items-center gap-1.5"
                          style={{ border: '1px solid rgba(255,255,255,0.8)' }}
                        >
                          Share
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                          </svg>
                        </button>
                        <SharePopup
                          isOpen={showShareMenu}
                          onClose={() => setShowShareMenu(false)}
                          onShare={handleShare}
                          options={shareOptions}
                          position="top"
                          align="right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          })()}

          {/* ════════════════════════════════════════════════════ */}
          {/* MAIN CONTENT                                        */}
          {/* ════════════════════════════════════════════════════ */}
          <main className="page-x py-8">
            <div className="page-w"><div className="flex flex-col lg:flex-row gap-8">

              {/* ── LEFT COLUMN ─────────────────────────────── */}
              <div className="flex-1 min-w-0">

                {/* Gallery: 3-col × 3-row | large 2×2 main image bottom-left, small images wrap top→right */}
                {(() => {
                  const allImages = getPropertyImages(property)
                  const padded: string[] = [...allImages]
                  while (padded.length < 6) {
                    padded.push(allImages[padded.length % allImages.length] ?? ASSETS.PLACEHOLDER_PROPERTY_MAIN)
                  }
                  const cellBase: React.CSSProperties = {
                    position: 'relative', overflow: 'hidden', cursor: 'pointer', backgroundColor: '#f3f4f6'
                  }
                  const imgFill: React.CSSProperties = {
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block'
                  }
                  const badge: React.CSSProperties = {
                    background: 'white', borderRadius: '6px', padding: '5px 10px',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontSize: '13px', fontWeight: 600,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.20)', color: '#374151'
                  }
                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gridTemplateRows: '1fr 1fr 1fr',
                      gap: '6px',
                      height: '500px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '28px'
                    }}>
                      {/* Top row: 3 small images (padded[1], [2], [3]) */}
                      {([1, 2, 3] as const).map((imgIdx, colIdx) => (
                        <div
                          key={`top-${colIdx}`}
                          style={{ ...cellBase, gridColumn: `${colIdx + 1}`, gridRow: '1' }}
                          onClick={() => { setModalImageIndex(imgIdx % allImages.length); setShowImageModal(true) }}
                          onContextMenu={e => e.preventDefault()}
                        >
                          <img
                            src={padded[imgIdx]}
                            alt={`${property.title} ${imgIdx + 1}`}
                            style={imgFill}
                            draggable={false}
                            onError={e => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }}
                          />
                        </div>
                      ))}

                      {/* Large main image 2×2: col 1-2, row 2-3 */}
                      <div
                        style={{ ...cellBase, gridColumn: '1 / 3', gridRow: '2 / 4' }}
                        onClick={() => { setModalImageIndex(0); setShowImageModal(true) }}
                        onContextMenu={e => e.preventDefault()}
                      >
                        <img
                          src={padded[0]}
                          alt={property.title}
                          style={imgFill}
                          draggable={false}
                          onError={e => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }}
                        />
                        {/* Bed / bath / area badges — bottom-left inside large image */}
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={badge}>
                            <svg style={{ width: '15px', height: '15px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            {property.bedrooms}
                          </div>
                          <div style={badge}>
                            <svg style={{ width: '15px', height: '15px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" /><path d="M12 4v2M8 4v1M16 4v1" />
                            </svg>
                            {property.bathrooms}
                          </div>
                          {property.area && (
                            <div style={badge}>
                              <svg style={{ width: '15px', height: '15px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                              </svg>
                              {property.area} sqm
                            </div>
                          )}
                        </div>
                        {/* Zoom button — bottom-right inside large image */}
                        <button
                          type="button"
                          style={{ ...badge, position: 'absolute', bottom: '12px', right: '12px', cursor: 'pointer', border: 'none' }}
                          onClick={e => { e.stopPropagation(); setModalImageIndex(0); setShowImageModal(true) }}
                        >
                          <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                          </svg>
                          Zoom
                        </button>
                      </div>

                      {/* Right col, row 2 */}
                      <div
                        style={{ ...cellBase, gridColumn: '3', gridRow: '2' }}
                        onClick={() => { setModalImageIndex(4 % allImages.length); setShowImageModal(true) }}
                        onContextMenu={e => e.preventDefault()}
                      >
                        <img src={padded[4]} alt={`${property.title} 5`} style={imgFill} draggable={false} onError={e => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }} />
                      </div>

                      {/* Right col, row 3 */}
                      <div
                        style={{ ...cellBase, gridColumn: '3', gridRow: '3' }}
                        onClick={() => { setModalImageIndex(5 % allImages.length); setShowImageModal(true) }}
                        onContextMenu={e => e.preventDefault()}
                      >
                        <img src={padded[5]} alt={`${property.title} 6`} style={imgFill} draggable={false} onError={e => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }} />
                      </div>
                    </div>
                  )
                })()}

                {/* About This Property */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">About this property</h2>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {showFullDescription
                      ? property.description
                      : property.description?.substring(0, 500)}
                    {!showFullDescription && (property.description?.length ?? 0) > 500 && (
                      <>
                        ...{' '}
                        <button
                          type="button"
                          className="text-[#205ed7] hover:underline font-medium"
                          onClick={() => setShowFullDescription(true)}
                        >
                          Show More
                        </button>
                      </>
                    )}
                  </p>
                </div>

                {/* Amenities */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Amenities</h2>
                  {property.amenities && property.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-700">
                      {property.amenities.map((amenity, i) => (
                        <span key={i}>{amenity}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No amenities listed.</p>
                  )}
                </div>

                {/* Map */}
                <div className="mb-8">
                  <div className="rounded-xl overflow-hidden" style={{ height: '300px', border: '1px solid #e5e7eb' }}>
                    <PropertyLocationMap property={property} />
                  </div>
                </div>

                {/* Reviews */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Reviews{' '}
                    <span className="text-[#205ed7] font-semibold text-base">0</span>
                  </h2>
                  <p className="text-sm text-gray-500 italic">
                    No reviews yet. Be the first to share your experience!
                  </p>
                </div>

                {/* Add Your Review */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Add Your Review</h2>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        value={reviewData.name}
                        onChange={handleReviewChange}
                        className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]"
                        style={{ border: '1px solid #d1d5db' }}
                        required
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Your email"
                        value={reviewData.email}
                        onChange={handleReviewChange}
                        className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]"
                        style={{ border: '1px solid #d1d5db' }}
                        required
                      />
                    </div>
                    <textarea
                      name="review"
                      placeholder="Your Review"
                      value={reviewData.review}
                      onChange={handleReviewChange}
                      className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7] mb-4"
                      rows={5}
                      style={{ minHeight: '120px', resize: 'vertical', border: '1px solid #d1d5db' }}
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#205ed7] text-white py-3 rounded-lg font-semibold hover:bg-[#1a4bb5] transition-colors text-sm"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>

              {/* ── RIGHT COLUMN (sticky) ────────────────────── */}
              <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0 lg:sticky lg:top-6 self-start">

                {/* Agent Card */}
                {(property.agent_id || property.agent || property.rent_manager) && (() => {
                  const agent = property.agent || (fetchedAgent
                    ? { id: fetchedAgent.id, first_name: fetchedAgent.first_name, last_name: fetchedAgent.last_name, full_name: fetchedAgent.full_name, verified: fetchedAgent.verified }
                    : null)
                  const rentManager = property.rent_manager
                  const displayName = agent
                    ? (agent.first_name && agent.last_name
                      ? `${agent.first_name} ${agent.last_name}`
                      : (agent as { full_name?: string }).full_name || 'Rental.Ph Official')
                    : (rentManager?.name || 'Rental.Ph Official')
                  const role = agent
                    ? getRentManagerRole((agent as { verified?: boolean }).verified)
                    : getRentManagerRole(rentManager?.is_official)
                  const agentId = property.agent_id || agent?.id || rentManager?.id
                  const isVerified = agent ? (agent as { verified?: boolean }).verified : rentManager?.is_official
                  const baseAgent = property.agent as { phone?: string; email?: string; whatsapp?: string; company_image?: string | null; company_name?: string | null; profile_image?: string | null; image?: string | null; avatar?: string | null; image_path?: string | null } | undefined
                  const baseRentManager = property.rent_manager as { phone?: string; email?: string; whatsapp?: string; company_image?: string | null; company_name?: string | null; profile_image?: string | null; image?: string | null; avatar?: string | null; image_path?: string | null } | undefined
                  const contactPhone = baseAgent?.phone || baseRentManager?.phone
                  const contactEmail = baseAgent?.email || baseRentManager?.email
                  const contactWhatsApp = baseAgent?.whatsapp || baseRentManager?.whatsapp || contactPhone
                  const rawCompanyImage = baseAgent?.company_image || baseRentManager?.company_image || null
                  const companyImage = rawCompanyImage ? resolveImageUrl(rawCompanyImage) : null
                  const companyName = baseAgent?.company_name || baseRentManager?.company_name || null
                  // Prefer the same image fields used on the Agents page
                  const fetched = fetchedAgent as any
                  let avatarImagePath: string | null =
                    baseAgent?.profile_image ||
                    baseAgent?.image ||
                    baseAgent?.avatar ||
                    baseAgent?.image_path ||
                    fetched?.profile_image ||
                    fetched?.image ||
                    fetched?.avatar ||
                    fetched?.image_path ||
                    baseRentManager?.profile_image ||
                    baseRentManager?.image ||
                    baseRentManager?.avatar ||
                    baseRentManager?.image_path ||
                    null

                  return (
                    <div className="mb-4 overflow-hidden rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] border border-gray-100">
                      {/* Top content: photo + details */}
                      <div className="flex items-stretch px-4 py-4 gap-4">
                        {/* Left: photo with name + role below */}
                        <div className="flex flex-col items-start w-[126px] flex-shrink-0">
                          <div className="h-[110px] w-full overflow-hidden rounded-lg bg-gray-200">
                            <img
                              src={resolveAgentAvatar(avatarImagePath, agentId)}
                              alt={displayName}
                              className="h-full w-full object-cover"
                              onError={e => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROFILE }}
                            />
                          </div>
                          <p className="mt-2 truncate text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                            {displayName}
                            {isVerified && (
                              <svg className="w-4 h-4 text-[#205ed7] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-gray-500">{role}</p>
                        </div>

                        {/* Right side: company + contacts */}
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          {/* Company image */}
                          <div className="mt-1">
                            <div className="w-full max-w-[170px] h-[46px] rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                              {companyImage ? (
                                <img
                                  src={companyImage}
                                  alt={companyName || 'Company'}
                                  className="w-full h-full object-contain"
                                  onError={e => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-400">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <path d="M3 9h18M9 3v18" />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Contact rows */}
                          <div className="mt-2 space-y-1.5 text-xs text-gray-700">
                            {contactPhone && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF4E6] text-[#F97316]">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.16 12.8 19.79 19.79 0 0 1 .09 4.37 2 2 0 0 1 2.05 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.1 9.89a16 16 0 0 0 6 6l1.24-1.24a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                  </span>
                                  <span className="text-[11px] text-gray-500">Phone</span>
                                </div>
                                <span className="text-[11px] font-semibold text-[#F97316]">
                                  {contactPhone}
                                </span>
                              </div>
                            )}
                            {contactEmail && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E0ECFF] text-[#2563eb]">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="3" y="5" width="18" height="14" rx="2" />
                                      <polyline points="3,7 12,13 21,7" />
                                    </svg>
                                  </span>
                                  <span className="text-[11px] text-gray-500">Email</span>
                                </div>
                                <span className="truncate text-right text-[11px] font-semibold text-[#2563eb]">
                                  {contactEmail}
                                </span>
                              </div>
                            )}
                            {contactWhatsApp && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E7FBEF] text-[#16A34A]">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                      <path
                                        d="M12 2a10 10 0 0 0-8.66 15.06L2 22l4.94-1.34A10 10 0 1 0 12 2Z"
                                        fill="#22C55E"
                                      />
                                      <path
                                        d="M9.5 7.5c-.15-.35-.3-.36-.45-.36h-.4c-.15 0-.4.05-.6.3-.2.25-.75.75-.75 1.8s.75 2.1.85 2.25c.1.15 1.5 2.3 3.65 3.2.5.2.9.35 1.2.45.5.15.95.15 1.3.1.4-.05 1.25-.5 1.4-1s.15-1 .1-1.05-.2-.15-.4-.25l-1.2-.6c-.2-.1-.35-.15-.5.15-.15.3-.6.75-.75.9-.15.15-.25.15-.45.05-.2-.1-.85-.3-1.6-1-.6-.55-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4.1-.1.2-.25.3-.35.1-.1.15-.2.2-.3s.05-.2 0-.3-.5-1.2-.7-1.65Z"
                                        fill="white"
                                      />
                                    </svg>
                                  </span>
                                  <span className="text-[11px] text-gray-500">WhatsApp</span>
                                </div>
                                <span className="text-[11px] font-semibold text-[#16A34A]">
                                  {contactWhatsApp}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom buttons */}
                      {agentId && (
                        <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
                          <Link
                            href={`/agents/${agentId}`}
                            className="flex-1 flex h-10 items-center justify-center rounded-md bg-[#2563eb] px-3 text-center text-[11px] font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
                          >
                            View All Properties
                          </Link>
                          <Link
                            href={`/agents/${agentId}`}
                            className="flex-1 flex h-10 items-center justify-center rounded-md bg-[#2563eb] px-3 text-center text-[11px] font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
                          >
                            22 Listings
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Property Inquiry Form */}
                <div id="inquiry-form" className="rounded-xl overflow-hidden bg-white shadow-sm scroll-mt-6" style={{ border: '1px solid #e5e7eb' }}>
                  <div className="bg-[#205ed7] text-white px-5 py-3 font-semibold text-base">
                    Property Inquiry
                  </div>
                  <div className="p-5">
                    <form onSubmit={handleInquirySubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name</label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Isaac Locaylocay"
                          value={inquiryData.name}
                          onChange={handleInquiryChange}
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
                            value={inquiryData.phone}
                            onChange={handleInquiryChange}
                            className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Your email</label>
                        <input
                          type="email"
                          name="email"
                          placeholder="isaaclocaylocay@gmail.com"
                          value={inquiryData.email}
                          onChange={handleInquiryChange}
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
                          value={inquiryData.message}
                          onChange={handleInquiryChange}
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
                </div>
              </div>
            </div></div>
          </main>

          {/* ════════════════════════════════════════════════════ */}
          {/* SIMILAR PROPERTIES                                  */}
          {/* ════════════════════════════════════════════════════ */}
          <section className="page-x py-10 bg-gray-50">
            <div className="page-w">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900">Similar Properties</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarProperties.length > 0 ? (
                  similarProperties.map(prop => {
                    const propertySize = prop.area
                      ? `${prop.area} sqft`
                      : `${(prop.bedrooms * 15 + prop.bathrooms * 5)} sqft`
                    const mainImg = prop.image_url || prop.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                    const images =
                      prop.images_url && prop.images_url.length > 0
                        ? [mainImg, ...(prop.images_url || []).filter((u): u is string => !!u && u !== mainImg)]
                        : undefined
                    // Normalize agent / rent manager objects to include optional avatar fields for TypeScript
                    const baseAgent = prop.agent as {
                      id?: number
                      first_name?: string | null
                      last_name?: string | null
                      full_name?: string | null
                      verified?: boolean
                      phone?: string
                      email?: string
                      whatsapp?: string
                      company_image?: string | null
                      company_name?: string | null
                      profile_image?: string | null
                      image?: string | null
                      avatar?: string | null
                      image_path?: string | null
                    } | undefined
                    const baseRentManager = prop.rent_manager as {
                      id?: number
                      name?: string | null
                      is_official?: boolean
                      phone?: string
                      email?: string
                      whatsapp?: string
                      company_image?: string | null
                      company_name?: string | null
                      profile_image?: string | null
                      image?: string | null
                      avatar?: string | null
                      image_path?: string | null
                    } | undefined

                    // Resolve agent or rent manager avatar consistently with Agents page
                    const rawAgentImage =
                      baseAgent?.profile_image ||
                      baseAgent?.image ||
                      baseAgent?.avatar ||
                      baseAgent?.image_path ||
                      baseRentManager?.profile_image ||
                      baseRentManager?.image ||
                      baseRentManager?.avatar ||
                      baseRentManager?.image_path ||
                      null
                    const agentIdForAvatar = baseAgent?.id || baseRentManager?.id
                    const agentImage = agentIdForAvatar
                      ? resolveAgentAvatar(rawAgentImage, agentIdForAvatar)
                      : undefined
                    return (
                      <div key={prop.id}>
                        <VerticalPropertyCard
                          id={prop.id}
                          propertyType={prop.type}
                          priceType={formatPriceType(prop.price_type)}
                          price={formatPrice(prop.price)}
                          title={prop.title}
                          image={mainImg}
                          images={images}
                          rentManagerName={
                            prop.agent?.first_name && prop.agent?.last_name
                              ? `${prop.agent.first_name} ${prop.agent.last_name}`
                              : prop.agent?.full_name ||
                                prop.rent_manager?.name ||
                                'Rental.Ph Official'
                          }
                          rentManagerRole={
                            prop.agent
                              ? getRentManagerRole(prop.agent.verified)
                              : getRentManagerRole(prop.rent_manager?.is_official)
                          }
                          rentManagerImage={agentImage}
                          bedrooms={prop.bedrooms}
                          bathrooms={prop.bathrooms}
                          parking={0}
                          propertySize={propertySize}
                          location={prop.location}
                          city={prop.city}
                          streetAddress={prop.street_address}
                          stateProvince={prop.state_province}
                        />
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    variant="empty"
                    title="No similar properties"
                    description="We couldn't find other listings similar to this one right now."
                    compact
                  />
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />

      {/* ════════════════════════════════════════════════════ */}
      {/* GALLERY MODAL                                       */}
      {/* ════════════════════════════════════════════════════ */}
      {showImageModal && property && (() => {
        const images = getPropertyImages(property)
        const currentIndex = modalImageIndex

        const handleNext = (e: React.MouseEvent) => {
          e.stopPropagation()
          setModalImageIndex(i => (i + 1) % images.length)
        }
        const handlePrev = (e: React.MouseEvent) => {
          e.stopPropagation()
          setModalImageIndex(i => (i - 1 + images.length) % images.length)
        }

        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setShowImageModal(false)}
            onContextMenu={e => e.preventDefault()}
            role="dialog"
            aria-modal="true"
            aria-label="Image gallery"
          >
            <div
              className="relative flex flex-col w-full max-w-6xl h-full max-h-[90vh]"
              onClick={e => e.stopPropagation()}
              onContextMenu={e => e.preventDefault()}
            >
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="absolute top-0 right-0 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors md:top-4 md:right-4"
                aria-label="Close gallery"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="relative flex-1 flex items-center justify-center min-h-0">
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-800 transition-colors"
                    aria-label="Previous image"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                <div className="flex-1 flex items-center justify-center max-h-[70vh] select-none" onContextMenu={e => e.preventDefault()}>
                  <img
                    src={images[currentIndex] || ASSETS.PLACEHOLDER_PROPERTY_MAIN}
                    alt={`${property.title} - Image ${currentIndex + 1}`}
                    className="max-w-full max-h-[70vh] w-auto h-auto object-contain pointer-events-none"
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                    onError={e => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  />
                </div>
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-800 transition-colors"
                    aria-label="Next image"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto py-4 justify-center shrink-0">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`thumb-${index}`}
                    onClick={e => { e.stopPropagation(); setModalImageIndex(index) }}
                    onContextMenu={e => e.preventDefault()}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${index === currentIndex ? 'border-white ring-2 ring-white/50' : 'border-white/30 hover:border-white/60'}`}
                  >
                    <img
                      src={image || ASSETS.PLACEHOLDER_PROPERTY_MAIN}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable={false}
                      onContextMenu={e => e.preventDefault()}
                      onError={e => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    />
                  </button>
                ))}
              </div>

              <p className="text-center text-white/80 text-sm pb-2">
                {currentIndex + 1} / {images.length}
              </p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
