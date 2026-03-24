"use client"

import { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react"
import { useRouter } from 'next/navigation'
import { ASSETS, getAsset } from "@/shared/utils/assets"
import { api, type PropertySearchResponse, type ConversationMessage } from "@/lib/api"
import { Property } from "@/shared/types"
import { getImageUrl } from "@/shared/utils/image"
import { formatAIMessage } from "@/shared/utils/format"
import { SimplePropertyCardSkeleton } from "@/shared/components/cards"
import { FadeInOnView } from "@/shared/components/ui"
import { TypewriterText } from "@/shared/components/animations/TypewriterText"
import HeroBanner from "./HeroBanner"

const SimplePropertyCard = lazy(() => import("@/shared/components/cards/SimplePropertyCard"))

const CONVERSATION_ID_KEY = 'rentals_ph_conversation_id'

function Hero() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [propertyType, setPropertyType] = useState('')
  const [location, setLocation] = useState('')
  const [minBeds, setMinBeds] = useState('')
  const [minBaths, setMinBaths] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isChatMode, setIsChatMode] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; message: string; properties?: Property[] }>>([
    {
      role: 'assistant',
      message: 'Hello! I\'m Rentals Assist. How can I help you find the perfect rental property today?'
    }
  ])
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  // Phase 2 state
  const [isAILoading, setIsAILoading] = useState(false)
  // Phase 3: AI search results state (separate from chat mode)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiResults, setAiResults] = useState<Property[] | null>(null)
  const [aiTotalCount, setAiTotalCount] = useState(0)
  const [aiExtractedFilters, setAiExtractedFilters] = useState<Record<string, any> | null>(null)
  const [aiConversationId, setAiConversationId] = useState<string | undefined>()
  // AI-generated property search queries for input label rotation
  const [propertySearchQueries, setPropertySearchQueries] = useState<string[]>([
    '3 bedroom condo in Makati under 100k',
    'Pet-friendly apartments in BGC with parking',
    'Latest listings in Cebu City',
    'Affordable studio apartments in Quezon City',
    'Furnished 2-bedroom house in Pasig',
    'Office space for rent in Manila',
    'Bedspace in Mandaluyong near LRT',
    'Commercial space in Lapulapu City',
  ])
  const [currentSearchQueryIndex, setCurrentSearchQueryIndex] = useState(0)
  // AI-generated input labels for contextual guidance
  const [aiInputLabel, setAiInputLabel] = useState('What are you looking for?')
  const [chatInputLabel, setChatInputLabel] = useState('Type your message...')
  // Automatically get latest properties from chat messages
  const latestProperties = useMemo(() => {
    // Find the latest message with properties (search from end)
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      const msg = chatMessages[i]
      if (msg.properties && Array.isArray(msg.properties) && msg.properties.length > 0) {
        console.log(`Found properties in message ${i}:`, {
          count: msg.properties.length,
          ids: msg.properties.map(p => p.id),
          properties: msg.properties
        })
        return {
          properties: [...msg.properties], // Create new array reference to ensure React detects change
          title: `Found ${msg.properties.length} propert${msg.properties.length === 1 ? 'y' : 'ies'}`,
          messageIndex: i, // Track which message these properties came from
          timestamp: Date.now() // Add timestamp to force re-render when properties change
        }
      }
    }
    console.log('No properties found in chat messages. Total messages:', chatMessages.length)
    return null
  }, [chatMessages])

  const [chatModeSearchQuery, setChatModeSearchQuery] = useState('')
  const [chatModeSortBy, setChatModeSortBy] = useState<string>('recommended')

  // Phase 1: Natural language detection + User mode selection
  const [searchMode, setSearchMode] = useState<'manual' | 'ai'>('manual')
  const [userSelectedMode, setUserSelectedMode] = useState<'manual' | 'ai' | null>(null)

  // Detect natural language vs manual search
  const detectSearchMode = (query: string): 'manual' | 'ai' => {
    if (!query.trim()) return 'manual'
    
    const trimmedQuery = query.trim().toLowerCase()
    
    // AI mode if input exceeds 25 characters
    if (trimmedQuery.length > 25) return 'ai'
    
    // AI mode keywords (case-insensitive)
    const aiKeywords = [
      'near', 'close to', 'with', 'walking distance', 'quiet', 'safe', 'school',
      'parking', 'furnished', 'within', 'beside', 'accessible', 'affordable',
      'spacious', 'cozy', 'good area', 'family', 'pet', 'garden', 'pool', 'gym',
      'views', 'overlooking'
    ]
    
    for (const keyword of aiKeywords) {
      if (trimmedQuery.includes(keyword)) return 'ai'
    }
    
    return 'manual'
  }

  // Update search mode whenever search query changes
  // If user has selected a mode explicitly, use that; otherwise, auto-detect
  useMemo(() => {
    if (userSelectedMode) {
      setSearchMode(userSelectedMode as 'manual' | 'ai')
    } else {
      setSearchMode(detectSearchMode(searchQuery))
    }
  }, [searchQuery, userSelectedMode])

  const filteredAndSortedProperties = useMemo(() => {
    if (!latestProperties?.properties?.length) return null
    const q = chatModeSearchQuery.trim().toLowerCase()
    let list = latestProperties.properties
    if (q) {
      list = list.filter((p) => {
        const title = (p.title || '').toLowerCase()
        const location = (p.location || '').toLowerCase()
        const city = (p.city || '').toLowerCase()
        const street = (p.street_address || '').toLowerCase()
        const type = (p.type || '').toLowerCase()
        const priceStr = String(p.price || '')
        const desc = (p.description || '').toLowerCase()
        return title.includes(q) || location.includes(q) || city.includes(q) || street.includes(q) || type.includes(q) || priceStr.includes(q) || desc.includes(q)
      })
    }
    const sorted = [...list]
    switch (chatModeSortBy) {
      case 'price-low':
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        break
      case 'price-high':
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        break
      case 'newest':
        sorted.sort((a, b) => {
          const da = a.published_at || a.created_at || ''
          const db = b.published_at || b.created_at || ''
          return db.localeCompare(da)
        })
        break
      case 'bedrooms':
        sorted.sort((a, b) => (b.bedrooms ?? 0) - (a.bedrooms ?? 0))
        break
      case 'bathrooms':
        sorted.sort((a, b) => (b.bathrooms ?? 0) - (a.bathrooms ?? 0))
        break
      case 'area':
        sorted.sort((a, b) => (b.area ?? 0) - (a.area ?? 0))
        break
      default:
        break
    }
    return { ...latestProperties, properties: sorted }
  }, [latestProperties, chatModeSearchQuery, chatModeSortBy])

  const [showResultsOverlay, setShowResultsOverlay] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const [showScrollArrow, setShowScrollArrow] = useState(true)
  const [showHeroOverlay, setShowHeroOverlay] = useState(false)

  const HERO_TITLE = 'FIND YOUR HOME IN THE PHILIPPINES'

  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const [suggestedPromptsLoading, setSuggestedPromptsLoading] = useState(false)
  const suggestedPromptsFetchedRef = useRef(false)
  const suggestedPromptsInFlightRef = useRef(false)
  const FALLBACK_SUGGESTED_PROMPTS = ['Show me 1-bedroom apartments', 'Find properties under ₱20k', 'Latest listings in Cebu City']
  
  // Refs for property search queries fetch
  const propertySearchQueriesFetchedRef = useRef(false)
  const propertySearchQueriesInFlightRef = useRef(false)

  // Array of background images - prioritize light blue with plant background
  const backgroundImages = [
    ASSETS.BG_HERO_LANDING, // Light blue with plant (primary design)
    getAsset('BG_HERO_LANDING_2') || ASSETS.BG_HERO_LANDING,
    getAsset('BG_HERO_LANDING_NEW') || ASSETS.BG_HERO_LANDING,
  ].filter(Boolean) // Remove any undefined values

  // Recommended searches
  const recommendedSearches = [
    'Condominium For Rent In Cebu',
    'House & Lot For Rent In Lapulapu',
    'Studio For Rent In Makati',
    'Pet Friendly Unit In Manila',
    '2 Bedroom Apartment In BGC',
    'Affordable Studio In Quezon City'
  ]

  // Map property types from Hero to PropertiesForRentPage format
  const propertyTypeMap: { [key: string]: string } = {
    'condominium': 'Condominium',
    'apartment': 'Apartment',
    'bedspace': 'Bed Space',
    'commercial': 'Commercial Spaces',
    'office': 'Office Spaces'
  }

  // Map locations from Hero to PropertiesForRentPage format
  const locationMap: { [key: string]: string } = {
    'manila': 'Manila',
    'makati': 'Makati City',
    'bgc': 'BGC',
    'quezon': 'Quezon City',
    'mandaluyong': 'Mandaluyong',
    'pasig': 'Pasig',
    'cebu': 'Cebu City',
    'davao': 'Davao City',
    'lapulapu': 'Lapulapu',
    'metro-manila': 'Metro Manila'
  }

  const handleSearch = () => {
    // Phase 2: Split into two paths based on search mode (considering user selection and auto-detection)
    if (searchMode === 'ai') {
      // AI mode: call the API endpoint
      handleAISearch()
      return
    }

    // Manual mode: existing redirect logic
    const params = new URLSearchParams()
    
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    }
    
    if (propertyType && propertyTypeMap[propertyType]) {
      params.set('type', propertyTypeMap[propertyType])
    }
    
    if (location && locationMap[location]) {
      params.set('location', locationMap[location])
    }

    // Add advanced filters
    if (minBeds) {
      params.set('minBeds', minBeds)
    }
    if (minBaths) {
      params.set('minBaths', minBaths)
    }
    if (priceMin) {
      params.set('priceMin', priceMin)
    }
    if (priceMax) {
      params.set('priceMax', priceMax)
    }
    
    // Navigate to properties page with query parameters
    const queryString = params.toString()
    router.push(`/properties${queryString ? `?${queryString}` : ''}`)
  }

  // Phase 3: AI search handler (also used in hybrid mode)
  const handleAISearch = async () => {
    if (!searchQuery.trim()) return
    
    console.log('[AI Search] Query submitted:', searchQuery, 'Mode:', userSelectedMode)
    setIsAILoading(true)

    try {
      // In hybrid mode, include manual filters
      const filters = userSelectedMode === 'hybrid' ? {
        bedrooms: minBeds ? parseInt(minBeds) : undefined,
        bathrooms: minBaths ? parseInt(minBaths) : undefined,
        min_price: priceMin ? parseFloat(priceMin) : undefined,
        max_price: priceMax ? parseFloat(priceMax) : undefined,
        property_type: propertyType ? propertyTypeMap[propertyType] : undefined,
        location: location ? locationMap[location] : undefined,
      } : {}

      const response = await api.searchProperties(searchQuery, aiConversationId, filters)
      
      if (response.success && response.data) {
        const data = response.data
        console.log('[AI Search] Response:', data)
        
        // Store response in state
        setAiResponse(data.ai_response)
        setAiResults(data.properties || [])
        setAiTotalCount(data.count || 0)
        setAiExtractedFilters(data.criteria || {})
        // Set AI-generated input label for next search
        if (data.input_label) {
          setAiInputLabel(data.input_label)
        }
        if (data.conversation_id) {
          setAiConversationId(data.conversation_id)
        }
      } else {
        console.error('[AI Search] Failed:', response.message)
        setAiResponse(`Error: ${response.message || 'Search failed'}`)
        setAiResults([])
      }
    } catch (error) {
      console.error('[AI Search] Error:', error)
      setAiResponse(`Error: Unable to search`)
      setAiResults([])
    } finally {
      setIsAILoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRecommendedSearch = (search: string) => {
    const params = new URLSearchParams()
    params.set('search', search)
    router.push(`/properties?${params.toString()}`)
  }

  const handleSendMessage = async (messageOverride?: string) => {
    const userMessage = (messageOverride ?? chatMessage).trim()
    if (!userMessage || isLoading) return

    if (!messageOverride) setChatMessage('')
    const newMessages = [...chatMessages, { role: 'user' as const, message: userMessage }]
    setChatMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await api.searchProperties(userMessage, conversationId)
      
      if (response.success && response.data) {
        const searchData = response.data as PropertySearchResponse
        
        console.log('API Response:', searchData)
        console.log('Properties from API:', searchData.properties)
        console.log('Properties count from API:', searchData.properties?.length || 0)
        
        // Update conversation ID if provided and save to localStorage
        if (searchData.conversation_id) {
          setConversationId(searchData.conversation_id)
          localStorage.setItem(CONVERSATION_ID_KEY, searchData.conversation_id)
        }
        
        // Set chat input label for next message
        if (searchData.input_label) {
          setChatInputLabel(searchData.input_label)
        }
        
        // Add assistant message with properties - ALWAYS use properties from API response
        const propertiesFromApi = Array.isArray(searchData.properties) ? searchData.properties : []
        const assistantMessage = {
          role: 'assistant' as const,
          message: searchData.ai_response,
          properties: propertiesFromApi // Always include properties, even if empty array
        }
        
        console.log('=== NEW ASSISTANT MESSAGE ===')
        console.log('Properties from API:', propertiesFromApi)
        console.log('Properties count:', propertiesFromApi.length)
        console.log('Properties IDs:', propertiesFromApi.map(p => p?.id || 'no-id'))
        console.log('Full assistant message:', assistantMessage)
        
        // Update chat messages - this will trigger latestProperties to update
        const updatedMessages = [
          ...newMessages,
          assistantMessage
        ]
        
        console.log('Updated chat messages count:', updatedMessages.length)
        console.log('Last message properties:', updatedMessages[updatedMessages.length - 1]?.properties?.length || 0)
        
        setChatMessages(updatedMessages)
      } else {
        // Handle error - show user-friendly message
        const errorMessage = response.message || 'Sorry, I encountered an error while searching. Please try again.'
        setChatMessages([
          ...newMessages,
          {
            role: 'assistant' as const,
            message: errorMessage
          }
        ])
      }
    } catch (error) {
      console.error('Search error:', error)
      // This catch block should rarely be hit since apiRequest handles errors
      // But we'll keep it as a safety net
      const errorMessage = error instanceof Error && error.message.includes('Failed to fetch')
        ? 'Unable to connect to the server. Please make sure the backend server is running on http://localhost:8000'
        : 'Sorry, I encountered an unexpected error. Please try again.'
      
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          message: errorMessage
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  // Load conversation ID from localStorage on mount
  useEffect(() => {
    const storedConversationId = localStorage.getItem(CONVERSATION_ID_KEY)
    if (storedConversationId) {
      setConversationId(storedConversationId)
    }
    // trigger hero overlay fade-in once on initial mount
    setShowHeroOverlay(true)
  }, [])

  // Save conversation ID to localStorage when it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(CONVERSATION_ID_KEY, conversationId)
    }
  }, [conversationId])

  // Fetch suggested prompts on Hero load and when user opens chat, so the request is visible in Network when entering chat.
  useEffect(() => {
    if (suggestedPromptsFetchedRef.current || suggestedPromptsInFlightRef.current) return

    suggestedPromptsInFlightRef.current = true
    let cancelled = false
    setSuggestedPromptsLoading(true)

    const DEBUG = process.env.NODE_ENV === 'development'
    const run = async () => {
      if (DEBUG) console.log('[suggestedPrompts] Fetching suggested prompts...')
      try {
        const response = await api.getSuggestedPrompts()
        const raw = response.data
        // Backend returns { prompts: string[], fromAI: boolean }; support legacy array shape
        const prompts = Array.isArray(raw) ? raw : (raw?.prompts ?? [])
        const fromAI = Array.isArray(raw) ? false : (raw?.fromAI === true)
        if (DEBUG) {
          console.log('[suggestedPrompts] Response:', {
            success: response.success,
            fromAI,
            promptsLength: prompts.length,
            prompts,
          })
        }
        if (!cancelled) {
          if (response.success && prompts.length >= 3) {
            if (DEBUG) console.log(fromAI ? '[suggestedPrompts] Using AI prompts:' : '[suggestedPrompts] Using backend fallback (AI unavailable):', prompts)
            setSuggestedPrompts(prompts)
          } else {
            if (DEBUG) console.warn('[suggestedPrompts] Using local fallback. Reason:', !response.success ? 'success=false' : prompts.length < 3 ? `prompts.length=${prompts.length} < 3` : 'unknown')
            setSuggestedPrompts(FALLBACK_SUGGESTED_PROMPTS)
          }
          suggestedPromptsFetchedRef.current = true
        }
      } catch (err) {
        if (DEBUG) {
          console.error('[suggestedPrompts] Request failed:', err instanceof Error ? err.message : err)
        }
        if (!cancelled) {
          setSuggestedPrompts(FALLBACK_SUGGESTED_PROMPTS)
          suggestedPromptsFetchedRef.current = true
        }
      } finally {
        if (!cancelled) setSuggestedPromptsLoading(false)
        suggestedPromptsInFlightRef.current = false
      }
    }
    run()

    return () => { cancelled = true }
  }, [isChatMode])

  // Fetch property search queries for input label rotation on component mount
  useEffect(() => {
    if (propertySearchQueriesFetchedRef.current || propertySearchQueriesInFlightRef.current) return

    propertySearchQueriesInFlightRef.current = true
    let cancelled = false

    const DEBUG = process.env.NODE_ENV === 'development'
    const run = async () => {
      if (DEBUG) console.log('[propertySearchQueries] Fetching AI-generated search queries...')
      try {
        const response = await api.getPropertySearchQueries()
        const raw = response.data
        // Backend returns { searches: string[], fromAI: boolean }
        const searches = raw?.searches ?? []
        const fromAI = raw?.fromAI === true
        if (DEBUG) {
          console.log('[propertySearchQueries] Response:', {
            success: response.success,
            fromAI,
            searchesLength: searches.length,
            searches,
          })
        }
        if (!cancelled) {
          if (response.success && searches.length >= 6) {
            if (DEBUG) console.log(fromAI ? '[propertySearchQueries] Using AI queries:' : '[propertySearchQueries] Using fallback queries:', searches)
            setPropertySearchQueries(searches)
          }
          propertySearchQueriesFetchedRef.current = true
        }
      } catch (err) {
        if (DEBUG) {
          console.error('[propertySearchQueries] Request failed:', err instanceof Error ? err.message : err)
        }
        if (!cancelled) {
          propertySearchQueriesFetchedRef.current = true
        }
      } finally {
        propertySearchQueriesInFlightRef.current = false
      }
    }
    run()

    return () => { cancelled = true }
  }, [])

  // Rotate through property search queries every 5 seconds while in AI mode and input is empty
  useEffect(() => {
    if (searchMode !== 'ai' || searchQuery.trim()) {
      return // Don't rotate if not in AI mode or if there's input
    }

    const interval = setInterval(() => {
      setCurrentSearchQueryIndex((prevIndex) => 
        (prevIndex + 1) % propertySearchQueries.length
      )
    }, 5000) // Change query every 5 seconds

    return () => clearInterval(interval)
  }, [searchMode, searchQuery, propertySearchQueries])

  // Auto-scroll chat to bottom when messages change or loading state changes
  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      // Scroll only the chat container, not the entire page
      chatMessagesContainerRef.current.scrollTo({
        top: chatMessagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [chatMessages, isLoading])

  // Auto-rotate background images with smooth transitions
  useEffect(() => {
    if (backgroundImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      )
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [backgroundImages.length])

  // Close overlay on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMenu) {
          setShowMenu(false)
        }
      }
    }

    if (showMenu) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [showMenu])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showMenu && !target.closest('.chat-menu-container')) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Lock body scroll when results overlay is open (mobile)
  useEffect(() => {
    if (showResultsOverlay) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [showResultsOverlay])

  // Hide scroll-down arrow when user scrolls past the hero
  useEffect(() => {
    const handleScroll = () => {
      const hero = heroSectionRef.current
      if (!hero) return
      const rect = hero.getBoundingClientRect()
      // Hide when hero bottom has moved above ~85% of viewport
      setShowScrollArrow(rect.bottom > window.innerHeight * 0.85)
    }
    handleScroll() // initial check
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToContent = () => {
    window.scrollTo({ top: heroSectionRef.current?.getBoundingClientRect().bottom ?? window.innerHeight, behavior: 'smooth' })
  }

  return (
    <section 
      ref={heroSectionRef}
      id="home" 
      className="relative mt-0 transition-all duration-500 ease-in-out flex flex-col justify-center items-center min-h-[500px] sm:min-h-[600px] md:min-h-[670px] overflow-hidden"
    >
      {/* Background images with smooth transitions */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden transition-all duration-300 min-h-[500px] sm:min-h-[600px] md:min-h-[700px]">
        {backgroundImages.map((imageSrc, index) => (
          <img
            key={index}
            src={imageSrc}
            alt={`Hero background ${index + 1}`}
            className={`w-full h-full object-cover object-center absolute top-0 left-0 transition-all duration-[2000ms] ease-in-out animate-[heroBackgroundAnimation_20s_ease-in-out_infinite] ${
              index === currentImageIndex ? 'opacity-100 z-[1]' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* Dark overlay over hero background with subtle fade-in (vanilla CSS gradient) */}
      <div
        className={`absolute inset-0 z-[1] pointer-events-none transition-opacity duration-700 ease-out ${
          showHeroOverlay ? 'opacity-80' : 'opacity-0'
        }`}
        style={{
          // Extra soft blue overlay: very light, still slightly darker at bottom
          background:
            'linear-gradient(to top, rgba(32, 94, 215, 0.35) 0%, rgba(32, 94, 215, 0.22) 35%, rgba(32, 94, 215, 0.12) 70%, rgba(32, 94, 215, 0.03) 100%)',
        }}
      />

      {/* Hero content - stable padding and alignment */}
      <div className="flex flex-col items-center justify-center w-full text-center relative z-10 px-4 py-8 sm:py-12 md:py-16 pb-24 sm:pb-32 md:pb-40">
        <FadeInOnView>
          <h2
            className="font-outfit font-bold text-[#205ED7] mb-4 mt-12 tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)] text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl"
          >
            {HERO_TITLE.split('').map((char, index) => (
              <span
                key={index}
                className="inline-block"
                style={{
                  opacity: showHeroOverlay ? 1 : 0,
                  transform: showHeroOverlay ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                  transitionDelay: `${index * 25}ms`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h2>
        </FadeInOnView>
        <FadeInOnView delayMs={120}>
          <p
            className="max-w-3xl font-outfit drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)] px-2 mb-6 text-sm xs:text-base md:text-xl"
          >
            <span className="text-[#FE8E0A]">Trusted Rentals, simplified. Start your journey with </span>
            <span className="font-bold text-[#205ED7]">Rentals.ph.</span>
          </p>
        </FadeInOnView>

       

        {/* Search bar and filters or Chat container - constrained to same max-width as page; no horizontal overflow */}
        <FadeInOnView
          delayMs={260}
          className="w-full max-w-7xl mx-auto transition-all duration-500 px-0 sm:px-2"
          as="div"
        >
          {isChatMode ? (
            <>
              {/* Single rounded container for Chat Mode: header + two-column content; on mobile overflow-visible so inner chat can scroll */}
              <div className="flex flex-col w-full bg-white/50 rounded-xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] min-h-0 h-auto overflow-visible md:overflow-visible flex-1">
                {/* Inner header: logo, search, notifications, avatar - compact on mobile */}
                <header className="flex items-center gap-2 sm:gap-4 px-3 py-2.5 sm:px-4 sm:py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0">
                    <img src={getAsset('LOGO_AI')} alt="" className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0" />
                    <span className="font-outfit font-bold text-gray-900 text-xs sm:text-base truncate">Rentals Assist</span>
                  </div>
                  <div className="flex-1 min-w-0 flex justify-left mx-auto max-w-[180px] xs:max-w-none">
                    <div className="relative w-full min-w-0">
                      <svg className="absolute left-2.5 sm:left-3 top-3 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-8 sm:pl-9 pr-2 sm:pr-3 py-2 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 font-outfit text-xs sm:text-sm placeholder-gray-500 outline-none transition-colors focus:border-rental-blue-500 focus:bg-white focus:ring-2 focus:ring-rental-blue-500/20"
                        value={chatModeSearchQuery}
                        onChange={(e) => setChatModeSearchQuery(e.target.value)}
                        aria-label="Filter properties"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <div className="chat-menu-container relative">
                      <button
                        type="button"
                        className="p-2 min-h-[44px] min-w-[44px] hover:bg-white/80 rounded-lg transition-colors text-gray-600 hover:text-gray-900 touch-manipulation flex items-center justify-center"
                        onClick={() => setShowMenu(!showMenu)}
                        aria-label="Search history"
                        title="Search history"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M11 7v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {showMenu && (
                        <div className="absolute top-full right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] max-w-[288px] bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-[300px] overflow-y-auto">
                          <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
                            <h4 className="font-outfit text-xs font-semibold text-gray-600 uppercase tracking-wide m-0">Search History</h4>
                          </div>
                          {chatMessages
                            .filter((msg) => msg.role === 'user')
                            .slice()
                            .reverse()
                            .map((msg, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full flex items-start gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors font-outfit text-sm"
                                onClick={() => {
                                  setSearchQuery(msg.message);
                                  setShowMenu(false);
                                }}
                                title={msg.message}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5 text-gray-400">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M12 6v6l4 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span className="line-clamp-2 flex-1">{msg.message}</span>
                              </button>
                            ))}
                          {chatMessages.filter((msg) => msg.role === 'user').length === 0 && (
                            <div className="px-4 py-4 text-center text-gray-500 font-outfit text-sm">
                              No search history yet
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button type="button" className="p-2 min-h-[44px] min-w-[44px] hover:bg-white/80 rounded-lg transition-colors text-gray-600 hover:text-gray-900 touch-manipulation flex items-center justify-center" onClick={() => setIsChatMode(false)} aria-label="Close chat">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                </header>
                {/* Two-column content: on mobile only chat is shown; results open in overlay. On md+ both columns side by side. No overflow-hidden so chat messages can scroll on mobile. */}
                <div className="flex flex-col md:flex-row gap-2 sm:gap-4 flex-1 min-h-0 min-w-0 p-2 sm:p-4 bg-gray-100/50 md:overflow-hidden overflow-visible">
              {/* Left column: Property results - hidden on mobile (shown in overlay instead) */}
              <div className="hidden md:flex flex-col flex-[3] min-w-0 min-h-0 bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden order-1">
                <div className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-200 bg-white flex-shrink-0">
                  <h3 className="font-outfit text-sm sm:text-lg font-bold text-gray-900 m-0 truncate">
                    {filteredAndSortedProperties
                      ? `Found ${filteredAndSortedProperties.properties.length} propert${filteredAndSortedProperties.properties.length === 1 ? 'y' : 'ies'}${filteredAndSortedProperties.properties[0]?.city ? ` in ${filteredAndSortedProperties.properties[0].city}` : ''}`
                      : isLoading
                        ? 'Searching...'
                        : 'Found 0 properties'}
                  </h3>
                  <div className="flex-shrink-0">
                    <select
                      className="font-outfit text-xs sm:text-sm text-gray-700 bg-white border border-gray-300 rounded-lg py-2 pl-2 pr-7 sm:pl-3 sm:pr-8 appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-rental-blue-500/20 focus:border-rental-blue-500 bg-no-repeat bg-[length:10px_6px] bg-[right_0.5rem_center]"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")" }}
                      aria-label="Sort by"
                      value={chatModeSortBy}
                      onChange={(e) => setChatModeSortBy(e.target.value)}
                    >
                      <option value="recommended">Sort by: Recommended</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="newest">Newest First</option>
                      <option value="bedrooms">Most Bedrooms</option>
                      <option value="bathrooms">Most Bathrooms</option>
                      <option value="area">Largest Area</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 min-h-0 [scrollbar-width:thin]">
                  {isLoading && (!latestProperties || latestProperties.properties.length === 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <SimplePropertyCardSkeleton key={`skeleton-${i}`} />
                      ))}
                    </div>
                  ) : filteredAndSortedProperties && filteredAndSortedProperties.properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <Suspense
                        fallback={
                          <>
                            {[1, 2, 3, 4].map((i) => (
                              <SimplePropertyCardSkeleton key={`skeleton-${i}`} />
                            ))}
                          </>
                        }
                      >
                        {filteredAndSortedProperties.properties.map((property, index) => (
                          <SimplePropertyCard
                            key={`${property.id}-${index}-${filteredAndSortedProperties.messageIndex ?? index}`}
                            id={property.id}
                            title={property.title}
                            location={property.location || property.city || property.street_address || undefined}
                            price={`₱${property.price.toLocaleString('en-US')}${property.price_type ? `/${property.price_type}` : ''}`}
                            image={property.image_url || (property.image ? getImageUrl(property.image) : ASSETS.PLACEHOLDER_PROPERTY_MAIN)}
                            variant="chat"
                            bedrooms={property.bedrooms}
                            bathrooms={property.bathrooms}
                            area={property.area}
                          />
                        ))}
                      </Suspense>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-[12rem] text-gray-500 font-outfit text-sm">
                      Ask Rentals Assist to find properties for you.
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile only: "View results" button when there are results */}
              {filteredAndSortedProperties && filteredAndSortedProperties.properties.length > 0 && (
                <div className="md:hidden flex-shrink-0 px-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowResultsOverlay(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rental-blue-600 text-white font-outfit font-semibold text-sm shadow-md hover:bg-rental-blue-700 active:scale-[0.98] transition-colors touch-manipulation"
                    aria-label={`View ${filteredAndSortedProperties.properties.length} results`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    View {filteredAndSortedProperties.properties.length} propert{filteredAndSortedProperties.properties.length === 1 ? 'y' : 'ies'}
                  </button>
                </div>
              )}

              {/* Chat column: full width on mobile, constrained on md+ */}
              <div className="flex flex-col flex-[3] min-w-0 min-h-0 md:max-w-[28rem] bg-white rounded-xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden order-2 flex-shrink-0">
                <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-4 border-b border-gray-200 bg-white flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <img src={getAsset('LOGO_AI')} alt="" className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0 rounded-full object-cover" />
                    <h3 className="font-outfit text-sm sm:text-lg font-bold text-gray-900 truncate">Rentals Assist</h3>
                  </div>
                  
                </div>
                <div
                  ref={chatMessagesContainerRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 min-h-0 bg-white [scrollbar-width:thin] touch-pan-y"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <>
                    <h4 className="font-outfit font-semibold text-gray-900 text-base mb-3">Chat with Rentals Assist</h4>
                    {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' ? (
                            <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%]">
                              <img src={getAsset('LOGO_AI')} alt="" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full object-cover" />
                              <div className="ai-message-content p-3 bg-white rounded-2xl rounded-tl-sm font-outfit text-sm leading-relaxed break-words text-left" dangerouslySetInnerHTML={{ __html: formatAIMessage(msg.message) }} style={{ border: '3px solid #0A369D' }} />
                            </div>
                          ) : (
                            <div className="max-w-[90%] sm:max-w-[85%] p-3 px-4 bg-gray-100 rounded-2xl rounded-br-sm font-outfit text-sm leading-relaxed break-words text-left text-gray-900" dangerouslySetInnerHTML={{ __html: msg.message.replace(/\n/g, '<br />') }} />
                          )}
                        </div>
                      ))}
                     
                      {chatMessages.length <= 1 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {suggestedPromptsLoading
                            ? [1, 2, 3].map((i) => (
                                <div key={i} className="h-11 rounded-full bg-gray-200 animate-pulse w-full" aria-hidden />
                              ))
                            : (suggestedPrompts.length > 0 ? suggestedPrompts : FALLBACK_SUGGESTED_PROMPTS).map((label) => (
                                <button
                                  key={label}
                                  type="button"
                                  className="font-outfit text-xs font-medium py-2.5 px-5 rounded-full bg-rental-blue-600 text-white hover:bg-rental-blue-700 transition-colors touch-manipulation text-left"
                                  onClick={() => handleSendMessage(label)}
                                >
                                  {label}
                                </button>
                              ))}
                        </div>
                      )}
                      {isLoading && (
                        <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%]">
                          <img src={getAsset('LOGO_AI')} alt="" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full object-cover" />
                          <div className="p-3 px-4 bg-white border border-gray-200 rounded-2xl rounded-tl-sm font-outfit">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatMessagesEndRef} />
                    </>
                </div>
                <div className="border-t border-gray-200 bg-white flex-shrink-0">
                  <form className="flex items-center gap-2 p-3 sm:p-4" onSubmit={handleChatSubmit}>
                    <div className="flex-1 min-w-0 relative">
                      <input
                        type="text"
                        className="w-full p-2.5 sm:p-3 px-3 sm:px-4 border border-gray-300 rounded-lg sm:rounded-xl font-outfit text-sm outline-none transition-colors focus:border-rental-blue-500 focus:ring-2 focus:ring-rental-blue-500/20 min-h-[44px]"
                        placeholder={isLoading ? 'Searching...' : ''}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        disabled={isLoading}
                      />
                      {!chatMessage && !isLoading && (
                        <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-outfit text-sm pointer-events-none">
                          <TypewriterText 
                            text={chatInputLabel}
                            speed={30}
                            className="text-gray-400 font-outfit text-sm"
                          />
                        </div>
                      )}
                    </div>
                    <button type="submit" className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-rental-blue-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-rental-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-95" aria-label="Send message">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </form>
                </div>
              </div>
                </div>
              </div>

              {/* Mobile: Results overlay - slide-up sheet when "View results" is tapped */}
              {showResultsOverlay && (
                <div
                  className="fixed inset-0 z-[1001] md:hidden flex flex-col"
                  aria-modal="true"
                  aria-label="Property results"
                >
                  <button
                    type="button"
                    onClick={() => setShowResultsOverlay(false)}
                    className="absolute inset-0 bg-black/50 transition-opacity"
                    aria-label="Close results"
                  />
                  <div
                    className="relative flex flex-col flex-1 mt-auto bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] max-h-[88vh] animate-slideInFromBottom"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 flex-shrink-0">
                      <h3 className="font-outfit text-base font-bold text-gray-900 m-0 truncate">
                        {filteredAndSortedProperties
                          ? `Found ${filteredAndSortedProperties.properties.length} propert${filteredAndSortedProperties.properties.length === 1 ? 'y' : 'ies'}${filteredAndSortedProperties.properties[0]?.city ? ` in ${filteredAndSortedProperties.properties[0].city}` : ''}`
                          : 'Results'}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          className="font-outfit text-sm text-gray-700 bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-rental-blue-500/20 focus:border-rental-blue-500 bg-no-repeat bg-[length:10px_6px] bg-[right_0.5rem_center]"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")" }}
                          aria-label="Sort by"
                          value={chatModeSortBy}
                          onChange={(e) => setChatModeSortBy(e.target.value)}
                        >
                          <option value="recommended">Sort by: Recommended</option>
                          <option value="price-low">Price: Low to High</option>
                          <option value="price-high">Price: High to Low</option>
                          <option value="newest">Newest First</option>
                          <option value="bedrooms">Most Bedrooms</option>
                          <option value="bathrooms">Most Bathrooms</option>
                          <option value="area">Largest Area</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowResultsOverlay(false)}
                          className="p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-gray-100 text-gray-600 flex items-center justify-center touch-manipulation"
                          aria-label="Close results"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 [scrollbar-width:thin]">
                      {filteredAndSortedProperties && filteredAndSortedProperties.properties.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 pb-6">
                          <Suspense fallback={null}>
                            {filteredAndSortedProperties.properties.map((property, index) => (
                              <SimplePropertyCard
                                key={`${property.id}-${index}-overlay-${filteredAndSortedProperties.messageIndex ?? index}`}
                                id={property.id}
                                title={property.title}
                                location={property.location || property.city || property.street_address || undefined}
                                price={`₱${property.price.toLocaleString('en-US')}${property.price_type ? `/${property.price_type}` : ''}`}
                                image={property.image_url || (property.image ? getImageUrl(property.image) : ASSETS.PLACEHOLDER_PROPERTY_MAIN)}
                                variant="chat"
                                bedrooms={property.bedrooms}
                                bathrooms={property.bathrooms}
                                area={property.area}
                              />
                            ))}
                          </Suspense>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Mode Selection Tabs */}
              <div className="flex gap-2 mb-4 justify-start flex-wrap">
                <button
                  onClick={() => setUserSelectedMode('manual')}
                  className={`px-4 py-2 rounded-full text-sm font-outfit font-medium transition-all ${
                    userSelectedMode === 'manual'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white/40 text-gray-700 border border-gray-300/50 hover:bg-white/60'
                  }`}
                >
                  Manual Mode
                </button>
                <button
                  onClick={() => setUserSelectedMode('ai')}
                  className={`px-4 py-2 rounded-full text-sm font-outfit font-medium transition-all ${
                    userSelectedMode === 'ai'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/40 text-gray-700 border border-gray-300/50 hover:bg-white/60'
                  }`}
                >
                  AI Mode
                </button>
                <button
                  onClick={() => setUserSelectedMode('hybrid')}
                  className={`px-4 py-2 rounded-full text-sm font-outfit font-medium transition-all ${
                    userSelectedMode === 'hybrid'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/40 text-gray-700 border border-gray-300/50 hover:bg-white/60'
                  }`}
                >
                  Hybrid Refine
                </button>
              </div>

              {/* Light search bar container */}
              <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 w-full shadow-lg">
                <div className="bg-gray-50/90 rounded-xl sm:rounded-2xl w-full flex flex-col md:flex-row items-stretch md:items-center overflow-hidden shadow-md md:h-auto border-2 border-gray-200" 
                style={{
                 borderWidth: '2px',
                 borderStyle: 'solid',
                 borderColor: 'rgb(226, 226, 226)',
                }}>
                    {/* Input field with typewriter label */}
                    <div className="relative flex-1 flex items-center md:min-w-[250px]">
                      <input 
                        type="text" 
                        className="flex-1 border-none outline-none bg-transparent text-gray-900 font-outfit text-sm sm:text-base font-normal px-4 sm:px-8 min-w-0 h-12 sm:h-auto py-3 sm:py-4 md:py-0 md:h-[57px] w-full md:border-b-0 border-b border-gray-200 relative z-10" 
                        placeholder={
                          (searchMode === 'ai' && !searchQuery) 
                            ? ''
                            : (aiResults && aiResults.length > 0 ? "Refine your search or ask a follow-up..." : "What are you looking for?")
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      
                      {/* Typewriter Label for AI Mode - Rotating Property Searches */}
                      {searchMode === 'ai' && !searchQuery && (
                        <div className="absolute left-4 sm:left-8 top-4 text-gray-400 font-outfit text-sm sm:text-base pointer-events-none">
                          <TypewriterText 
                            key={currentSearchQueryIndex}
                            text={propertySearchQueries[currentSearchQueryIndex] || 'Search for properties...'}
                            speed={25}
                            className="text-gray-400 font-outfit text-sm sm:text-base"
                          />
                        </div>
                      )}
                    </div>

                    {/* Mode Badge */}
                    <div className="px-3 sm:px-4 flex items-center">
                      {userSelectedMode === 'hybrid' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-purple-100/60 text-purple-700 font-outfit text-xs font-medium">
                          <span>✦</span>
                          <span>AI + Filters</span>
                        </span>
                      ) : searchMode === 'ai' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-blue-100/60 text-blue-700 font-outfit text-xs font-medium">
                          <span>✦</span>
                          <span>AI Search</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gray-200/60 text-gray-600 font-outfit text-xs font-medium">
                          <span>Filters</span>
                        </span>
                      )}
                    </div>

                    <div className="md:block hidden w-px h-[67px] bg-gray-200 flex-shrink-0" />

                    {(searchMode === 'manual' || userSelectedMode === 'hybrid') && (
                      <>
                    <select 
                      className={`text-gray-700 font-outfit text-base font-normal bg-transparent border-none outline-none cursor-pointer appearance-none md:py-5 py-4 pr-[50px] md:pl-9 pl-5 md:min-w-[180px] w-full md:w-auto transition-colors hover:text-[#205ED7] focus:text-[#205ED7] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%229%22%20height%3D%226%22%20viewBox%3D%220%200%209%206%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201L4.5%205L8%201%22%20stroke%3D%236b7280%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat md:bg-[right_36px_center] bg-[right_20px_center] bg-[length:9px_6px] md:border-b-0 border-b border-gray-200`}
                      
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                    >
                      <option value="">Property Type</option>
                      <option value="condominium">Condominium</option>
                      <option value="apartment">Apartment</option>
                      <option value="bedspace">Bed Space</option>
                      <option value="commercial">Commercial Spaces</option>
                      <option value="office">Office Spaces</option>
                    </select>
                    
                    <div className="md:block hidden w-px h-[67px] bg-gray-200 flex-shrink-0" />
                    
                    <select 
                      className={`text-gray-700 font-outfit text-base font-normal bg-transparent border-none outline-none cursor-pointer appearance-none md:py-5 py-4 pr-[50px] md:pl-9 pl-5 md:min-w-[180px] w-full md:w-auto transition-colors hover:text-[#205ED7] focus:text-[#205ED7] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%229%22%20height%3D%226%22%20viewBox%3D%220%200%209%206%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201L4.5%205L8%201%22%20stroke%3D%236b7280%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat md:bg-[right_36px_center] bg-[right_20px_center] bg-[length:9px_6px] md:border-b-0 border-b border-gray-200`}
                      
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      <option value="">Location</option>
                      <option value="metro-manila">Metro Manila</option>
                      <option value="makati">Makati City</option>
                      <option value="bgc">BGC</option>
                      <option value="quezon">Quezon City</option>
                      <option value="mandaluyong">Mandaluyong</option>
                      <option value="pasig">Pasig</option>
                      <option value="cebu">Cebu City</option>
                      <option value="davao">Davao City</option>
                      <option value="lapulapu">Lapulapu</option>
                      <option value="manila">Manila</option>
                    </select>

                    <button 
                      className="flex items-center bg-white border-none rounded-full py-2 px-5 ml-2 mr-2 text-base text-indigo-700 font-medium shadow-sm transition-all hover:border-indigo-600 md:inline-flex hidden"
                      type="button"
                      onClick={() => setShowAdvancedOptions((prev) => !prev)}
                      aria-label="Show filters"
                      title="Show filters"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 text-indigo-500">
                        <path d="M4 6h16M6 12h12M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="font-semibold tracking-wider">Filters</span>
                    </button>
                    </>
                    )}

                    <button 
                      className="bg-[#FE8E0A] md:rounded-r-xl rounded-xl w-full md:w-[135px] md:h-[67px] h-12 sm:h-[50px] border-none cursor-pointer flex items-center justify-center transition-all hover:bg-[#ff7700] hover:shadow-lg active:scale-[0.98] flex-shrink-0 relative overflow-hidden group font-outfit font-semibold text-white text-sm sm:text-base"
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                  </div>

                  

                  {/* Advanced Options - Inside search container, animated when filter button is toggled */}
                  {(searchMode === 'manual' || userSelectedMode === 'hybrid') && (
                  <div
                    className={`w-full transition-all duration-300 ease-out origin-top ${
                      showAdvancedOptions
                        ? 'pt-1 mt-3 border-t border-gray-300/20 max-h-[500px] opacity-100 scale-100'
                        : 'pt-0 mt-0 border-t border-transparent max-h-0 opacity-0 scale-[0.98] overflow-hidden'
                    }`}
                  >
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 -mb-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="font-outfit text-xs font-medium text-gray-700">Min. Bedrooms</label>
                        <select 
                          className="h-[38px] p-2 px-3 border border-gray-300/65 rounded-md bg-white text-gray-700 font-outfit text-xs cursor-pointer transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%229%22%20height%3D%226%22%20viewBox%3D%220%200%209%206%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201L4.5%205L8%201%22%20stroke%3D%22%23374151%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center] bg-[length:9px_6px] pr-8 hover:border-[#205ED7] focus:border-[#205ED7] focus:outline-none"
                          value={minBeds}
                          onChange={(e) => setMinBeds(e.target.value)}
                        >
                          <option value="">Any</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-outfit text-xs font-medium text-gray-700">Min. Bathrooms</label>
                        <select 
                          className="h-[38px] p-2 px-3 border border-gray-300/65 rounded-md bg-white text-gray-700 font-outfit text-xs cursor-pointer transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%229%22%20height%3D%226%22%20viewBox%3D%220%200%209%206%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201L4.5%205L8%201%22%20stroke%3D%22%23374151%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center] bg-[length:9px_6px] pr-8 hover:border-[#205ED7] focus:border-[#205ED7] focus:outline-none"
                          value={minBaths}
                          onChange={(e) => setMinBaths(e.target.value)}
                        >
                          <option value="">Any</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-outfit text-xs font-medium text-gray-700">Price Range</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="flex-1 min-w-0 h-[38px] p-2 px-3 border border-gray-300/65 rounded-md bg-white text-gray-700 font-outfit text-xs transition-colors hover:border-[#205ED7] focus:border-[#205ED7] focus:outline-none"
                            placeholder="Min"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                          />
                          <span className="font-outfit text-xs text-gray-600 font-medium">to</span>
                          <input
                            type="number"
                            className="flex-1 min-w-0 h-[38px] p-2 px-3 border border-gray-300/65 rounded-md bg-white text-gray-700 font-outfit text-xs transition-colors hover:border-[#205ED7] focus:border-[#205ED7] focus:outline-none"
                            placeholder="Max"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

              </div>

              {/* Phase 2: AI Loading Indicator */}
              {isAILoading && searchMode === 'ai' && (
                <div className="mt-2 sm:mt-3 text-center">
                  <p className="font-outfit text-xs sm:text-sm text-gray-500">
                    ✦ Searching with AI...
                  </p>
                </div>
              )}

              {/* Phase 4: AI Results Section */}
              {searchMode === 'ai' && !isAILoading && aiResults && aiResults.length > 0 && (
                <div className="mt-4 sm:mt-6 w-full max-w-full">
                  {/* AI Response Banner */}
                  <div className="mb-4 px-4 sm:px-0">
                    <div className="flex items-start gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-blue-50/80 border border-blue-200/50">
                      <span className="text-blue-600 text-lg flex-shrink-0 mt-0.5">✦</span>
                      <p className="font-outfit text-sm sm:text-base text-gray-700">{aiResponse}</p>
                    </div>
                  </div>

                  {/* Phase 6: Filter Pills */}
                  {aiExtractedFilters && Object.keys(aiExtractedFilters).length > 0 && (
                    <div className="mb-4 px-4 sm:px-0">
                      <div className="flex gap-2 flex-wrap items-center">
                        {aiExtractedFilters.location && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-outfit text-xs">
                            <span>✦ {aiExtractedFilters.location}</span>
                            <button
                              className="hover:text-gray-900 cursor-pointer"
                              onClick={() => {
                                const updated = { ...aiExtractedFilters }
                                delete updated.location
                                setAiExtractedFilters(updated)
                                setSearchQuery('')
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {aiExtractedFilters.property_type && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-outfit text-xs">
                            <span>{aiExtractedFilters.property_type}</span>
                            <button
                              className="hover:text-gray-900 cursor-pointer"
                              onClick={() => {
                                const updated = { ...aiExtractedFilters }
                                delete updated.property_type
                                setAiExtractedFilters(updated)
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {aiExtractedFilters.bedrooms && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-outfit text-xs">
                            <span>{aiExtractedFilters.bedrooms} bedrooms</span>
                            <button
                              className="hover:text-gray-900 cursor-pointer"
                              onClick={() => {
                                const updated = { ...aiExtractedFilters }
                                delete updated.bedrooms
                                setAiExtractedFilters(updated)
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {(aiExtractedFilters.min_price || aiExtractedFilters.max_price) && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-outfit text-xs">
                            <span>
                              ₱{aiExtractedFilters.min_price || '0'} - ₱{aiExtractedFilters.max_price || 'any'}
                            </span>
                            <button
                              className="hover:text-gray-900 cursor-pointer"
                              onClick={() => {
                                const updated = { ...aiExtractedFilters }
                                delete updated.min_price
                                delete updated.max_price
                                setAiExtractedFilters(updated)
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        {Object.keys(aiExtractedFilters).length > 0 && (
                          <button
                            className="text-gray-500 hover:text-gray-700 font-outfit text-xs ml-2"
                            onClick={() => {
                              setAiExtractedFilters({})
                              setAiResults([])
                              setAiResponse(null)
                              setSearchQuery('')
                            }}
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Property Cards Grid - max 6 cards */}
                  <div className="mb-4 px-4 sm:px-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <Suspense fallback={null}>
                        {aiResults.slice(0, 6).map((property, index) => (
                          <SimplePropertyCard
                            key={`${property.id}-${index}`}
                            id={property.id}
                            title={property.title}
                            location={property.location || property.city || property.street_address || 'Location not specified'}
                            price={`₱${property.price.toLocaleString('en-US')}${property.price_type ? `/${property.price_type}` : ''}`}
                            image={property.image_url || (property.image ? getImageUrl(property.image) : ASSETS.PLACEHOLDER_PROPERTY_MAIN)}
                            bedrooms={property.bedrooms}
                            bathrooms={property.bathrooms}
                            area={property.area}
                          />
                        ))}
                      </Suspense>
                    </div>
                  </div>

                  {/* See All Button and Clear Search */}
                  <div className="flex gap-2 px-4 sm:px-0 items-center justify-center flex-wrap">
                    <button
                      className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-rental-blue-600 text-white font-outfit font-medium text-sm hover:bg-rental-blue-700 transition-colors"
                      onClick={() => {
                        // Phase 5: Build query params from AI extracted filters and redirect
                        const params = new URLSearchParams()
                        
                        // Add the original search query for reference
                        if (searchQuery.trim()) {
                          params.set('search', searchQuery.trim())
                        }
                        
                        if (aiExtractedFilters) {
                          if (aiExtractedFilters.location) {
                            params.set('location', aiExtractedFilters.location)
                          }
                          if (aiExtractedFilters.property_type) {
                            params.set('type', aiExtractedFilters.property_type)
                          }
                          if (aiExtractedFilters.bedrooms) {
                            params.set('minBeds', aiExtractedFilters.bedrooms.toString())
                          }
                          if (aiExtractedFilters.bathrooms) {
                            params.set('minBaths', aiExtractedFilters.bathrooms.toString())
                          }
                          if (aiExtractedFilters.min_price) {
                            params.set('priceMin', aiExtractedFilters.min_price.toString())
                          }
                          if (aiExtractedFilters.max_price) {
                            params.set('priceMax', aiExtractedFilters.max_price.toString())
                          }
                          // Add amenities if present
                          if (aiExtractedFilters.amenities && Array.isArray(aiExtractedFilters.amenities)) {
                            params.set('amenities', aiExtractedFilters.amenities.join(','))
                          }
                        }
                        
                        const queryString = params.toString()
                        router.push(`/properties${queryString ? `?${queryString}` : ''}`)
                      }}
                    >
                      See all {aiTotalCount} results →
                    </button>
                    <button
                      className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 font-outfit text-sm hover:text-gray-900 transition-colors"
                      onClick={() => {
                        setSearchQuery('')
                        setAiResponse(null)
                        setAiResults(null)
                        setAiTotalCount(0)
                        setAiExtractedFilters(null)
                        setAiConversationId(undefined)
                      }}
                    >
                      ✕ Clear search
                    </button>
                  </div>

                  
                </div>
              )}

              {/* Phase 4: Loading Placeholders */}
              {isAILoading && searchMode === 'ai' && (
                <div className="mt-4 sm:mt-6 w-full max-w-full px-4 sm:px-0">
                  {/* Loading Banner Placeholder */}
                  <div className="mb-4 h-16 rounded-lg bg-gray-200 animate-pulse" />
                  
                  {/* Loading Cards Placeholders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-64 rounded-lg bg-gray-200 animate-pulse" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </FadeInOnView>

        {/* Recommended Searches - Outside search container; stable spacing */}
        <FadeInOnView
          delayMs={420}
          as="div"
          className="relative z-10 w-full max-w-4xl px-2 sm:px-5 mt-6 sm:mt-8"
        >
          <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
            {recommendedSearches.map((search, index) => (
              <button
                key={index}
                className="py-2 sm:py-2.5 px-3 sm:px-4 bg-white/95 border border-white/30 rounded-[20px] text-gray-700 font-outfit text-xs sm:text-[13px] font-normal cursor-pointer transition-all hover:bg-[#205ED7] hover:text-white hover:border-[#205ED7] hover:-translate-y-px hover:shadow-md touch-manipulation whitespace-nowrap"
                onClick={() => handleRecommendedSearch(search)}
              >
                {search}
              </button>
            ))}
          </div>
        </FadeInOnView>
      </div>

      {/* Scroll-down indicator - stable positioning */}
      {!isChatMode && (
        <button
          type="button"
          onClick={scrollToContent}
          aria-label="Scroll to content below"
          className={`absolute bottom-8 left-0 right-0 mx-auto w-fit z-[110] flex flex-col items-center gap-2 transition-all duration-300 ease-out ${
            showScrollArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="font-outfit text-xs font-medium text-rental-blue-600 bg-white px-2 py-1 rounded-full drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            More below
          </span>
          <svg
            className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Hero Banner - hidden on mobile only when in chat mode so chat isn't covered; visible on desktop and when not in chat mode */}
      <div className={isChatMode ? 'max-md:hidden' : ''}>
        <HeroBanner />
      </div>

    </section>
  )
}

export default Hero