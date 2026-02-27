'use client'

import { useState } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import DashboardHeader from '../../../components/common/DashboardHeader'

interface Property {
  id: string
  propertyId: string
  propertyName: string
  type: string
  location: string
  status: 'published' | 'draft' | 'occupied' | 'under-review'
  dateCreated: string
}

export default function PropertiesPage() {
  const [filter, setFilter] = useState('all')

  const properties: Property[] = [
    {
      id: '1',
      propertyId: 'PROP-502',
      propertyName: 'Skyline Studio',
      type: 'Condominium',
      location: 'Barangay Bel-Air',
      status: 'published',
      dateCreated: '12-8-2025'
    },
    {
      id: '2',
      propertyId: 'PROP-512',
      propertyName: 'Highrise Complex',
      type: 'Condominium',
      location: 'Barangay Guadalupe',
      status: 'draft',
      dateCreated: '11-4-2025'
    },
    {
      id: '3',
      propertyId: 'PROP-546',
      propertyName: 'Reach Front',
      type: 'Apartment',
      location: 'Barangay Batasan',
      status: 'occupied',
      dateCreated: '10-27-2025'
    },
    {
      id: '4',
      propertyId: 'PROP-509',
      propertyName: 'Between Edges Co.',
      type: 'Condominium',
      location: 'Barangay Lahug',
      status: 'under-review',
      dateCreated: '8-19-2025'
    }
  ]

  const filteredProperties = properties

  const getStatusDisplay = (status: string) => {
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

  const getStatusStyles = (status: string) => {
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

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />

      <main className="ml-[280px] flex-1 w-[calc(100%-280px)] p-8 min-h-screen lg:ml-[240px] lg:w-[calc(100%-240px)] lg:p-6 md:ml-0 md:w-full md:p-4 md:pt-15 transition-[margin,width] duration-200">
        <DashboardHeader
          title="Property Management"
          subtitle="Manage properties and listings"
          showNotifications={true}
        />

        <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">Properties</h2>
            <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-100 rounded-lg">
              {[
                { value: 'all', label: 'All (23)' },
                { value: 'newest', label: 'Newest (12)' },
                { value: 'oldest', label: 'Oldest (67)' }
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
                    <td className="px-6 py-4 font-medium text-gray-900">{property.propertyId}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{property.propertyName}</td>
                    <td className="px-6 py-4 text-gray-600">{property.type}</td>
                    <td className="px-6 py-4 text-gray-600">{property.location}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyles(property.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {getStatusDisplay(property.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{property.dateCreated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
