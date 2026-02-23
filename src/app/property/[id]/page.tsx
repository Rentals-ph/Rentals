'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/layout/Navbar'
import Footer from '../../../components/layout/Footer'
import PageHeader from '../../../components/layout/PageHeader'
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
  const [formMode, setFormMode] = useState<'inquiry' | 'contact'>('inquiry')
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
    return `₱${price.toLocaleString('en-US')}/Month`
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

  const handleFormModeChange = (mode: 'inquiry' | 'contact') => {
    setFormMode(mode)
    // Reset form when switching modes
    if (mode === 'inquiry' && property) {
      setFormData({
        firstName: '',
        lastName: '',
        phone: 'PH+63',
        email: '',
        message: `I'm Interested In This Property ${property.title} And I'd Like To Know More Details.`
      })
    } else {
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
      } else {
        await messagesApi.send({
          recipient_id: property.agent_id,
          sender_name: `${formData.firstName} ${formData.lastName}`,
          sender_email: formData.email,
          sender_phone: formData.phone,
          message: formData.message,
          type: 'contact',
          subject: `Contact from ${formData.firstName} ${formData.lastName}`,
        })
        alert('Message sent successfully!')
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


          <main className="px-6 md:px-10 lg:px-[150px] py-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-3 space-y-6">
                {/* Property Images - Gallery with carousel */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  {property && (() => {
                    const allImages = getPropertyImages(property)
                    const currentImage = allImages[selectedImageIndex] || allImages[0] || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                    const hasMultiple = allImages.length > 1
                    return (
                      <>
                        <div
                          className="relative w-full h-[400px] mb-4 rounded-lg overflow-hidden cursor-pointer select-none bg-gray-100"
                          onClick={() => {
                            setModalImageIndex(selectedImageIndex)
                            setShowImageModal(true)
                          }}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <img
                            src={currentImage}
                            alt={property.title}
                            className="w-full h-full object-cover pointer-events-none"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            onError={(e) => {
                              e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                            }}
                          />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {allImages.map((image, index) => (
                            <div
                              key={`img-${index}-${image.substring(0, 20)}`}
                              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 select-none ${
                                index === selectedImageIndex ? 'border-blue-600' : 'border-gray-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImageIndex(index)
                                setModalImageIndex(index)
                              }}
                              onContextMenu={(e) => e.preventDefault()}
                            >
                              <img
                                src={image}
                                alt={`Property view ${index + 1}`}
                                className="w-full h-full object-cover pointer-events-none"
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                onError={(e) => {
                                  e.currentTarget.src = ASSETS.PLACEHOLDER_PROPERTY_MAIN
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{allImages.length} Photos</p>
                      </>
                    )
                  })()}
                </div>

                {/* Property Overview */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Property Overview</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {showFullDescription ? property.description : property.description.substring(0, 200)}
                    {!showFullDescription && property.description.length > 200 && (
                      <button
                        className="text-blue-600 hover:text-blue-800 ml-1"
                        onClick={() => setShowFullDescription(true)}
                      >
                        ...Show More
                      </button>
                    )}
                  </p>
                </div>

                {/* Location Map */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">Nearby Landmarks</h2>
                  <p className="text-gray-600 mb-4">{property.location}</p>
                  <div className="w-full h-[400px] rounded-lg overflow-hidden">
                    <PropertyLocationMap property={property} />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {(property.agent?.first_name?.charAt(0) || property.rent_manager?.name?.charAt(0) || 'R')}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg text-gray-800">
                        {property.agent?.first_name && property.agent?.last_name 
                          ? `${property.agent.first_name} ${property.agent.last_name}`
                          : property.agent?.full_name 
                          || property.rent_manager?.name 
                          || 'Rental.Ph Official'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {property.agent 
                          ? getRentManagerRole(property.agent.verified) 
                          : getRentManagerRole(property.rent_manager?.is_official)}
                      </p>
                      {property.agent?.agency_name && (
                        <p className="text-gray-500 text-sm">{property.agent.agency_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(property.agent?.phone || property.rent_manager?.email) && (
                      <a 
                        href={`tel:${property.agent?.phone || ''}`} 
                        className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" fill="#205ED7" />
                          </svg>
                        </div>
                        <span>{property.agent?.phone || 'Contact via inquiry'}</span>
                      </a>
                    )}
                    {(property.agent?.email || property.rent_manager?.email) && (
                      <a 
                        href={`mailto:${property.agent?.email || property.rent_manager?.email || ''}`} 
                        className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#205ED7" strokeWidth="2" />
                            <path d="M3 7L12 13L21 7" stroke="#205ED7" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </div>
                        <span>{property.agent?.email || property.rent_manager?.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                

                {/* Property Title Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-3xl font-bold text-blue-600">{formatPrice(property.price)}</p>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button 
                          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          aria-label="Share property"
                          onClick={() => setShowShareMenu(!showShareMenu)}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"
                              fill="#205ED7"
                            />
                          </svg>
                        </button>
                        <SharePopup
                          isOpen={showShareMenu}
                          onClose={() => setShowShareMenu(false)}
                          onShare={handleShare}
                          options={shareOptions}
                          position="bottom"
                          align="right"
                        />
                      </div>
                      <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="Add to favorites">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                            fill="#ef4444"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{property.type}</p>
                  <h1 className="text-2xl font-bold text-gray-800">{property.title}</h1>
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities && property.amenities.length > 0 ? (
                      property.amenities.map((amenity, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{amenity}</span>
                      ))
                    ) : (
                      <p className="text-gray-500">No amenities listed</p>
                    )}
                  </div>
                </div>
                
                {/* Merged Contact/Inquiry Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 mb-6">
                    <button
                      type="button"
                      className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                        formMode === 'inquiry' 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                      onClick={() => handleFormModeChange('inquiry')}
                    >
                      Property Inquiry
                    </button>
                    <button
                      type="button"
                      className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                        formMode === 'contact' 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                      onClick={() => handleFormModeChange('contact')}
                    >
                      Contact Rent Manager
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder={formMode === 'inquiry' ? 'Firstname' : 'First Name'}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder={formMode === 'inquiry' ? 'Lastname' : 'Last Name'}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="phone"
                      placeholder={formMode === 'inquiry' ? 'PH+63' : 'Phone'}
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
                      placeholder={formMode === 'inquiry' ? 'Your inquiry message' : 'Your message'}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      required
                    />
                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {formMode === 'inquiry' ? 'Send Inquiry' : 'Contact'}
                    </button>
                  </form>
                </div>
                {/* Property Details */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property type:</span>
                      <span className="font-semibold text-gray-800">{property.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Size:</span>
                      <span className="font-semibold text-gray-800">{property.area ? `${property.area} sqft` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Garage:</span>
                      <span className="font-semibold text-gray-800">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="font-semibold text-gray-800">{property.bedrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bathrooms:</span>
                      <span className="font-semibold text-gray-800">{property.bathrooms}</span>
                    </div>
                  </div>
                </div>

                

              </div>
            </div>
          </main>

          {/* Similar Properties */}
          <section className=" lg:px-[150px] py-12 bg-gray-50">
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
                          date={formatDate(prop.published_at)}
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

