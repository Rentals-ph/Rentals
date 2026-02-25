'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/layout/Navbar'
import Footer from '../../../components/layout/Footer'
import VerticalPropertyCard from '../../../components/common/VerticalPropertyCard'
import SharePopup, { type SharePlatform, type ShareOption } from '../../../components/common/SharePopup'
import PropertyLocationMap from '../../../components/common/PropertyLocationMap'
import { propertiesApi, messagesApi } from '../../../api'
import type { Property } from '../../../types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
// import './page.css' // Removed - converted to Tailwind

export default function PropertyDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [similarProperties, setSimilarProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [formMode, setFormMode] = useState<'inquiry' | 'comments' | 'review'>('inquiry')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: 'PH+63',
    email: '',
    message: ''
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
        setProperty(data)
        setSelectedImageIndex(0) // Reset to first image when property changes
        // Set initial message for inquiry mode
        setFormData({
          firstName: '',
          lastName: '',
          phone: 'PH+63',
          email: '',
          message: `I'm Interested In This Property ${data.title} And I'd Like To Know More Details.`
        })
        
        // Fetch similar properties (same type or location)
        const allPropertiesResponse = await propertiesApi.getAll()
        // Handle both array and paginated response
        const allProperties = Array.isArray(allPropertiesResponse) 
          ? allPropertiesResponse 
          : allPropertiesResponse.data || []
        const similar = allProperties
          .filter((p: Property) => p.id !== propertyId && (p.type === data.type || p.location === data.location))
          .slice(0, 6)
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

  const getRentManagerRole = (isOfficial: boolean | undefined): string => {
    return isOfficial ? 'Rent Manager' : 'Property Specialist'
  }

  const getImageUrl = (image: string | null | undefined): string => {
    if (!image) return ASSETS.PLACEHOLDER_PROPERTY_MAIN
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    // Construct the full URL from backend
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin.replace('/api', '').replace(':3000', ':8000')
      : 'http://localhost:8000'
    
    // Handle different path formats
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `${baseUrl}/${image.startsWith('/') ? image.slice(1) : image}`
    }
    // Handle images/products/ paths (without storage/)
    if (image.startsWith('images/')) {
      return `${baseUrl}/storage/${image}`
    }
    // Default: assume it's a storage path
    return `${baseUrl}/storage/${image}`
  }

  // Get all property images from backend
  const getPropertyImages = (property: Property): string[] => {
    const images: string[] = []
    
    // First, check if property has images_url (full URLs from backend)
    if (property.images_url && Array.isArray(property.images_url) && property.images_url.length > 0) {
      // Use images_url (full URLs) - these already include the main image
      property.images_url.forEach(img => {
        if (img) {
          images.push(img)
        }
      })
    } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      // Fallback: resolve image paths to full URLs
      property.images.forEach(img => {
        if (img) {
          images.push(getImageUrl(img))
        }
      })
    }
    
    // If we have images from the array, use them (they already include the main image)
    // Only add main image separately if we don't have any images yet
    if (images.length === 0) {
      const mainImage = property.image_url || getImageUrl(property.image)
      if (mainImage && mainImage !== ASSETS.PLACEHOLDER_PROPERTY_MAIN) {
        images.push(mainImage)
      }
    }
    
    // If no images at all, return placeholder
    if (images.length === 0) {
      return [ASSETS.PLACEHOLDER_PROPERTY_MAIN]
    }
    
    return images
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFormModeChange = (mode: 'inquiry' | 'comments' | 'review') => {
    setFormMode(mode)
    // Reset form when switching modes
    if (property && mode === 'inquiry') {
      setFormData({
        firstName: '',
        lastName: '',
        phone: 'PH+63',
        email: '',
        message: `I'm Interested In This Property ${property.title} And I'd Like To Know More Details.`
      })
    } else if (mode === 'comments') {
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        message: ''
      })
    } else {
      // review mode
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        message: ''
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!property || !property.agent_id) {
      alert('Property agent information is missing. Please try again later.')
      return
    }

    try {
      if (formMode === 'inquiry') {
        await messagesApi.send({
          recipient_id: property.agent_id,
          property_id: property.id,
          sender_name: `${formData.firstName} ${formData.lastName}`,
          sender_email: formData.email,
          sender_phone: formData.phone.replace('PH+63', ''),
          message: formData.message,
          type: 'property_inquiry',
          subject: `Inquiry about ${property.title}`,
        })
        alert('Inquiry submitted successfully!')
      } else if (formMode === 'comments') {
        await messagesApi.send({
          recipient_id: property.agent_id,
          property_id: property.id,
          sender_name: `${formData.firstName} ${formData.lastName}`,
          sender_email: formData.email,
          sender_phone: formData.phone,
          message: formData.message,
          type: 'general',
          subject: `Comment on ${property.title}`,
        })
        alert('Comment submitted successfully!')
      } else {
        await messagesApi.send({
          recipient_id: property.agent_id,
          property_id: property.id,
          sender_name: `${formData.firstName} ${formData.lastName}`,
          sender_email: formData.email,
          sender_phone: formData.phone,
          message: formData.message,
          type: 'general',
          subject: `Review for ${property.title}`,
        })
        alert('Review submitted successfully!')
      }
      
      // Reset form
      if (formMode === 'inquiry') {
        setFormData({ firstName: '', lastName: '', phone: 'PH+63', email: '', message: '' })
      } else {
        setFormData({ firstName: '', lastName: '', phone: '', email: '', message: '' })
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(error.response?.data?.message || `Failed to send ${formMode === 'inquiry' ? 'inquiry' : 'message'}. Please try again.`)
    }
  }

  const getShareUrl = (): string => {
    if (typeof window !== 'undefined') {
      return window.location.href
    }
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
        navigator.clipboard.writeText(url).then(() => {
          alert('Link copied to clipboard!')
        }).catch(() => {
          alert('Failed to copy link')
        })
        break
      case 'print':
        window.print()
        break
      case 'gmail':
        window.open(
          `mailto:?subject=${encodeURIComponent(property?.title || 'Property Listing')}&body=${encodedText}%20${encodedUrl}`,
          '_blank'
        )
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
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="#1DA1F2"/>
        </svg>
      ),
    },
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2c-.151.504.335.99.839.839l3.032-.892A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#25D366"/>
          <path d="M9.5 8.5c-.15-.35-.3-.36-.45-.36h-.4c-.15 0-.4.05-.6.3-.2.25-.75.75-.75 1.8s.75 2.1.85 2.25c.1.15 1.5 2.3 3.65 3.2.5.2.9.35 1.2.45.5.15.95.15 1.3.1.4-.05 1.25-.5 1.4-1s.15-1 .1-1.05c-.05-.1-.2-.15-.4-.25l-1.2-.6c-.2-.1-.35-.15-.5.15-.15.3-.6.75-.75.9-.15.15-.25.15-.45.05-.2-.1-.85-.3-1.6-1-.6-.55-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4.1-.1.2-.25.3-.35.1-.1.15-.2.2-.3.05-.1.05-.2 0-.3-.05-.1-.5-1.2-.7-1.65z" fill="#FFFFFF"/>
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
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
      ),
    },
    {
      platform: 'print',
      label: 'Print',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
      ),
    },
  ]

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
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showImageModal, modalImageIndex, property])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {loading ? (
        <div className="text-center py-10 px-6 md:px-10 lg:px-[150px]">
          <p>Loading property details...</p>
        </div>
      ) : !property ? (
        <div className="text-center py-10 px-6 md:px-10 lg:px-[150px]">
          <p>Property not found</p>
        </div>
      ) : (
        <>


          <main className="px-4 sm:px-6 md:px-10 lg:px-[150px] py-8  mx-auto">
            {/* 1. Property Images: one large left, two stacked right */}
            {property && (() => {
              const allImages = getPropertyImages(property)
              const img0 = allImages[0] || ASSETS.PLACEHOLDER_PROPERTY_MAIN
              const img1 = allImages[1] || allImages[0] || ASSETS.PLACEHOLDER_PROPERTY_MAIN
              const img2 = allImages[2] || allImages[0] || ASSETS.PLACEHOLDER_PROPERTY_MAIN
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mb-6 rounded-xl overflow-hidden">
                  <div
                    className="md:col-span-2 relative aspect-[16/9] md:aspect-auto md:min-h-[180px] bg-gray-100 cursor-pointer"
                    onClick={() => { setModalImageIndex(0); setShowImageModal(true) }}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <img
                      src={img0}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                      onError={(e) => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }}
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2 sm:gap-3">
                    <div
                      className="aspect-[16/9] bg-gray-100 cursor-pointer rounded-r-none md:rounded-b-none overflow-hidden"
                      onClick={() => { setModalImageIndex(1); setShowImageModal(true) }}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <img src={img1} alt="" className="w-full h-full object-cover" draggable={false} onError={(e) => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }} />
                    </div>
                    <div
                      className="aspect-[16/9] bg-gray-100 cursor-pointer overflow-hidden"
                      onClick={() => { setModalImageIndex(2); setShowImageModal(true) }}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <img src={img2} alt="" className="w-full h-full object-cover" draggable={false} onError={(e) => { e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN }} />
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 2. Price, title, type, location + heart & share */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div>
                <p className="text-3xl sm:text-6xl font-bold text-[#205ed7] m-0">
                  {formatPrice(property.price)}
                  {formatPriceType(property.price_type) && (
                    <span className="text-xl sm:text-2xl font-semibold text-gray-500 ml-2">/{formatPriceType(property.price_type)}</span>
                  )}
                </p>
                <h1 className="text-xl sm:text-5xl font-semibold text-gray-800 mt-2 mb-1">{property.title}</h1>
                <p className="text-3xl text-rental-blue-600 m-0">{property.type}</p>
                <p className="text-gray-600 text-xl mt-1 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {([property.street_address, property.city, property.state_province].filter(Boolean).join(', ')) || property.location}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="Add to favorites">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    aria-label="Share"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                  >
                    <svg className="w-5 h-5 text-[#205ed7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                    </svg>
                  </button>
                  <SharePopup isOpen={showShareMenu} onClose={() => setShowShareMenu(false)} onShare={handleShare} options={shareOptions} position="bottom" align="right" />
                </div>
              </div>
            </div>

            {/* 3. Property Manager Card */}
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
              {/* Top: Agent photo */}
              <div className="relative w-full h-44 bg-gray-100">
                <span className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold bg-[#205ed7]">
                  {(property.agent?.first_name?.charAt(0) || property.rent_manager?.name?.charAt(0) || 'R')}
                </span>
                {property.agent?.id && (
                  <img
                    src={resolveAgentAvatar(property.agent.id.toString(), property.agent.id)}
                    alt={property.agent?.full_name || property.rent_manager?.name || 'Agent'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>

              {/* Middle: Name, role, listings link */}
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-gray-900 m-0 leading-tight">
                    {property.agent?.first_name && property.agent?.last_name
                      ? `${property.agent.first_name} ${property.agent.last_name}`
                      : property.agent?.full_name
                      || property.rent_manager?.name
                      || 'Rental.Ph Official'}
                  </p>
                  <p className="text-sm text-rental-blue-600 m-0">
                    {property.agent ? getRentManagerRole(property.agent.verified) : getRentManagerRole(property.rent_manager?.is_official)}
                  </p>
                </div>
                {property.agent_id && (
                  <Link
                    href={`/rent-managers/${property.agent_id}`}
                    className="text-sm font-semibold text-[#205ed7] whitespace-nowrap"
                  >
                    View Listings
                  </Link>
                )}
              </div>

              {/* Contact info */}
              <div className="px-5 py-4 space-y-3 text-sm text-gray-800">
                {(property.agent?.email || property.rent_manager?.email) && (
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16v16H4z" />
                        <path d="M4 4l8 7 8-7" />
                      </svg>
                    </span>
                    <span className="truncate">
                      {property.agent?.email || property.rent_manager?.email}
                    </span>
                  </div>
                )}
                {property.agent?.phone && (
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3A2 2 0 0 1 9 3.72a12.84 12.84 0 0 0 .7 2.11 2 2 0 0 1-.45 2.11L8.09 9.11a16 16 0 0 0 6 6l1.17-1.17a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.11.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <span>{property.agent.phone}</span>
                  </div>
                )}
              </div>

              {/* CTA button */}
              {property.agent_id && (
                <div className="px-5 pb-5 pt-1">
                  <Link
                    href={`/rent-managers/${property.agent_id}`}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[#205ed7] text-white font-semibold shadow-sm hover:bg-[#1a4bb5] transition-colors"
                  >
                    View My Listing
                    <span className="inline-flex items-center justify-center">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Property Overview */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Property Overview</h2>
              <p className="text-gray-600 text-xl leading-relaxed m-0">
                {showFullDescription ? property.description : property.description.substring(0, 400)}
                {!showFullDescription && property.description.length > 400 && (
                  <>
                    ...{' '}
                    <button type="button" className="text-[#205ed7] hover:underline font-medium" onClick={() => setShowFullDescription(true)}>
                      Show More
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* 5. Property Details: bed, garage, bathroom icons */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Details</h2>
              <div className="flex flex-wrap gap-6 text-xl sm:gap-10">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  <span>{property.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14v-5H5v5zM5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" /></svg>
                  <span>{property.garage ?? 0} Garage</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" /><path d="M12 4v2M8 4v1M16 4v1" /></svg>
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
              </div>
            </div>

            {/* 6. Amenities: icon boxes with orange border */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-3">
                {property.amenities && property.amenities.length > 0 ? (
                  property.amenities.slice(0, 8).map((amenity, index) => (
                    <div key={index} className="w-14 h-[auto] sm:w-[auto] sm:h-[auto] rounded-full border-2 border-[#f97316] flex items-center px-5 justify-center p-2 bg-gray-200"  title={amenity}>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 text-center truncate w-full">{amenity}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {['Air conditioning', 'Furnished', 'Pool', 'Wi-Fi'].map((label, i) => (
                      <div key={i} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-[#f97316] bg-white flex items-center justify-center" title={label}>
                        <span className="text-xs text-gray-600 text-center px-1">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 7. Nearby Landmark / Map + Show On Map */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Nearby Landmark</h2>
              <div className="rounded-xl overflow-hidden border border-gray-200 relative">
                <div className="w-full h-[360px] sm:h-[400px] bg-gray-100">
                  <PropertyLocationMap property={property} />
                </div>
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(property.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#205ed7] text-white font-semibold rounded-lg hover:bg-[#1a4bb5] transition-colors shadow-lg"
                >
                  Show On Map
                </a>
              </div>
            </div>

            {/* Inquiry / Contact form (for Inquire now scroll target) */}
            <div id="inquiry-form" className="scroll-mt-8 bg-white rounded-xl border border-gray-200 py-6 mb-10">
              <div className="flex border-b border-gray-200 mb-6"
              style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#E5E7EB' }}>
                <button
                  type="button"
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${formMode === 'inquiry' ? 'text-[#205ed7]' : 'text-gray-600 hover:text-gray-800'}`}
                  style={{
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: formMode === 'inquiry' ? '#205ed7' : 'transparent',
                  }}
                  onClick={() => handleFormModeChange('inquiry')}
                >
                  Property Inquiry
                </button>
                <button
                  type="button"
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${formMode === 'comments' ? 'text-[#205ed7]' : 'text-gray-600 hover:text-gray-800'}`}
                  style={{
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: formMode === 'comments' ? '#205ed7' : 'transparent',
                  }}
                  onClick={() => handleFormModeChange('comments')}
                >
                  Comments
                </button>
                <button
                  type="button"
                  className={`px-6 py-3 font-semibold border-b-2 transition-colors ${formMode === 'review' ? 'text-[#205ed7]' : 'text-gray-600 hover:text-gray-800'}`}
                  style={{
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: formMode === 'review' ? '#205ed7' : 'transparent',
                  }}
                  onClick={() => handleFormModeChange('review')}
                >
                  Write a Review
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="firstName" placeholder={formMode === 'inquiry' ? 'Firstname' : 'First Name'} value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]" required />
                <input type="text" name="lastName" placeholder={formMode === 'inquiry' ? 'Lastname' : 'Last Name'} value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]" required />
                <input type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]" required />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]" required />
                <textarea
                  name="message"
                  placeholder={
                    formMode === 'inquiry'
                      ? 'Your inquiry message'
                      : formMode === 'comments'
                        ? 'Your comment'
                        : 'Your review'
                  }
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#205ed7]"
                  rows={4}
                  required
                />
                <button type="submit" className="w-full bg-[#205ed7] text-white py-3 rounded-lg font-semibold hover:bg-[#1a4bb5] transition-colors">
                  {formMode === 'inquiry'
                    ? 'Send Inquiry'
                    : formMode === 'comments'
                      ? 'Submit Comment'
                      : 'Submit Review'}
                </button>
              </form>
            </div>
          </main>

          {/* Similar Properties */}
          <section className="lg:px-[150px] py-12 bg-gray-50">
            <div className=" mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-gray-800">Similar Properties</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProperties.length > 0 ? (
                  similarProperties.map(prop => {
                    const propertySize = prop.area 
                      ? `${prop.area} sqft` 
                      : `${(prop.bedrooms * 15 + prop.bathrooms * 5)} sqft`
                    const mainImg = prop.image_url || prop.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                    const images = (prop.images_url && prop.images_url.length > 0)
                      ? [mainImg, ...(prop.images_url || []).filter((u): u is string => !!u && u !== mainImg)]
                      : undefined
                    const agentImage = prop.agent
                      ? resolveAgentAvatar(
                          prop.agent.id.toString(),
                          prop.agent.id
                        )
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
                              : prop.agent?.full_name
                              || prop.rent_manager?.name
                              || 'Rental.Ph Official'
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
                  <p className="text-center py-8 text-gray-500">No similar properties found</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />

      {/* Gallery overlay with carousel - right-click disabled */}
      {showImageModal && property && (() => {
        const images = getPropertyImages(property)
        const currentIndex = modalImageIndex
        const hasNext = currentIndex < images.length - 1
        const hasPrev = currentIndex > 0

        const handleNext = (e: React.MouseEvent) => {
          e.stopPropagation()
          setModalImageIndex((i) => (i + 1) % images.length)
        }

        const handlePrev = (e: React.MouseEvent) => {
          e.stopPropagation()
          setModalImageIndex((i) => (i - 1 + images.length) % images.length)
        }

        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setShowImageModal(false)}
            onContextMenu={(e) => e.preventDefault()}
            role="dialog"
            aria-modal="true"
            aria-label="Image gallery"
          >
            <div
              className="relative flex flex-col w-full max-w-6xl h-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="absolute top-0 right-0 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors -translate-y-2 translate-x-2 md:translate-x-0 md:translate-y-0 md:top-4 md:right-4"
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

                <div
                  className="flex-1 flex items-center justify-center max-h-[70vh] select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <img
                    src={images[currentIndex] || ASSETS.PLACEHOLDER_PROPERTY_MAIN}
                    alt={`${property.title} - Image ${currentIndex + 1}`}
                    className="max-w-full max-h-[70vh] w-auto h-auto object-contain pointer-events-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onError={(e) => {
                      e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                    }}
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
                    key={`thumb-${index}-${image?.substring(0, 20) || index}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setModalImageIndex(index)
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentIndex ? 'border-white ring-2 ring-white/50' : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={image || ASSETS.PLACEHOLDER_PROPERTY_MAIN}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      onError={(e) => {
                        e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                      }}
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