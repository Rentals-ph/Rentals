'use client'

import { useState, useEffect, useRef } from 'react'
import { getAsset } from '@/utils/assets'
import { api, type PropertySearchResponse, type ConversationMessage } from '@/lib/api'
import type { Property } from '../types'
import { formatAIMessage } from '@/shared/utils/format'

const CONVERSATION_ID_KEY = 'rentals_ph_conversation_id'
const FALLBACK_SUGGESTED_PROMPTS = [
  'Show me 1-bedroom apartments',
  'Find properties under ₱20k',
  'Latest listings in Cebu City',
]

export interface FloatingPropertyChatProps {
  onPropertiesResult: (properties: Property[]) => void
}

export function FloatingPropertyChat({ onPropertiesResult }: FloatingPropertyChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; message: string; properties?: Property[] }>
  >([
    {
      role: 'assistant',
      message: "Hello! I'm Rentals Assist. Ask me to find properties and I'll update the list here.",
    },
  ])
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const [suggestedPromptsLoading, setSuggestedPromptsLoading] = useState(false)
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null)
  const suggestedPromptsFetchedRef = useRef(false)
  const suggestedPromptsInFlightRef = useRef(false)

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

        if (searchData.conversation_id) {
          setConversationId(searchData.conversation_id)
          localStorage.setItem(CONVERSATION_ID_KEY, searchData.conversation_id)
        }

        const propertiesFromApi = Array.isArray(searchData.properties) ? searchData.properties : []
        const assistantMessage = {
          role: 'assistant' as const,
          message: searchData.ai_response,
          properties: propertiesFromApi,
        }

        const updatedMessages = [...newMessages, assistantMessage]
        setChatMessages(updatedMessages)

        if (propertiesFromApi.length > 0) {
          onPropertiesResult(propertiesFromApi)
        }
      } else {
        const errorMessage = response.message || 'Sorry, I encountered an error. Please try again.'
        setChatMessages([
          ...newMessages,
          { role: 'assistant' as const, message: errorMessage },
        ])
      }
    } catch (error) {
      console.error('FloatingPropertyChat search error:', error)
      const errorMessage =
        error instanceof Error && error.message.includes('Failed to fetch')
          ? 'Unable to connect to the server. Please try again later.'
          : 'Sorry, I encountered an unexpected error. Please try again.'
      setChatMessages([
        ...newMessages,
        { role: 'assistant' as const, message: errorMessage },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  useEffect(() => {
    const stored = localStorage.getItem(CONVERSATION_ID_KEY)
    if (stored) setConversationId(stored)
  }, [])

  useEffect(() => {
    if (conversationId) localStorage.setItem(CONVERSATION_ID_KEY, conversationId)
  }, [conversationId])

  useEffect(() => {
    if (suggestedPromptsFetchedRef.current || suggestedPromptsInFlightRef.current) return
    suggestedPromptsInFlightRef.current = true
    setSuggestedPromptsLoading(true)
    let cancelled = false

    api
      .getSuggestedPrompts()
      .then((res) => {
        if (cancelled) return
        const raw = res.data
        const prompts = Array.isArray(raw) ? raw : (raw?.prompts ?? [])
        if (prompts.length > 0) setSuggestedPrompts(prompts)
        else setSuggestedPrompts(FALLBACK_SUGGESTED_PROMPTS)
      })
      .catch(() => {
        if (!cancelled) setSuggestedPrompts(FALLBACK_SUGGESTED_PROMPTS)
      })
      .finally(() => {
        suggestedPromptsFetchedRef.current = true
        suggestedPromptsInFlightRef.current = false
        if (!cancelled) setSuggestedPromptsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !conversationId || isLoadingHistory) return

    setIsLoadingHistory(true)
    api
      .getConversation(conversationId)
      .then((response) => {
        if (!response.success || !response.data) return
        const conversation = response.data
        const messages = conversation.messages.map((msg: ConversationMessage) => {
          const frontend: { role: 'user' | 'assistant'; message: string; properties?: Property[] } = {
            role: msg.role,
            message: msg.content,
          }
          if (msg.metadata?.properties && Array.isArray(msg.metadata.properties)) {
            frontend.properties = msg.metadata.properties
          }
          return frontend
        })
        if (messages.length > 0) setChatMessages(messages)
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false))
  }, [isOpen, conversationId])

  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTo({
        top: chatMessagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatMessages, isLoading])

  return (
    <>
      {/* Speech bubble hint above chat - only when closed */}
      {!isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 animate-chat-bubble-float overflow-visible"
          aria-hidden
        >
          <div
            className="relative overflow-visible rounded-xl bg-rental-blue-600 px-4 py-2.5 font-outfit text-sm font-semibold text-white shadow-lg"
            style={{ boxShadow: '0 4px 14px rgba(32, 94, 215, 0.35)' }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs font-bold">!</span>
              <span>Chat here</span>
            </div>
            {/* Bubble tail pointing down at the chat button */}
            <svg
              className="absolute -bottom-3 left-2/3 h-4 w-6 -translate-x-1/2"
              viewBox="0 0 24 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 16L0 0h24L12 16z"
                fill="#205ED7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-transform hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 0 24px rgba(0,0,0,0.22)' }}
        aria-label={isOpen ? 'Close chat' : 'Open Rentals Assist chat'}
        title="Chat with Rentals Assist"
      >
        {isOpen ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <img src={getAsset('LOGO_AI')} alt="" className="h-12 w-12 rounded-full object-cover" aria-hidden />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 flex w-[calc(100vw-3rem)] max-w-[420px] flex-col rounded-2xl border-2 border-rental-blue-200 bg-white shadow-2xl overflow-hidden"
          style={{ height: 'min(75vh, 560px)' }}
          role="dialog"
          aria-label="Rentals Assist chat"
        >
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-rental-blue-50 to-white px-4 py-3">
            <div className="flex items-center gap-2">
              <img src={getAsset('LOGO_AI')} alt="" className="h-9 w-9 rounded-full object-cover" />
              <h3 className="font-outfit text-base font-bold text-gray-900">Rentals Assist</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close chat"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            ref={chatMessagesContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0 bg-white"
          >
            {isLoadingHistory ? (
              <div className="flex items-start gap-2">
                <img src={getAsset('LOGO_AI')} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                <div className="p-3 px-4 bg-gray-100 rounded-2xl rounded-tl-sm font-outfit text-sm text-gray-600">
                  <span className="italic animate-pulse">Loading conversation...</span>
                </div>
              </div>
            ) : (
              <>
                   <h4 className="font-outfit font-semibold text-gray-900 text-sm mb-2">Chat with Rentals Assist</h4>
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="flex items-start gap-2 max-w-[90%]">
                        <img src={getAsset('LOGO_AI')} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                        <div
                          className="ai-message-content p-3 bg-white rounded-2xl rounded-tl-sm font-outfit text-sm leading-relaxed break-words text-left"
                          style={{ border: '3px solid #0A369D' }}
                          dangerouslySetInnerHTML={{ __html: formatAIMessage(msg.message) }}
                        />
                      </div>
                    ) : (
                      <div className="max-w-[90%] p-3 px-4 bg-gray-100 rounded-2xl rounded-br-sm font-outfit text-sm leading-relaxed break-words text-left text-gray-900" dangerouslySetInnerHTML={{ __html: msg.message.replace(/\n/g, '<br />') }} />
                    )}
                  </div>
                ))}
             
                {chatMessages.length <= 1 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {suggestedPromptsLoading
                      ? [1, 2, 3].map((i) => (
                          <div key={i} className="h-10 rounded-full bg-gray-200 animate-pulse" aria-hidden />
                        ))
                      : (suggestedPrompts.length > 0 ? suggestedPrompts : FALLBACK_SUGGESTED_PROMPTS).map((label) => (
                          <button
                            key={label}
                            type="button"
                            className="font-outfit text-sm font-medium py-2 px-4 rounded-full bg-rental-blue-600 text-white hover:bg-rental-blue-700 transition-colors text-left w-full"
                            onClick={() => handleSendMessage(label)}
                          >
                            {label}
                          </button>
                        ))}
                  </div>
                )}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <img src={getAsset('LOGO_AI')} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                    <div className="p-3 px-4 bg-gray-100 rounded-2xl rounded-tl-sm font-outfit">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <form className="border-t border-gray-200 bg-white flex-shrink-0 p-3 flex items-center gap-2" onSubmit={handleChatSubmit}>
            <input
              type="text"
              className="flex-1 min-w-0 p-2.5 px-3 border border-gray-300 rounded-xl font-outfit text-sm outline-none focus:border-rental-blue-500 focus:ring-2 focus:ring-rental-blue-500/20 min-h-[42px]"
              placeholder={isLoading ? 'Searching...' : 'Type your message...'}
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="h-10 w-10 min-w-[40px] rounded-full bg-rental-blue-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-rental-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
