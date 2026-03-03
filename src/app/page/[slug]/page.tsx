'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { pageBuilderApi } from '@/api'
import type { PageBuilderData } from '@/api'
import { ASSETS } from '@/utils/assets'
import { 
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiGlobe,
  FiStar,
  FiHeart
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

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return
      
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching page with slug:', slug)
        const data = await pageBuilderApi.getBySlug(slug)
        console.log('Page data received:', data)
        setPageData(data)
      } catch (err: any) {
        console.error('Error fetching page:', err)
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        })
        setError(err.response?.data?.message || err.message || 'Page not found')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPage()
  }, [slug])

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!contactFormName || !contactFormEmail || !contactFormMessage) {
        alert('Please fill in all fields')
        return
      }
      
      // TODO: Implement actual API call to submit inquiry
      console.log('Contact form submission:', {
        name: contactFormName,
        email: contactFormEmail,
        message: contactFormMessage,
        pageId: pageData?.id,
        pageType: pageData?.page_type
      })
      
      alert('Thank you for your inquiry! We will get back to you soon.')
      setContactFormName('')
      setContactFormEmail('')
      setContactFormMessage('')
    } catch (error) {
      console.error('Error submitting contact form:', error)
      alert('Failed to send inquiry. Please try again.')
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
    if (!property) return ''
    return `₱${property.price != null ? property.price.toLocaleString('en-US') : ''}${property.price_type ? `/${property.price_type}` : '/mo'}`
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

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: pageData.selected_theme === 'dark' ? '#1F2937' :
          pageData.selected_theme === 'orange' ? '#F97316' :
            pageData.selected_theme === 'blue' ? '#3B82F6' : '#FFFFFF',
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
                        <h2 className="full-preview-name">{pageData.profile_card_name || 'Agent Name'}</h2>
                        <p className="full-preview-tagline">{pageData.profile_card_role || (pageData.profile_card_bio || pageData.bio)?.slice(0, 80) || ''}</p>
                      </div>
                    </div>
                  </div>
                )
              case 'profileContactInfo':
                return (
                  <div key={section.id} className="full-preview-profile-section" style={{ marginBottom: '40px' }}>
                    <h3 className="full-preview-section-title">Contact</h3>
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
                    <h3 className="full-preview-section-title">About</h3>
                    <p className="full-preview-tagline" style={{ whiteSpace: 'pre-wrap' }}>{(pageData.profile_card_bio || pageData.bio) || ''}</p>
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
                        <h3 className="full-preview-section-title">Active Listings</h3>
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
                        <h3 className="full-preview-section-title">Client Reviews</h3>
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
                    <h3 className="full-preview-section-title">Connect</h3>
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

    return (
      <div className="min-h-screen bg-white">
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
                        backgroundColor: pageData.hero_image ? 'transparent' : '#E5E7EB',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: `brightness(${100 - (pageData.overall_darkness || 30)}%)`
                      }}
                    >
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-6">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{pageData.main_heading}</h1>
                        <p className="text-lg md:text-xl text-white/90 mb-6">{pageData.tagline}</p>
                        {pageData.property_price && (
                          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                            Starts at {pageData.property_price} /mo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              
              case 'propertyDescription':
                return (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">About</h2>
                    <p className="text-gray-700 leading-relaxed">{pageData.property_description}</p>
                  </div>
                )
              
              case 'propertyImages':
                return (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Inside?</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {(pageData.property_images || []).length > 0 ? (
                        (pageData.property_images || []).map((image: string, index: number) => (
                          <div 
                            key={index} 
                            className="aspect-square rounded-lg overflow-hidden bg-gray-200"
                            style={{ borderRadius: getCornerRadiusClass(pageData.selected_corner_radius) }}
                          >
                            <img src={image} alt={`Interior ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic col-span-3">Property images will appear here...</p>
                      )}
                    </div>
                  </div>
                )
              
              case 'propertyDetails': {
                const bedrooms = (pageData as any).property_bedrooms ?? 0
                const bathrooms = (pageData as any).property_bathrooms ?? 0
                const garage = (pageData as any).property_garage ?? 0
                const area = (pageData as any).property_area
                return (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Property Details</h2>
                    <div className="flex flex-wrap gap-4 sm:gap-6 text-base">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        <span>{bedrooms} Bedrooms</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14v-5H5v5zM5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" /></svg>
                        <span>{garage} Garage</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" /><path d="M12 4v2M8 4v1M16 4v1" /></svg>
                        <span>{bathrooms} Bathrooms</span>
                      </div>
                      {area && (
                        <div className="flex items-center gap-2 text-gray-700">
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {amenities.length > 0 ? (
                        amenities.map((amenity: string, index: number) => (
                          <span key={index} className="rounded-full border-2 border-orange-500 px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700">
                            {amenity}
                          </span>
                        ))
                      ) : null}
                    </div>
                  </div>
                )
              }
              
              case 'profileCard':
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

              case 'contact': {
                if (!(pageData.show_contact_number && pageData.contact_info && (pageData.contact_info.email || pageData.contact_info.phone || pageData.contact_info.website || pageData.contact_info.message))) {
                  return null
                }
                return (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {stats.map((stat: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
                          <div className="text-sm text-gray-600">{stat.label}</div>
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
                    <h3 className="full-preview-section-title">Featured Listings</h3>
                    <div className="full-preview-listings-grid">
                      {featured.map((listing: any) => (
                        <div key={listing.id} className="full-preview-listing-card">
                          <div className="full-preview-listing-badge">
                            <FiStar className="full-preview-star-icon" />
                            <span>Featured</span>
                          </div>
                          <div className="full-preview-listing-image-wrapper">
                            <img src={listing.image || ASSETS.PLACEHOLDER_PROPERTY} alt={listing.title} />
                          </div>
                          <div className="full-preview-listing-info">
                            <div className="full-preview-listing-info-header">
                              <div className="full-preview-listing-price">{formatPropertyPrice(listing)}</div>
                              <button className="full-preview-listing-heart" aria-label="Favorite">
                                <FiHeart />
                              </button>
                            </div>
                            <div className="full-preview-listing-title">{listing.title}</div>
                            <div className="full-preview-listing-category">{listing.type || listing.category}</div>
                            <div className="full-preview-listing-info-footer">
                              <div className="full-preview-listing-date">{formatPropertyDate(listing)}</div>
                              <div className="full-preview-listing-view-count">
                                <span>1</span>
                              </div>
                            </div>
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
                    <h3 className="full-preview-section-title">Client Testimonials</h3>
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

              case 'readyToView':
                return (
                  <div key={section.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready To View?</h2>
                      <p className="text-gray-600 mb-4">Schedule a tour or ask any questions about the property.</p>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-gray-700">
                          <FiPhone className="w-5 h-5 text-gray-500" />
                          <span>{pageData.contact_info?.phone || 'Phone number'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <FiMail className="w-5 h-5 text-gray-500" />
                          <span>{pageData.contact_info?.email || 'Email address'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact {pageData.profile_card_name || 'Agent'}</h3>
                      {/* Public page form is static; submission is handled client-side only */}
                      <form className="space-y-3">
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                        <input
                          type="email"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your email"
                        />
                        <textarea
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                          placeholder="Your message"
                          rows={4}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <span>Send Inquiry</span>
                          <FiMessageCircle className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )
              
              default:
                return null
            }
          })}

          {/* Contact Information Section */}
          {pageData.show_contact_number && pageData.contact_info && (pageData.contact_info.email || pageData.contact_info.phone || pageData.contact_info.website || pageData.contact_info.message) && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
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
          )}

          {/* Experience Stats Section */}
          {pageData.show_experience_stats && pageData.experience_stats && pageData.experience_stats.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pageData.experience_stats.map((stat: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Listings Section */}
          {pageData.show_featured_listings && pageData.featured_listings && pageData.featured_listings.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Listings</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {pageData.featured_listings.map((listing: any) => (
                  <div key={listing.id} className="flex-shrink-0 w-72 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                    <div className="relative">
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                        <FiStar className="w-3 h-3 fill-current" />
                        <span>Featured</span>
                      </div>
                      <div className="w-full h-48 bg-gray-200">
                        <img src={listing.image || ASSETS.PLACEHOLDER_PROPERTY} alt={listing.title} className="w-full h-full object-cover" />
                      </div>
                      <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors shadow-sm" aria-label="Favorite">
                        <FiHeart className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold text-blue-600">{formatPropertyPrice(listing)}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title}</div>
                      <div className="text-xs text-gray-500 mb-3">{listing.type || listing.category}</div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div>{formatPropertyDate(listing)}</div>
                        <div className="flex items-center gap-1">
                          <span>1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Testimonials Section */}
          {pageData.show_testimonials && pageData.testimonials && pageData.testimonials.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Testimonials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pageData.testimonials.map((testimonial: any) => (
                  <div key={testimonial.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img 
                          src={testimonial.avatar || ASSETS.PLACEHOLDER_PROFILE} 
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hidden">
                          {testimonial.name?.split(' ').map((n: string) => n[0]).join('') || 'TC'}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{testimonial.name}</div>
                    </div>
                    <p className="text-sm text-gray-700 italic mb-2">"{testimonial.content}"</p>
                    {testimonial.role && (
                      <div className="text-xs text-gray-500">
                        {testimonial.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ready To View? Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready To View?</h2>
              <p className="text-gray-600 mb-4">Schedule a tour or ask any questions about the property.</p>
              <div className="flex flex-col gap-3">
                {pageData.contact_phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FiPhone className="w-5 h-5 text-gray-500" />
                    <span>{pageData.contact_phone}</span>
                  </div>
                )}
                {pageData.contact_email && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FiMail className="w-5 h-5 text-gray-500" />
                    <span>{pageData.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact {pageData.profile_card_name || 'Agent'}</h3>
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  type="submit"
                >
                  <span>Send Inquiry</span>
                  <FiMessageCircle className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

