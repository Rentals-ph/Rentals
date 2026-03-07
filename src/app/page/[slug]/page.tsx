'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { pageBuilderApi, messagesApi } from '@/api'
import type { PageBuilderData } from '@/api'
import { toast, ToastContainer } from '@/utils/toast'
import { ASSETS } from '@/utils/assets'
import { 
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiGlobe,
  FiStar,
  FiHeart,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi'
// import '../../agent/page-builder/page.css' // Removed - file doesn't exist

export default function PublicPageBuilderPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [pageData, setPageData] = useState<PageBuilderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactFormName, setContactFormName] = useState('')
  const [contactFormEmail, setContactFormEmail] = useState('')
  const [contactFormMessage, setContactFormMessage] = useState('')
  const [galleryIndex, setGalleryIndex] = useState(0)

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await pageBuilderApi.getBySlug(slug)
        setPageData(data)
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Page not found')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPage()
  }, [slug])

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageData) return
    const recipientId = pageData.user_id ?? pageData.user?.id
    if (!recipientId) {
      toast.error('Unable to send inquiry: page owner information is missing.')
      return
    }
    if (!contactFormName?.trim() || !contactFormEmail?.trim() || !contactFormMessage?.trim()) {
      toast.error('Please fill in all fields.')
      return
    }
    try {
      await messagesApi.send({
        recipient_id: recipientId,
        sender_name: contactFormName.trim(),
        sender_email: contactFormEmail.trim(),
        message: contactFormMessage.trim(),
        type: 'contact',
        subject: `Inquiry from your ${pageData.page_type === 'profile' ? 'Profile' : 'Property'} page`,
      })
      toast.success('Thank you for your inquiry! We will get back to you soon.')
      setContactFormName('')
      setContactFormEmail('')
      setContactFormMessage('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send inquiry. Please try again.')
    }
  }

  const getCornerRadiusClass = (cornerRadius?: string) => {
    switch (cornerRadius) {
      case 'sharp': return '0px'
      case 'regular': return '8px'
      case 'soft': return '16px'
      default: return '16px'
    }
  }

  const formatPropertyPrice = (property: any) => {
    if (!property) return '₱—'
    const price = property.price != null ? Number(property.price) : null
    if (price === null || Number.isNaN(price)) return '₱—'
    return `₱${price.toLocaleString('en-US')}${property.price_type ? `/${property.price_type}` : '/mo'}`
  }

  const formatPropertyDate = (property: any) => {
    if (property?.published_at) {
      const date = new Date(property.published_at)
      return date.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    }
    return 'Recently'
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#6B7280'
      }}>
        Loading page...
      </div>
    )
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-20">
          <div className="w-full max-w-2xl mx-auto">
            <EmptyState
              variant="notFound"
              title="Page not found"
              description={error || 'The page you\'re looking for doesn\'t exist or isn\'t published.'}
              action={
                <>
                  <EmptyStateAction href="/" primary>Go to homepage</EmptyStateAction>
                  <EmptyStateAction href="/properties" primary={false}>Browse properties</EmptyStateAction>
                </>
              }
            />
          </div>
        </main>
        <Footer />
        <ToastContainer />
      </div>
    )
  }

  // Profile page: default block order when profile_layout_sections not saved
  const DEFAULT_PROFILE_LAYOUT = [
    { id: 'profileHero', name: 'Hero Banner', visible: true },
    { id: 'profileContactInfo', name: 'Contact Info', visible: true },
    { id: 'profileBioAbout', name: 'Bio/About', visible: true },
    { id: 'profileStatsBar', name: 'Stats Bar', visible: true },
    { id: 'profileActiveListings', name: 'Active Listings', visible: true },
    { id: 'profileClientReviews', name: 'Client Reviews', visible: true },
    { id: 'profileSocialLinks', name: 'Social Links', visible: true }
  ]

  // Profile Page
  if (pageData.page_type === 'profile') {
    const profileSections = (pageData.profile_layout_sections && pageData.profile_layout_sections.length > 0)
      ? pageData.profile_layout_sections
      : DEFAULT_PROFILE_LAYOUT

    const profileBg = pageData.selected_theme === 'dark' ? '#1F2937' :
      pageData.selected_theme === 'orange' ? '#F97316' :
        pageData.selected_theme === 'blue' ? '#3B82F6' : '#FFFFFF'
    const profileTextColor = profileBg === '#FFFFFF' ? '#111827' : '#FFFFFF'
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: profileBg,
        color: profileTextColor,
        padding: '40px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          {profileSections.map((section: { id: string; name: string; visible: boolean }) => {
            if (!section.visible) return null
            const ci = pageData.contact_info
            switch (section.id) {
              case 'profileHero':
                return (
                  <div key={section.id} className="full-preview-profile-section" style={{ marginBottom: '40px' }}>
                    <div
                      className="full-preview-profile-header"
                      style={{
                        backgroundImage: (pageData.profile_card_image || pageData.profile_image) ? `url(${pageData.profile_card_image || pageData.profile_image})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        minHeight: '200px'
                      }}
                    >
                      <div className="full-preview-profile-image-wrapper">
                        <img src={pageData.profile_card_image || pageData.profile_image || ASSETS.PLACEHOLDER_PROFILE} alt="Profile" className="full-preview-profile-image" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <div className="full-preview-profile-fallback">{pageData.profile_card_name?.[0] || 'A'}{pageData.profile_card_name?.split(' ').pop()?.[0] || 'G'}</div>
                      </div>
                      <div className="full-preview-profile-info">
                        <h2 className="full-preview-name" style={{ color: profileTextColor }}>{pageData.profile_card_name || 'Agent Name'}</h2>
                        <p className="full-preview-tagline" style={{ color: profileTextColor, opacity: 0.95 }}>{pageData.profile_card_role || (pageData.profile_card_bio || pageData.bio)?.slice(0, 80) || ''}</p>
                      </div>
                    </div>
                  </div>
                )
              case 'profileContactInfo':
                return (
                  <div key={section.id} className="full-preview-profile-section" style={{ marginBottom: '40px' }}>
                    <h3 className="full-preview-section-title" style={{ color: profileTextColor }}>Contact</h3>
                    <div className="full-preview-contact-icons">
                      {ci?.email && <a href={`mailto:${ci.email}`} className="full-preview-contact-icon" title={ci.email}><FiMail /></a>}
                      {pageData.show_contact_number && ci?.phone && <a href={`tel:${ci.phone}`} className="full-preview-contact-icon" title={ci.phone}><FiPhone /></a>}
                      {ci?.website && <a href={ci.website} target="_blank" rel="noopener noreferrer" className="full-preview-contact-icon" title={ci.website}><FiGlobe /></a>}
                    </div>
                  </div>
                )
              case 'profileBioAbout':
                return (
                  <div key={section.id} className="full-preview-profile-section" style={{ marginBottom: '40px' }}>
                    <h3 className="full-preview-section-title" style={{ color: profileTextColor }}>About</h3>
                    <p className="full-preview-tagline" style={{ whiteSpace: 'pre-wrap', color: profileTextColor, opacity: 0.9 }}>{(pageData.profile_card_bio || pageData.bio) || ''}</p>
                  </div>
                )
              case 'profileStatsBar':
                return (
                  <div key={section.id} className="full-preview-profile-section" style={{ marginBottom: '40px' }}>
                    {pageData.show_experience_stats && pageData.experience_stats && pageData.experience_stats.length > 0 && (
                      <div className="full-preview-experience-stats">
                        {pageData.experience_stats.map((stat: any, index: number) => (
                          <div key={index} className="full-preview-stat-item">
                            <div className="full-preview-stat-value">{stat.value}</div>
                            <div className="full-preview-stat-label">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              case 'profileActiveListings':
                return (
                  <div key={section.id} style={{ marginBottom: '40px' }}>
                    {pageData.show_featured_listings && pageData.featured_listings && pageData.featured_listings.length > 0 && (
                      <div className="full-preview-featured-section">
                        <h3 className="full-preview-section-title" style={{ color: profileTextColor }}>Active Listings</h3>
                        <div className="full-preview-listings-grid">
                          {pageData.featured_listings.map((listing: any) => (
                            <div key={listing.id} className="full-preview-listing-card">
                              <div className="full-preview-listing-badge"><FiStar className="full-preview-star-icon" /><span>Featured</span></div>
                              <div className="full-preview-listing-image-wrapper">
                                <img src={listing.image || ASSETS.PLACEHOLDER_PROPERTY} alt={listing.title} />
                              </div>
                              <div className="full-preview-listing-info">
                                <div className="full-preview-listing-info-header">
                                  <div className="full-preview-listing-price">{formatPropertyPrice(listing)}</div>
                                  <button type="button" className="full-preview-listing-heart" aria-label="Favorite"><FiHeart /></button>
                                </div>
                                <div className="full-preview-listing-title">{listing.title}</div>
                                <div className="full-preview-listing-category">{listing.type || listing.category}</div>
                                <div className="full-preview-listing-info-footer">
                                  <div className="full-preview-listing-date">{formatPropertyDate(listing)}</div>
                                  <div className="full-preview-listing-view-count"><span>1</span></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              case 'profileClientReviews':
                return (
                  <div key={section.id} style={{ marginBottom: '40px' }}>
                    {pageData.show_testimonials && pageData.testimonials && pageData.testimonials.length > 0 && (
                      <div className="full-preview-testimonials-section">
                        <h3 className="full-preview-section-title" style={{ color: profileTextColor }}>Client Reviews</h3>
                        <div className="full-preview-testimonials-grid">
                          {pageData.testimonials.map((testimonial: any) => (
                            <div key={testimonial.id} className="full-preview-testimonial-card">
                              <div className="full-preview-testimonial-header">
                                <img src={testimonial.avatar || ASSETS.PLACEHOLDER_PROFILE} alt={testimonial.name} className="full-preview-testimonial-avatar" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                <div className="full-preview-testimonial-avatar-fallback">{testimonial.name?.split(' ').map((n: string) => n[0]).join('') || 'TC'}</div>
                                <div className="full-preview-testimonial-name">{testimonial.name}</div>
                              </div>
                              <p className="full-preview-testimonial-quote">"{testimonial.content}"</p>
                              {testimonial.role && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>{testimonial.role}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              case 'profileSocialLinks':
                return (
                  <div key={section.id} className="full-preview-profile-section" style={{ marginBottom: '40px' }}>
                    <h3 className="full-preview-section-title" style={{ color: profileTextColor }}>Connect</h3>
                    <div className="full-preview-contact-icons">
                      {ci?.website && <a href={ci.website} target="_blank" rel="noopener noreferrer" className="full-preview-contact-icon" title="Website"><FiGlobe /></a>}
                      {ci?.email && <a href={`mailto:${ci.email}`} className="full-preview-contact-icon" title="Email"><FiMail /></a>}
                    </div>
                  </div>
                )
              default:
                return null
            }
          })}
        </div>
      </div>
    )
  }

  // Property Page
  if (pageData.page_type === 'property') {
    const layoutSections = pageData.layout_sections || []
    const sectionVisibility = pageData.section_visibility || {}

    // Theme tokens from page builder (if present)
    const globalDesign = (pageData as any).global_design || {}
    const colorBackground = globalDesign.colorBackground || '#FFFFFF'
    const colorText = globalDesign.colorText || '#111827'
    const colorPrimary = globalDesign.colorPrimary || '#2563EB'
    const fontBody = globalDesign.fontBody || 'Inter, system-ui, sans-serif'
    const fontHeading = globalDesign.fontHeading || fontBody
    const cornerRadius =
      typeof globalDesign.borderRadius === 'number'
        ? `${globalDesign.borderRadius}px`
        : getCornerRadiusClass(pageData.selected_corner_radius)
  
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: colorBackground,
          color: colorText,
          fontFamily: fontBody,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
          {/* Render sections in the order specified by layoutSections */}
          {layoutSections.map((section: any) => {
            const isVisibleFlag = (sectionVisibility as any)[section.id]
            if (!section.visible || (isVisibleFlag === false)) return null
            
            switch (section.id) {
              case 'hero':
                return (
                  <div key={section.id} className="mb-6">
                    <div 
                      className="relative w-full h-96 rounded-2xl overflow-hidden"
                      style={{
                        backgroundImage: pageData.hero_image ? `url(${pageData.hero_image})` : 'none',
                        backgroundColor: pageData.hero_image ? 'transparent' : colorPrimary,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: `brightness(${100 - (pageData.overall_darkness || 30)}%)`,
                        borderRadius: cornerRadius,
                      }}
                    >
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                        style={{
                          background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.65))',
                        }}
                      >
                        <h1
                          className="text-4xl md:text-5xl font-bold text-white mb-4"
                          style={{ fontFamily: fontHeading }}
                        >
                          {pageData.main_heading}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 mb-6">
                          {pageData.tagline}
                        </p>
                        {pageData.property_price && (
                          <button
                            className="px-6 py-3 font-semibold rounded-xl transition-colors"
                            style={{
                              backgroundColor: colorPrimary,
                              color: '#FFFFFF',
                            }}
                          >
                            Starts at {pageData.property_price} /mo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              
              case 'propertyDescription':
                return (
                  <div key={section.id} className="mb-6 sm:mb-8">
                    <h2
                      className="text-lg sm:text-xl font-bold mb-3 sm:mb-4"
                      style={{ color: colorText, fontFamily: fontHeading }}
                    >
                      Property Overview
                    </h2>
                    <p className="text-base sm:text-xl leading-relaxed m-0 whitespace-pre-wrap" style={{ color: colorText, opacity: 0.9 }}>
                      {pageData.property_description}
                    </p>
                  </div>
                )
              
              case 'propertyImages': {
                const images = pageData.property_images || []
                const currentIndex = images.length > 0 ? Math.min(galleryIndex, images.length - 1) : 0
                const goPrev = () => setGalleryIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
                const goNext = () => setGalleryIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
                return (
                  <div key={section.id} className="mb-6 overflow-hidden" style={{ borderRadius: cornerRadius, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)' }}>
                    <div style={{ backgroundColor: colorPrimary, color: '#fff' }} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="font-medium" style={{ fontFamily: fontHeading }}>What&apos;s Inside?</span>
                      {images.length > 0 && (
                        <span style={{ opacity: 0.9 }}>{currentIndex + 1} / {images.length}</span>
                      )}
                    </div>
                    <div className="relative aspect-video bg-gray-200" style={{ backgroundColor: `${colorText}12` }}>
                      {images.length > 0 ? (
                        <>
                          <img
                            src={images[currentIndex]}
                            alt={`Interior ${currentIndex + 1}`}
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={goPrev}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                            aria-label="Previous image"
                          >
                            <FiChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={goNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                            aria-label="Next image"
                          >
                            <FiChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ color: colorText, opacity: 0.8 }}>
                          <p className="italic">Property images will appear here...</p>
                        </div>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 p-3 overflow-x-auto border-t" style={{ backgroundColor: `${colorText}08`, borderColor: `${colorText}20` }}>
                        {images.map((image: string, index: number) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setGalleryIndex(index)}
                            className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{
                              borderColor: index === currentIndex ? colorPrimary : 'transparent',
                              boxShadow: index === currentIndex ? `0 0 0 1px ${colorPrimary}` : undefined,
                              opacity: index === currentIndex ? 1 : 0.75,
                            }}
                          >
                            <img src={image} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              
              case 'propertyDetails': {
                const bedrooms = (pageData as any).property_bedrooms ?? 0
                const bathrooms = (pageData as any).property_bathrooms ?? 0
                const garage = (pageData as any).property_garage ?? 0
                const area = (pageData as any).property_area
                return (
                  <div key={section.id} className="mb-6 sm:mb-8">
                    <h2
                      className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4"
                      style={{ color: colorText, fontFamily: fontHeading }}
                    >
                      Property Details
                    </h2>
                    <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-10 text-base sm:text-xl" style={{ color: colorText, opacity: 0.9 }}>
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 flex-shrink-0" style={{ color: colorText, opacity: 0.7 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        <span>{bedrooms} Bedrooms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 flex-shrink-0" style={{ opacity: 0.7 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14v-5H5v5zM5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" /></svg>
                        <span>{garage} Garage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 flex-shrink-0" style={{ opacity: 0.7 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" /><path d="M12 4v2M8 4v1M16 4v1" /></svg>
                        <span>{bathrooms} Bathrooms</span>
                      </div>
                      {area && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{area}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              
              case 'amenities': {
                const amenities = (pageData as any).property_amenities || []
                return (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-2xl font-bold mb-3" style={{ color: colorText, fontFamily: fontHeading }}>Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {amenities.length > 0 ? (
                        amenities.map((amenity: string, index: number) => (
                          <span key={index} className="rounded-full border-2 px-4 py-2 text-sm font-medium" style={{ borderColor: colorPrimary, backgroundColor: `${colorPrimary}12`, color: colorText }}>
                            {amenity}
                          </span>
                        ))
                      ) : null}
                    </div>
                  </div>
                )
              }
              
              case 'profileCard': {
                // Skip standalone profile card when readyToView is present (agent is shown inside merged block)
                const hasReadyToView = layoutSections.some((s: any) => s.id === 'readyToView')
                if (hasReadyToView) return null
                return (
                  <div 
                    key={section.id}
                    className="p-6 mb-6 text-white"
                    style={{
                      backgroundColor: pageData.selected_brand_color === 'white' ? '#3B82F6' : 
                                     pageData.selected_brand_color === 'dark' ? '#1F2937' :
                                     pageData.selected_brand_color === 'orange' ? '#F97316' :
                                     pageData.selected_brand_color === 'blue' ? '#3B82F6' : '#3B82F6',
                      borderRadius: getCornerRadiusClass(pageData.selected_corner_radius)
                    }}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                          <img 
                            src={pageData.profile_card_image || ASSETS.PLACEHOLDER_PROFILE} 
                            alt={pageData.profile_card_name || 'Agent'} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{pageData.profile_card_name}</h3>
                        <p className="text-sm text-white/80 mb-3">{pageData.profile_card_role}</p>
                        <p className="text-sm text-white/90 mb-4">{pageData.profile_card_bio}</p>
                        <div className="flex items-center gap-3">
                          {pageData.contact_email && (
                            <a 
                              href={`mailto:${pageData.contact_email}`}
                              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center justify-center"
                            >
                              <FiMail className="w-4 h-4" />
                            </a>
                          )}
                          {pageData.contact_phone && (
                            <a 
                              href={`tel:${pageData.contact_phone}`}
                              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center justify-center"
                            >
                              <FiPhone className="w-4 h-4" />
                            </a>
                          )}
                          {pageData.contact_info?.message && (
                            <a 
                              href={pageData.contact_info.message}
                              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center justify-center"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FiMessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          {pageData.contact_info?.website && (
                            <a 
                              href={pageData.contact_info.website}
                              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center justify-center"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FiGlobe className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              case 'contact': {
                if (!(pageData.show_contact_number && pageData.contact_info && (pageData.contact_info.email || pageData.contact_info.phone || pageData.contact_info.website || pageData.contact_info.message))) {
                  return null
                }
                return (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-2xl font-bold mb-4" style={{ color: colorText, fontFamily: fontHeading }}>Contact Information</h2>
                    <div className="rounded-lg p-6 shadow-sm border border-gray-200" style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pageData.contact_info.phone && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FiPhone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Phone</div>
                              <a href={`tel:${pageData.contact_info.phone}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                {pageData.contact_info.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {pageData.contact_info.email && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FiMail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Email</div>
                              <a href={`mailto:${pageData.contact_info.email}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                {pageData.contact_info.email}
                              </a>
                            </div>
                          </div>
                        )}
                        {pageData.contact_info.website && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FiGlobe className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Website</div>
                              <a href={pageData.contact_info.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                Visit Website
                              </a>
                            </div>
                          </div>
                        )}
                        {pageData.contact_info.message && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FiMessageCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Message</div>
                              <a href={pageData.contact_info.message} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                Send Message
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              case 'experience': {
                const stats = pageData.experience_stats || []
                if (!(pageData.show_experience_stats && stats.length > 0)) return null
                return (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-2xl font-bold mb-4" style={{ color: colorText, fontFamily: fontHeading }}>Experience</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {stats.map((stat: any, index: number) => (
                        <div key={index} className="rounded-lg p-4 shadow-sm border border-gray-200 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
                          <div className="text-3xl font-bold mb-1" style={{ color: colorPrimary }}>{stat.value}</div>
                          <div className="text-sm" style={{ color: colorText, opacity: 0.9 }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              case 'featured': {
                const featured = pageData.featured_listings || []
                if (!(pageData.show_featured_listings && featured.length > 0)) return null
                return (
                  <div key={section.id} className="mb-6">
                    <h3 className="text-xl font-bold mb-4" style={{ color: colorText, fontFamily: fontHeading }}>Featured Listings</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {featured.map((listing: any) => (
                        <div key={listing.id} className="flex-shrink-0 w-72 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                          <div className="relative">
                            <div className="w-full h-48 bg-gray-200">
                              <img
                                src={listing.image_url || listing.image || ASSETS.PLACEHOLDER_PROPERTY}
                                alt={listing.title || 'Listing'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="text-lg font-bold mb-1" style={{ color: colorPrimary }}>{formatPropertyPrice(listing)}</div>
                            <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title || 'Untitled'}</div>
                            <div className="text-xs text-gray-500">{listing.type || listing.category || 'Property'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              case 'testimonialsSection': {
                const testimonials = pageData.testimonials || []
                if (!(pageData.show_testimonials && testimonials.length > 0)) return null
                return (
                  <div key={section.id} className="mb-6">
                    <h3 className="full-preview-section-title" style={{ color: colorText }}>Client Testimonials</h3>
                    <div className="full-preview-testimonials-grid">
                      {testimonials.map((testimonial: any) => (
                        <div key={testimonial.id} className="full-preview-testimonial-card">
                          <div className="full-preview-testimonial-header">
                            <img 
                              src={testimonial.avatar || ASSETS.PLACEHOLDER_PROFILE}
                              alt={testimonial.name}
                              className="full-preview-testimonial-avatar"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="full-preview-testimonial-avatar-fallback">
                              {testimonial.name?.split(' ').map((n: string) => n[0]).join('') || 'TC'}
                            </div>
                            <div className="full-preview-testimonial-name">{testimonial.name}</div>
                          </div>
                          <p className="full-preview-testimonial-quote">"{testimonial.content}"</p>
                          {testimonial.role && (
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                              {testimonial.role}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              case 'readyToView': {
                // Follow theme: use global_design primary when set, else brand color
                const contactCardBg =
                  (globalDesign as any).colorPrimary
                    ? (globalDesign as any).colorPrimary
                    : pageData.selected_brand_color === 'white' ? '#3B82F6' :
                      pageData.selected_brand_color === 'dark' ? '#1F2937' :
                      pageData.selected_brand_color === 'orange' ? '#F97316' :
                      pageData.selected_brand_color === 'blue' ? '#3B82F6' : '#3B82F6'
                const contactRadius =
                  typeof (globalDesign as any).borderRadius === 'number'
                    ? `${(globalDesign as any).borderRadius}px`
                    : getCornerRadiusClass(pageData.selected_corner_radius)
                return (
                  <div key={section.id} className="mb-6 overflow-hidden" style={{ borderRadius: contactRadius, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 min-h-0">
                      {/* Left: agent + ready to view in one branded card */}
                      <div
                        className="p-6 md:p-8 text-white flex flex-col justify-between"
                        style={{ backgroundColor: contactCardBg, borderRadius: 0 }}
                      >
                        <div>
                          <div className="flex items-start gap-4 mb-6">
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                                <img
                                  src={pageData.profile_card_image || ASSETS.PLACEHOLDER_PROFILE}
                                  alt={pageData.profile_card_name || 'Agent'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 
                                className="text-xl md:text-2xl font-extrabold text-white mb-1 tracking-tight"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2), 0 0 20px rgba(255,255,255,0.15)' }}
                              >
                                {pageData.profile_card_name || 'Agent'}
                              </h3>
                              {pageData.profile_card_role && (
                                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-white/95 px-2.5 py-1 rounded-md bg-white/20 mb-2">
                                  {pageData.profile_card_role}
                                </span>
                              )}
                              {pageData.profile_card_bio && (
                                <p className="text-sm text-white font-medium mt-2 line-clamp-2 pl-3 border-l-2 border-white/50">
                                  {pageData.profile_card_bio}
                                </p>
                              )}
                            </div>
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ fontFamily: fontHeading }}>Ready To View?</h2>
                          <p className="text-sm text-white/90 mb-4">Schedule a tour or ask any questions about the property.</p>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-white/90">
                              <FiPhone className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">{pageData.contact_info?.phone || pageData.contact_phone || 'Phone number'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/90">
                              <FiMail className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm truncate">{pageData.contact_info?.email || pageData.contact_email || 'Email address'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/20">
                          {pageData.contact_email && (
                            <a href={`mailto:${pageData.contact_email}`} className="w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center" aria-label="Email"><FiMail className="w-4 h-4" /></a>
                          )}
                          {pageData.contact_phone && (
                            <a href={`tel:${pageData.contact_phone}`} className="w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center" aria-label="Phone"><FiPhone className="w-4 h-4" /></a>
                          )}
                          {pageData.contact_info?.message && (
                            <a href={pageData.contact_info.message} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center" aria-label="Message"><FiMessageCircle className="w-4 h-4" /></a>
                          )}
                          {pageData.contact_info?.website && (
                            <a href={pageData.contact_info.website} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center" aria-label="Website"><FiGlobe className="w-4 h-4" /></a>
                          )}
                        </div>
                      </div>
                      {/* Right: contact form */}
                      <div className="rounded-none md:rounded-r-2xl p-6 md:p-8 flex flex-col justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 0 }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: colorText }}>Contact {pageData.profile_card_name || 'Agent'}</h3>
                        <form onSubmit={handleContactFormSubmit} className="flex flex-col gap-3">
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your name"
                            value={contactFormName}
                            onChange={(e) => setContactFormName(e.target.value)}
                            required
                          />
                          <input
                            type="email"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your email"
                            value={contactFormEmail}
                            onChange={(e) => setContactFormEmail(e.target.value)}
                            required
                          />
                          <textarea
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                            placeholder="Your message"
                            value={contactFormMessage}
                            onChange={(e) => setContactFormMessage(e.target.value)}
                            rows={4}
                            required
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-colors"
                            style={{ backgroundColor: contactCardBg }}
                          >
                            <span>Send Inquiry</span>
                            <FiMessageCircle className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )
              }
              
              default:
                return null
            }
          })}

        </div>
        <ToastContainer />
      </div>
    )
  }

  return null
}

