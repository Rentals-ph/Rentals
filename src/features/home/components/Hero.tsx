"use client"

import { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react"
import { useRouter } from 'next/navigation'
import { ASSETS, getAsset } from "@/utils/assets"
import { api, type PropertySearchResponse, type ConversationMessage } from "@/lib/api"
import { Property } from "@/types"
import { getImageUrl } from "@/shared/utils/image"
import { formatAIMessage } from "@/shared/utils/format"
import { SimplePropertyCardSkeleton } from "@/shared/components/cards"
import { FadeInOnView } from "@/shared/components/ui"
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
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

  const [showHistory, setShowHistory] = useState(false)
  const [showResultsOverlay, setShowResultsOverlay] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
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

  const handleNewConversation = () => {
    setConversationId(undefined)
    localStorage.removeItem(CONVERSATION_ID_KEY)
    setChatMessages([
      { role: 'assistant', message: 'Hello! I\'m Rentals Assist. How can I help you find the perfect rental property today?' }
    ])
    setShowMenu(false)
    // Keep prefetched suggested prompts; no need to clear or refetch
  }

  const handleClearContext = async () => {
    if (!conversationId) return
    
    try {
      const response = await api.clearConversationContext(conversationId)
      if (response.success) {
        // Reload conversation to get updated state
        const convResponse = await api.getConversation(conversationId)
        if (convResponse.success && convResponse.data) {
          const conversation = convResponse.data
          const messages = conversation.messages.map((msg: any) => {
            const frontendMessage: { role: 'user' | 'assistant'; message: string; properties?: Property[] } = {
              role: msg.role,
              message: msg.content,
            }
            if (msg.metadata?.properties && Array.isArray(msg.metadata.properties)) {
              frontendMessage.properties = msg.metadata.properties
            }
            return frontendMessage
          })
          if (messages.length > 0) {
            setChatMessages(messages)
          }
        }
        setShowMenu(false)
      }
    } catch (error) {
      console.error('Failed to clear context:', error)
    }
  }

  const handleDeleteConversation = async (convId?: string) => {
    const idToDelete = convId || conversationId
    if (!idToDelete) return
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await api.deleteConversation(idToDelete)
      if (response.success) {
        // If deleting current conversation, start new one
        if (idToDelete === conversationId) {
          handleNewConversation()
        }
        // Reload conversations list
        loadConversations()
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const loadConversations = async () => {
    setIsLoadingConversations(true)
    try {
      const response = await api.listConversations()
      if (response.success && response.data) {
        setConversations(response.data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const handleLoadConversation = async (convId: string) => {
    setConversationId(convId)
    localStorage.setItem(CONVERSATION_ID_KEY, convId)
    setIsLoadingHistory(true)
    setShowHistory(false)
    
    try {
      const response = await api.getConversation(convId)
      if (response.success && response.data) {
        const conversation = response.data
        const messages = conversation.messages.map((msg: any) => {
          const frontendMessage: { role: 'user' | 'assistant'; message: string; properties?: Property[] } = {
            role: msg.role,
            message: msg.content,
          }
          if (msg.metadata?.properties && Array.isArray(msg.metadata.properties)) {
            frontendMessage.properties = msg.metadata.properties
          }
          return frontendMessage
        })
        if (messages.length > 0) {
          setChatMessages(messages)
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      setIsLoadingHistory(false)
    }
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

  // Load conversation history when conversation ID exists and chat mode is opened
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!isChatMode || !conversationId || isLoadingHistory) return

      setIsLoadingHistory(true)
      try {
        const response = await api.getConversation(conversationId)
        
        if (response.success && response.data) {
          const conversation = response.data
          
          // Convert backend messages to frontend format
          const messages = conversation.messages.map((msg: ConversationMessage) => {
            const frontendMessage: { role: 'user' | 'assistant'; message: string; properties?: Property[] } = {
              role: msg.role,
              message: msg.content,
            }
            
            // Extract properties from metadata if available
            if (msg.metadata?.properties && Array.isArray(msg.metadata.properties)) {
              frontendMessage.properties = msg.metadata.properties
            }
            
            return frontendMessage
          })
          
          // If we have messages, replace the default greeting
          if (messages.length > 0) {
            setChatMessages(messages)
          }
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error)
        // Don't show error to user, just continue with current messages
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadConversationHistory()
  }, [isChatMode, conversationId])

  // Load conversations list when history panel is opened
  useEffect(() => {
    if (showHistory) {
      loadConversations()
    }
  }, [showHistory])

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
        if (showHistory) {
          setShowHistory(false)
        }
        if (showMenu) {
          setShowMenu(false)
        }
      }
    }

    if (showHistory || showMenu) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [showHistory, showMenu])

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
      className={`relative mt-0 transition-all duration-500 ease-in-out flex flex-col justify-center items-center ${
        isChatMode 
          ? 'min-h-[50vh] sm:min-h-[55vh] pb-[20px] overflow-visible'
          : 'min-h-[500px] sm:min-h-[600px] md:min-h-[670px] max-h-none sm:max-h-[670px] pb-[200px] overflow-hidden'
      }`}
    >
      {/* Background images with smooth transitions */}
      <div className={`absolute top-0 left-0 w-full h-full z-0 overflow-hidden transition-all duration-300 ${
        isChatMode ? 'min-h-0 h-full' : 'min-h-[500px] sm:min-h-[600px] md:min-h-[700px] h-full'
      }`}>
        {backgroundImages.map((imageSrc, index) => (
          <img
            key={index}
            src={imageSrc}
            alt={`Hero background ${index + 1}`}
            className={`w-full h-full object-cover object-center absolute top-0 left-0 transition-all duration-[2000ms] ease-in-out animate-[heroBackgroundAnimation_20s_ease-in-out_infinite] ${
              isChatMode ? 'min-h-[100dvh] sm:min-h-[900px]' : 'min-h-[500px] sm:min-h-[600px] md:min-h-[700px]'
            } ${
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

      {/* Hero content - padding-top so "Find your home" is never clipped below navbar; when chat mode fill remaining space below header */}
      <div className={`flex flex-col items-center justify-center w-full text-center relative z-10 ${
        isChatMode
          ? 'min-h-0 pt-2 pb-2 px-3 sm:pt-6 sm:pb-4 sm:px-4 md:pt-0 md:pb-0 flex-1'
          : 'min-h-[400px] sm:min-h-[500px] pb-8 sm:pt-10 sm:pb-10 md:pt-0 md:pb-0 md:min-h-[600px] md:h-full px-4'
      }`}>
        <FadeInOnView>
          <h2
            className={`font-outfit font-bold text-[#205ED7] mb-0 mt-0 tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)] ${
              isChatMode
                ? 'text-base xs:text-lg sm:text-xl md:text-2xl'
                : 'text-xl xs:text-2xl mobile:text-3xl mt-20 sm:text-4xl md:text-5xl lg:text-6xl'
            }`}
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
            className={`max-w-3xl font-outfit drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)] px-1 ${
              isChatMode ? "mt-1 text-xs sm:text-sm md:text-lg hidden sm:block" : "mt-3 text-sm xs:text-base md:text-xl"
            }`}
          >
            <span className="text-[#FE8E0A]">Trusted Rentals, simplified. Start your journey with </span>
            <span className="font-bold text-[#205ED7]">Rentals.ph.</span>
          </p>
        </FadeInOnView>

        {/* AI Assistant Button - hidden in chat mode (close is in chat header) */}
        {!isChatMode && (
          <FadeInOnView delayMs={240}>
          <button 
            className="relative font-outfit font-semibold flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-[0.98] overflow-hidden cursor-pointer rounded-full sm:rounded-[32.5px] shadow-[0_4px_21px_rgba(0,0,0,0.25)] touch-manipulation min-h-[48px] mt-4 sm:mt-6 text-sm sm:text-base md:text-lg h-12 sm:h-[52px] md:h-[55px] px-4 sm:px-6 md:px-7"
            style={{
              width: 'auto',
              maxWidth: 'min(100%, 260px)',
              backgroundColor: 'var(--ai-button-bg, white)',
              color: 'var(--ai-button-text, #002978)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: '#205ED7',
            }}
            onClick={() => setIsChatMode(true)}
            aria-label="Open Rentals Assist"
          >
            {/* Orange decorative vector - smaller on mobile so it doesn't overflow */}
            <svg 
              className="absolute -bottom-4 -right-0.5 sm:-bottom-5 sm:-right-1 z-0 pointer-events-none w-12 h-12 sm:w-14 sm:h-14 md:w-[68px] md:h-[67px]"
              viewBox="154 10 68 67" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
            >
              <path 
                d="M191.543 40.9593L194.39 38.7754C198.284 35.7874 201.337 31.8399 203.251 27.3204L205.356 22.3506C207.905 16.3331 218.4 12.0101 222.422 10.5451V48.1866C222.422 64.0998 209.522 77 193.609 77H154.263C147.43 77 143.439 69.2957 147.379 63.7138C147.959 62.8912 148.683 62.1793 149.515 61.6119L157.059 56.466C162.195 52.9628 167.918 50.4094 173.955 48.9269L175.99 48.4272C181.636 47.041 186.932 44.4981 191.543 40.9593Z" 
                fill="var(--ai-button-accent, #FE8E0A)"
              />
              <path 
                d="M222.422 10V48.1866C222.422 64.0998 209.522 77 193.609 77H154.263C147.43 77 143.439 69.2957 147.379 63.7138C147.959 62.8912 148.683 62.1793 149.515 61.6119L157.059 56.466C162.195 52.9628 167.918 50.4094 173.955 48.9269L175.99 48.4272C181.636 47.041 186.932 44.4981 191.543 40.9593L194.39 38.7754C198.284 35.7874 201.337 31.8399 203.251 27.3204C203.98 25.6005 204.669 23.9734 205.356 22.3506C208.527 14.8637 224 10 224 10" 
                stroke="var(--ai-button-border, #002978)"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            
            {/* Content: logo at start, text centered in remaining space */}
            <div className="relative z-10 w-full flex items-center justify-start min-w-0 gap-2">
              <img 
                src={getAsset('LOGO_AI')} 
                alt=""
                className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9"
              />
              <span className="flex-1 text-center font-bold text-sm sm:text-base md:text-lg leading-tight pr-6 sm:pr-8 md:pr-10 truncate">
                Rentals Assist
              </span>
            </div>
          </button>
          </FadeInOnView>
        )}

        {/* Search bar and filters or Chat container - constrained to same max-width as page; no horizontal overflow */}
        <FadeInOnView
          delayMs={260}
          className={`mt-2 sm:mt-6 md:mt-8 w-full max-w-7xl mx-auto transition-all duration-500 px-0 sm:px-2 ${
            isChatMode ? 'flex flex-col w-full' : 'max-h-[400px]'
          }`}
          as="div"
        >
          {isChatMode ? (
            <>
              {/* Single rounded container for Chat Mode: header + two-column content; on mobile overflow-visible so inner chat can scroll */}
              <div className="flex flex-col w-full bg-white/50 rounded-xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] min-h-[45vh] sm:min-h-[50vh] overflow-visible md:overflow-hidden">
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
                        aria-label="More options"
                        title="More options"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="1" fill="currentColor"/>
                          <circle cx="12" cy="5" r="1" fill="currentColor"/>
                          <circle cx="12" cy="19" r="1" fill="currentColor"/>
                        </svg>
                      </button>
                      {showMenu && (
                        <div className="absolute top-full right-0 mt-2 w-[min(16rem,calc(100vw-2rem))] max-w-[224px] bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                          <button type="button" className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors font-outfit text-sm" onClick={() => { setShowHistory(true); setShowMenu(false) }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            View History
                          </button>
                          {conversationId && (
                            <button type="button" className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors font-outfit text-sm" onClick={() => handleDeleteConversation()}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              Delete Conversation
                            </button>
                          )}
                          <button type="button" className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors font-outfit text-sm" onClick={handleNewConversation}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            New Conversation
                          </button>
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
              <div className="hidden md:flex flex-col flex-[3] min-w-0 min-h-0 max-h-[70vh] bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden order-1">
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
              <div className="flex flex-col flex-[3] min-w-0 min-h-0 max-h-[70vh] md:max-w-[28rem] bg-white rounded-xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden order-2 flex-shrink-0">
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
                  {isLoadingHistory ? (
                    <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%]">
                      <img src={getAsset('LOGO_AI')} alt="" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full object-cover" />
                      <div className="p-3 px-4 bg-white border border-gray-200 rounded-2xl rounded-tl-sm font-outfit text-sm text-gray-600">
                        <span className="italic animate-pulse">Loading conversation...</span>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
                <div className="border-t border-gray-200 bg-white flex-shrink-0">
                  <form className="flex items-center gap-2 p-3 sm:p-4" onSubmit={handleChatSubmit}>
                    <input
                      type="text"
                      className="flex-1 min-w-0 p-2.5 sm:p-3 px-3 sm:px-4 border border-gray-300 rounded-lg sm:rounded-xl font-outfit text-sm outline-none transition-colors focus:border-rental-blue-500 focus:ring-2 focus:ring-rental-blue-500/20 min-h-[44px]"
                      placeholder={isLoading ? 'Searching...' : 'Type your message...'}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      disabled={isLoading}
                    />
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
              {/* Light search bar container */}
              <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 w-full shadow-lg">
                <div className="bg-gray-50/90 rounded-xl sm:rounded-2xl w-full flex flex-col md:flex-row items-stretch md:items-center overflow-hidden shadow-md md:h-auto border-2 border-gray-200" 
                style={{
                 borderWidth: '2px',
                 borderStyle: 'solid',
                 borderColor: 'rgb(226, 226, 226)',
                }}>
                    <input 
                      type="text" 
                      className="flex-1 border-none outline-none bg-transparent text-gray-900 font-outfit text-sm sm:text-base font-normal px-4 sm:px-8 min-w-0 md:min-w-[250px] md:h-[57px] h-12 sm:h-auto py-3 sm:py-4 md:py-0 w-full md:w-auto md:border-b-0 border-b border-gray-200" 
                      placeholder="What are you looking for?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />

                    <div className="md:block hidden w-px h-[67px] bg-gray-200 flex-shrink-0" />

                    <select 
                      className="text-gray-700 font-outfit text-base font-normal bg-transparent border-none outline-none cursor-pointer appearance-none md:py-5 py-4 pr-[50px] md:pl-9 pl-5 md:min-w-[180px] w-full md:w-auto transition-colors hover:text-[#205ED7] focus:text-[#205ED7] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%229%22%20height%3D%226%22%20viewBox%3D%220%200%209%206%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201L4.5%205L8%201%22%20stroke%3D%236b7280%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat md:bg-[right_36px_center] bg-[right_20px_center] bg-[length:9px_6px] md:border-b-0 border-b border-gray-200"
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
                      className="text-gray-700 font-outfit text-base font-normal bg-transparent border-none outline-none cursor-pointer appearance-none md:py-5 py-4 pr-[50px] md:pl-9 pl-5 md:min-w-[180px] w-full md:w-auto transition-colors hover:text-[#205ED7] focus:text-[#205ED7] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%229%22%20height%3D%226%22%20viewBox%3D%220%200%209%206%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201L4.5%205L8%201%22%20stroke%3D%236b7280%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat md:bg-[right_36px_center] bg-[right_20px_center] bg-[length:9px_6px] md:border-b-0 border-b border-gray-200"
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
                      className={`flex items-center bg-white border-none rounded-full py-2 px-5 ml-2 mr-2 text-base text-indigo-700 font-medium shadow-sm transition-all hover:border-indigo-600 md:inline-flex hidden ${showAdvancedOptions ? 'border-indigo-600' : ''}`}
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

                    <button 
                      className="bg-[#FE8E0A] md:rounded-r-xl rounded-xl w-full md:w-[135px] md:h-[67px] h-12 sm:h-[50px] border-none cursor-pointer flex items-center justify-center transition-all hover:bg-[#ff7700] hover:shadow-lg active:scale-[0.98] flex-shrink-0 relative overflow-hidden group font-outfit font-semibold text-white text-sm sm:text-base"
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                  </div>

                  {/* Advanced Options - Inside search container, animated when filter button is toggled */}
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
              </div>
            </>
          )}
        </FadeInOnView>

        {/* Recommended Searches - Outside search container; in chat mode on mobile: compact single-line scroll so chat has more room */}
        <FadeInOnView
          delayMs={420}
          as="div"
          className={`relative z-10 w-full max-w-4xl px-2 sm:px-5 ${isChatMode ? 'mt-2 sm:mt-3.5 mb-20 sm:mb-28 md:mb-32' : 'mt-3 sm:mt-3.5'}`}
        >
          <div className={`flex gap-1.5 sm:gap-2 justify-center ${isChatMode ? 'flex-nowrap overflow-x-auto overflow-y-hidden py-1 -mx-2 px-2 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible' : 'flex-wrap'}`}>
            {recommendedSearches.map((search, index) => (
              <button
                key={index}
                className={`py-1.5 sm:py-2 px-3 sm:px-4 bg-white/95 border border-white/30 rounded-[20px] text-gray-700 font-outfit text-xs sm:text-[13px] font-normal cursor-pointer transition-all hover:bg-[#205ED7] hover:text-white hover:border-[#205ED7] hover:-translate-y-px hover:shadow-md touch-manipulation ${isChatMode ? 'flex-shrink-0 whitespace-nowrap sm:whitespace-normal sm:break-words' : 'whitespace-normal break-words max-w-full'}`}
                onClick={() => handleRecommendedSearch(search)}
              >
                {search}
              </button>
            ))}
          </div>
        </FadeInOnView>
      </div>

      {/* Scroll-down indicator - centered at bottom, fades out on scroll */}
      {!isChatMode && (
        <button
          type="button"
          onClick={scrollToContent}
          aria-label="Scroll to content below"
          className={`absolute bottom-6 sm:bottom-10 left-0 right-0 mx-auto w-fit z-[110] flex flex-col items-center gap-1 transition-all duration-300 ease-out ${
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

      {/* Conversation History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-end transition-opacity duration-300" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-rental-blue-50 to-white">
              <h3 className="font-outfit text-lg font-semibold text-gray-900 m-0">Conversation History</h3>
              <button
                className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-gray-900 flex items-center justify-center cursor-pointer"
                onClick={() => setShowHistory(false)}
                aria-label="Close history"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {isLoadingConversations ? (
                <div className="text-center py-8 text-gray-500 font-outfit text-sm">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 font-outfit text-sm">No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className={`mb-2 p-3 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                      conversationId === conv.conversation_id 
                        ? 'bg-rental-blue-50 border-rental-blue-200' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      className="flex-1 text-left min-w-0 p-0 border-none bg-transparent cursor-pointer"
                      onClick={() => handleLoadConversation(conv.conversation_id)}
                    >
                      <div className="flex flex-col gap-1">
                        <h4 className="font-outfit text-sm font-medium text-gray-900 m-0 truncate">{conv.title}</h4>
                        <p className="font-outfit text-xs text-gray-500 m-0">
                          {conv.message_count} message{conv.message_count !== 1 ? 's' : ''} • {new Date(conv.last_message_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50 p-0 border-none cursor-pointer flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(conv.conversation_id)
                      }}
                      aria-label="Delete conversation"
                      title="Delete conversation"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  )
}

export default Hero