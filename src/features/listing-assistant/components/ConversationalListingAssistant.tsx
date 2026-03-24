/**
 * Conversational Listing Assistant Component (Phase 3 Simplified)
 * Minimal state model: chat on left, property results on right
 * Wired to /property/search endpoint for natural language search
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { getAsset } from '@/shared/utils/assets'
import { MessageBubble, TypingIndicator } from './MessageBubble'
import type { ListingAssistantMessage } from '../types'
import api from '@/lib/api'

interface ConversationalListingAssistantProps {
  onListingSubmitted?: (propertyId: number) => void
  initialConversationId?: string
  onDataChange?: (data: any) => void
}

/**
 * Simplified Property Search Assistant
 * Minimal state: messages, results, filters, conversation context
 */
export function ConversationalListingAssistant({
  onListingSubmitted,
  initialConversationId,
  onDataChange,
}: ConversationalListingAssistantProps) {
  // MINIMAL STATE (Phase 3)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [messages, setMessages] = useState<ListingAssistantMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search results placeholder
  const [results, setResults] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [extractedFilters, setExtractedFilters] = useState<any>({})

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Initialize: Load conversation if provided, otherwise show welcome message
  useEffect(() => {
    const initConversation = async () => {
      if (initialConversationId) {
        try {
          const response = await api.get(`/listing/assistant/${initialConversationId}`)
          setConversationId(response.data.conversation_id)
          setMessages(response.data.messages || [])
          setExtractedFilters(response.data.extracted_filters || {})
          setResults(response.data.results || [])
          setTotalCount(response.data.total_count || 0)
        } catch (err) {
          console.error('Failed to load conversation:', err)
          setError('Failed to load conversation')
        }
      } else {
        // Start fresh conversation
        const newId = `conv_${Date.now()}`
        setConversationId(newId)
        
        // Add welcome message
        const welcomeMsg: ListingAssistantMessage = {
          role: 'assistant',
          content: 'Welcome! Tell me what you\'re looking for in a property. For example: "3 bedroom house in Cebu with parking"',
          timestamp: new Date().toISOString(),
        }
        setMessages([welcomeMsg])
      }
    }

    initConversation()
  }, [initialConversationId])

  // Send message to search API
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || !conversationId) return

    // Add user message to chat
    const userMsg: ListingAssistantMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')

    setIsLoading(true)
    setError(null)

    try {
      // Call /property/search with natural language query
      const searchResponse = await api.searchProperties(userMessage, conversationId)
      
      setResults(searchResponse.properties || [])
      setTotalCount(searchResponse.count || 0)
      setExtractedFilters(searchResponse.ai_extracted_filters || {})

      // Add AI response to chat
      const aiMsg: ListingAssistantMessage = {
        role: 'assistant',
        content: searchResponse.ai_response || `Found ${searchResponse.count || 0} properties matching your search.`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Search failed'
      setError(errorMsg)
      
      const errorMsgBubble: ListingAssistantMessage = {
        role: 'assistant',
        content: `❌ ${errorMsg}. Please try again.`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsgBubble])
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  // Handle text input submission
  const handleTextSubmit = useCallback(() => {
    if (!inputValue.trim()) return
    sendMessage(inputValue.trim())
  }, [inputValue, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  return (
    <div className="flex h-full bg-white">
      {/* LEFT: Chat Panel (40%) */}
      <div className="flex flex-col w-full lg:w-2/5 border-r border-gray-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <img src={getAsset('LOGO_AI')} alt="" className="w-9 h-9 rounded-full object-cover" />
          <h3 className="font-outfit text-lg font-bold text-gray-900">AI Search Assistant</h3>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-white">
          {messages.map((msg, idx) => {
            const isLastMessage = idx === messages.length - 1
            const shouldShowSuggestions = isLastMessage && msg.role === 'assistant' && results.length > 0
            
            return (
              <div key={`msg-${idx}`}>
                <MessageBubble message={msg} isLatest={isLastMessage} buttons={[]} />
                
                {/* Suggestion Chips below last AI message with results */}
                {shouldShowSuggestions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => sendMessage('Only fully furnished')}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-rental-blue-600 rounded-full border border-gray-200 font-outfit transition-colors disabled:opacity-50"
                    >
                      Only furnished
                    </button>
                    <button
                      onClick={() => sendMessage('With parking')}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-rental-blue-600 rounded-full border border-gray-200 font-outfit transition-colors disabled:opacity-50"
                    >
                      With parking
                    </button>
                    <button
                      onClick={() => sendMessage('Sort by cheapest')}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-rental-blue-600 rounded-full border border-gray-200 font-outfit transition-colors disabled:opacity-50"
                    >
                      Sort by cheapest
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && <TypingIndicator />}
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-700 font-outfit">{error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={results.length > 0 ? "Refine your search or ask a follow-up..." : "Type your search query..."}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-outfit text-sm outline-none focus:border-rental-blue-500 focus:ring-2 focus:ring-rental-blue-500/20"
              disabled={isLoading}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="w-11 h-11 flex-shrink-0 rounded-lg bg-rental-blue-600 text-white flex items-center justify-center hover:bg-rental-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Results Panel (60%) - Hidden on mobile */}
      <div className="hidden lg:flex flex-col flex-1">
        {/* Results Header */}
        <div className="px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h3 className="font-outfit font-bold text-gray-900">
            Results <span className="text-gray-500 font-normal">({totalCount})</span>
          </h3>
        </div>

        {/* Results Grid / Empty State */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {results.map((property) => (
                <div key={property.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
                  {property.image_url && (
                    <img src={property.image_url} alt={property.name} className="w-full h-32 object-cover rounded-md mb-2" />
                  )}
                  <p className="font-outfit font-semibold text-gray-900 text-sm line-clamp-2">{property.name || property.title}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">{property.location || property.city}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm font-bold text-rental-blue-600">₱{property.price?.toLocaleString()}</p>
                    {property.bedrooms && (
                      <p className="text-xs text-gray-500">{property.bedrooms}bd • {property.bathrooms || 1}ba</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                </svg>
                <p className="font-outfit font-medium text-gray-400">No results yet</p>
                <p className="text-xs text-gray-400 mt-1">Submit your first search to see results...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

