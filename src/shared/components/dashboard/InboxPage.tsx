'use client'

import { useState, useEffect, useRef } from 'react'
import { messagesApi, propertiesApi } from '@/api'
import type { Message, InquiryConversation } from '@/shared/api'
import type { Property } from '@/types'
import {
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiX,
  FiHome,
  FiDroplet,
  FiMaximize,
  FiSend,
} from 'react-icons/fi'

type MessageTypeFilter = 'all' | 'contact' | 'property_inquiry' | 'general' | 'team_invitation' | 'broker_invitation'

type InboxPageProps = {
  registrationStatusKey: string
  statusKey: string
  ownerIdStorageKey: string
  variant?: 'agent' | 'broker'
}

export default function InboxPage({
  registrationStatusKey,
  statusKey,
  ownerIdStorageKey,
  variant = 'broker',
}: InboxPageProps) {
  const [activeFilter, setActiveFilter] = useState<MessageTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showProcessingBanner, setShowProcessingBanner] = useState(true)
  const [conversations, setConversations] = useState<InquiryConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<InquiryConversation | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [processingInvitation, setProcessingInvitation] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()

    if (typeof window !== 'undefined') {
      const registrationStatus = localStorage.getItem(registrationStatusKey)
      const status = localStorage.getItem(statusKey)

      if (
        registrationStatus === 'processing' ||
        status === 'processing' ||
        status === 'pending' ||
        status === 'under_review'
      ) {
        setIsProcessing(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, registrationStatusKey, statusKey])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unread_messages_count', unreadCount.toString())
      window.dispatchEvent(new Event('storage'))
    }
  }, [unreadCount])

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationMessages(selectedConversation.id)
      loadPropertyForConversation(selectedConversation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation])

  useEffect(() => {
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

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeFilter !== 'all') {
        params.type = activeFilter
      }

      const response = await messagesApi.getAll(params)
      const conversationsList = response.conversations || []
      setConversations(conversationsList)
      setUnreadCount(response.unread_count ?? 0)

      if (!selectedConversation && conversationsList.length > 0) {
        setSelectedConversation(conversationsList[0])
      } else if (selectedConversation) {
        const matching = conversationsList.find((c) => c.id === selectedConversation.id)
        if (matching) {
          setSelectedConversation(matching)
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error)
      if (error.response?.status === 401) {
        console.error('Unauthorized. Please log in again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationMessages = async (conversationId: number) => {
    setMessagesLoading(true)
    try {
      const response = await messagesApi.getConversationMessages(conversationId)
      setConversationMessages(response.data)

      const unreadMessages = response.data.filter(
        (m: Message) =>
          !m.is_read &&
          m.sender_email !==
            (typeof window !== 'undefined' ? localStorage.getItem('user_email') : null)
      )
      for (const msg of unreadMessages) {
        try {
          await messagesApi.markAsRead(msg.id)
        } catch {
          // ignore errors
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversation messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSelectConversation = (conversation: InquiryConversation) => {
    setSelectedConversation(conversation)
    setReplyText('')
  }

  const handleAcceptInvitation = async (messageId: number) => {
    setProcessingInvitation(messageId)
    try {
      await messagesApi.acceptTeamInvitation(messageId)
      await fetchConversations()
      if (selectedConversation) {
        await fetchConversationMessages(selectedConversation.id)
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      alert(error.message || 'Failed to accept invitation')
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleRejectInvitation = async (messageId: number) => {
    if (!confirm('Are you sure you want to reject this team invitation?')) {
      return
    }
    setProcessingInvitation(messageId)
    try {
      await messagesApi.rejectTeamInvitation(messageId)
      await fetchConversations()
      if (selectedConversation) {
        await fetchConversationMessages(selectedConversation.id)
      }
    } catch (error: any) {
      console.error('Error rejecting invitation:', error)
      alert(error.message || 'Failed to reject invitation')
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation || !conversationMessages.length) return

    const customerMessage = conversationMessages.find(
      (m) =>
        !m.sender_id ||
        m.sender_email !==
          (typeof window !== 'undefined' ? localStorage.getItem('user_email') : null)
    )
    if (!customerMessage) return

    setIsSendingReply(true)
    try {
      await messagesApi.reply(customerMessage.id, {
        message: replyText.trim(),
      })

      setReplyText('')
      if (selectedConversation) {
        await fetchConversationMessages(selectedConversation.id)
        await fetchConversations()
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
    // For invitation filters, check if any message in conversation matches the type
    if (activeFilter === 'team_invitation' || activeFilter === 'broker_invitation') {
      const hasInvitation = conversationMessages.some(
        (m) => m.conversation_id === conv.id && m.type === activeFilter
      )
      if (!hasInvitation) return false
    } else if (activeFilter !== 'all' && conv.type !== activeFilter) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        conv.customer_name.toLowerCase().includes(query) ||
        conv.customer_email.toLowerCase().includes(query) ||
        conv.property?.title.toLowerCase().includes(query) ||
        conv.subject?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getConversationUnreadCount = (conversation: InquiryConversation): number => {
    return conversationMessages.filter(
      (m) => m.conversation_id === conversation.id && !m.is_read && m.sender_id === null
    ).length
  }

  const isFromOwner = (msg: Message): boolean => {
    return (
      msg.sender_id !== null &&
      (typeof window !== 'undefined' &&
        (localStorage.getItem('user_id') || localStorage.getItem(ownerIdStorageKey)) ===
          msg.sender_id.toString())
    )
  }

  const showTabs = variant === 'agent'

  return (
    <>
      {isProcessing && showProcessingBanner && (
        <div className="relative mb-4 flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-1 items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FiAlertCircle />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-amber-900">Account Under Review</h3>
              <p className="text-xs leading-relaxed text-amber-700">
                Your account is currently being processed by our admin team. Your listings will be
                visible to users once your account is approved.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowProcessingBanner(false)}
            aria-label="Close banner"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-100"
          >
            <FiX />
          </button>
        </div>
      )}

      <div
        className={
          variant === 'agent'
            ? 'flex flex-col gap-4 rounded-2xl bg-white p-0 shadow-[0_2px_12px_rgba(15,23,42,0.06)]'
            : 'bg-white rounded-2xl shadow-sm overflow-hidden'
        }
      >
        {showTabs && (
          <div className="flex border-b border-gray-200 bg-blue-600 px-6 pt-4">
            <button
              type="button"
              className="border-b-2 border-[#2563eb] bg-white px-5 py-2 text-sm font-semibold text-[#2563eb] shadow-sm"
            >
              Messages
            </button>
          </div>
        )}

        <div className="flex min-h-[600px] flex-col overflow-hidden rounded-b-2xl border-t border-gray-200 bg-[#f5f7fb] md:flex-row">
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
                  onClick={fetchConversations}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 px-4 pb-3 border-b border-gray-100 overflow-x-auto">
              {(['all', 'property_inquiry', 'contact', 'general', 'team_invitation', 'broker_invitation'] as MessageTypeFilter[]).map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                      activeFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all'
                      ? 'All'
                      : filter
                          .replace('_', ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                )
              )}
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
                  const conversationUnreadCount = getConversationUnreadCount(conv)

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleSelectConversation(conv)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                        isSelected ? 'bg-[#f5f7fb]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase text-white">
                        {getInitials(conv.customer_name)}
                        {conversationUnreadCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500">
                            <span className="text-[8px] font-bold text-white">
                              {conversationUnreadCount > 9 ? '9+' : conversationUnreadCount}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {conv.customer_name}
                          </p>
                          {conv.latestMessage && (
                            <span className="flex-shrink-0 text-[10px] font-medium text-gray-400">
                              {formatDate(conv.latestMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                          {conv.property?.title || conv.subject || 'General inquiry'}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                          {conv.customer_email}
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase text-white">
                      {getInitials(selectedConversation.customer_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedConversation.customer_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {selectedConversation.customer_email}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {selectedConversation.property?.title ||
                          selectedConversation.subject ||
                          'General inquiry'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-sm text-gray-500">Loading messages...</div>
                    </div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-sm text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversationMessages.map((msg, idx) => {
                        const fromOwner = isFromOwner(msg)

                        return (
                          <div
                            key={`${msg.id}-${idx}-${msg.created_at}`}
                            className={`flex items-start gap-3 ${
                              fromOwner ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {!fromOwner && (
                              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                {getInitials(msg.sender_name)}
                              </div>
                            )}
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                fromOwner
                                  ? 'rounded-tr-none bg-[#2563eb] text-white'
                                  : 'rounded-tl-none bg-white text-gray-800'
                              }`}
                            >
                              <p className="whitespace-pre-line">{msg.message}</p>
                              {(msg.type === 'team_invitation' || msg.type === 'broker_invitation') && !fromOwner && msg.metadata && (
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => handleAcceptInvitation(msg.id)}
                                    disabled={processingInvitation === msg.id}
                                    className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {processingInvitation === msg.id ? 'Processing...' : 'Accept'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectInvitation(msg.id)}
                                    disabled={processingInvitation === msg.id}
                                    className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {processingInvitation === msg.id ? 'Processing...' : 'Reject'}
                                  </button>
                                </div>
                              )}
                              <p
                                className={`mt-1.5 text-[10px] font-medium ${
                                  fromOwner ? 'text-blue-100' : 'text-gray-400'
                                }`}
                              >
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                            {fromOwner && (
                              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                                You
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message input - Hide for pending invitations */}
                {!conversationMessages.some((m) => (m.type === 'team_invitation' || m.type === 'broker_invitation') && !m.is_read && !isFromOwner(m)) && (
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
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2563eb] text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiSend className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 py-10 text-center text-sm text-gray-500">
                Select a conversation to start messaging.
              </div>
            )}
          </div>

          {/* Property details sidebar */}
          {activeProperty && (
            <div className="hidden w-[320px] flex-shrink-0 flex-col border-l border-gray-200 bg-white lg:flex">
              <div className="border-b border-gray-200 px-5 py-4">
                <p className="text-sm font-semibold text-gray-900">Property Details</p>
              </div>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
                <div className="h-40 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                  <img
                    src={
                      activeProperty.image_url ||
                      activeProperty.image ||
                      '/images/placeholder-property.png'
                    }
                    alt={activeProperty.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{activeProperty.title}</p>
                  <p className="text-xs text-gray-500">
                    {activeProperty.street_address ||
                      activeProperty.city ||
                      activeProperty.location ||
                      ''}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <FiHome className="h-4 w-4 text-gray-500" />
                    <span>
                      {activeProperty.bedrooms != null ? activeProperty.bedrooms : '—'} bed
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiDroplet className="h-4 w-4 text-gray-500" />
                    <span>
                      {activeProperty.bathrooms != null ? activeProperty.bathrooms : '—'} bath
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiMaximize className="h-4 w-4 text-gray-500" />
                    <span>
                      {activeProperty.area != null
                        ? `${activeProperty.area} ${
                            activeProperty.floor_area_unit
                              ?.toLowerCase()
                              .includes('meter')
                              ? 'sqm'
                              : activeProperty.floor_area_unit || 'sqm'
                          }`
                        : '— sqm'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 space-y-2 text-sm">
                  <p className="text-lg font-bold text-blue-600">
                    {activeProperty.price != null
                      ? `₱ ${activeProperty.price.toLocaleString('en-US')}${
                          activeProperty.price_type
                            ? `/${activeProperty.price_type}`
                            : '/monthly'
                        }`
                      : 'Price upon request'}
                  </p>
                </div>
                <a
                  href={`/property/${activeProperty.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto rounded-lg bg-[#2563eb] py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
                >
                  View Property
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

