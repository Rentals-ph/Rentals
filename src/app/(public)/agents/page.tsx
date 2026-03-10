"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import PopularRentManagers from '@/components/rent-managers/PopularRentManagers'
import { RentManagerCardSkeleton } from '@/components/common/RentManagerCardSkeleton'
import { AgentCard } from '@/components/common/cards'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { agentsApi, propertiesApi } from '@/api'
import { ASSETS } from '@/utils/assets'
import type { Property } from '@/types'

interface AgentInfo {
  id: number
  name: string
  role: string
  location: string
  listings: number
  email: string
  phone?: string
  whatsapp?: string
  image?: string | null
  companyImage?: string | null
  companyName?: string | null
  description?: string | null
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
            whatsapp: a.whatsapp || undefined,
            image: a.profile_image || a.image || a.avatar || a.image_path || null,
            companyImage: a.company_image || null,
            companyName: a.company_name || null,
            description: a.description || null,
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
      const inText = `${m.name} ${m.role} ${m.location} ${m.email} ${m.phone || ''} ${m.whatsapp || ''}`.toLowerCase()
      if (!inText.includes(q)) return false
    }
    if (selectedProvince && !m.location.toLowerCase().includes(selectedProvince.toLowerCase())) return false
    if (selectedCity && !m.location.toLowerCase().includes(selectedCity.toLowerCase())) return false
    if (selectedLicense && !m.role.toLowerCase().includes(selectedLicense.toLowerCase())) return false
    return true
  })

  const featuredAgents = filteredManagers.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Hero - match About hero height & left-aligned content */}
      <section className="w-full relative min-h-[220px] xs:min-h-[260px] sm:min-h-[320px] md:min-h-[400px] flex flex-col overflow-hidden">
        {/* Background image + gradient overlay */}
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src={ASSETS.BG_RENT_MANAGERS_HERO}
            alt="Agents hero background"
            className="w-full h-full object-cover object-center"
          />
          <div
            className="absolute top-0 left-0 w-full h-full z-[2]"
            style={{
              background:
                'linear-gradient(90deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.6) 35%, rgba(0, 0, 0, 0.45) 65%, rgba(0, 0, 0, 0.3) 100%)',
              opacity: 0.95,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-[3] max-w-[var(--page-max-width)] mx-auto py-10 sm:py-14 md:py-16 w-full flex items-center justify-start flex-1">
          <div className="text-left flex flex-col items-start justify-center max-w-xl">
            <h1 className="font-outfit font-extrabold text-white tracking-tight leading-tight m-0 text-xl xs:text-2xl mobile:text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              AGENTS
            </h1>
            <p className="max-w-2xl font-outfit text-white m-0 mt-3 text-sm xs:text-base md:text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
              Agents are trusted professionals who help property owners manage their rental properties and assist tenants
              in finding their perfect home. They handle everything from property listings to tenant screening, making
              the rental process smooth and stress-free for everyone involved.
            </p>
          </div>
        </div>

        {/* Right-side three agents image, fixed to bottom of hero */}
        <div className="hidden md:block absolute bottom-0 right-0 z-[3] translate-y-[2px]">
          <div className="flex items-end pr-4 sm:pr-8 md:pr-20 lg:pr-56">
            <div className="flex items-end">              {/* Largest on the left */}
              <img
                src={ASSETS.AGENTS_HERO_PERSON}
                alt="Professional rental agents"
                className="h-[260px] lg:h-[320px] xl:h-[360px] w-auto object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
              />
              {/* Medium in the middle, overlapping */}
              <img
                src={ASSETS.AGENTS_HERO_PERSON}
                alt="Professional rental agents"
                className="h-[235px] lg:h-[260px] xl:h-[320px] w-auto object-contain -ml-20 lg:-ml-22 xl:-ml-24 drop-shadow-[0_18px_56px_rgba(0,0,0,0.8)]"
              />
              {/* Smallest on the right */}
              <img
                src={ASSETS.AGENTS_HERO_PERSON}
                alt="Professional rental agents"
                className="h-[210px] lg:h-[260px] xl:h-[290px] w-auto object-contain -ml-20 lg:-ml-22 xl:-ml-24 drop-shadow-[0_16px_52px_rgba(0,0,0,0.75)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results header below hero - styled like properties page */}
      <section className="px-4 sm:px-6 md:px-10 lg:px-[150px] pt-6 sm:pt-8 pb-2">
        <div className="mx-auto max-w-[var(--page-max-width)]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(320px,1.2fr)] gap-3 sm:gap-4 items-start lg:items-center">
            {/* Left column: results + sort + view mode controls (aligned with agents grid) */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
              <div className="text-sm sm:text-base font-outfit">
                <span className="text-gray-600">Results for : </span>
                <span className="text-blue-600 font-medium">Agents</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-outfit hidden sm:inline">Sort by</span>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                  defaultValue="newest"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <div className="flex rounded-lg border border-gray-200 p-1 bg-white max-w-max">
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="5" height="5" rx="1" />
                      <rect x="9" y="2" width="5" height="5" rx="1" />
                      <rect x="2" y="9" width="5" height="5" rx="1" />
                      <rect x="9" y="9" width="5" height="5" rx="1" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'}`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="2" y1="4" x2="14" y2="4" />
                      <line x1="2" y1="8" x2="14" y2="8" />
                      <line x1="2" y1="12" x2="14" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right column: label for Search & Filter Agents card below */}
            <div className="flex items-start lg:items-center justify-start lg:justify-end">
              <div className="inline-flex items-center gap-2 text-blue-600 font-outfit text-sm font-medium">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <circle cx="4" cy="6" r="2" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <circle cx="4" cy="12" r="2" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                  <circle cx="4" cy="18" r="2" />
                </svg>
                <span>Search Filters</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find agents list with right-side filters & CTA */}
      <main className="px-4 sm:px-6 md:px-10 lg:px-[150px] pb-8 sm:pb-10 md:pb-12">
        <section className="mx-auto max-w-[var(--page-max-width)]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(320px,1.2fr)] gap-6 lg:gap-10 items-start">
            {/* Left: Agents list */}
            <div>

              {loading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'flex flex-col gap-4'}>
                  {Array.from({ length: viewMode === 'grid' ? 9 : 4 }).map((_, i) => (
                    <RentManagerCardSkeleton key={i} variant={viewMode === 'grid' ? 'grid' : 'list'} />
                  ))}
                </div>
              ) : filteredManagers.length > 0 ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6' : 'flex flex-col gap-4'}>
                  {filteredManagers.map((manager) => (
                    <AgentCard
                      key={manager.id}
                      id={manager.id}
                      name={manager.name}
                      role={manager.role}
                      location={manager.location}
                      listings={manager.listings}
                      email={manager.email}
                      phone={manager.phone}
                      whatsapp={manager.whatsapp}
                      image={manager.image}
                      companyImage={manager.companyImage}
                      companyName={manager.companyName}
                      description={manager.description}
                      viewMode={viewMode}
                      linkUrl={`/agents/${manager.id}`}
                      ctaText="View Details"
                    />
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
            </div>

            {/* Right: Search, Featured Agents, and CTA */}
            <div className="space-y-6 lg:space-y-8">
              {/* Search & filters card (matches provided layout) */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 sm:p-5 md:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Search</label>
                    <div className="relative">
                      <svg
                        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 pointer-events-none"
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
                        placeholder="Enter keywords"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search agents"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Province</label>
                      <select
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        aria-label="Filter by province"
                      >
                        <option value="">All Provinces</option>
                        {uniqueLocations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">City</label>
                      <select
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        aria-label="Filter by city"
                      >
                        <option value="">All Cities</option>
                        {uniqueLocations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#205ED7] text-white font-outfit text-sm font-semibold shadow-sm hover:bg-[#1D4ED8] transition-colors min-w-[110px]"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800"
                      onClick={() => {
                        setSelectedProvince('')
                        setSelectedCity('')
                        setSearchQuery('')
                      }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured Agents list */}
              {featuredAgents.length > 0 && (
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 sm:p-5 md:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    Featured Agents
                  </h3>
                  <div className="space-y-3">
                    {featuredAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center gap-3 sm:gap-4 py-2 border-b last:border-b-0 border-gray-100"
                      >
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          {agent.image ? (
                            <img
                              src={agent.image}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {agent.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            <span className="text-[#205ED7] font-semibold">{agent.listings}</span>{' '}
                            Property Listings
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-[#205ED7]">
                          {agent.whatsapp && (
                            <a
                              href={`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E0EDFF] hover:bg-[#d0e2ff] transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M20.52 3.48A11.84 11.84 0 0 0 12.02 0C5.8 0 .78 5.04.78 11.29a11.2 11.2 0 0 0 1.53 5.7L0 24l7.2-2.31a11.93 11.93 0 0 0 4.8 1.03h.01c6.23 0 11.25-5.04 11.25-11.29 0-3.01-1.18-5.84-3.24-7.95Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </a>
                          )}
                          {agent.email && (
                            <a
                              href={`mailto:${agent.email}`}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-[#205ED7] text-[#205ED7] hover:bg-[#E0EDFF] transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="m22 6-10 7L2 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work with Our Agents CTA */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl min-h-[260px] sm:min-h-[300px]">
                <div className="absolute inset-0 w-full h-full z-0">
                  <img
                    src={ASSETS.BG_RENT_MANAGERS_FOOTER}
                    alt=""
                    className="w-full h-full object-cover object-center"
                    style={{ objectPosition: 'center bottom' }}
                  />
                </div>
                <div className="absolute inset-0 w-full h-full z-[1] bg-black/55" />
                <div className="relative z-10 p-5 sm:p-6 md:p-7 flex flex-col items-center justify-center text-center min-h-[260px] sm:min-h-[300px]">
                  <h2 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight">
                    Work with Our Agents
                  </h2>
                  <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-5 md:mb-6 max-w-2xl">
                    Connect with our network of trusted agents to find your perfect home.
                  </p>
                  <Link
                    href="/properties"
                    className="inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-[rgba(32,94,215,0.9)] text-white font-outfit text-xs sm:text-sm md:text-base font-semibold rounded-full transition-all hover:opacity-90 min-h-[44px] items-center justify-center touch-manipulation"
                  >
                    <span>Become an agent</span>
                    <svg width="16" height="16" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PopularRentManagers />

      <Footer />
    </div>
  )
}
