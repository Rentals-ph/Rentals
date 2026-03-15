'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/features/dashboard'
import { adminApi, type AdminProperty, type CreatePropertyData, type UpdatePropertyData } from '@/api'
import { agentsApi, type Agent } from '@/api'
import { toast } from '@/shared/utils/toast'
import { FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'

export default function PropertiesPage() {
  const [filter, setFilter] = useState('all')
  const [properties, setProperties] = useState<AdminProperty[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreatePropertyData>({
    title: '',
    description: '',
    type: '',
    listing_type: 'for_rent',
    price: undefined,
    price_type: 'monthly',
    bedrooms: undefined,
    bathrooms: undefined,
    garage: undefined,
    area: undefined,
    lot_area: undefined,
    city: '',
    state_province: '',
    street_address: '',
    agent_id: undefined,
    status: 'available',
    draft_status: 'draft',
    is_featured: false,
  })

  useEffect(() => {
    fetchProperties()
    fetchAgents()
  }, [filter])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filter === 'published') {
        params.draft_status = 'published'
      } else if (filter === 'draft') {
        params.draft_status = 'draft'
      }
      const data = await adminApi.getProperties(params)
      setProperties(data)
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast.error('Failed to fetch properties')
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const data = await agentsApi.getAll()
      setAgents(data)
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const handleCreate = () => {
    setIsEditing(false)
    setSelectedProperty(null)
    setFormData({
      title: '',
      description: '',
      type: '',
      listing_type: 'for_rent',
      price: undefined,
      price_type: 'monthly',
      bedrooms: undefined,
      bathrooms: undefined,
      garage: undefined,
      area: undefined,
      lot_area: undefined,
      city: '',
      state_province: '',
      street_address: '',
      agent_id: undefined,
      status: 'available',
      draft_status: 'draft',
      is_featured: false,
    })
    setShowFormModal(true)
  }

  const handleEdit = (property: AdminProperty) => {
    setIsEditing(true)
    setSelectedProperty(property)
    setFormData({
      title: property.title || '',
      description: property.description || '',
      type: property.type || '',
      listing_type: (property.listing_type as any) || 'for_rent',
      price: property.price,
      price_type: (property.price_type as any) || 'monthly',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      garage: property.garage,
      area: property.area,
      lot_area: property.lot_area,
      city: property.city || '',
      state_province: property.state_province || '',
      street_address: property.street_address || '',
      agent_id: property.agent_id,
      status: (property.status as any) || 'available',
      draft_status: (property.draft_status as any) || 'draft',
      is_featured: property.is_featured || false,
    })
    setShowFormModal(true)
  }

  const handleDelete = async (propertyId: number) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      await adminApi.deleteProperty(propertyId)
      toast.success('Property deleted successfully')
      fetchProperties()
    } catch (err) {
      toast.error('Failed to delete property')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing && selectedProperty) {
        const identifier = selectedProperty.slug || selectedProperty.id
        await adminApi.updateProperty(identifier, formData)
        toast.success('Property updated successfully')
      } else {
        await adminApi.createProperty(formData)
        toast.success('Property created successfully')
      }
      setShowFormModal(false)
      setSelectedProperty(null)
      fetchProperties()
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to save property'
      toast.error(errorMessage)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const getStatusDisplay = (property: AdminProperty) => {
    const status = property.draft_status || property.status || 'draft'
    switch (status) {
      case 'published':
        return 'Published'
      case 'draft':
        return 'Draft'
      case 'occupied':
        return 'Occupied'
      case 'under-review':
        return 'Under Review'
      default:
        return status
    }
  }

  const getStatusStyles = (property: AdminProperty) => {
    const status = property.draft_status || property.status || 'draft'
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'under-review':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLocationDisplay = (property: AdminProperty) => {
    if (property.street_address) return property.street_address
    const parts = [property.city, property.state_province].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'N/A'
  }

  const modalBackdrop = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]'
  const modalPanel = 'bg-white rounded-xl shadow-xl w-[90%] max-w-2xl max-h-[90vh] overflow-auto'

  return (
    <>
      <DashboardHeader
        title="Property Management"
        subtitle="Create, view, edit, and manage properties"
        showNotifications={false}
      />

      <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Properties</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add Property
            </button>
            <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-100 rounded-lg">
              {[
                { value: 'all', label: `All (${properties.length})` },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' }
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-gray-900"
                >
                  <input
                    type="radio"
                    name="propertyFilter"
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
              onClick={() => fetchProperties()}
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
            <div className="p-12 text-center text-gray-500">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No properties found</div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Property ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{property.id}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{property.title}</td>
                    <td className="px-6 py-4 text-gray-600">{property.type || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{getLocationDisplay(property)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyles(property)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {getStatusDisplay(property)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(property.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(property)}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showFormModal && (
        <div className={modalBackdrop} onClick={() => { setShowFormModal(false); setSelectedProperty(null); }}>
          <div className={`${modalPanel} p-6`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Property' : 'Create New Property'}
              </h2>
              <button
                onClick={() => { setShowFormModal(false); setSelectedProperty(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Apartment, House"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                  <select
                    value={formData.listing_type}
                    onChange={(e) => setFormData({ ...formData, listing_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="for_rent">For Rent</option>
                    <option value="for_sale">For Sale</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                  <select
                    value={formData.price_type}
                    onChange={(e) => setFormData({ ...formData, price_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="per_sqm">Per SQM</option>
                    <option value="total">Total</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bedrooms || ''}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bathrooms || ''}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garage</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.garage || ''}
                    onChange={(e) => setFormData({ ...formData, garage: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area || ''}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lot Area (sqm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.lot_area || ''}
                    onChange={(e) => setFormData({ ...formData, lot_area: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                <input
                  type="text"
                  value={formData.state_province}
                  onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                <select
                  value={formData.agent_id || ''}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="under_negotiation">Under Negotiation</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Draft Status</label>
                  <select
                    value={formData.draft_status}
                    onChange={(e) => setFormData({ ...formData, draft_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">Featured</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : isEditing ? 'Update Property' : 'Create Property'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFormModal(false); setSelectedProperty(null); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
