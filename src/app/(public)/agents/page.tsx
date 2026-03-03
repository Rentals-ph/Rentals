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

/** Normalize phone/whatsapp for wa.me: digits only, ensure PH country code 63 */
const toWhatsAppHref = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  const withCountry = digits.startsWith('63') ? digits : digits.startsWith('0') ? '63' + digits.slice(1) : '63' + digits
  return `https://wa.me/${withCountry}`
}

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
            whatsapp: a.whatsapp || undefined,
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
      const inText = `${m.name} ${m.role} ${m.location} ${m.email} ${m.phone || ''} ${m.whatsapp || ''}`.toLowerCase()
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

      {/* Find agents list with right-side filters & CTA */}
      <main className="px-4 sm:px-6 md:px-10 lg:px-[150px] pb-8 sm:pb-10 md:pb-12">
        <section className="mx-auto max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(320px,1.2fr)] gap-6 lg:gap-10 items-start">
            {/* Left: Agents list */}
            <div>
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
                            <svg width="16" height="16" className="flex-shrink-0 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <rect width="20" height="16" x="2" y="4" rx="2" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <span className="text-xs sm:text-sm text-gray-500 shrink-0">Email:</span>
                            <span className="truncate text-xs sm:text-sm text-gray-600">{manager.email}</span>
                          </div>
                          {manager.phone && (
                            <div className="flex items-center gap-2 min-w-0">
                              <svg width="16" height="16" className="flex-shrink-0 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              <span className="text-xs sm:text-sm text-gray-500 shrink-0">Phone:</span>
                              <span className="truncate text-xs sm:text-sm text-gray-600">{manager.phone}</span>
                            </div>
                          )}
                          {manager.whatsapp && (
                            <a
                              href={toWhatsAppHref(manager.whatsapp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 min-w-0 text-[#25D366] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                              title="Chat on WhatsApp"
                            >
                              <svg width="16" height="16" className="flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              <span className="text-xs sm:text-sm shrink-0">WhatsApp:</span>
                              <span className="truncate text-xs sm:text-sm">Chat with agent</span>
                            </a>
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
                              <svg width="16" height="16" className="flex-shrink-0 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                              </svg>
                              <span className="text-xs sm:text-sm text-gray-500 shrink-0">Email:</span>
                              <span className="truncate text-xs sm:text-sm text-gray-600">{manager.email}</span>
                            </div>
                            {manager.phone && (
                              <div className="flex items-center gap-2 min-w-0">
                                <svg width="16" height="16" className="flex-shrink-0 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <span className="text-xs sm:text-sm text-gray-500 shrink-0">Phone:</span>
                                <span className="truncate text-xs sm:text-sm text-gray-600">{manager.phone}</span>
                              </div>
                            )}
                            {manager.whatsapp && (
                              <a
                                href={toWhatsAppHref(manager.whatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 min-w-0 text-[#25D366] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                                title="Chat on WhatsApp"
                              >
                                <svg width="16" height="16" className="flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                <span className="text-xs sm:text-sm shrink-0">WhatsApp:</span>
                                <span className="truncate text-xs sm:text-sm">Chat with agent</span>
                              </a>
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
            </div>

            {/* Right: Search, filters, and CTA */}
            <div className="space-y-6 lg:space-y-8">
              {/* Search & filters card */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 sm:p-5 md:p-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">
                  Search & Filter Agents
                </h3>
                <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full">
                  <div className="w-full min-w-0 relative">
                    <svg
                      className="absolute left-3 sm:left-4 top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 pointer-events-none"
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
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Province</label>
                      <select
                        className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        aria-label="Filter by province"
                      >
                        <option value="">All provinces</option>
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
                        <option value="">All cities</option>
                        {uniqueLocations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 mt-1">
                    <span className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      View mode
                    </span>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[40px] touch-manipulation ${
                          viewMode === 'list'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-label="List view"
                        onClick={() => setViewMode('list')}
                      >
                        List view
                      </button>
                      <button
                        className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[40px] touch-manipulation ${
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-label="Grid view"
                        onClick={() => setViewMode('grid')}
                      >
                        Grid view
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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
