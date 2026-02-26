'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import DashboardHeader from '../../../components/common/DashboardHeader'
import api from '../../../lib/api'
import { FiRefreshCw, FiCheck, FiX, FiEye } from 'react-icons/fi'

interface Agent {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  agency_name?: string
  prc_license_number?: string
  license_type?: string
  status: string
  verified: boolean
  created_at: string
  latest_approval?: {
    action: string
    notes?: string
    approved_by?: {
      first_name: string
      last_name: string
    }
  }
}

export default function AgentsPage() {
  const [filter, setFilter] = useState('all')
  const [agents, setAgents] = useState<Agent[]>([])
  const [pendingAgents, setPendingAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    fetchAgents()
    fetchPendingAgents()
  }, [filter])

  const fetchAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      
      const response = await api.get<Agent[]>(`/admin/agents?${params.toString()}`)
      if (response.success && response.data) {
        setAgents(response.data)
      } else {
        setError(response.message || 'Failed to fetch agents')
      }
    } catch (err) {
      setError('An error occurred while fetching agents')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingAgents = async () => {
    try {
      const response = await api.get<Agent[]>('/admin/agents/pending')
      if (response.success && response.data) {
        setPendingAgents(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch pending agents:', err)
    }
  }

  const handleViewDetails = async (agentId: number) => {
    try {
      const response = await api.get<Agent>(`/admin/agents/${agentId}`)
      if (response.success && response.data) {
        setSelectedAgent(response.data)
        setShowDetailsModal(true)
      }
    } catch (err) {
      setError('Failed to fetch agent details')
      console.error(err)
    }
  }

  const handleApprove = async () => {
    if (!selectedAgent) return
    
    try {
      const response = await api.post(`/admin/agents/${selectedAgent.id}/approve`, {
        notes: approvalNotes
      })
      if (response.success) {
        setShowApproveModal(false)
        setShowDetailsModal(false)
        setSelectedAgent(null)
        setApprovalNotes('')
        fetchAgents()
        fetchPendingAgents()
      } else {
        setError(response.message || 'Failed to approve agent')
      }
    } catch (err) {
      setError('An error occurred while approving agent')
      console.error(err)
    }
  }

  const handleReject = async () => {
    if (!selectedAgent || !rejectionNotes.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    
    try {
      const response = await api.post(`/admin/agents/${selectedAgent.id}/reject`, {
        notes: rejectionNotes
      })
      if (response.success) {
        setShowRejectModal(false)
        setShowDetailsModal(false)
        setSelectedAgent(null)
        setRejectionNotes('')
        fetchAgents()
        fetchPendingAgents()
      } else {
        setError(response.message || 'Failed to reject agent')
      }
    } catch (err) {
      setError('An error occurred while rejecting agent')
      console.error(err)
    }
  }

  const filteredAgents = filter === 'pending' ? pendingAgents : agents

  return (
    <div className="admin-dashboard">
      <AppSidebar/>

      <main className="admin-main">
        <DashboardHeader
          title="Agent Management"
          subtitle="Manage and approve agents"
          showNotifications={true}
        />

        {error && (
          <div style={{
            padding: '1rem',
            margin: '1rem',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B'
          }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>
              <FiX />
            </button>
          </div>
        )}

        {pendingAgents.length > 0 && filter !== 'pending' && (
          <div style={{
            padding: '1rem',
            margin: '1rem',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '8px',
            color: '#92400E'
          }}>
            <strong>Attention:</strong> You have {pendingAgents.length} pending agent approval{pendingAgents.length > 1 ? 's' : ''}.
            <button 
              onClick={() => setFilter('pending')}
              style={{ 
                marginLeft: '1rem', 
                padding: '0.25rem 0.5rem', 
                backgroundColor: '#F59E0B', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              View Pending
            </button>
          </div>
        )}

        <div className="agents-section">
          <div className="agents-header">
            <h2 className="agents-title">Agents</h2>
            <div className="agents-controls">
              <div className="filter-options">
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="filter" 
                    value="all" 
                    checked={filter === 'all'}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <span>All ({agents.length})</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="filter" 
                    value="pending" 
                    checked={filter === 'pending'}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <span>Pending ({pendingAgents.length})</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="filter" 
                    value="approved" 
                    checked={filter === 'approved'}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <span>Approved</span>
                </label>
                <label className="filter-option">
                  <input 
                    type="radio" 
                    name="filter" 
                    value="rejected" 
                    checked={filter === 'rejected'}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <span>Rejected</span>
                </label>
              </div>
              <button className="refresh-button" onClick={() => { fetchAgents(); fetchPendingAgents(); }} title="Refresh" disabled={loading}>
                <FiRefreshCw className={`refresh-icon ${loading ? 'spinning' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="agents-table-container">
              <table className="agents-table">
                <thead>
                  <tr>
                    <th><span className="block h-4 w-24 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-16 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-16 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-20 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-16 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-20 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                    <th><span className="block h-4 w-16 rounded bg-gray-100 animate-pulse mx-auto" /></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><span className="block h-4 rounded bg-gray-200 animate-pulse" style={{ width: j === 6 ? 80 : '70%' }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="agents-table-container">
              <table className="agents-table">
                <thead>
                  <tr>
                    <th>Agent Name</th>
                    <th>Email</th>
                    <th>Agency</th>
                    <th>PRC License</th>
                    <th>Status</th>
                    <th>Date Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                        No agents found
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((agent) => (
                      <tr key={agent.id}>
                        <td className="agent-name" data-label="Agent Name">
                          {agent.first_name} {agent.last_name}
                        </td>
                        <td data-label="Email">{agent.email}</td>
                        <td data-label="Agency">{agent.agency_name || 'N/A'}</td>
                        <td data-label="PRC License">{agent.prc_license_number || 'N/A'}</td>
                        <td data-label="Status">
                          <span className={`status-indicator ${agent.status}`}>
                            <span className="status-dot"></span>
                            <span className="status-text">
                              {agent.status === 'pending' ? 'Pending' : 
                               agent.status === 'approved' ? 'Approved' :
                               agent.status === 'rejected' ? 'Rejected' :
                               agent.status === 'active' ? 'Active' : 
                               agent.status === 'inactive' ? 'Inactive' : agent.status}
                            </span>
                          </span>
                        </td>
                        <td className="date-joined" data-label="Date Joined">
                          {new Date(agent.created_at).toLocaleDateString()}
                        </td>
                        <td data-label="Actions">
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleViewDetails(agent.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB' }}
                              title="View Details"
                            >
                              <FiEye />
                            </button>
                            {agent.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedAgent(agent)
                                    setShowApproveModal(true)
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981' }}
                                  title="Approve"
                                >
                                  <FiCheck />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAgent(agent)
                                    setShowRejectModal(true)
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                                  title="Reject"
                                >
                                  <FiX />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Agent Details</h2>
              <button onClick={() => { setShowDetailsModal(false); setSelectedAgent(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FiX />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><strong>Name:</strong> {selectedAgent.first_name} {selectedAgent.last_name}</div>
              <div><strong>Email:</strong> {selectedAgent.email}</div>
              <div><strong>Phone:</strong> {selectedAgent.phone || 'N/A'}</div>
              <div><strong>Agency:</strong> {selectedAgent.agency_name || 'N/A'}</div>
              <div><strong>PRC License:</strong> {selectedAgent.prc_license_number || 'N/A'}</div>
              <div><strong>License Type:</strong> {selectedAgent.license_type || 'N/A'}</div>
              <div><strong>Status:</strong> {selectedAgent.status}</div>
              <div><strong>Verified:</strong> {selectedAgent.verified ? 'Yes' : 'No'}</div>
              {selectedAgent.latest_approval && (
                <div>
                  <strong>Last Action:</strong> {selectedAgent.latest_approval.action}
                  {selectedAgent.latest_approval.notes && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#F3F4F6', borderRadius: '4px' }}>
                      <strong>Notes:</strong> {selectedAgent.latest_approval.notes}
                    </div>
                  )}
                  {selectedAgent.latest_approval.approved_by && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Approved by:</strong> {selectedAgent.latest_approval.approved_by.first_name} {selectedAgent.latest_approval.approved_by.last_name}
                    </div>
                  )}
                </div>
              )}
              {selectedAgent.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setShowApproveModal(true)
                    }}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <FiCheck style={{ marginRight: '0.5rem' }} />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      setShowRejectModal(true)
                    }}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <FiX style={{ marginRight: '0.5rem' }} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2>Approve Agent</h2>
            <p>Are you sure you want to approve {selectedAgent.first_name} {selectedAgent.last_name}?</p>
            <div style={{ marginTop: '1rem' }}>
              <label>Notes (optional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', minHeight: '100px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => { setShowApproveModal(false); setApprovalNotes(''); }} style={{ padding: '0.5rem 1rem' }}>
                Cancel
              </button>
              <button onClick={handleApprove} style={{ padding: '0.5rem 1rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px' }}>
                <FiCheck style={{ marginRight: '0.5rem' }} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2>Reject Agent</h2>
            <p>Are you sure you want to reject {selectedAgent.first_name} {selectedAgent.last_name}?</p>
            <div style={{ marginTop: '1rem' }}>
              <label>Reason for rejection *</label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                required
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', minHeight: '100px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => { setShowRejectModal(false); setRejectionNotes(''); }} style={{ padding: '0.5rem 1rem' }}>
                Cancel
              </button>
              <button onClick={handleReject} style={{ padding: '0.5rem 1rem', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '4px' }}>
                <FiX style={{ marginRight: '0.5rem' }} />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
