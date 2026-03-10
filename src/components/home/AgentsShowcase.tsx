"use client"

import { useEffect, useState } from "react"
import { agentsApi, propertiesApi } from "@/api"
import { resolveAgentAvatar } from "@/utils/imageResolver"
import FadeInOnView from "@/components/common/FadeInOnView"
import { AgentCard } from "@/components/common/cards"
import { Pagination } from "@/components/common"
import type { Property } from "@/types"
import type { PaginatedResponse } from "@/api/types"

interface AgentSummary {
  id: number
  name: string
  role: string
  location: string
  listings?: number
  email?: string
  whatsapp?: string
  image?: string | null
  companyImage?: string | null
  companyName?: string | null
  description?: string | null
}

function AgentsShowcase() {
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4 // 1 row × 4 cards per row

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const [agentsData, allPropertiesResponse] = await Promise.all([
          agentsApi.getAll(),
          propertiesApi.getAll()
        ])
        if (!mounted) return

        // Count properties per agent
        const allProperties: Property[] = Array.isArray(allPropertiesResponse)
          ? allPropertiesResponse
          : (allPropertiesResponse as PaginatedResponse<Property>).data || []
        
        const propertiesCountByAgent: { [key: number]: number } = {}
        allProperties.forEach((property) => {
          const agentId = (property as any).agent_id || property.agent?.id
          if (agentId) {
            propertiesCountByAgent[agentId] = (propertiesCountByAgent[agentId] || 0) + 1
          }
        })

        const mapped: AgentSummary[] = agentsData.map((a: any) => {
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
            listings: propertiesCountByAgent[a.id] || 0,
            email: a.email || undefined,
            whatsapp: a.whatsapp || undefined,
            image: resolveAgentAvatar(
              a.profile_image || a.image || a.avatar || a.image_path || null,
              a.id,
            ),
            companyImage: a.company_image || null,
            companyName: a.company_name || null,
            description: a.description || null,
          }
        })

        // Show all agents with pagination
        setAgents(mapped)
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

  // Pagination calculations
  const totalPages = Math.ceil(agents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const visibleAgents = agents.slice(startIndex, endIndex)

  if (loading && agents.length === 0) {
    return null
  }

  if (!agents.length) {
    return null
  }

  return (
    <section className="bg-white px-3 xs:px-4 sm:px-6 md:px-10 lg:px-[150px] w-full py-8 sm:py-10 md:py-14">
      <div className="w-full mx-auto">
        {/* Header: Centered Label, title + subtitle */}
        <FadeInOnView
          className="relative flex flex-col gap-4 mb-6 sm:mb-8 pb-4"
          as="div"
        >
          <div className="text-center px-0 xs:px-2 min-w-0">
            <p className="text-[#205ED7] font-outfit text-[17px] font-medium leading-[1.26] mb-2 uppercase tracking-wide">
              TRUSTED PROFESSIONALS
            </p>
            <h2 className="text-[#111827] font-outfit text-2xl sm:text-3xl md:text-[40px] font-bold leading-[1em] tracking-[-0.0125em] m-0 mb-2">
              Meet Our Trusted Agents
            </h2>
            <p className="text-[#374151] font-outfit text-[17px] font-medium leading-[1.5] mt-2 mb-0 max-w-2xl mx-auto">
              Work with licensed professionals who know the Philippine<br />
              {' '}rental market and are ready to help you find<br />
              {' '}or manage your next home.
            </p>
          </div>
        </FadeInOnView>

        <FadeInOnView
          as="div"
          delayMs={140}
          className="relative w-full mt-4 sm:mt-6"
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="w-full">
                  <div className="bg-gray-200 animate-pulse h-[400px] rounded-2xl" />
                </div>
              ))}
            </div>
          ) : visibleAgents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {visibleAgents.map((agent, index) => (
                  <FadeInOnView
                    key={agent.id}
                    as="div"
                    delayMs={180 + index * 70}
                    className="w-full"
                  >
                    <AgentCard
                      id={agent.id}
                      name={agent.name}
                      role={agent.role}
                      location={agent.location}
                      listings={agent.listings}
                      email={agent.email}
                      whatsapp={agent.whatsapp}
                      image={agent.image}
                      companyImage={agent.companyImage}
                      companyName={agent.companyName}
                      description={agent.description}
                      linkUrl={`/agents/${agent.id}`}
                      ctaText="View Details"
                    />
                  </FadeInOnView>
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 sm:mt-10">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center w-full min-w-0">
              <p className="text-gray-600">No agents available</p>
            </div>
          )}
        </FadeInOnView>
      </div>
    </section>
  )
}

export default AgentsShowcase

