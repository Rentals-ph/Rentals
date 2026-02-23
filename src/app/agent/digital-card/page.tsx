'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import AgentHeader from '../../../components/agent/AgentHeader'
import { agentsApi } from '../../../api'
import type { Agent } from '../../../api/endpoints/agents'
import { ASSETS } from '@/utils/assets'
import { 
  FiMail,
  FiPhone
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
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
  const phone = agent?.phone ? `+63 ${agent.phone.replace(/^\+?63\s?/, '')}` : '+63'
  const email = agent?.email || ''
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
            <div className="p-8 text-center">Loading card...</div>
          ) : (
            <div className="flex justify-center items-start py-5"> {/* business-card-container */}
              <div className="bg-white rounded-2xl p-0 w-full max-w-[900px] shadow-md flex flex-row relative overflow-hidden min-h-[400px] md:flex-col md:max-w-full md:min-h-0"> {/* business-card */}
                {/* Rentals.ph Logo in top-right */}
                <div className="absolute top-5 right-5 z-10 md:top-3 md:right-3"> {/* card-logo */}
                  <img 
                    src={ASSETS.LOGO_HERO_MAIN} 
                    alt="Rentals.ph"
                    className="h-10 w-auto object-contain md:h-8" /* rentals-logo */
                  />
                </div>

                {/* Left Decorative Strip */}
                <div className="w-20 relative flex-shrink-0 flex flex-col items-center md:w-full md:h-20 md:flex-row"> {/* card-decorative-strip */}
                  <div className="absolute top-5 z-[5] w-8 h-8 flex items-center justify-center bg-white rounded-full p-1 md:top-1/2 md:left-5 md:-translate-y-1/2"> {/* strip-icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#0073e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#0073e6"/>
                      <path d="M9 22V12H15V22" fill="#ff8c00"/>
                    </svg>
                  </div>
                  <div className="w-1/2 h-full absolute left-0 top-0 md:w-full md:h-1/2" style={{ background: '#0073e6' }}></div> {/* strip-blue */}
                  <div className="w-1/2 h-full absolute right-0 top-0 md:w-full md:h-1/2 md:left-0 md:bottom-0 md:top-auto" style={{ background: '#ff8c00' }}></div> {/* strip-orange */}
                  <div 
                    className="absolute left-1/2 top-0 w-full h-full -translate-x-1/2 z-[2] pointer-events-none md:left-0 md:top-1/2 md:w-full md:h-0.5 md:translate-x-0 md:-translate-y-1/2"
                    style={{
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='40' viewBox='0 0 4 40'%3E%3Cpath d='M0,0 Q2,5 0,10 T0,20 T0,30 T0,40' stroke='white' stroke-width='2.5' fill='none'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'repeat-y',
                      backgroundSize: '4px 20px',
                      backgroundPosition: 'center'
                    }}
                  ></div> {/* strip-wave */}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-10 pl-15 flex flex-col gap-4 relative pt-15 md:p-8 md:pl-6"> {/* card-content */}
                  {/* Profile Picture */}
                  <div className="w-35 h-35 rounded-full overflow-hidden relative bg-gray-200 flex items-center justify-center self-start mb-1 md:self-center md:w-30 md:h-30"> {/* card-profile-image */}
                    <img 
                      src={agentImage} 
                      alt={fullName}
                      className="w-full h-full object-cover relative z-[1]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const nextSibling = target.nextElementSibling as HTMLElement;
                        if (nextSibling) {
                          nextSibling.classList.remove('hidden');
                        }
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-[42px] relative z-[1] hidden" style={{ background: 'linear-gradient(135deg, #0073e6 0%, #ff8c00 100%)' }}>{agentInitials}</div> {/* card-avatar-fallback */}
                  </div>

                  {/* Name and Title Section */}
                  <div className="flex flex-col gap-1 mt-0 md:items-center md:text-center"> {/* card-name-section */}
                    <h3 className="m-0 text-4xl font-bold flex gap-2 items-baseline leading-tight md:text-3xl md:justify-center"> {/* card-name */}
                      <span style={{ color: '#0073e6' }}>{firstName}</span> {/* name-first */}
                      {lastName && <span style={{ color: '#ff8c00' }}>{lastName}</span>} {/* name-last */}
                    </h3>
                    <p className="m-0 text-lg font-medium text-gray-500 md:text-base md:text-center">{title}</p> {/* card-title */}
                    <p className="m-0 text-sm font-normal text-gray-400 md:text-center">Since {sinceYear}</p> {/* card-tenure */}
                  </div>

                  {/* Contact Information */}
                  <div className="flex flex-col gap-3 mt-2 md:items-center"> {/* card-contact-info */}
                    {phone && phone !== '+63' && (
                      <div className="flex items-center gap-3"> {/* contact-item */}
                        <FiPhone className="text-xl flex-shrink-0" style={{ color: '#0073e6' }} /> {/* contact-icon phone-icon */}
                        <span className="text-base font-medium text-gray-900">{phone}</span> {/* contact-text */}
                      </div>
                    )}
                    {phone && phone !== '+63' && (
                      <div className="flex items-center gap-3"> {/* contact-item */}
                        <FaWhatsapp className="text-xl flex-shrink-0 text-[#25D366]" /> {/* contact-icon whatsapp-icon */}
                        <span className="text-base font-medium text-gray-900">{phone}</span> {/* contact-text */}
                      </div>
                    )}
                    {email && (
                      <div className="flex items-center gap-3"> {/* contact-item */}
                        <FiMail className="text-xl flex-shrink-0" style={{ color: '#0073e6' }} /> {/* contact-icon email-icon */}
                        <span className="text-base font-medium text-gray-900">{email}</span> {/* contact-text */}
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center justify-center gap-3 p-10 flex-shrink-0 border-l border-gray-200 md:border-l-0 md:border-t md:p-6"> {/* card-qr-container */}
                  <div 
                    className="w-45 h-45 rounded-lg border border-gray-200 shadow-sm md:w-40 md:h-40"
                    style={{
                      background: 'repeating-linear-gradient(0deg, #000 0px, #000 3px, transparent 3px, transparent 12px), repeating-linear-gradient(90deg, #000 0px, #000 3px, transparent 3px, transparent 12px), #FFFFFF',
                      backgroundSize: '12px 12px'
                    }}
                  ></div> {/* card-qr-code */}
                  <p className="m-0 text-sm font-medium text-gray-500 text-center">Scan to view my profile</p> {/* qr-instruction */}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
