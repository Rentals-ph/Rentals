'use client'

import { useState, useEffect, useRef } from 'react'
import { messagesApi, propertiesApi } from '@/api'
import type { Message, InquiryConversation } from '@/shared/api'
import type { Property } from '@/types'
import {
  FiSearch,
  FiRefreshCw,
  FiSend,
  FiHome,
  FiDroplet,
  FiMaximize,
} from 'react-icons/fi'
import Link from 'next/link'
import { ASSETS } from '@/utils/assets'

export default function CustomerInquiries() {
  const [conversations, setConversations] = useState<InquiryConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<InquiryConversation | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [customerEmail, setCustomerEmail] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMarkingAsReadRef = useRef(false)

  useEffect(() => {
    // Get customer email from localStorage
    if (typeof window !== 'undefined') {
      const profile = localStorage.getItem('temp_chat_profile_v1')
      if (profile) {
        try {
          const parsed = JSON.parse(profile)
          if (parsed?.email) {
            setCustomerEmail(parsed.email)
          }
        } catch {
          // ignore
        }
      }
    }
  }, [])

  useEffect(() => {
    if (customerEmail) {
      fetchInquiries()
    }
  }, [customerEmail])

  useEffect(() => {
    if (selectedConversation && !isMarkingAsReadRef.current) {
      fetchConversationMessages(selectedConversation.id)
      loadPropertyForConversation(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages])

  const loadPropertyForConversation = async (conversation: InquiryConversation | null) => {
    if (!conversation || !conversation.property_id) {
      setActiveProperty(null)
      return
    }

    try {
      const property = await propertiesApi.getById(conversation.property_id)
      setActiveProperty(property)
    } catch (error: any) {
      console.error('Error fetching property:', error)
      setActiveProperty(null)
    }
  }

  const fetchInquiries = async () => {
    if (!customerEmail) return
    
    setLoading(true)
    try {
      const response = await messagesApi.getCustomerInquiries(customerEmail)
      const conversationsList = response.conversations || []
      setConversations(conversationsList)
      
      // Auto-select first conversation if none selected
      if (!selectedConversation && conversationsList.length > 0) {
        setSelectedConversation(conversationsList[0])
      } else if (selectedConversation) {
        // Keep selected conversation in sync
        const matching = conversationsList.find((c) => c.id === selectedConversation.id)
        if (matching) {
          setSelectedConversation(matching)
        }
      }
    } catch (error: any) {
      console.error('Error fetching inquiries:', error)
      if (error.response?.status === 404) {
        setConversations([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationMessages = async (conversationId: number) => {
    if (!customerEmail) return
    
    setMessagesLoading(true)
    try {
      const response = await messagesApi.getConversationMessages(conversationId, customerEmail)
      setConversationMessages(response.data)
      
      // Mark conversation as read when messages are fetched
      if (!isMarkingAsReadRef.current) {
        isMarkingAsReadRef.current = true
        try {
          await messagesApi.markConversationAsRead(conversationId, customerEmail)
          // Update local conversation state to reflect read status without triggering full refresh
          setConversations(prev => prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, latestMessage: conv.latestMessage ? { ...conv.latestMessage, is_read: true } : undefined }
              : conv
          ) as InquiryConversation[])
        } catch (error) {
          // Ignore errors when marking as read
          console.error('Error marking conversation as read:', error)
        } finally {
          isMarkingAsReadRef.current = false
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversation messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSelectConversation = async (conversation: InquiryConversation) => {
    setSelectedConversation(conversation)
    setReplyText('')
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation || !conversationMessages.length || !customerEmail) return

    // Find the first customer message to get the conversation context
    const customerMessage = conversationMessages.find(m => m.sender_email === customerEmail && !m.sender_id)
    if (!customerMessage) return

    setIsSendingReply(true)
    try {
      // Send a new message in the conversation
      await messagesApi.send({
        recipient_id: selectedConversation.agent_id || selectedConversation.broker_id || 0,
        property_id: selectedConversation.property_id ?? undefined,
        sender_name: selectedConversation.customer_name,
        sender_email: customerEmail,
        sender_phone: undefined,
        message: replyText.trim(),
        type: (selectedConversation.type === 'team_invitation' || selectedConversation.type === 'broker_invitation') ? 'general' : selectedConversation.type,
        subject: selectedConversation.subject ?? undefined,
      })
      
      setReplyText('')
      // Refresh conversation messages
      if (selectedConversation) {
        await fetchConversationMessages(selectedConversation.id)
        await fetchInquiries() // Refresh conversations list
      }
    } catch (error: any) {
      console.error('Error sending reply:', error)
      alert(error?.response?.data?.message || 'Failed to send reply. Please try again.')
    } finally {
      setIsSendingReply(false)
    }
  }

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        (conv.agent?.name || conv.broker?.name || '').toLowerCase().includes(query) ||
        conv.property?.title.toLowerCase().includes(query) ||
        conv.subject?.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Get unread count for a conversation (messages from agent/broker)
  const getConversationUnreadCount = (conversation: InquiryConversation): number => {
    return conversationMessages.filter(m => 
      m.conversation_id === conversation.id && 
      m.sender_id !== null && // From agent/broker
      !m.is_read
    ).length
  }

  if (!customerEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Inquiries Found</h1>
          <p className="text-gray-600 mb-6">
            You haven't made any inquiries yet. Browse properties and send inquiries to agents to see them here.
          </p>
          <Link
            href="/properties"
            className="inline-block px-6 py-3 bg-[#2563eb] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Inquiries</h1>
          <p className="text-gray-600">View and manage your property inquiries</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex min-h-[600px] flex-col md:flex-row">
            {/* Conversations list - Left sidebar */}
            <div className="flex w-full flex-shrink-0 flex-col border-b border-gray-200 bg-white md:w-[320px] md:border-b-0 md:border-r">
              {/* Search */}
              <div className="border-b border-gray-100 px-4 pb-3 pt-4">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={fetchInquiries}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100"
                  >
                    <FiRefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No conversations found.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedConversation?.id === conv.id
                    const unreadCount = getConversationUnreadCount(conv)
                    const agentName = conv.agent?.name || conv.broker?.name || 'Agent'
                    
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => handleSelectConversation(conv)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                          isSelected ? 'bg-[#f5f7fb]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold uppercase text-gray-600">
                          {conv.property ? (
                            <FiHome className="h-6 w-6" />
                          ) : (
                            getInitials(agentName)
                          )}
                          {unreadCount > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-red-500 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {conv.property?.title || agentName}
                            </p>
                            {conv.latestMessage && (
                              <span className="flex-shrink-0 text-[10px] font-medium text-gray-400">
                                {formatDate(conv.latestMessage.created_at)}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                            {agentName}
                          </p>
                          {conv.latestMessage && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                              {conv.latestMessage.message}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Chat panel - Right side */}
            <div className="flex min-h-[600px] flex-1 flex-col bg-white">
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold uppercase text-gray-600">
                        {selectedConversation.property ? (
                          <FiHome className="h-5 w-5" />
                        ) : (
                          getInitials(selectedConversation.agent?.name || selectedConversation.broker?.name || 'Agent')
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedConversation.property?.title || selectedConversation.agent?.name || selectedConversation.broker?.name || 'Agent'}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {selectedConversation.agent?.name || selectedConversation.broker?.name || 'Agent/Broker'}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {selectedConversation.customer_email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-gray-500">Loading messages...</div>
                      </div>
                    ) : conversationMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-gray-500">No messages yet. Start the conversation!</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {conversationMessages.map((msg, idx) => {
                          // Check if message is from agent/broker (has sender_id) or from customer
                          const isFromAgent = msg.sender_id !== null
                          
                          return (
                            <div
                              key={`${msg.id}-${idx}-${msg.created_at}`}
                              className={`flex items-start gap-3 ${isFromAgent ? 'justify-start' : 'justify-end'}`}
                            >
                              {isFromAgent && (
                                <div className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                                  Agent
                                </div>
                              )}
                              <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                isFromAgent 
                                  ? 'rounded-tl-none bg-white text-gray-800' 
                                  : 'rounded-tr-none bg-[#2563eb] text-white'
                              }`}>
                                <p className="whitespace-pre-line">{msg.message}</p>
                                <p className={`mt-1.5 text-[10px] font-medium ${
                                  isFromAgent ? 'text-gray-400' : 'text-blue-100'
                                }`}>
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                              {!isFromAgent && (
                                <div className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                                  {getInitials(msg.sender_name)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Message input */}
                  <div className="border-t border-gray-200 bg-white px-6 py-4">
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendReply()
                          }
                        }}
                        className="flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={isSendingReply || !replyText.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2563eb] text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#1d4ed8] transition-colors"
                      >
                        <FiSend className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center px-6 py-10 text-center text-sm text-gray-500">
                  Select a conversation to start messaging.
                </div>
              )}
            </div>

            {/* Property details sidebar */}
            {activeProperty && (
              <div className="hidden lg:flex w-[320px] flex-shrink-0 flex-col bg-white border-l border-gray-200">
                <div className="border-b border-gray-200 px-5 py-4">
                  <p className="text-sm font-semibold text-gray-900">Property Details</p>
                </div>
                <div className="flex flex-1 flex-col gap-4 px-5 py-4 overflow-y-auto">
                  <div className="h-40 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                    <img
                      src={activeProperty.image_url || activeProperty.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN}
                      alt={activeProperty.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{activeProperty.title}</p>
                    <p className="text-xs text-gray-500">
                      {activeProperty.street_address || activeProperty.city || activeProperty.location || ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <FiHome className="h-4 w-4 text-gray-500" />
                      <span>{activeProperty.bedrooms != null ? activeProperty.bedrooms : '—'} bed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiDroplet className="h-4 w-4 text-gray-500" />
                      <span>{activeProperty.bathrooms != null ? activeProperty.bathrooms : '—'} bath</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiMaximize className="h-4 w-4 text-gray-500" />
                      <span>
                        {activeProperty.area != null
                          ? `${activeProperty.area} ${activeProperty.floor_area_unit?.toLowerCase().includes('meter') ? 'sqm' : activeProperty.floor_area_unit || 'sqm'}`
                          : '— sqm'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="text-lg font-bold text-blue-600">
                      {activeProperty.price != null
                        ? `₱ ${activeProperty.price.toLocaleString('en-US')}${activeProperty.price_type ? `/${activeProperty.price_type}` : '/monthly'}`
                        : 'Price upon request'}
                    </p>
                  </div>
                  <Link
                    href={`/property/${activeProperty.id}`}
                    className="mt-auto rounded-lg bg-[#2563eb] py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] transition-colors"
                  >
                    View Property
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
