'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import FlippableBusinessCard from '@/components/common/digital/FlippableBusinessCard'
import { agentsApi } from '@/api'
import type { Agent } from '@/api/endpoints/agents'
import { ASSETS } from '@/utils/assets'
import { FiBell } from 'react-icons/fi'

// Default profile image you provided (place your image at public/images/broker-profile.png)
const DEFAULT_PROFILE_IMAGE = '/images/broker-profile.png'

export default function BrokerDigitalCard() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBrokerData = async () => {
      const role = typeof window !== 'undefined' ? (localStorage.getItem('user_role') || localStorage.getItem('agent_role')) : null
      // /agents/me is only for role 'agent'; brokers get 403
      if (role === 'broker') {
        const name = localStorage.getItem('user_name') || localStorage.getItem('agent_name') || 'Broker'
        const agentId = localStorage.getItem('agent_id') || localStorage.getItem('user_id')
        setAgent({
          id: agentId ? parseInt(agentId) : 0,
          first_name: name.split(' ')[0] || 'Broker',
          last_name: name.split(' ').slice(1).join(' ') || '',
          email: '',
          full_name: name,
        } as Agent)
        setLoading(false)
        return
      }
      try {
        const agentData = await agentsApi.getCurrent()
        setAgent(agentData)
        if (agentData.first_name && agentData.last_name) {
          const fullName = `${agentData.first_name} ${agentData.last_name}`
          localStorage.setItem('agent_name', fullName)
          localStorage.setItem('user_name', fullName)
        }
        if (agentData.id) {
          localStorage.setItem('agent_id', agentData.id.toString())
        }
      } catch (error) {
        console.error('Error fetching broker data:', error)
        try {
          const agentId = localStorage.getItem('agent_id')
          if (agentId) {
            const agentData = await agentsApi.getById(parseInt(agentId))
            setAgent(agentData)
            if (agentData.first_name && agentData.last_name) {
              const fullName = `${agentData.first_name} ${agentData.last_name}`
              localStorage.setItem('agent_name', fullName)
              localStorage.setItem('user_name', fullName)
            }
          }
        } catch (fallbackError) {
          console.error('Error fetching broker by ID:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchBrokerData()
  }, [])

  const firstName = agent?.first_name || 'Broker'
  const lastName = agent?.last_name || ''
  const fullName = agent?.full_name || 
    (agent?.first_name && agent?.last_name 
      ? `${agent.first_name} ${agent.last_name}` 
      : 'Broker')
  const title = agent?.verified ? 'Rent Manager' : 'Property Broker'
  const sinceYear = agent?.created_at 
    ? new Date(agent.created_at).getFullYear().toString()
    : new Date().getFullYear().toString()
  const phone = agent?.phone ? `+63 ${agent.phone.replace(/^\+?63\s?/, '')}` : '+63 9XX XXX XXXX'
  const email = agent?.email || 'your@email.com'
  // Use your photo first; fallback to agent image from API if set
  const brokerImage = agent?.image || agent?.avatar || agent?.profile_image || DEFAULT_PROFILE_IMAGE
  const brokerInitials = fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'B'
  const companyName = agent?.company_name || agent?.agency_name || ''
  const companyImage = agent?.company_image || null
  const officeAddress = agent?.office_address || ''
  const licenseNumber = agent?.prc_license_number || ''

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15"> {/* broker-main */}
        {/* Broker Header */}
        <header className="broker-header flex items-center justify-between gap-4 mb-6 md:flex-col md:items-start">
          <div className="broker-header-left flex items-center gap-3 md:w-full md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1">Digital Business Card</h1>
              <p className="text-sm text-gray-400 m-0">Share your professional contact information.</p>
            </div>
            <button type="button" className="w-11 h-11 rounded-xl border-0 bg-white flex items-center justify-center text-gray-600 text-xl cursor-pointer transition-all duration-200 shadow-sm hover:bg-gray-50 hover:text-blue-600 flex-shrink-0" aria-label="Notifications">
              <FiBell />
            </button>
          </div>
        </header>

        <div className="mt-2">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading card...</div>
          ) : (
            <div className="flex justify-center items-start">
              <FlippableBusinessCard
                firstName={firstName}
                lastName={lastName}
                fullName={fullName}
                title={title}
                sinceYear={sinceYear}
                phone={phone}
                email={email}
                image={brokerImage}
                initials={brokerInitials}
                profileUrl={agent?.id ? `/agents/${agent.id}` : undefined}
                companyName={companyName}
                companyImage={companyImage}
                officeAddress={officeAddress}
                licenseNumber={licenseNumber}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
