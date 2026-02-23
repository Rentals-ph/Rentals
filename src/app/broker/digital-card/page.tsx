'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import { agentsApi } from '../../../api'
import type { Agent } from '../../../api/endpoints/agents'
import { ASSETS } from '@/utils/assets'
import { 
  FiBell,
  FiPlus,
  FiMail,
  FiPhone
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

// Default profile image you provided (place your image at public/images/broker-profile.png)
const DEFAULT_PROFILE_IMAGE = '/images/broker-profile.png'

export default function BrokerDigitalCard() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBrokerData = async () => {
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

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15"> {/* broker-main */}
        {/* Broker Header */}
        <header className="broker-header">
          <div className="broker-header-left">
            <h1>Digital Business Card</h1>
            <p>Share your professional contact information.</p>
          </div>
          <div className="flex items-center gap-3.5 md:w-full md:justify-between md:gap-2.5">
            <button className="w-11 h-11 rounded-xl border-0 bg-white flex items-center justify-center text-gray-600 text-xl cursor-pointer transition-all duration-200 shadow-sm hover:bg-gray-50 hover:text-blue-600">
              <FiBell />
            </button>
            <a href="/broker/create-listing" className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 text-white text-sm font-semibold rounded-xl border-0 no-underline cursor-pointer transition-all duration-200 shadow-sm hover:bg-blue-700 active:scale-[0.98]">
              <FiPlus />
              Add Listing
            </a>
          </div>
        </header>

        <div className="mt-2">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading card...</div>
          ) : (
            <div className="flex justify-center items-start">
              {/* Card: horizontal, same layout as reference */}
              <div 
                className="relative w-full max-w-[560px] rounded-[1.25rem] overflow-hidden flex flex-row aspect-[1.6] min-h-[300px]"
                style={{
                  background: 'linear-gradient(135deg, #0f2d52 0%, #1a4a7a 50%, #0f2d52 100%)',
                  boxShadow: '0 8px 24px rgba(15, 45, 82, 0.4), 0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* Wave pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.12] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q15 10 30 20 T60 20 M0 35 Q20 25 40 35 T60 35 M0 50 Q10 40 30 50 T60 50' stroke='%2359b3f5' fill='none' strokeWidth='1.5' opacity='0.8'/%3E%3Cpath d='M20 0 Q25 15 20 30 T20 60 M35 0 Q40 20 35 40 T35 60 M50 0 Q45 18 50 35 T50 60' stroke='%2359b3f5' fill='none' strokeWidth='1.2' opacity='0.6'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Left: photo, name, Property Broker, Since, contacts — same order as image */}
                <div className="relative z-10 flex-1 flex flex-col p-6 min-w-0">
                  <div 
                    className="w-20 h-20 rounded-full p-1 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #fbbf24 100%)' }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0f2d52]">
                      <img
                        src={brokerImage}
                        alt={fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement
                          t.style.display = 'none'
                          const next = t.nextElementSibling as HTMLElement
                          if (next) next.classList.remove('hidden')
                        }}
                      />
                      <div 
                        className="w-full h-full hidden flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: 'linear-gradient(135deg, #1a4a7a 0%, #0f2d52 100%)' }}
                      >
                        {brokerInitials}
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-3 m-0 text-lg font-bold leading-tight truncate">
                    <span className="text-white">{firstName}</span>
                    {lastName && <span className="text-amber-400"> {lastName}</span>}
                  </h3>
                  <p className="m-0 mt-0.5 text-white/95 text-sm font-medium">{title}</p>
                  <p className="m-0 text-white/80 text-xs">Since {sinceYear}</p>
                  <div className="mt-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-white/95">
                      <FiPhone className="flex-shrink-0 text-amber-400 text-xs" />
                      <span className="text-xs font-medium truncate">{phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/95">
                      <FaWhatsapp className="flex-shrink-0 text-amber-400 text-xs" />
                      <span className="text-xs font-medium truncate">{phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/95">
                      <FiMail className="flex-shrink-0 text-amber-400 text-xs" />
                      <span className="text-xs font-medium truncate max-w-[180px]">{email}</span>
                    </div>
                  </div>
                </div>

                {/* Right: logo, QR */}
                <div className="relative z-10 flex flex-col items-center justify-between p-6 border-l border-white/15 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <img src={ASSETS.LOGO_HERO_MAIN} alt="Rentals.ph" className="h-10 w-auto object-contain" />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-24 h-24 rounded-lg bg-white p-1.5 flex items-center justify-center">
                      <div 
                        className="w-full h-full rounded"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(0deg, #111 0, #111 2px, transparent 2px, transparent 8px), repeating-linear-gradient(90deg, #111 0, #111 2px, transparent 2px, transparent 8px)',
                          backgroundSize: '8px 8px',
                        }}
                      />
                    </div>
                    <p className="m-0 text-white/80 text-xs font-medium">Scan to view my profile</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
