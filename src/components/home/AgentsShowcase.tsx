"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { agentsApi } from "@/api"
import { resolveAgentAvatar } from "@/utils/imageResolver"
import FadeInOnView from "@/components/common/FadeInOnView"

interface AgentSummary {
  id: number
  name: string
  role: string
  location: string
  image?: string | null
}

function AgentsShowcase() {
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const data = await agentsApi.getAll()
        if (!mounted) return

        const mapped: AgentSummary[] = data.map((a: any) => {
          const name =
            a.full_name ||
            `${a.first_name || ''} ${a.last_name || ''}`.trim() ||
            a.email

          const location = [a.city, a.state].filter(Boolean).join(', ')

          return {
            id: a.id,
            name,
            role: a.license_type || a.agency_name || 'Agent',
            location: location || 'Philippines',
            image: resolveAgentAvatar(
              a.profile_image || a.image || a.avatar || a.image_path || null,
              a.id,
            ),
          }
        })

        // Show only a handful of featured agents on the homepage
        setAgents(mapped.slice(0, 4))
      } catch (err) {
        console.error('Failed to load agents for homepage', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const locations = ['All Locations', ...Array.from(new Set(agents.map((a) => a.location).filter(Boolean)))]

  const visibleAgents =
    selectedLocation === 'All Locations'
      ? agents
      : agents.filter((agent) => agent.location === selectedLocation)

  if (loading && agents.length === 0) {
    return null
  }

  if (!agents.length) {
    return null
  }

  return (
    <section className="bg-white px-3 xs:px-4 sm:px-6 md:px-10 lg:px-[150px] w-full py-8 sm:py-10 md:py-14">
      <div className="w-full mx-auto">
        <FadeInOnView className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8" as="div">
          <div className="text-center sm:text-left max-w-xl">
            <h2 className="text-gray-900 font-outfit text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight m-0 mb-2">
              Meet Our Trusted Agents
            </h2>
            <p className="text-gray-600 font-outfit text-sm sm:text-base md:text-lg leading-relaxed m-0">
              Work with licensed professionals who know the Philippine rental market and are ready to
              help you find or manage your next home.
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full border-2 border-rental-blue-500 text-rental-blue-600 font-outfit text-sm sm:text-base font-semibold bg-white hover:bg-blue-50 transition-colors"
            >
              View all agents
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M7 4L13 10L7 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </FadeInOnView>

        {/* Trusted agent locations filter */}
        {agents.length > 0 && (
          <div className="flex flex-col gap-2 sm:gap-3 mb-3">
            <div className="flex items-center justify-between gap-2 px-1 sm:px-0">
              <p className="text-gray-700 font-outfit text-xs sm:text-sm md:text-base font-medium m-0">
                Browse trusted agents by location
              </p>
            </div>
            <div className="subcategory-row flex items-center gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden flex-nowrap sm:flex-wrap justify-start p-1.5 sm:p-2 rounded-full sm:rounded-2xl bg-white shadow-[0_1px_4px_rgba(148,163,184,0.25)] w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-manipulation min-h-[32px] sm:min-h-[36px] ${
                    selectedLocation === loc
                      ? 'bg-rental-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]'
                      : 'bg-transparent text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        <FadeInOnView
          as="div"
          delayMs={140}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
        >
          {visibleAgents.map((agent, index) => (
            <FadeInOnView
              key={agent.id}
              as="div"
              delayMs={180 + index * 70}
              className="w-full"
            >
              <Link
                href={`/agents/${agent.id}`}
                className="group bg-white rounded-2xl border border-gray-200 shadow-[0_6px_18px_rgba(15,23,42,0.07)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all overflow-hidden flex flex-col min-w-0"
              >
                <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                  {agent.image ? (
                    <img
                      src={agent.image}
                      alt={agent.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-rental-blue-600 text-white font-outfit text-xl font-semibold">
                      {agent.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 px-4 sm:px-5 py-4 sm:py-5">
                  <h3 className="font-outfit text-base sm:text-lg font-semibold text-gray-900 m-0 truncate">
                    {agent.name}
                  </h3>
                  <p className="font-outfit text-xs sm:text-sm text-rental-blue-600 m-0">
                    {agent.role}
                  </p>
                  <p className="font-outfit text-xs sm:text-sm text-gray-500 m-0 flex items-center gap-1.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0 text-gray-400"
                    >
                      <path
                        d="M10 2C6.686 2 4 4.686 4 8C4 12.418 10 18 10 18C10 18 16 12.418 16 8C16 4.686 13.314 2 10 2ZM10 10.5C8.619 10.5 7.5 9.381 7.5 8C7.5 6.619 8.619 5.5 10 5.5C11.381 5.5 12.5 6.619 12.5 8C12.5 9.381 11.381 10.5 10 10.5Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="truncate">{agent.location}</span>
                  </p>
                </div>
              </Link>
            </FadeInOnView>
          ))}
        </FadeInOnView>
      </div>
    </section>
  )
}

export default AgentsShowcase

