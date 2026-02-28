'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import { messagesApi } from '@/api'
import type { Message } from '@/api/endpoints/messages'
import { 
  FiBell,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiCheckSquare,
  FiAlertCircle,
  FiX,
  FiTrash2,
  FiEye,
  FiMail,
  FiHome
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind
// import '../broker-shared.css' // Removed - converted to Tailwind

type MessageTypeFilter = 'all' | 'contact' | 'property_inquiry' | 'general'

export default function BrokerInbox() {
  const [activeFilter, setActiveFilter] = useState<MessageTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showProcessingBanner, setShowProcessingBanner] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)

  useEffect(() => {
    fetchMessages()
    
    if (typeof window !== 'undefined') {
      const registrationStatus = localStorage.getItem('broker_registration_status')
      const brokerStatus = localStorage.getItem('broker_status')
      
      if (registrationStatus === 'processing' || 
          brokerStatus === 'processing' || 
          brokerStatus === 'pending' || 
          brokerStatus === 'under_review') {
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

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeFilter !== 'all') {
        params.type = activeFilter
      }
      
      const response = await messagesApi.getAll(params)
      setMessages(response.data)
      setUnreadCount(response.unread_count)
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
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: any) {
      console.error('Error marking message as read:', error)
      alert('Failed to mark message as read')
    }
  }

  const handleDelete = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    
    try {
      await messagesApi.delete(messageId)
      const message = messages.find(m => m.id === messageId)
      if (message && !message.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error: any) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message)
    setShowMessageModal(true)
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
      case 'property_inquiry': return 'Property Inquiry'
      case 'contact': return 'Contact'
      case 'general': return 'General'
      default: return type
    }
  }

  const getMessageTypeColor = (type: string): string => {
    switch (type) {
      case 'property_inquiry': return '#F97316'
      case 'contact': return '#10B981'
      case 'general': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const filteredMessages = messages.filter(msg => {
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

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* broker-dashboard */}
      <AppSidebar />

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15"> {/* broker-main */}
        {/* Broker Header */}
        <header className="flex items-center justify-between mb-7 md:flex-col md:items-start md:gap-3.5"> {/* broker-header */}
          <div className="flex flex-col gap-1"> {/* broker-header-left */}
            <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1 md:text-xl">Inbox</h1>
            <p className="text-sm text-gray-400 m-0">Manage your messages and inquiries.</p>
          </div>
          <div className="flex items-center gap-3.5 md:w-full md:justify-between md:gap-2.5"> {/* broker-header-right */}
            <button className="w-11 h-11 rounded-xl border-0 bg-white flex items-center justify-center text-gray-600 text-xl cursor-pointer transition-all duration-200 shadow-sm hover:bg-gray-50 hover:text-blue-600"> {/* broker-notification-btn */}
              <FiBell />
            </button>
            <a href="/broker/create-listing" className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 text-white text-sm font-semibold rounded-xl border-0 no-underline cursor-pointer transition-all duration-200 shadow-sm hover:bg-blue-700 active:scale-[0.98]"> {/* broker-add-listing-btn */}
              <FiPlus />
              Add Listing
            </a>
          </div>
        </header>

        <div className="bg-white rounded-2xl p-6 shadow-sm"> {/* inbox-container */}
          <h2 className="text-xl font-bold text-gray-900 mb-5">Inbox</h2> {/* inbox-title */}

          {isProcessing && showProcessingBanner && (
            <div className="relative flex items-start gap-4 p-4 mb-5 bg-amber-50 border border-amber-200 rounded-xl"> {/* processing-banner */}
              <div className="flex items-start gap-3 flex-1"> {/* processing-banner-content */}
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0"> {/* processing-banner-icon */}
                  <FiAlertCircle />
                </div>
                <div className="flex-1"> {/* processing-banner-text */}
                  <h3 className="text-base font-bold text-amber-900 mb-1">Account Under Review</h3>
                  <p className="text-sm text-amber-700 m-0">Your account is currently being processed by our admin team. Your listings won't be visible to users until your account is approved.</p>
                </div>
              </div>
              <button 
                className="w-8 h-8 rounded-lg border-0 bg-transparent flex items-center justify-center text-amber-600 cursor-pointer transition-all duration-200 hover:bg-amber-100" /* processing-banner-close */
                onClick={() => setShowProcessingBanner(false)}
                aria-label="Close banner"
              >
                <FiX />
              </button>
            </div>
          )}

          <div className="relative mb-5"> {/* inbox-search */}
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" /> {/* search-icon */}
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-xl text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /* search-input */
            />
          </div>

          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2 md:flex-wrap"> {/* inbox-filters */}
            <button
              className={`inline-flex items-center gap-2 py-2 px-4 rounded-lg border-0 text-sm font-medium cursor-pointer transition-all duration-200 ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} /* filter-tab active */
              onClick={() => setActiveFilter('all')}
            >
              <FiCheckSquare className="text-base" /> {/* filter-checkbox */}
              <span>All({messages.length})</span>
            </button>
            <button
              className={`inline-flex items-center gap-2 py-2 px-4 rounded-lg border-0 text-sm font-medium cursor-pointer transition-all duration-200 ${activeFilter === 'property_inquiry' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} /* filter-tab active */
              onClick={() => setActiveFilter('property_inquiry')}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F97316' }}></span> {/* filter-dot */}
              <span>Property Inquiries({messages.filter(m => m.type === 'property_inquiry').length})</span>
            </button>
            <button
              className={`inline-flex items-center gap-2 py-2 px-4 rounded-lg border-0 text-sm font-medium cursor-pointer transition-all duration-200 ${activeFilter === 'contact' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} /* filter-tab active */
              onClick={() => setActiveFilter('contact')}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></span> {/* filter-dot */}
              <span>Contacts({messages.filter(m => m.type === 'contact').length})</span>
            </button>
            <button
              className={`inline-flex items-center gap-2 py-2 px-4 rounded-lg border-0 text-sm font-medium cursor-pointer transition-all duration-200 ${activeFilter === 'general' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} /* filter-tab active */
              onClick={() => setActiveFilter('general')}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6B7280' }}></span> {/* filter-dot */}
              <span>General({messages.filter(m => m.type === 'general').length})</span>
            </button>
            <button className="w-10 h-10 rounded-lg border-0 bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-200 ml-auto" onClick={fetchMessages} title="Refresh"> {/* refresh-button */}
              <FiRefreshCw className="text-base" /> {/* refresh-icon */}
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No messages found.</div>
          ) : (
            <div className="overflow-x-auto"> {/* inbox-table-container */}
              <table className="w-full border-collapse min-w-[900px]"> {/* inbox-table */}
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Sender</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Type</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Property</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Message</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Date</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr 
                      key={msg.id} 
                      className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 ${msg.is_read ? 'bg-white' : 'bg-blue-50/30'}`} /* read/unread */
                      onClick={() => handleViewMessage(msg)}
                    >
                      <td className="py-3 px-4 border-b border-gray-100">
                        <div className="flex items-center gap-3"> {/* table-sender */}
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0"> {/* table-avatar */}
                            {getInitials(msg.sender_name)}
                          </div>
                          <div className="flex flex-col"> {/* table-sender-info */}
                            <div className="text-sm font-semibold text-gray-900">{msg.sender_name}</div> {/* table-sender-name */}
                            <div className="text-xs text-gray-500">{msg.sender_email}</div> {/* table-sender-email */}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100">
                        <span 
                          className="inline-block py-1 px-2.5 rounded-md text-xs font-semibold text-white" /* table-type-badge */
                          style={{ backgroundColor: getMessageTypeColor(msg.type) }}
                        >
                          {getMessageTypeLabel(msg.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100">
                        {msg.property ? (
                          <div className="flex items-center gap-2"> {/* table-property */}
                            <FiHome className="text-gray-400 text-sm" /> {/* table-property-icon */}
                            <span className="text-sm text-gray-700 truncate max-w-[200px]">{msg.property.title}</span> {/* table-property-title */}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span> /* table-no-property */
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100">
                        <div className="flex flex-col gap-1 max-w-[300px]"> {/* table-message */}
                          {msg.subject && (
                            <div className="text-sm font-semibold text-gray-900 truncate">{msg.subject}</div> /* table-message-subject */
                          )}
                          <div className="text-sm text-gray-600 truncate"> {/* table-message-text */}
                            {msg.message.length > 100 ? `${msg.message.substring(0, 100)}...` : msg.message}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100 text-sm text-gray-600">{formatDate(msg.created_at)}</td> {/* table-date */}
                      <td className="py-3 px-4 border-b border-gray-100">
                        {msg.is_read ? (
                          <span className="inline-block py-1 px-2.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">Read</span> /* table-status read */
                        ) : (
                          <span className="inline-block py-1 px-2.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">New</span> /* table-status unread */
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100" onClick={(e) => e.stopPropagation()}> {/* table-actions */}
                        <div className="flex items-center gap-2">
                          <button
                            className="w-8 h-8 rounded-lg border-0 flex items-center justify-center text-blue-600 bg-blue-50 cursor-pointer transition-all duration-200 hover:bg-blue-100" /* table-action-btn view */
                            onClick={() => handleViewMessage(msg)}
                            title="View"
                          >
                            <FiEye />
                          </button>
                          {!msg.is_read && (
                            <button
                              className="w-8 h-8 rounded-lg border-0 flex items-center justify-center text-emerald-600 bg-emerald-50 cursor-pointer transition-all duration-200 hover:bg-emerald-100" /* table-action-btn mark-read */
                              onClick={() => handleMarkAsRead(msg.id)}
                              title="Mark as read"
                            >
                              <FiMail />
                            </button>
                          )}
                          <button
                            className="w-8 h-8 rounded-lg border-0 flex items-center justify-center text-red-600 bg-red-50 cursor-pointer transition-all duration-200 hover:bg-red-100" /* table-action-btn delete */
                            onClick={() => handleDelete(msg.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Message Detail Modal */}
          {showMessageModal && selectedMessage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMessageModal(false)}> {/* message-modal-overlay */}
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}> {/* message-modal */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200"> {/* message-modal-header */}
                  <h2 className="text-xl font-bold text-gray-900 m-0">Message Details</h2>
                  <button className="w-10 h-10 rounded-full border-0 bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-200" onClick={() => setShowMessageModal(false)}> {/* message-modal-close */}
                    <FiX />
                  </button>
                </div>
                <div className="p-6 flex flex-col gap-4"> {/* message-modal-content */}
                  <div className="flex gap-3"> {/* message-detail-row */}
                    <strong className="text-sm font-semibold text-gray-700 min-w-[80px]">From:</strong>
                    <span className="text-sm text-gray-900">{selectedMessage.sender_name} ({selectedMessage.sender_email})</span>
                  </div>
                  {selectedMessage.sender_phone && (
                    <div className="flex gap-3"> {/* message-detail-row */}
                      <strong className="text-sm font-semibold text-gray-700 min-w-[80px]">Phone:</strong>
                      <span className="text-sm text-gray-900">{selectedMessage.sender_phone}</span>
                    </div>
                  )}
                  {selectedMessage.property && (
                    <div className="flex gap-3"> {/* message-detail-row */}
                      <strong className="text-sm font-semibold text-gray-700 min-w-[80px]">Property:</strong>
                      <span className="text-sm text-gray-900">{selectedMessage.property.title}</span>
                    </div>
                  )}
                  {selectedMessage.subject && (
                    <div className="flex gap-3"> {/* message-detail-row */}
                      <strong className="text-sm font-semibold text-gray-700 min-w-[80px]">Subject:</strong>
                      <span className="text-sm text-gray-900">{selectedMessage.subject}</span>
                    </div>
                  )}
                  <div className="flex gap-3"> {/* message-detail-row */}
                    <strong className="text-sm font-semibold text-gray-700 min-w-[80px]">Type:</strong>
                    <span 
                      className="inline-block py-1 px-2.5 rounded-md text-xs font-semibold text-white" /* message-type-badge */
                      style={{ backgroundColor: getMessageTypeColor(selectedMessage.type) }}
                    >
                      {getMessageTypeLabel(selectedMessage.type)}
                    </span>
                  </div>
                  <div className="flex gap-3"> {/* message-detail-row */}
                    <strong className="text-sm font-semibold text-gray-700 min-w-[80px]">Date:</strong>
                    <span className="text-sm text-gray-900">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-2"> {/* message-detail-message */}
                    <strong className="text-sm font-semibold text-gray-700">Message:</strong>
                    <p className="text-sm text-gray-900 leading-relaxed m-0">{selectedMessage.message}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200"> {/* message-modal-footer */}
                  <button
                    className="py-2.5 px-5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-gray-200" /* message-modal-btn close */
                    onClick={() => setShowMessageModal(false)}
                  >
                    Close
                  </button>
                  {!selectedMessage.is_read && (
                    <button
                      className="py-2.5 px-5 bg-blue-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700" /* message-modal-btn mark-read */
                      onClick={() => {
                        handleMarkAsRead(selectedMessage.id)
                        setShowMessageModal(false)
                      }}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    className="py-2.5 px-5 bg-red-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-red-700" /* message-modal-btn delete */
                    onClick={() => {
                      handleDelete(selectedMessage.id)
                      setShowMessageModal(false)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
