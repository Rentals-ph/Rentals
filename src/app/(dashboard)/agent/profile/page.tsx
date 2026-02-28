'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import AgentHeader from '@/components/agent/AgentHeader'
import { agentsApi, propertiesApi } from '@/api'
import type { Agent } from '@/api/endpoints/agents'
import type { Property } from '@/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar, resolvePropertyImage } from '@/utils/imageResolver'
import {
  FiMail,
  FiPhone,
  FiHeart,
  FiShare2,
  FiStar
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind

export default function AgentMyProfile() {
  const [activeTab, setActiveTab] = useState('reviews')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [reviewForm, setReviewForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    review: ''
  })

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        // Try to get current authenticated agent first
        const agentData = await agentsApi.getCurrent()
        setAgent(agentData)
        
        // Update localStorage with agent info
        if (agentData.first_name && agentData.last_name) {
          const fullName = `${agentData.first_name} ${agentData.last_name}`
          localStorage.setItem('agent_name', fullName)
          localStorage.setItem('user_name', fullName)
        }
        if (agentData.id) {
          localStorage.setItem('agent_id', agentData.id.toString())
        }
      } catch (error) {
        console.error('Error fetching agent data:', error)
        // Fallback to using agent_id if getCurrent fails
        try {
          const agentId = localStorage.getItem('agent_id')
          if (agentId) {
            const agentData = await agentsApi.getById(parseInt(agentId))
            setAgent(agentData)
            
            // Update localStorage with agent info
            if (agentData.first_name && agentData.last_name) {
              const fullName = `${agentData.first_name} ${agentData.last_name}`
              localStorage.setItem('agent_name', fullName)
              localStorage.setItem('user_name', fullName)
            }
          }
        } catch (fallbackError) {
          console.error('Error fetching agent by ID:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
  }, [])

  const agentName = agent?.full_name || 
    (agent?.first_name && agent?.last_name 
      ? `${agent.first_name} ${agent.last_name}` 
      : agent?.first_name || agent?.last_name ||
      localStorage.getItem('user_name') || 
      localStorage.getItem('agent_name') ||
      (agent?.email ? agent.email.split('@')[0] : 'Agent'))
  const agentEmail = agent?.email || ''
  const agentPhone = agent?.phone ? `+63 ${agent.phone}` : '+63 987654321'
  const agentImage = resolveAgentAvatar(agent?.image || agent?.avatar || agent?.profile_image, agent?.id)
  const agentInitials = agentName.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'

  const [listings, setListings] = useState<Array<{
    id: number
    type: string
    date: string
    price: string
    title: string
    image: string
    bedrooms: number
    bathrooms: number
    area: number | string
  }>>([])
  const [listingsLoading, setListingsLoading] = useState(true)

  useEffect(() => {
    const fetchAgentListings = async () => {
      if (!agent?.id) return
      
      try {
        // Fetch properties for this agent
        const properties = await propertiesApi.getByAgentId(agent.id)
        
        // Transform properties to listings format
        const transformedListings = properties.map((property: Property) => {
          const date = property.published_at 
            ? new Date(property.published_at).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
            : 'Not published'
          
          const price = property.price_type 
            ? `₱${property.price.toLocaleString('en-US')}/${property.price_type}`
            : `₱${property.price.toLocaleString('en-US')}/Month`
          
          const area = property.area ? property.area : 0
          
          return {
            id: property.id,
            type: property.type || 'Property',
            date: date,
            price: price,
            title: property.title,
            image: resolvePropertyImage(property.image, property.id),
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: area
          }
        })
        
        setListings(transformedListings)
      } catch (error) {
        console.error('Error fetching agent listings:', error)
      } finally {
        setListingsLoading(false)
      }
    }

    if (agent?.id) {
      fetchAgentListings()
    }
  }, [agent?.id])

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* agent-profile-page */}
      <AppSidebar />

      {/* Main Content */}
      <main className="main-with-sidebar flex-1 p-8 min-h-screen bg-gray-100 lg:p-6 md:p-4 md:pt-20"> {/* agent-main */}
        {/* Header */}
        <AgentHeader 
          title="My Profile" 
          subtitle="View and manage your profile information." 
        />

        {/* Profile Section */}
        <div className="mt-6"> {/* profile-section */}
          <h2 className="m-0 mb-6 text-2xl font-bold text-gray-900">My Profile</h2> {/* page-title */}

          {/* Profile Card */}
          {loading ? (
            <div className="p-8 text-center">Loading profile...</div>
          ) : (
            <div className="bg-white rounded-xl p-8 mb-8 flex justify-between items-center shadow-sm md:flex-col md:items-start md:gap-6"> {/* profile-card */}
              <div className="flex items-center gap-6 flex-1 md:flex-col md:items-start md:w-full"> {/* profile-card-left */}
                <div className="w-35 h-35 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative p-1" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #3B82F6 50%, #10B981 100%)' }}> {/* profile-avatar-large */}
                  <div className="absolute inset-1 rounded-full bg-white z-[1]"></div>
                  <img src={agentImage} alt={agentName} className="w-[calc(100%-8px)] h-[calc(100%-8px)] object-cover relative z-[2] rounded-full" onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }} />
                  <div className="w-[calc(100%-8px)] h-[calc(100%-8px)] flex items-center justify-center text-white font-semibold text-4xl relative z-[2] rounded-full hidden" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #3B82F6 50%, #10B981 100%)' }}>{agentInitials}</div> {/* avatar-fallback-large */}
                </div>
                <div className="flex flex-col gap-3 flex-1 md:w-full"> {/* profile-info */}
                  <h3 className="m-0 text-2xl font-bold text-gray-900 md:text-xl">{agentName}</h3> {/* profile-name */}
                  <p className="m-0 text-base text-gray-600 font-medium">{agent?.verified ? 'Rent Manager' : 'Property Agent'}</p> {/* profile-role */}
                  <div className="flex flex-col gap-2.5 md:w-full"> {/* profile-contact */}
                    <div className="flex items-center gap-3"> {/* contact-item */}
                      <FiPhone className="text-lg text-blue-600 flex-shrink-0" /> {/* contact-icon */}
                      <span className="text-sm text-gray-700">{agentPhone}</span>
                    </div>
                    <div className="flex items-center gap-3"> {/* contact-item */}
                      <FiMail className="text-lg text-blue-600 flex-shrink-0" /> {/* contact-icon */}
                      <span className="text-sm text-gray-700">{agentEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            <div className="flex items-center justify-center md:w-full md:justify-start"> {/* profile-card-right */}
              <div className="flex flex-col items-center gap-2"> {/* qr-code-container */}
                <div className="w-32 h-32 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 2px, transparent 2px, transparent 8px), repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 8px)', backgroundSize: '8px 8px', backgroundColor: '#fff' }} /> {/* qr-code-box */}
              </div>
            </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-none md:gap-1"> {/* profile-tabs */}
            <button
              className={`py-3 px-6 bg-transparent border-0 text-base font-medium cursor-pointer transition-all duration-200 border-b-2 whitespace-nowrap md:py-2.5 md:px-4 md:text-sm ${activeTab === 'listings' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`} /* tab-button */
              onClick={() => setActiveTab('listings')}
            >
              Listings
            </button>
            <button
              className={`py-3 px-6 bg-transparent border-0 text-base font-medium cursor-pointer transition-all duration-200 border-b-2 whitespace-nowrap md:py-2.5 md:px-4 md:text-sm ${activeTab === 'about' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`} /* tab-button */
              onClick={() => setActiveTab('about')}
            >
              About Me
            </button>
            <button
              className={`py-3 px-6 bg-transparent border-0 text-base font-medium cursor-pointer transition-all duration-200 border-b-2 whitespace-nowrap md:py-2.5 md:px-4 md:text-sm ${activeTab === 'reviews' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`} /* tab-button */
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6"> {/* tab-content */}
            {activeTab === 'listings' && (
              <div className="grid grid-cols-3 gap-6 xl:grid-cols-2 md:grid-cols-1"> {/* listings-grid */}
                {listingsLoading ? (
                  <div className="p-8 text-center col-span-full">Loading listings...</div>
                ) : listings.length === 0 ? (
                  <div className="p-8 text-center col-span-full">No listings yet. Create your first listing!</div>
                ) : (
                  listings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 flex flex-col transition-all duration-200 hover:shadow-md"> {/* property-card */}
                    <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200"> {/* property-card-header */}
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 py-1 px-2.5 rounded">{listing.type}</span> {/* property-type */}
                      <span className="text-xs text-gray-500">{listing.date}</span> {/* property-date */}
                    </div>
                    <div className="relative w-full h-48 bg-gray-100 overflow-hidden"> {/* property-image */}
                      <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }} />
                    </div>
                    <div className="p-4 flex flex-col gap-3 flex-1"> {/* property-card-body */}
                      <div className="flex justify-between items-center"> {/* property-price-row */}
                        <span className="text-xl font-bold text-gray-900">{listing.price}</span> {/* property-price */}
                        <FiHeart className="text-xl text-gray-400 cursor-pointer transition-colors duration-200 hover:text-red-500" /> {/* heart-icon */}
                      </div>
                      <h4 className="m-0 text-base font-semibold text-gray-900 leading-snug line-clamp-2">{listing.title}</h4> {/* property-title */}
                      <div className="flex gap-2 mt-auto"> {/* property-actions */}
                        <button className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400" title="Email"> {/* action-icon-btn */}
                          <FiMail />
                        </button>
                        <button className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 cursor-pointer transition-all duration-200 hover:bg-[#25D366] hover:border-[#25D366] hover:text-white" title="WhatsApp"> {/* action-icon-btn whatsapp-btn */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                        </button>
                        <button className="w-10 h-10 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400" title="Share"> {/* action-icon-btn */}
                          <FiShare2 />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 border border-blue-100 rounded-lg"> {/* rental-manager-badge */}
                        <img src={ASSETS.LOGO_HERO_MAIN} alt="Rentals.ph" className="h-5 w-auto object-contain" /> {/* badge-logo */}
                        <span className="text-xs font-medium text-blue-700">Rental.Ph Official Rent Manager</span>
                      </div>
                      <div className="flex gap-4 pt-3 border-t border-gray-100"> {/* property-features */}
                        <div className="flex items-center gap-1.5 text-gray-600"> {/* feature-item */}
                          <svg className="w-5 h-5 text-gray-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> {/* feature-icon */}
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <path d="M9 22V12h6v10" />
                            <path d="M9 12h6" />
                          </svg>
                          <span className="text-sm font-medium">{listing.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600"> {/* feature-item */}
                          <svg className="w-5 h-5 text-gray-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> {/* feature-icon */}
                            <path d="M9 2v6M15 2v6M3 10h18M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10" />
                            <path d="M9 16h6" />
                          </svg>
                          <span className="text-sm font-medium">{listing.bathrooms}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600"> {/* feature-item */}
                          <svg className="w-5 h-5 text-gray-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"> {/* feature-icon */}
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="3" y1="15" x2="21" y2="15" />
                          </svg>
                          <span className="text-sm font-medium">{listing.area}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white rounded-xl p-6 shadow-sm"> {/* about-content */}
                <p className="text-base leading-relaxed text-gray-700 m-0"> {/* about-text */}
                  I&apos;m a firm believer that real estate is about more than just closing deals; it&apos;s about navigating life&apos;s biggest transitions with confidence and clarity. By combining hyper-local market data with a straight-shooting, &quot;no-fluff&quot; approach, I help my clients cut through the noise to find properties that align with both their financial goals and their lifestyle. Whether you&apos;re hunting for a hidden gem in an up-and-coming neighborhood or selling a long-time family home, I prioritize transparent communication and relentless advocacy to ensure you never feel like just another transaction. My goal is to handle the complexities of the contracts and the chaos of the search so that you can focus on the excitement of your next chapter.
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl p-6 shadow-sm"> {/* reviews-content */}
                <h3 className="m-0 mb-6 text-xl font-bold text-gray-900">1 Review</h3> {/* reviews-heading */}

                <div className="mt-8 pt-8 border-t border-gray-200"> {/* write-review-section */}
                  <h4 className="m-0 mb-6 text-lg font-semibold text-gray-900">Write a review</h4> {/* write-review-title */}

                  <form className="flex flex-col gap-5" onSubmit={(e) => { /* review-form */
                    e.preventDefault()
                    // Handle form submission here
                    console.log('Review submitted:', { ...reviewForm, rating })
                  }}>
                    <div className="grid grid-cols-2 gap-5 md:grid-cols-1"> {/* form-row */}
                      <div className="flex flex-col gap-2"> {/* form-group */}
                        <label htmlFor="firstname" className="text-sm font-medium text-gray-700">Firstname</label>
                        <input
                          type="text"
                          id="firstname"
                          placeholder="Enter your first name"
                          value={reviewForm.firstname}
                          onChange={(e) => setReviewForm({ ...reviewForm, firstname: e.target.value })}
                          className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /* form-input */
                        />
                      </div>

                      <div className="flex flex-col gap-2"> {/* form-group */}
                        <label htmlFor="lastname" className="text-sm font-medium text-gray-700">Lastname</label>
                        <input
                          type="text"
                          id="lastname"
                          placeholder="Enter your last name"
                          value={reviewForm.lastname}
                          onChange={(e) => setReviewForm({ ...reviewForm, lastname: e.target.value })}
                          className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /* form-input */
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2"> {/* form-group */}
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        value={reviewForm.email}
                        onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                        className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /* form-input */
                      />
                    </div>

                    <div className="flex items-center gap-4"> {/* rating-section */}
                      <div className="flex gap-1"> {/* stars-container */}
                        {[1, 2, 3, 4, 5].map((star) => {
                          const displayRating = hoverRating || rating
                          return (
                            <button
                              key={star}
                              type="button"
                              className={`w-10 h-10 bg-transparent border-0 cursor-pointer text-2xl transition-all duration-200 ${star <= displayRating ? 'text-yellow-400' : 'text-gray-300'}`} /* star-button */
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            >
                              <FiStar className={star <= displayRating ? 'fill-current' : ''} />
                            </button>
                          )
                        })}
                      </div>
                      <span className="text-sm text-gray-600">Your rating & review</span> {/* rating-label */}
                    </div>

                    <div className="flex flex-col gap-2"> {/* form-group */}
                      <label htmlFor="review" className="text-sm font-medium text-gray-700">Your Review</label>
                      <textarea
                        id="review"
                        placeholder="Your Review"
                        value={reviewForm.review}
                        onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                        className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-all duration-200 resize-vertical min-h-[120px] focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /* form-textarea */
                        rows={6}
                      />
                    </div>

                    <button type="submit" className="self-start py-3 px-8 bg-blue-600 text-white text-base font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"> {/* submit-review-btn */}
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

