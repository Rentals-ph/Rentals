"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import PopularRentManagers from '@/components/rent-managers/PopularRentManagers'
import { RentManagerCardSkeleton } from '@/components/common/RentManagerCardSkeleton'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { agentsApi, propertiesApi } from '@/api'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import type { Property } from '@/types'

const getAgentImageUrl = (imagePath: string | null | undefined, agentId?: number): string => {
  return resolveAgentAvatar(imagePath, agentId)
}

const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

interface AgentInfo {
  id: number
  name: string
  role: string
  location: string
  listings: number
  email: string
  phone?: string
  image?: string | null
}

export default function AgentsPage() {
  const router = useRouter()
  const [managers, setManagers] = useState<AgentInfo[]>([])
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
        const [agents, allPropertiesResponse] = await Promise.all([
          agentsApi.getAll(),
          propertiesApi.getAll()
        ])
        if (!mounted) return
        const allProperties: Property[] = Array.isArray(allPropertiesResponse)
          ? allPropertiesResponse
          : (allPropertiesResponse as any)?.data || []
        const propertiesCountByAgent: { [key: number]: number } = {}
        allProperties.forEach((property) => {
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
            role: a.license_type || a.agency_name || 'Agent',
            location: location || 'Unknown',
            listings: propertiesCountByAgent[a.id] || 0,
            email: a.email,
            phone: a.phone || undefined,
            image: a.profile_image || a.image || a.avatar || a.image_path || null,
          } as AgentInfo
        })
        setManagers(mapped)
      } catch (err) {
        console.error('Failed to load agents', err)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

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
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Hero - mobile responsive: person hidden on mobile; on md+ person's head protrudes above section */}
      <section
        className="relative mt-0 sm:mt-16 md:mt-20 pt-6 sm:pt-12 md:pt-16 pb-6 sm:pb-12 md:pb-16 px-4 sm:px-6 md:px-10 lg:px-[150px] min-h-[320px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[550px] overflow-visible"
        style={{
          backgroundImage: `url(${ASSETS.BG_RENT_MANAGERS_HERO})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="mx-auto relative flex flex-col lg:flex-row items-center max-w-full min-h-[280px] sm:min-h-[320px] lg:min-h-[300px] overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-center w-full overflow-visible">
            <div className="order-2 lg:order-1 text-left max-w-[650px]">
              <h1 className="font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                What are Agents?
              </h1>
              <p className="text-white leading-relaxed text-sm sm:text-base md:text-lg lg:text-xl font-light">
                Agents are trusted professionals who help property owners manage their
                rental properties and assist tenants in finding their perfect home. They handle
                everything from property listings to tenant screening, making the rental process
                smooth and stress-free for everyone involved.
              </p>
            </div>
            {/* Person: hidden on mobile; on md+ positioned so head protrudes above hero */}
            <div className="order-1 lg:order-2 hidden md:flex justify-center lg:justify-end w-full lg:max-w-[50%] overflow-visible items-end self-stretch min-h-[320px] lg:min-h-0">
              <div className="absolute top-3 right-0 flex items-end justify-end w-full max-w-[280px] md:max-w-[360px] lg:max-w-[420px] xl:max-w-[500px] overflow-visible" style={{ marginTop: '-12%' }}>
                <img
                  className="w-full h-auto max-h-[85vh] object-contain object-bottom block"
                  src={ASSETS.AGENTS_HERO_PERSON}
                  alt="Agent"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards - overlapping hero, mobile responsive */}
      <div className="mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px] relative -mt-24 sm:-mt-28 md:-mt-32 lg:-mt-40 z-10 pt-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border-[3px] border-[rgb(29,78,216)] shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
              style={{ border: '3px solid #1D4ED8' }}
            >
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                  <img
                    src={feature.icon}
                    alt={feature.alt}
                    className="w-10 h-10 sm:w-12 sm:h-12"
                    style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(2598%) hue-rotate(210deg) brightness(95%) contrast(92%)' }}
                  />
                </div>
                <div className="font-bold text-base sm:text-lg md:text-xl text-[#2563EB]">
                  {feature.title}
                </div>
                <p className="text-center text-sm sm:text-base md:text-lg text-gray-600 leading-snug">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky search bar - sticks below navbar (top offset ~navbar height) */}
      <div className="sticky z-40 top-16 sm:top-20 lg:top-0 mt-4 sm:mt-6 md:mt-8 lg:mt-6 border-b border-gray-200 bg-white py-3 sm:py-4 md:py-5 px-4 sm:px-6 md:px-10 lg:px-[150px] mb-4 sm:mb-6 md:mb-8 shadow-md">
        <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
            <div className="flex-1 w-full min-w-0 relative">
              <svg
                className="absolute left-3 sm:left-4 top-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search agents"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <select
                className="flex-1 sm:flex-none min-w-0 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                aria-label="Filter by province"
              >
                <option value="">Province</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <select
                className="flex-1 sm:flex-none min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter by city"
              >
                <option value="">City</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <div className="flex gap-1 flex-1 sm:flex-none justify-end sm:justify-start">
                <button
                  className={`flex-1 sm:flex-none min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[44px] touch-manipulation ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="List view"
                  onClick={() => setViewMode('list')}
                >
                  <span className="hidden sm:inline">List view</span>
                  <span className="sm:hidden">List</span>
                </button>
                <button
                  className={`flex-1 sm:flex-none min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[44px] touch-manipulation ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="Grid view"
                  onClick={() => setViewMode('grid')}
                >
                  <span className="hidden sm:inline">Grid view</span>
                  <span className="sm:hidden">Grid</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Find agents list */}
      <main className="px-4 sm:px-6 md:px-10 lg:px-[150px] pb-8 sm:pb-10 md:pb-12">
        <section className="mx-auto max-w-full">
          <h2 className="font-bold mb-4 sm:mb-6 md:mb-8 text-base sm:text-lg md:text-xl lg:text-2xl text-[#1A3DBF] uppercase tracking-wide text-left px-0">
            Find an Agent
          </h2>

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
                  className="bg-white overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 rounded-2xl border border-gray-200 shadow-sm min-w-0"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/agents/${manager.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/agents/${manager.id}`)
                    }
                  }}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="w-full pt-0 pb-4">
                        <div className="relative overflow-hidden w-full aspect-square rounded-t-2xl bg-white">
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
                            className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl sm:text-2xl md:text-3xl bg-blue-600"
                            style={{ display: manager.image ? 'none' : 'flex' }}
                          >
                            {getInitials(manager.name)}
                          </div>
                        </div>
                      </div>
                      <div className="px-3 sm:px-5 md:px-6 pb-4">
                        <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                          <h3 className="font-bold truncate flex-1 text-sm sm:text-base md:text-lg text-gray-700">
                            {manager.name}
                          </h3>
                          <span className="font-medium flex-shrink-0 text-xs sm:text-sm text-[#2563EB]">
                            {manager.listings} Listings
                          </span>
                        </div>
                        <p className="mb-3 text-xs sm:text-sm text-[#2563EB]">{manager.role}</p>
                        <div className="border-t border-gray-200 mb-3" />
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <svg width="16" height="16" className="flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 3C2 2.45 2.45 2 3 2H13C13.55 2 14 2.45 14 3V13C14 13.55 13.55 14 13 14H3C2.45 14 2 13.55 2 13V3ZM3 3V13H13V3H3Z" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
                              <path d="M3 4L8 8L13 4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="truncate text-xs sm:text-sm text-gray-600">{manager.email}</span>
                          </div>
                          {manager.phone && (
                            <div className="flex items-center gap-2 min-w-0">
                              <svg width="16" height="16" className="flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.5 2C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H12.5C13.33 14 14 13.33 14 12.5V3.5C14 2.67 13.33 2 12.5 2H3.5ZM3.5 3H12.5C12.78 3 13 3.22 13 3.5V12.5C13 12.78 12.78 13 12.5 13H3.5C3.22 13 3 12.78 3 12.5V3.5C3 3.22 3.22 3 3.5 3Z" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
                                <path d="M6 5H10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M6 7H12" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              <span className="truncate text-xs sm:text-sm text-gray-600">{manager.phone}</span>
                            </div>
                          )}
                        </div>
                        <button
                          className="w-full py-2.5 sm:py-3 px-3 rounded-lg bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors duration-200 min-h-[44px] touch-manipulation"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/agents/${manager.id}`)
                          }}
                        >
                          <span className="hidden sm:inline">View Listings</span>
                          <span className="sm:hidden">View</span>
                          <svg width="14" height="14" className="flex-shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row min-w-0">
                        <div className="w-full sm:w-40 md:w-48 flex-shrink-0">
                          <div className="relative w-full aspect-square overflow-hidden">
                            <img
                              src={getAgentImageUrl(manager.image, manager.id)}
                              alt={manager.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            <div
                              className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white text-xl sm:text-2xl md:text-3xl font-bold"
                              style={{ display: manager.image ? 'none' : 'flex' }}
                            >
                              {getInitials(manager.name)}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 p-4 sm:p-5 md:p-6 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold truncate text-base sm:text-lg md:text-xl text-gray-700">
                                {manager.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-[#2563EB]">{manager.role}</p>
                            </div>
                            <span className="font-medium text-xs sm:text-sm text-[#2563EB] flex-shrink-0">
                              {manager.listings} Listings
                            </span>
                          </div>
                          <div className="border-t border-gray-200 mb-3" />
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <svg width="16" height="16" className="flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 3C2 2.45 2.45 2 3 2H13C13.55 2 14 2.45 14 3V13C14 13.55 13.55 14 13 14H3C2.45 14 2 13.55 2 13V3ZM3 3V13H13V3H3Z" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
                                <path d="M3 4L8 8L13 4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="truncate text-xs sm:text-sm text-gray-600">{manager.email}</span>
                            </div>
                            {manager.phone && (
                              <div className="flex items-center gap-2 min-w-0">
                                <svg width="16" height="16" className="flex-shrink-0" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3.5 2C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H12.5C13.33 14 14 13.33 14 12.5V3.5C14 2.67 13.33 2 12.5 2H3.5ZM3.5 3H12.5C12.78 3 13 3.22 13 3.5V12.5C13 12.78 12.78 13 12.5 13H3.5C3.22 13 3 12.78 3 12.5V3.5C3 3.22 3.22 3 3.5 3Z" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
                                  <path d="M6 5H10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                                  <path d="M6 7H12" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span className="truncate text-xs sm:text-sm text-gray-600">{manager.phone}</span>
                              </div>
                            )}
                            <div className="mt-2">
                              <Link
                                href={`/agents/${manager.id}`}
                                className="inline-flex items-center gap-2 font-medium text-[#2563EB] text-xs sm:text-sm transition-colors duration-200 py-1 -mx-1 rounded hover:bg-blue-50 touch-manipulation"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="hidden sm:inline">View Listings</span>
                                <span className="sm:hidden">View</span>
                                <svg width="14" height="14" className="flex-shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <EmptyState
              variant="empty"
              title="No agents found"
              description="No agents match your search or filters. Try adjusting your criteria or browse all agents."
              action={<EmptyStateAction href="/agents" primary>View all agents</EmptyStateAction>}
            />
          )}
        </section>
      </main>

      <PopularRentManagers />

      {/* CTA - mobile responsive */}
      <section className="relative py-10 sm:py-14 md:py-16 px-4 sm:px-6 md:px-10 lg:px-[150px] min-h-[260px] sm:min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <img
            src={ASSETS.BG_RENT_MANAGERS_FOOTER}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: 'center bottom' }}
          />
        </div>
        <div className="absolute inset-0 w-full h-full z-[1] bg-black/55" />
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] px-4">
          <h2 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-5 leading-tight">
            Become an Agent
          </h2>
          <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 max-w-2xl">
            Join our network of trusted agents to help people find their perfect home.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[rgba(32,94,215,0.9)] text-white font-outfit text-sm sm:text-base font-semibold rounded-full transition-all hover:opacity-90 min-h-[44px] items-center justify-center touch-manipulation"
          >
            <span>Join now</span>
            <svg width="20" height="20" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
