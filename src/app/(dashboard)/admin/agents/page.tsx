'use client'

import { useState, useEffect } from 'react'
import { AppSidebar, DashboardHeader } from '@/components/common'
import api from '@/lib/api'
import { FiRefreshCw, FiEye, FiX } from 'react-icons/fi'

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
  company?: { id: number; name: string }
}

export default function AgentsPage() {
  const [filter, setFilter] = useState('all')
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  useEffect(() => {
    fetchAgents()
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'approved':
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'rejected':
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'approved': return 'Approved'
      case 'rejected': return 'Rejected'
      case 'active': return 'Active'
      case 'inactive': return 'Inactive'
      default: return status
    }
  }

  const filteredAgents = agents.filter((a) => filter === 'all' || a.status === filter)
  const modalBackdrop = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
  const modalPanel = 'bg-white rounded-xl shadow-xl w-[90%] max-w-lg max-h-[90vh] overflow-auto'

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />

      <main className="ml-[280px] flex-1 w-[calc(100%-280px)] p-8 min-h-screen lg:ml-[240px] lg:w-[calc(100%-240px)] lg:p-6 md:ml-0 md:w-full md:p-4 md:pt-15 transition-[margin,width] duration-200">
        <DashboardHeader
          title="User Management"
          subtitle="View and manage agents (agents are created by brokers)"
          showNotifications={true}
        />

        {error && (
          <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
              aria-label="Dismiss"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Agents</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-100 rounded-lg">
                {[
                  { value: 'all', label: `All (${agents.length})` },
                  { value: 'approved', label: 'Approved' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'rejected', label: 'Rejected' }
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-gray-900"
                  >
                    <input
                      type="radio"
                      name="filter"
                      value={value}
                      checked={filter === value}
                      onChange={(e) => setFilter(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => fetchAgents()}
                title="Refresh"
                disabled={loading}
                className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <th key={i} className="px-6 py-4 text-left">
                        <span className="block h-4 w-24 rounded bg-gray-200 animate-pulse" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <span className="block h-4 rounded bg-gray-100 animate-pulse max-w-[80%]" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agency</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PRC License</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No agents found
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((agent) => (
                      <tr key={agent.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {agent.first_name} {agent.last_name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{agent.email}</td>
                        <td className="px-6 py-4 text-gray-600">{agent.agency_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{agent.prc_license_number || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyles(agent.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            {getStatusLabel(agent.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(agent.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(agent.id)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedAgent && (
        <div className={modalBackdrop} onClick={() => { setShowDetailsModal(false); setSelectedAgent(null); }}>
          <div className={`${modalPanel} p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Agent Details</h2>
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedAgent(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold text-gray-700">Name:</span> {selectedAgent.first_name} {selectedAgent.last_name}</div>
              <div><span className="font-semibold text-gray-700">Email:</span> {selectedAgent.email}</div>
              <div><span className="font-semibold text-gray-700">Phone:</span> {selectedAgent.phone || 'N/A'}</div>
              <div><span className="font-semibold text-gray-700">Agency:</span> {selectedAgent.agency_name || 'N/A'}</div>
              <div><span className="font-semibold text-gray-700">Company:</span> {selectedAgent.company?.name || 'N/A'}</div>
              <div><span className="font-semibold text-gray-700">PRC License:</span> {selectedAgent.prc_license_number || 'N/A'}</div>
              <div><span className="font-semibold text-gray-700">License Type:</span> {selectedAgent.license_type || 'N/A'}</div>
              <div><span className="font-semibold text-gray-700">Status:</span> {selectedAgent.status}</div>
              <div><span className="font-semibold text-gray-700">Verified:</span> {selectedAgent.verified ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
