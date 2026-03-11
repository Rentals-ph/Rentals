'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import AgentHeader from '@/components/agent/AgentHeader'
import DigitalBusinessCard from '@/components/common/DigitalBusinessCard'
import { agentsApi } from '@/api'
import type { Agent } from '@/api/endpoints/agents'
import { ASSETS } from '@/utils/assets'
// import './page.css' // Removed - converted to Tailwind

export default function AgentDigitalCard() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        // Try to get current authenticated agent first
        const agentData = await agentsApi.getCurrent()
        setAgent(agentData)
        
        // Update localStorage with agent info
        if (agentData.first_name && agentData.last_name) {
          const fullName = `${agentData.first_name} ${agentData.last_name}`
          localStorage.setItem('agent_name', fullName)
          localStorage.setItem('user_name', fullName)
        }
        if (agentData.id) {
          localStorage.setItem('agent_id', agentData.id.toString())
        }
      } catch (error) {
        console.error('Error fetching agent data:', error)
        // Fallback to using agent_id if getCurrent fails
        try {
          const agentId = localStorage.getItem('agent_id')
          if (agentId) {
            const agentData = await agentsApi.getById(parseInt(agentId))
            setAgent(agentData)
            
            // Update localStorage with agent info
            if (agentData.first_name && agentData.last_name) {
              const fullName = `${agentData.first_name} ${agentData.last_name}`
              localStorage.setItem('agent_name', fullName)
              localStorage.setItem('user_name', fullName)
            }
          }
        } catch (fallbackError) {
          console.error('Error fetching agent by ID:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
  }, [])

  // Get user data from agent or use defaults
  const firstName = agent?.first_name || 'Agent'
  const lastName = agent?.last_name || ''
  const fullName = agent?.full_name || 
    (agent?.first_name && agent?.last_name 
      ? `${agent.first_name} ${agent.last_name}` 
      : 'Agent')
  const title = agent?.verified ? 'Rent Manager' : 'Property Agent'
  const sinceYear = agent?.created_at 
    ? new Date(agent.created_at).getFullYear().toString()
    : new Date().getFullYear().toString()
  const phone = agent?.phone ? `+63 ${agent.phone.replace(/^\+?63\s?/, '')}` : '+63 9XX XXX XXXX'
  const email = agent?.email || 'your@email.com'
  const agentImage = agent?.image || agent?.avatar || agent?.profile_image || ASSETS.PLACEHOLDER_PROFILE
  const agentInitials = fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* agent-dashboard */}
      <AppSidebar/>

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-20"> {/* agent-main */}
        <AgentHeader 
          title="Digital Business Card" 
          subtitle="Share your professional contact information." 
        />

        <div className="mt-6"> {/* digital-card-section */}
          <h2 className="m-0 mb-8 text-2xl font-bold text-gray-900"> {/* section-title */}
            Digital Business Card
          </h2>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading card...</div>
          ) : (
            <div className="flex justify-center items-start py-5">
              <DigitalBusinessCard
                firstName={firstName}
                lastName={lastName}
                fullName={fullName}
                title={title}
                sinceYear={sinceYear}
                phone={phone}
                profileUrl={agent?.id ? `/agents/${agent.id}` : undefined}
                email={email}
                image={agentImage}
                initials={agentInitials}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
