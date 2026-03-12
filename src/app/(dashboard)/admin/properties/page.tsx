'use client'

import { useState, useEffect } from 'react'
import DashboardHeader from '@/components/common/dashboard/DashboardHeader'
import api from '@/lib/api'

interface Property {
  id: number
  slug?: string
  title: string
  property_type?: string
  location?: string
  city?: string
  barangay?: string
  status?: string
  draft_status?: string
  created_at: string
}

export default function PropertiesPage() {
  const [filter, setFilter] = useState('all')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperties()
  }, [filter])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await api.get('/properties')
      if (response.success && response.data) {
        setProperties(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = properties.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'published') return p.draft_status === 'published' || p.status === 'published'
    if (filter === 'draft') return p.draft_status === 'draft' || p.status === 'draft'
    return true
  })

  const getStatusDisplay = (property: Property) => {
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

  const getStatusStyles = (property: Property) => {
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

  const getLocationDisplay = (property: Property) => {
    if (property.location) return property.location
    const parts = [property.barangay, property.city].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'N/A'
  }

  return (
    <>
      <DashboardHeader
        title="Property Management"
        subtitle="Manage properties and listings"
        showNotifications={false}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Properties</h2>
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
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{property.id}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{property.title}</td>
                    <td className="px-6 py-4 text-gray-600">{property.property_type || 'N/A'}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
