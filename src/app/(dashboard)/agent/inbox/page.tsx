'use client'

import { useState, useEffect } from 'react'
import { messagesApi, propertiesApi } from '@/api'
import type { Message } from '@/api/endpoints/messages'
import type { Property } from '@/types'
import {
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiX,
  FiTrash2,
  FiMail,
  FiHome,
  FiDroplet,
  FiMaximize,
} from 'react-icons/fi'

type MessageTypeFilter = 'all' | 'contact' | 'property_inquiry' | 'general'

export default function AgentInbox() {
  const [activeFilter, setActiveFilter] = useState<MessageTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showProcessingBanner, setShowProcessingBanner] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)

  useEffect(() => {
    fetchMessages()

    if (typeof window !== 'undefined') {
      const registrationStatus = localStorage.getItem('agent_registration_status')
      const agentStatus = localStorage.getItem('agent_status')

      if (
        registrationStatus === 'processing' ||
        agentStatus === 'processing' ||
        agentStatus === 'pending' ||
        agentStatus === 'under_review'
      ) {
        setIsProcessing(true)
      }
    }
  }, [activeFilter])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unread_messages_count', unreadCount.toString())
      window.dispatchEvent(new Event('storage'))
    }
  }, [unreadCount])

  const loadPropertyForMessage = async (message: Message | null) => {
    if (!message || !message.property_id) {
      setActiveProperty(null)
      return
    }

    try {
      const property = await propertiesApi.getById(message.property_id)
      setActiveProperty(property)
    } catch (error: any) {
      console.error('Error fetching property for message:', error)
      setActiveProperty(null)
    }
  }

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeFilter !== 'all') {
        params.type = activeFilter
      }

      const response = await messagesApi.getAll(params)
      const data: Message[] = Array.isArray(response.data) ? response.data : []
      setMessages(data)
      setUnreadCount(response.unread_count ?? 0)
      if (!selectedMessage && data.length > 0) {
        const first = data[0]
        setSelectedMessage(first)
        await loadPropertyForMessage(first)
      } else if (selectedMessage) {
        // Keep property in sync when refetching messages
        const matching = data.find((m) => m.id === selectedMessage.id) ?? null
        await loadPropertyForMessage(matching)
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      if (error.response?.status === 401) {
        console.error('Unauthorized. Please log in again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await messagesApi.markAsRead(messageId)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg,
        ),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error: any) {
      console.error('Error marking message as read:', error)
      alert('Failed to mark message as read')
    }
  }

  const handleDelete = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await messagesApi.delete(messageId)
      const message = messages.find((m) => m.id === messageId)
      if (message && !message.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
        setActiveProperty(null)
      }
    } catch (error: any) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message)
    await loadPropertyForMessage(message)
    if (!message.is_read) {
      await handleMarkAsRead(message.id)
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

  const getMessageTypeLabel = (type: string): string => {
    switch (type) {
      case 'property_inquiry':
        return 'Property Inquiry'
      case 'contact':
        return 'Contact'
      case 'general':
        return 'General'
      default:
        return type
    }
  }

  const getMessageTypeColor = (type: string): string => {
    switch (type) {
      case 'property_inquiry':
        return '#F97316'
      case 'contact':
        return '#10B981'
      case 'general':
        return '#6B7280'
      default:
        return '#6B7280'
    }
  }

  const filteredMessages = messages.filter((msg) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        msg.sender_name.toLowerCase().includes(query) ||
        msg.sender_email.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query) ||
        msg.subject?.toLowerCase().includes(query) ||
        msg.property?.title.toLowerCase().includes(query)
      )
    }
    return true
  })

  const activeConversation = selectedMessage

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">

      {isProcessing && showProcessingBanner && (
        <div className="relative flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-1 items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FiAlertCircle />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-amber-900">Account Under Review</h3>
              <p className="text-xs leading-relaxed text-amber-700">
                Your account is currently being processed by our admin team. Your listings
                will be visible to users once your account is approved.
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

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-0 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
        {/* Top tabs row */}
        <div className="flex border-b border-gray-200 bg-blue-600 px-6 pt-4">
          <button
            type="button"
            className="border-b-2 border-[#2563eb] bg-white px-5 py-2 text-sm font-semibold text-[#2563eb] shadow-sm"
          >
            Messages
          </button>
          <button
            type="button"
            disabled
            className="ml-1 border-b-2 border-transparent px-5 py-2 text-sm font-semibold text-white"
          >
            Notifications
          </button>
        </div>

        <div className="flex min-h-[480px] flex-col overflow-hidden rounded-b-2xl border-t border-gray-200 bg-[#f5f7fb] md:flex-row">
          {/* Conversation list */}
          <div className="flex w-full flex-shrink-0 flex-col border-b border-gray-200 bg-white md:w-[280px] md:border-b-0 md:border-r" style={{ border: '1px solid #e2e8f0' }}>
            {/* Search above messages list */}
            <div className="border-b border-gray-100 px-4 pb-3 pt-4">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={fetchMessages}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Small filter chips under search */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  Loading messages...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No messages found.
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isActive = activeConversation?.id === msg.id
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => handleViewMessage(msg)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                        isActive ? 'bg-[#f5f7fb]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold uppercase text-white">
                        {getInitials(msg.sender_name)}
                        {!msg.is_read && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {msg.sender_name}
                          </p>
                          <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                          {msg.message}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex min-h-[260px] flex-1 flex-col border-b border-gray-200 bg-[#f5f7fb] md:border-b-0 md:border-r">
            {activeConversation ? (
              <>
                <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4" style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold uppercase text-white">
                      {getInitials(activeConversation.sender_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {activeConversation.sender_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {(activeProperty && activeProperty.title) ||
                          activeConversation.property?.title ||
                          'General inquiry'}
                      </p>
                    </div>
                    
                  </div>
                  <div className="flex items-center gap-2">
                    {!activeConversation.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(activeConversation.id)}
                        className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                      >
                        <FiMail className="h-4 w-4" />
                        Mark as read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(activeConversation.id)}
                      className="flex h-9 items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-gray-200" />
                    <div className="max-w-[70%] rounded-2xl rounded-tl-none bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
                      <p className="whitespace-pre-line">{activeConversation.message}</p>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        {formatDate(activeConversation.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 bg-white px-6 py-3" style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-2">
                    <input
                      disabled
                      placeholder="Reply to this inquiry (coming soon)"
                      className="flex-1 border-none bg-transparent text-sm text-gray-500 outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      disabled
                      className="flex h-9 items-center justify-center rounded-md bg-[#2563eb] px-6 text-sm font-semibold text-white opacity-60"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 py-10 text-center text-sm text-gray-500">
                Select a message on the left to view the conversation.
              </div>
            )}
          </div>

          {/* Listing details */}
          <div className="flex w-full flex-shrink-0 flex-col bg-white md:w-[320px]" style={{ border: '1px solid #e2e8f0' }}>
            <div className="border-b border-gray-200 px-5 py-4">
              <p className="text-sm font-semibold text-gray-900">Listing Details</p>
            </div>
            {activeProperty ? (
              <div className="flex flex-1 flex-col gap-4 px-5 py-4">
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
                  <p className="text-sm font-semibold text-gray-900">
                    {activeProperty.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activeProperty.street_address ||
                      activeProperty.city ||
                      activeProperty.location ||
                      ''}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
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
                            activeProperty.floor_area_unit &&
                            activeProperty.floor_area_unit.toLowerCase().includes('meter')
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
                <button
                  type="button"
                  className="mt-auto rounded-lg bg-[#2563eb] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
                >
                  View Property
                </button>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-5 py-6 text-center text-xs text-gray-500">
                Select a message linked to a property to see its details here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


