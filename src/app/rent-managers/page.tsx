"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import PopularRentManagers from '../../components/rent-managers/PopularRentManagers'
import { RentManagerCardSkeleton } from '../../components/common/RentManagerCardSkeleton'
import { agentsApi, propertiesApi } from '../../api'
import { getApiBaseUrl } from '../../config/api'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import type { Property } from '../../types'

// Helper function to get agent image URL using the resolver
const getAgentImageUrl = (imagePath: string | null | undefined, agentId?: number): string => {
  return resolveAgentAvatar(imagePath, agentId)
}

const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

interface RentManagerInfo {
  id: number
  name: string
  role: string
  location: string
  listings: number
  email: string
  phone?: string
  image?: string | null
}

export default function RentManagersPage() {
  const router = useRouter()
  const [managers, setManagers] = useState<RentManagerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedLicense, setSelectedLicense] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const searchParams = useSearchParams()

  const features = [
    { id: 1, icon: '/assets/icons/secure.svg', alt: 'secure', title: 'Property Management', description: 'Expert handling of property listings, maintenance coordination, and tenant relations.' },
    { id: 2, icon: '/assets/icons/support.svg', alt: 'support', title: 'Tenant Screening', description: 'Thorough background checks and verification to ensure reliable tenants.' },
    { id: 3, icon: '/assets/icons/listing.svg', alt: 'listing', title: 'Professional Service', description: 'Licensed and verified managers committed to quality service.' },
    { id: 4, icon: '/assets/icons/insight.svg', alt: 'insight', title: 'Legal Compliance', description: 'Ensuring all rental agreements meet legal requirements and standards.' },
  ]

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        
        // Fetch agents and properties in parallel
        const [agents, allPropertiesResponse] = await Promise.all([
          agentsApi.getAll(),
          propertiesApi.getAll()
        ])
        
        if (!mounted) return
        
        // Handle both array and paginated response for properties
        const allProperties: Property[] = Array.isArray(allPropertiesResponse)
          ? allPropertiesResponse
          : (allPropertiesResponse as any)?.data || []
        
        // Count properties per agent
        const propertiesCountByAgent: { [key: number]: number } = {}
        allProperties.forEach((property) => {
          // Check agent_id field
          const agentId = (property as any).agent_id || property.agent?.id
          if (agentId) {
            propertiesCountByAgent[agentId] = (propertiesCountByAgent[agentId] || 0) + 1
          }
        })
        
        const mapped = agents.map((a) => {
          const name = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email
          const location = [a.city, a.state].filter(Boolean).join(', ')
          return {
            id: a.id,
            name,
            role: a.license_type || a.agency_name || 'Rent Manager',
            location: location || 'Unknown',
            listings: propertiesCountByAgent[a.id] || 0,
            email: a.email,
            phone: a.phone || undefined,
            image: a.profile_image || a.image || a.avatar || a.image_path || null,
          } as RentManagerInfo
        })
        setManagers(mapped)
      } catch (err) {
        console.error('Failed to load managers', err)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Sync URL params (from PopularRentManagers links) into filter state
  useEffect(() => {
    const location = searchParams.get('location')
    const license = searchParams.get('license')
    if (location) setSelectedProvince(location)
    if (license) setSelectedLicense(license)
  }, [searchParams])

  const uniqueLocations = Array.from(new Set(managers.map((m) => m.location))).filter(Boolean)

  const filteredManagers = managers.filter((m) => {
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      const inText = `${m.name} ${m.role} ${m.location} ${m.email}`.toLowerCase()
      if (!inText.includes(q)) return false
    }
    if (selectedProvince && !m.location.toLowerCase().includes(selectedProvince.toLowerCase())) return false
    if (selectedCity && !m.location.toLowerCase().includes(selectedCity.toLowerCase())) return false
    if (selectedLicense && !m.role.toLowerCase().includes(selectedLicense.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen overflow-x-hidden overflow-y-visible" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative mt-16 sm:mt-20 pt-8 sm:pt-16 pb-8 sm:pb-16 px-4 sm:px-6 md:px-10 lg:px-[150px] overflow-x-visible min-h-[400px] sm:min-h-[550px]" style={{ background: 'linear-gradient(to right, #205ED7 0%, #FE8E0A 100%)', overflowY: 'visible' }}>
  <div className="mx-auto relative flex items-center max-w-full overflow-visible" style={{ minHeight: '300px', overflow: 'visible' }}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch w-full overflow-visible">

      {/* Left Column - Description */}
      <div className="order-2 lg:order-1 text-lg sm:text-xl md:text-2xl max-w-[650px]">
        <h1 className="font-bold text-white mb-4 sm:mb-6 leading-tight text-left text-2xl sm:text-3xl md:text-4xl">
          What are Rent Managers?
        </h1>
        <p className="text-white leading-relaxed text-base sm:text-lg md:text-xl font-light text-justify">
          Rent Managers are trusted professionals who help property owners manage their
          rental properties and assist tenants in finding their perfect home. They handle
          everything from property listings to tenant screening, making the rental process
          smooth and stress-free for everyone involved.
        </p>
      </div>

      {/* Right Column - Person Image */}
      <div className="relative order-1 lg:order-2 lg:col-span-2 flex justify-center lg:justify-end" style={{ overflow: 'visible', minHeight: '0', position: 'relative' }}>
        <img
          className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[610px] -mt-100 w-auto object-contain object-bottom absolute z-[5]"
          src="/assets/images/agents/hero-person.png"
          alt="Rent Manager"
          style={{ 
            maxWidth: 'clamp(200px, 50vw, 500px)',
            right: 'clamp(-50px, 10vw, 200px)',
            top: 'clamp(-373px, -30vw, -400px)',
            position: 'absolute'
          }}
        />
      </div>

    </div>
  </div>
</section>

      {/* Feature Cards Row - Overlapping hero */}
      <div className=" mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px] relative" style={{ marginTop: '-160px', zIndex: 10, paddingTop: '20px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="bg-white p-4 sm:p-6"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '3px solid  rgb(29, 78, 216)'
              }}
            >
              <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                  <img 
                    src={feature.icon} 
                    alt={feature.alt} 
                    className="w-10 h-10 sm:w-12 sm:h-12" 
                    style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(2598%) hue-rotate(210deg) brightness(95%) contrast(92%)' }} 
                  />
                </div>
                <div 
                  className="font-bold"
                  style={{ 
                    fontSize: 'clamp(16px, 4vw, 22px)',
                    color: '#2563EB'
                  }}
                >
                  {feature.title}
                </div>
                <div 
                  className="text-center"
                  style={{ 
                    fontSize: 'clamp(14px, 3.5vw, 18px)',
                    color: '#374151',
                    lineHeight: '1.5'
                  }}
                >
                  {feature.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Rent Manager Searches - agent-focused (similar to PopularSearches) */}
   

      {/* Search and Filter Row - Full Width */}
      <div className="top-search-bar-container sticky top-0 z-40 bg-white mt-6 sm:mt-10 border-b border-gray-200 py-3 sm:py-5 px-4 sm:px-6 md:px-10 lg:px-[150px] mb-6 sm:mb-8 shadow-md">
        <div className=" mx-auto">
          <div className="top-search-bar flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
              <div className="search-input-container flex-1 w-full sm:min-w-[200px] relative">
                <svg 
                  className="search-icon absolute left-3 sm:left-4 top-3 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 pointer-events-none" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  className="main-search-input w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="top-search-bar-controls flex flex-wrap items-center gap-2 sm:gap-3">
                <select
                  className="sort-dropdown-btn px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none min-w-0"
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                >
                  <option value="">Province</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <select
                  className="sort-dropdown-btn px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none min-w-0"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="">City</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <button
                  className={`hamburger-menu-btn px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="List View"
                  onClick={() => setViewMode('list')}
                >
                  <span className="hidden sm:inline">List view</span>
                  <span className="sm:hidden">List</span>
                </button>
                <button
                  className={`grid-view-btn px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="Grid View"
                  onClick={() => setViewMode('grid')}
                >
                  <span className="hidden sm:inline">Grid view</span>
                  <span className="sm:hidden">Grid</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Find a Rent Manager Section */}
      <main className="px-4 sm:px-6 md:px-10 lg:px-[150px]" style={{ paddingTop: '0px', paddingBottom: '40px' }}>
        <section className="mx-auto">
          <h2 
            className="font-bold mb-6 sm:mb-8 px-2 sm:px-0"
            style={{ 
              fontSize: 'clamp(18px, 4vw, 22px)',
              color: '#1A3DBF',
              textTransform: 'uppercase',
              textAlign: 'left',
              letterSpacing: '0.05em'
            }}
          >
            FIND A RENT MANAGERS
          </h2>

          {/* Manager Cards Grid */}
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'flex flex-col gap-4'}>
              {Array.from({ length: viewMode === 'grid' ? 9 : 4 }).map((_, i) => (
                <RentManagerCardSkeleton key={i} variant={viewMode === 'grid' ? 'grid' : 'list'} />
              ))}
            </div>
          ) : filteredManagers.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'flex flex-col gap-4'}>
              {filteredManagers.map((manager) => (
                <div
                  key={manager.id}
                  className="bg-white overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                  style={{
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/rent-managers/${manager.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/rent-managers/${manager.id}`)
                    }
                  }}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Card image - fixed aspect so container has height */}
                      <div className="w-full pt-0 pb-4">
                        <div 
                          className="relative overflow-hidden flex-shrink-0 w-full aspect-[4/3] rounded-t-2xl"
                          style={{
                            backgroundColor: '#2563EB'
                          }}
                        >
                          <img 
                            src={getAgentImageUrl(manager.image, manager.id)} 
                            alt={manager.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <div 
                            className="absolute inset-0 flex items-center justify-center text-white font-bold"
                            style={{ 
                              display: manager.image ? 'none' : 'flex',
                              fontSize: 'clamp(20px, 5vw, 28px)'
                            }}
                          >
                            <span>{getInitials(manager.name)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Body */}
                      <div className="px-3 sm:px-8 pb-3 sm:pb-4">
                        {/* Name Row with Listing Count */}
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <h3 
                            className="font-bold truncate flex-1"
                            style={{ 
                              fontSize: 'clamp(14px, 3.5vw, 18px)',
                              color: '#374151'
                            }}
                          >
                            {manager.name}
                          </h3>
                          <span 
                            className="font-medium flex-shrink-0 ml-2"
                            style={{ 
                              fontSize: 'clamp(11px, 2.5vw, 14px)',
                              color: '#2563EB'
                            }}
                          >
                            {manager.listings} Listings
                          </span>
                        </div>
                        
                        {/* Rent Manager Label */}
                        <p 
                          className="mb-3 sm:mb-4"
                          style={{ 
                            fontSize: 'clamp(11px, 2.5vw, 13px)',
                            color: '#2563EB'
                          }}
                        >
                          {manager.role}
                        </p>
                        
                        {/* Divider */}
                        <div className="border-t mb-3 sm:mb-4" style={{ borderColor: '#E5E7EB' }} />
                        
                        {/* Contact Info */}
                        <div className="flex flex-col gap-2 mb-3 sm:mb-4">
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px] flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 3C2 2.45 2.45 2 3 2H13C13.55 2 14 2.45 14 3V13C14 13.55 13.55 14 13 14H3C2.45 14 2 13.55 2 13V3ZM3 3V13H13V3H3Z" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
                              <path d="M3 4L8 8L13 4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span 
                              className="truncate text-xs sm:text-sm"
                              style={{ 
                                color: '#374151'
                              }}
                            >
                              {manager.email}
                            </span>
                          </div>
                          {manager.phone && (
                            <div className="flex items-center gap-2">
                              <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px] flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.5 2C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H12.5C13.33 14 14 13.33 14 12.5V3.5C14 2.67 13.33 2 12.5 2H3.5ZM3.5 3H12.5C12.78 3 13 3.22 13 3.5V12.5C13 12.78 12.78 13 12.5 13H3.5C3.22 13 3 12.78 3 12.5V3.5C3 3.22 3.22 3 3.5 3Z" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
                                <path d="M6 5H10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M6 7H12" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              <span 
                                className="truncate text-xs sm:text-sm"
                                style={{ 
                                  color: '#374151'
                                }}
                              >
                                {manager.phone}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* CTA Button */}
                        <button
                          className="w-full text-white font-bold flex items-center justify-center gap-2 transition-colors duration-200"
                          style={{
                            backgroundColor: '#1D4ED8',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: 'clamp(12px, 3vw, 14px)'
                          }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/rent-managers/${manager.id}`)
                          }}
                        >
                          <span className="hidden sm:inline">View My Listing</span>
                          <span className="sm:hidden">View Listing</span>
                          <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-48 flex-shrink-0">
                          <div className="relative w-full aspect-square overflow-hidden">
                            <img 
                              src={getAgentImageUrl(manager.image, manager.id)} 
                              alt={manager.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            <div 
                              className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white text-2xl sm:text-4xl font-bold"
                              style={{ display: manager.image ? 'none' : 'flex' }}
                            >
                              <span>{getInitials(manager.name)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 
                                className="font-bold truncate mb-1"
                                style={{ 
                                  fontSize: 'clamp(16px, 4vw, 18px)',
                                  color: '#374151'
                                }}
                              >
                                {manager.name}
                              </h3>
                              <p 
                                style={{ 
                                  fontSize: 'clamp(11px, 2.5vw, 13px)',
                                  color: '#2563EB'
                                }}
                              >
                                {manager.role}
                              </p>
                            </div>
                            <span 
                              className="font-medium flex-shrink-0"
                              style={{ 
                                fontSize: 'clamp(12px, 3vw, 14px)',
                                color: '#2563EB'
                              }}
                            >
                              {manager.listings} Listings
                            </span>
                          </div>
                          <div className="border-t mb-3 sm:mb-4" style={{ borderColor: '#E5E7EB' }} />
                          <div className="flex flex-col gap-2 sm:gap-3">
                            <div className="flex items-center gap-2">
                              <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px] flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 3C2 2.45 2.45 2 3 2H13C13.55 2 14 2.45 14 3V13C14 13.55 13.55 14 13 14H3C2.45 14 2 13.55 2 13V3ZM3 3V13H13V3H3Z" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
                                <path d="M3 4L8 8L13 4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span 
                                className="truncate text-xs sm:text-sm"
                                style={{ 
                                  color: '#374151'
                                }}
                              >
                                {manager.email}
                              </span>
                            </div>
                            {manager.phone && (
                              <div className="flex items-center gap-2">
                                <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px] flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3.5 2C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H12.5C13.33 14 14 13.33 14 12.5V3.5C14 2.67 13.33 2 12.5 2H3.5ZM3.5 3H12.5C12.78 3 13 3.22 13 3.5V12.5C13 12.78 12.78 13 12.5 13H3.5C3.22 13 3 12.78 3 12.5V3.5C3 3.22 3.22 3 3.5 3Z" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
                                  <path d="M6 5H10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                                  <path d="M6 7H12" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span 
                                  className="truncate text-xs sm:text-sm"
                                  style={{ 
                                    color: '#374151'
                                  }}
                                >
                                  {manager.phone}
                                </span>
                              </div>
                            )}
                            <div className="mt-2">
                              <Link
                                href={`/rent-managers/${manager.id}`}
                                className="inline-flex items-center gap-2 font-medium transition-colors duration-200"
                                style={{
                                  color: '#2563EB',
                                  fontSize: 'clamp(12px, 3vw, 14px)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="hidden sm:inline">View My Listing</span>
                                <span className="sm:hidden">View Listing</span>
                                <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No rent managers found matching your criteria.</p>
            </div>
          )}
        </section>
      </main>
      <PopularRentManagers />
      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 md:px-10 lg:px-[150px] overflow-hidden" style={{ minHeight: '300px' }}>
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img 
            src="/assets/backgrounds/rent-managers-bg.png" 
            alt="Buildings" 
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: 'center bottom' }}
          />
        </div>
        
        {/* Dark Blue Overlay */}
        <div 
          className="absolute inset-0 w-full h-full z-[1]"
          style={{ 
            background: 'rgba(0, 0, 0, 0.55)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center justify-center px-4" style={{ minHeight: '300px' }}>
          <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 leading-tight">
            Become a Rental Manager here!
          </h2>
          <p className="text-white text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl">
            Join us together with the most trusted managers to help people find their perfect home.
          </p>
          <button  style={{ background: "rgba(32, 94, 215, 0.9)" }}  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-white font-outfit text-base font-semibold rounded-full transition-all hover:bg-rental-orange-600 hover:gap-4 w-fit">
            <span>Join now</span>
            <span className="transition-transform items-center justify-center flex">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
