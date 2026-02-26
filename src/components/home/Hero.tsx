'use client'

import { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { ASSETS, getAsset } from '@/utils/assets'
import { api, type PropertySearchResponse, type ConversationMessage } from '@/lib/api'
import { Property } from '@/types'
import { getImageUrl } from '@/utils/storage'
import { SimplePropertyCardSkeleton } from '@/components/common/SimplePropertyCardSkeleton'
import HeroBanner from './HeroBanner'

const SimplePropertyCard = lazy(() => import('@/components/common/SimplePropertyCard'))

const CONVERSATION_ID_KEY = 'rentals_ph_conversation_id'

// Function to format AI message with proper paragraph spacing
const formatAIMessage = (text: string): string => {
  if (!text) return ''
  
  // First, handle bold text (**text**)
  let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  
  // Split by double line breaks to identify paragraphs
  const paragraphs = formatted.split(/\n\s*\n/).filter(p => p.trim())
  
  return paragraphs.map(paragraph => {
    const trimmed = paragraph.trim()
    
    // Check if paragraph contains numbered list items (handle both single and multi-line)
    // Split by newlines first, then check for numbered items
    const lines = trimmed.split(/\n/).map(l => l.trim()).filter(l => l)
    const numberedLines = lines.filter(line => /^\d+\.\s/.test(line))
    
    if (numberedLines.length >= 2 || (numberedLines.length === 1 && lines.length === 1)) {
      // This appears to be a list section
      // Try to extract all numbered items, handling multi-line items
      const listItems: string[] = []
      let currentItem = ''
      
      for (const line of lines) {
        if (/^\d+\.\s/.test(line)) {
          // New list item
          if (currentItem) {
            listItems.push(currentItem)
          }
          currentItem = line.replace(/^\d+\.\s/, '')
        } else if (currentItem) {
          // Continuation of current item
          currentItem += ' ' + line
        } else {
          // Regular text before list, treat as paragraph
          if (listItems.length === 0) {
            return `<p>${trimmed}</p>`
          }
        }
      }
      
      if (currentItem) {
        listItems.push(currentItem)
      }
      
      if (listItems.length > 0) {
        return `<ul class="ai-message-list">${listItems.map(item => `<li>${item.trim()}</li>`).join('')}</ul>`
      }
    }
    
    // Regular paragraph
    return `<p>${trimmed}</p>`
  }).join('')
}

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
      message: 'Hello! I\'m Rental Assist. How can I help you find the perfect rental property today?'
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
  const [showHistory, setShowHistory] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const router = useRouter()
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const [showScrollArrow, setShowScrollArrow] = useState(true)

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
    // Clear conversation ID and localStorage
    setConversationId(undefined)
    localStorage.removeItem(CONVERSATION_ID_KEY)
    
    // Reset messages to initial greeting
    setChatMessages([
      {
        role: 'assistant',
        message: 'Hello! I\'m Rental Assist. How can I help you find the perfect rental property today?'
      }
    ])
    setShowMenu(false)
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || isLoading) return

    const userMessage = chatMessage.trim()
    
    // Add user message
    const newMessages = [...chatMessages, { role: 'user' as const, message: userMessage }]
    setChatMessages(newMessages)
    setChatMessage('')
    setIsLoading(true)

    try {
      // Call the search API
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

  // Load conversation ID from localStorage on mount
  useEffect(() => {
    const storedConversationId = localStorage.getItem(CONVERSATION_ID_KEY)
    if (storedConversationId) {
      setConversationId(storedConversationId)
    }
  }, [])

  // Save conversation ID to localStorage when it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(CONVERSATION_ID_KEY, conversationId)
    }
  }, [conversationId])

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
      className={`relative overflow-hidden pb-[200px]  mt-0 transition-all duration-500 ease-in-out flex flex-col justify-center items-center ${
        isChatMode 
          ? 'max-h-[1200px] min-h-[900px] pb-[200px]' 
          : 'max-h-[670px] min-h-[670px]'
      }`}
    >
      {/* Background images with smooth transitions */}
      <div className={`absolute top-0 left-0 w-full h-full z-0 overflow-hidden transition-all duration-300 ${
        isChatMode ? 'min-h-[900px] h-full' : 'min-h-[700px]'
      }`}>
        {backgroundImages.map((imageSrc, index) => (
          <img
            key={index}
            src={imageSrc}
            alt={`Hero background ${index + 1}`}
            className={`w-full h-full object-cover object-center absolute top-0 left-0 transition-all duration-[2000ms] ease-in-out animate-[heroBackgroundAnimation_20s_ease-in-out_infinite] ${
              isChatMode ? 'min-h-[900px]' : 'min-h-[700px]'
            } ${
              index === currentImageIndex ? 'opacity-100 z-[1]' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* Hero content */}
      <div className="flex mobile:mt-16 sm:mt-10  flex-col items-center justify-center w-full h-full min-h-[600px] text-center relative z-10 px-4">
        <h2 className="font-outfit text-2xl mobile:text-4xl md:text-5xl lg:text-6xl font-bold text-[#205ED7] mb-0 tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)] ">
          FIND YOUR HOME IN THE PHILIPPINES
        </h2>
        <p className="mt-3 max-w-3xl font-outfit text-base md:text-lg drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]">
          <span className="text-[#FE8E0A]">Trusted Rentals, simplified. Start your journey with </span>
          <span className="font-bold text-[#205ED7]">Rentals.ph.</span>
        </p>

        {/* AI Assistant Button */}
        <button 
          className="mt-6 relative font-outfit text-sm font-semibold flex items-center justify-center gap-1 transition-all hover:scale-105 overflow-hidden cursor-pointer rounded-[32.5px] shadow-[0_4px_21px_rgba(0,0,0,0.25)]"
          style={{
            width: 'auto',
            height: '55px',
            backgroundColor: 'var(--ai-button-bg, white)', // Customizable via CSS variable
            color: 'var(--ai-button-text, #002978)', // Customizable via CSS variable
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#205ED7',
          }}
          onClick={() => setIsChatMode(!isChatMode)}
        >
          {/* Orange decorative vector in bottom right */}
          <svg 
            className="absolute -bottom-5 -right-1 z-0 pointer-events-none"
            width="68" 
            height="67" 
            viewBox="154 10 68 67" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            style={{ 
              width: '68px',
              height: '67px',
            }}
          >
            {/* Orange fill */}
            <path 
              d="M191.543 40.9593L194.39 38.7754C198.284 35.7874 201.337 31.8399 203.251 27.3204L205.356 22.3506C207.905 16.3331 218.4 12.0101 222.422 10.5451V48.1866C222.422 64.0998 209.522 77 193.609 77H154.263C147.43 77 143.439 69.2957 147.379 63.7138C147.959 62.8912 148.683 62.1793 149.515 61.6119L157.059 56.466C162.195 52.9628 167.918 50.4094 173.955 48.9269L175.99 48.4272C181.636 47.041 186.932 44.4981 191.543 40.9593Z" 
              fill="var(--ai-button-accent, #FE8E0A)" // Customizable via CSS variable
            />
            {/* Rental blue border */}
            <path 
              d="M222.422 10V48.1866C222.422 64.0998 209.522 77 193.609 77H154.263C147.43 77 143.439 69.2957 147.379 63.7138C147.959 62.8912 148.683 62.1793 149.515 61.6119L157.059 56.466C162.195 52.9628 167.918 50.4094 173.955 48.9269L175.99 48.4272C181.636 47.041 186.932 44.4981 191.543 40.9593L194.39 38.7754C198.284 35.7874 201.337 31.8399 203.251 27.3204C203.98 25.6005 204.669 23.9734 205.356 22.3506C208.527 14.8637 224 10 224 10" 
              stroke="var(--ai-button-border, #002978)" // Rental blue border
              strokeWidth="2"
              fill="none"
            />
          </svg>
          
          {/* Content */}
          <div className="relative z-10 w-full flex items-center">
            <img 
              src={getAsset('LOGO_AI')} 
              alt="AI Logo" 
              className="absolute left-4 w-9 h-9 flex-shrink-0"
            />
            <span className="w-full text-center font-bold text-lg leading-tight px-14">
              Rental Assist
            </span>
          </div>
        </button>

        {/* Search bar and filters or Chat container */}
        <div className={`mt-8 w-full max-w-6xl mx-auto transition-all duration-500 ${
          isChatMode ? 'max-h-[750px]' : 'max-h-[400px]'
        }`}>
          {isChatMode ? (
            <div className="flex flex-col md:flex-row gap-4 w-full h-[600px] max-h-[600px]">
              {/* Chat Interface - Left side */}
              <div className="flex-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col min-w-0 h-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-rental-blue-50 to-white flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getAsset('LOGO_AI')} 
                      alt="AI Logo" 
                      className=" w-9 h-9 flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-outfit text-lg font-semibold text-gray-900">Rental Assist</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="chat-menu-container relative">
                      <button 
                        className="p-2 hover:bg-white border-none rounded-lg transition-colors text-gray-600 hover:text-gray-900"
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
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                          <button 
                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors font-outfit text-sm"
                            onClick={() => {
                              setShowHistory(true)
                              setShowMenu(false)
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            View History
                          </button>
                          {conversationId && (
                            <>
                              
                              <button 
                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors font-outfit text-sm"
                                onClick={() => handleDeleteConversation()}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Delete Conversation
                              </button>
                            </>
                          )}
                          <button 
                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors font-outfit text-sm"
                            onClick={handleNewConversation}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            New Conversation
                          </button>
                        </div>
                      )}
                    </div>
                    <button 
                      className="p-2 hover:bg-white border-none rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                      onClick={() => setIsChatMode(false)}
                      aria-label="Close chat"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div ref={chatMessagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 relative" style={{
                  background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)',
                }}>
                  {/* Subtle decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 50 Q25 0 50 50 T100 50" stroke="#FE8E0A" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  
                  {isLoadingHistory ? (
                    <div className="flex items-start gap-2 max-w-[75%] mb-4">
                      <img 
                        src={getAsset('LOGO_AI')} 
                        alt="AI Logo" 
                        className="w-12 h-12 flex-shrink-0"
                      />
                      <div 
                        className="relative overflow-hidden p-3 px-4 bg-white !border-2 !border-[#002978] rounded-xl rounded-tl-sm shadow-lg font-outfit text-sm leading-relaxed break-words text-left"
                        style={{
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderColor: '#002978',
                          boxShadow: '0 4px 12px rgba(0, 41, 120, 0.15), 0 2px 4px rgba(0, 41, 120, 0.1)',
                        }}
                      >
                        <span className="inline-block text-gray-600 italic after:content-['...'] animate-pulse">Loading conversation</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {msg.role === 'assistant' ? (
                            <div className="flex items-start gap-2 max-w-[75%]">
                              <img 
                                src={getAsset('LOGO_AI')} 
                                alt="AI Logo" 
                                className="w-12 h-12 flex-shrink-0"
                              />
                              <div className="relative">
                                {/* Speech bubble pointer pointing to the logo - top left */}
                                <div 
                                  className="relative overflow-hidden p-3 px-4 bg-white !border-2 !border-[#002978] rounded-xl rounded-tl-sm shadow-lg font-outfit text-sm leading-relaxed break-words text-left"                                style={{
                                    borderWidth: '2px',
                                    borderStyle: 'solid',
                                    borderColor: '#002978',
                                    boxShadow: '0 4px 12px rgba(0, 41, 120, 0.15), 0 2px 4px rgba(0, 41, 120, 0.1)',
                                  }}
                                >
                                  <div 
                                    className="relative z-10"
                                    dangerouslySetInnerHTML={{
                                      __html: formatAIMessage(msg.message)
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="max-w-[75%] !border-2 !border-[#002978] p-3 px-4 rounded-xl font-outfit text-sm leading-relaxed break-words text-left bg-[#205ED7] text-white rounded-br-sm shadow-sm"
                              style={{
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: '#002978',
                              }}
                              dangerouslySetInnerHTML={{
                                __html: msg.message.replace(/\n/g, '<br />')
                              }}
                            />
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex items-start gap-2 max-w-[75%] mb-4">
                          <img 
                            src={getAsset('LOGO_AI')} 
                            alt="AI Logo" 
                            className="w-12 h-12 flex-shrink-0"
                          />
                          <div 
                            className="relative overflow-hidden p-3 px-4 bg-white !border-2 !border-[#002978] rounded-xl rounded-tl-sm shadow-lg font-outfit"
                            style={{
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              borderColor: '#002978',
                              boxShadow: '0 4px 12px rgba(0, 41, 120, 0.15), 0 2px 4px rgba(0, 41, 120, 0.1)',
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Invisible element at the bottom to scroll to */}
                      <div ref={chatMessagesEndRef} />
                    </>
                  )}
                </div>
                <form className="flex items-center gap-2 p-4 px-5 border-t border-gray-200/50 bg-white flex-shrink-0" onSubmit={handleChatSubmit}>
                  <input
                    type="text"
                    className="flex-1 p-3 px-4 border border-gray-300/65 rounded-lg font-outfit text-sm outline-none transition-colors focus:border-[#205ED7]"
                    placeholder={isLoading ? "Searching..." : "Type your message..."}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    disabled={isLoading}
                  />
                  <button type="submit" className="w-11 h-11 bg-[#205ED7] border-none rounded-lg text-white cursor-pointer flex items-center justify-center transition-all flex-shrink-0 hover:bg-[#1a4bb8] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </form>
              </div>
              {/* Properties Panel - Right side when in chat mode - Show when properties exist or while loading */}
              {((latestProperties && latestProperties.properties.length > 0) || (isChatMode && isLoading)) && (
                <div
                  key={latestProperties ? `properties-${latestProperties.messageIndex}-${latestProperties.properties.length}-${latestProperties.timestamp ?? Date.now()}` : 'properties-loading'}
                  className="w-full md:w-[340px] md:max-w-[340px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-shrink-0 h-full"
                >
                  <div className="p-4 px-5 border-b border-gray-200 bg-gradient-to-r from-rental-blue-50 to-white flex-shrink-0">
                    <h3 className="font-outfit text-base font-semibold text-gray-900 m-0">
                      {latestProperties?.title ?? (isLoading ? 'Searching...' : 'Properties')}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {isLoading && (!latestProperties || latestProperties.properties.length === 0) ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <SimplePropertyCardSkeleton key={`skeleton-${i}`} />
                        ))}
                      </>
                    ) : latestProperties && latestProperties.properties.length > 0 ? (
                      <Suspense
                        fallback={
                          <>
                            {[1, 2, 3].map((i) => (
                              <SimplePropertyCardSkeleton key={`skeleton-${i}`} />
                            ))}
                          </>
                        }
                      >
                        {latestProperties.properties.map((property, index) => (
                          <SimplePropertyCard
                            key={`${property.id}-${index}-${latestProperties.messageIndex}`}
                            id={property.id}
                            title={property.title}
                            location={property.location || property.city || property.street_address || undefined}
                            price={`₱${property.price.toLocaleString()}${property.price_type ? `/${property.price_type}` : ''}`}
                            image={property.image_url || (property.image ? getImageUrl(property.image) : ASSETS.PLACEHOLDER_PROPERTY_MAIN)}
                          />
                        ))}
                      </Suspense>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Light search bar container */}
              <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 w-full shadow-lg">
                <div className="bg-gray-50/90 rounded-2xl w-full flex items-center overflow-hidden shadow-md md:flex-row flex-col md:h-auto border-2 border-gray-200" 
                style={{
                 borderWidth: '2px',
                 borderStyle: 'solid',
                 borderColor: 'rgb(226, 226, 226)',
                }}>
                    <input 
                      type="text" 
                      className="flex-1 border-none outline-none bg-transparent text-gray-900 font-outfit text-base font-normal px-8 min-w-[250px] md:h-[57px] h-auto py-4 md:py-0 w-full md:w-auto md:border-b-0 border-b border-gray-200" 
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
                      className="bg-[#FE8E0A] md:rounded-r-xl rounded-xl w-full md:w-[135px] md:h-[67px] h-[50px] border-none cursor-pointer flex items-center justify-center transition-all hover:bg-[#ff7700] hover:shadow-lg active:scale-[0.98] flex-shrink-0 relative overflow-hidden group font-outfit font-semibold text-white text-base"
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                  </div>

                  {/* Advanced Options - Inside search container, toggled by filter button */}
                  {showAdvancedOptions && (
                    <div className="pt-1 w-full border-t border-gray-300/20 mt-3">
                      <div className="grid grid-cols-3 gap-5 -mb-2.5">
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
            </>
          )}
        </div>

        {/* Recommended Searches - Outside search container */}
        <div className="relative z-10 mt-3.5 w-full max-w-4xl px-5 ">
          <div className="flex flex-wrap gap-2 justify-center">
            {recommendedSearches.map((search, index) => (
              <button
                key={index}
                className="py-2 px-4 bg-white/95 border border-white/30 rounded-[20px] text-gray-700 font-outfit text-[13px] font-normal cursor-pointer transition-all hover:bg-[#205ED7] hover:text-white hover:border-[#205ED7] hover:-translate-y-px hover:shadow-md whitespace-normal break-words max-w-full"
                onClick={() => handleRecommendedSearch(search)}
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll-down indicator - centered at bottom, fades out on scroll */}
      {!isChatMode && (
        <button
          type="button"
          onClick={scrollToContent}
          aria-label="Scroll to content below"
          className={`absolute bottom-[40px] left-0 right-0 mx-auto w-fit z-[110] flex flex-col items-center gap-1 transition-all duration-300 ease-out ${
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

      {/* Hero Banner - Positioned absolutely at bottom (hidden in chat mode) */}
      {<HeroBanner />}

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