'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/features/dashboard'
import { contactApi } from '@/api'
import type { ContactInquiry } from '@/shared/api'
import { toast, ToastContainer } from '@/shared/utils/toast'
import { FiMail, FiPhone, FiMessageSquare, FiCheck, FiTrash2, FiEye, FiEyeOff, FiCalendar } from 'react-icons/fi'

export default function AdminContactInquiriesPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadInquiries()
  }, [filter])

  const loadInquiries = async () => {
    try {
      setIsLoading(true)
      const params: { is_read?: boolean } = {}
      if (filter === 'read') params.is_read = true
      if (filter === 'unread') params.is_read = false

      const response = await contactApi.getInquiries(params)
      const data = Array.isArray(response.data) ? response.data : response.data.data || []
      setInquiries(data)
    } catch (error) {
      console.error('Error loading contact inquiries:', error)
      toast.error('Failed to load contact inquiries')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await contactApi.markAsRead(id)
      toast.success('Marked as read')
      loadInquiries()
      if (selectedInquiry?.id === id) {
        setSelectedInquiry({ ...selectedInquiry, is_read: true, read_at: new Date().toISOString() })
      }
    } catch (error: any) {
      console.error('Error marking inquiry as read:', error)
      toast.error(error.response?.data?.message || 'Failed to mark as read')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact inquiry?')) return

    try {
      await contactApi.delete(id)
      toast.success('Contact inquiry deleted successfully')
      loadInquiries()
      if (selectedInquiry?.id === id) {
        setShowModal(false)
        setSelectedInquiry(null)
      }
    } catch (error: any) {
      console.error('Error deleting inquiry:', error)
      toast.error(error.response?.data?.message || 'Failed to delete inquiry')
    }
  }

  const handleViewDetails = async (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry)
    setShowModal(true)
    
    // Mark as read if unread
    if (!inquiry.is_read) {
      handleMarkAsRead(inquiry.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const unreadCount = inquiries.filter((i) => !i.is_read).length

  return (
    <>
      <ToastContainer />
      <DashboardHeader
        title="Contact Inquiries"
        subtitle="Manage customer feedback and inquiries"
        showNotifications={false}
      />

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({inquiries.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${
              filter === 'unread'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${
              filter === 'read'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Read ({inquiries.length - unreadCount})
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-12">
            <FiMail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold mb-2">No contact inquiries</p>
            <p className="text-gray-400 text-sm">Contact inquiries from the website will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  !inquiry.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{inquiry.name}</h3>
                      {!inquiry.is_read && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <FiMail className="w-4 h-4" />
                        <span>{inquiry.email}</span>
                      </div>
                      {inquiry.phone && (
                        <div className="flex items-center gap-1">
                          <FiPhone className="w-4 h-4" />
                          <span>{inquiry.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>{formatDate(inquiry.created_at)}</span>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="font-medium text-gray-900 text-sm mb-1">Subject: {inquiry.subject}</p>
                      <p className="text-gray-600 text-sm line-clamp-2">{inquiry.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(inquiry)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                    {!inquiry.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(inquiry.id)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as Read"
                      >
                        <FiCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(inquiry.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Contact Inquiry Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                <p className="text-gray-900 font-medium mt-1">{selectedInquiry.name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-gray-900 mt-1">{selectedInquiry.email}</p>
              </div>
              {selectedInquiry.phone && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-gray-900 mt-1">{selectedInquiry.phone}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</label>
                <p className="text-gray-900 font-medium mt-1">{selectedInquiry.subject}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</label>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</label>
                  <p className="text-gray-600 text-sm mt-1">{formatDate(selectedInquiry.created_at)}</p>
                </div>
                {selectedInquiry.is_read && selectedInquiry.read_at && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Read</label>
                    <p className="text-gray-600 text-sm mt-1">{formatDate(selectedInquiry.read_at)}</p>
                    {selectedInquiry.readBy && (
                      <p className="text-gray-500 text-xs mt-1">
                        by {selectedInquiry.readBy.first_name} {selectedInquiry.readBy.last_name}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {!selectedInquiry.is_read && (
                  <button
                    onClick={() => {
                      handleMarkAsRead(selectedInquiry.id)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FiCheck className="w-4 h-4" />
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDelete(selectedInquiry.id)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="ml-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

