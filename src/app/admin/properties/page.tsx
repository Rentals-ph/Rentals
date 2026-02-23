'use client'

import { useState, useEffect } from 'react'
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

  return (
    <div className="admin-dashboard">
      <AppSidebar />

      <main className="admin-main">
        <DashboardHeader
          title="Dashboard Overview"
          subtitle="Welcome back, Admin"
          showNotifications={true}
        />

        <div className="properties-section">
          <h2 className="properties-title">Properties</h2>
          
          <div className="properties-filters">
            <label className="filter-option">
              <input 
                type="radio" 
                name="propertyFilter" 
                value="all" 
                checked={filter === 'all'}
                onChange={(e) => setFilter(e.target.value)}
              />
              <span>All(23)</span>
            </label>
            <label className="filter-option">
              <input 
                type="radio" 
                name="propertyFilter" 
                value="newest" 
                checked={filter === 'newest'}
                onChange={(e) => setFilter(e.target.value)}
              />
              <span>Newest(12)</span>
            </label>
            <label className="filter-option">
              <input 
                type="radio" 
                name="propertyFilter" 
                value="oldest" 
                checked={filter === 'oldest'}
                onChange={(e) => setFilter(e.target.value)}
              />
              <span>Oldest(67)</span>
            </label>
          </div>

          <div className="properties-table-container">
            <table className="properties-table">
              <thead>
                <tr>
                  <th>Property ID</th>
                  <th>Property Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Date Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr key={property.id}>
                    <td className="property-id" data-label="Property ID">{property.propertyId}</td>
                    <td className="property-name" data-label="Property Name">{property.propertyName}</td>
                    <td className="property-type" data-label="Type">{property.type}</td>
                    <td className="property-location" data-label="Location">{property.location}</td>
                    <td data-label="Status">
                      <span className={`property-status-indicator ${property.status}`}>
                        <span className="property-status-dot"></span>
                        <span className="property-status-text">
                          {getStatusDisplay(property.status)}
                        </span>
                      </span>
                    </td>
                    <td className="property-date" data-label="Date Created">{property.dateCreated}</td>
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

