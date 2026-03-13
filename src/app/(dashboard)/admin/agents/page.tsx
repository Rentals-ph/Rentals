'use client'

import { useState, useEffect } from 'react'
import { AppSidebar, DashboardHeader } from '@/components/common'
import { adminApi, type AdminAgent, type CreateAgentData, type UpdateAgentData } from '@/api'
import { toast } from '@/utils/toast'
import { FiRefreshCw, FiEye, FiX, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'

export default function AgentsPage() {
  const [filter, setFilter] = useState('all')
  const [agents, setAgents] = useState<AdminAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AdminAgent | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreateAgentData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    status: 'pending',
    is_active: true,
  })

  useEffect(() => {
    fetchAgents()
  }, [filter])

  const fetchAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const status = filter !== 'all' ? filter : undefined
      const data = await adminApi.getAgents(status)
      setAgents(data)
    } catch (err) {
      setError('An error occurred while fetching agents')
      console.error(err)
      toast.error('Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (agentId: number) => {
    try {
      const agent = await adminApi.getAgent(agentId)
      setSelectedAgent(agent)
      setShowDetailsModal(true)
    } catch (err) {
      toast.error('Failed to fetch agent details')
      console.error(err)
    }
  }

  const handleCreate = () => {
    setIsEditing(false)
    setSelectedAgent(null)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone: '',
      status: 'pending',
      is_active: true,
    })
    setShowFormModal(true)
  }

  const handleEdit = (agent: AdminAgent) => {
    setIsEditing(true)
    setSelectedAgent(agent)
    setFormData({
      first_name: agent.first_name || '',
      last_name: agent.last_name || '',
      email: agent.email || '',
      password: '', // Don't pre-fill password
      phone: agent.phone || '',
      status: agent.status as any,
      is_active: true,
    })
    setShowFormModal(true)
  }

  const handleDelete = async (agentId: number) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }

    try {
      await adminApi.deleteAgent(agentId)
      toast.success('Agent deleted successfully')
      fetchAgents()
    } catch (err) {
      toast.error('Failed to delete agent')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing && selectedAgent) {
        const updateData: UpdateAgentData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          is_active: formData.is_active,
        }
        if (formData.password) {
          updateData.password = formData.password
        }
        await adminApi.updateAgent(selectedAgent.id, updateData)
        toast.success('Agent updated successfully')
      } else {
        await adminApi.createAgent(formData)
        toast.success('Agent created successfully')
      }
      setShowFormModal(false)
      setSelectedAgent(null)
      fetchAgents()
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to save agent'
      toast.error(errorMessage)
      console.error(err)
    } finally {
      setSaving(false)
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
    <>
      <DashboardHeader
        title="Agent Management"
        subtitle="Create, view, edit, and manage agents"
        showNotifications={false}
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
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add Agent
            </button>
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
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <th key={i} className="px-6 py-4 text-left">
                      <span className="block h-4 w-24 rounded bg-gray-200 animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 8 }).map((_, j) => (
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(agent.id)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(agent)}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(agent.id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showFormModal && (
        <div className={modalBackdrop} onClick={() => { setShowFormModal(false); setSelectedAgent(null); }}>
          <div className={`${modalPanel} p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Agent' : 'Create New Agent'}
              </h2>
              <button
                onClick={() => { setShowFormModal(false); setSelectedAgent(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {isEditing ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Agent' : 'Create Agent'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFormModal(false); setSelectedAgent(null); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </>
  )
}
