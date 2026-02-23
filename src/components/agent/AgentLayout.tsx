import { ReactNode, useEffect, useState } from 'react'
import AgentHeader from './AgentHeader'

interface AgentLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

function AgentLayout({ children, title, subtitle }: AgentLayoutProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Check if agent account is processing
    const registrationStatus = localStorage.getItem('agent_registration_status')
    const agentStatus = localStorage.getItem('agent_status')
    
    if (registrationStatus === 'processing' || 
        agentStatus === 'processing' || 
        agentStatus === 'pending' || 
        agentStatus === 'under_review') {
      setIsProcessing(true)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <main className="ml-[280px] flex-1 w-[calc(100%-280px)] p-8 min-h-screen lg:ml-60 lg:w-[calc(100%-240px)] lg:p-6 md:ml-[200px] md:w-[calc(100%-200px)] md:p-4">
        <AgentHeader title={title} subtitle={subtitle} />
        
        {/* Processing Account Banner */}
        {isProcessing && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-rental-orange-500 rounded-xl p-5 md:p-4 mb-6 shadow-[0_2px_8px_rgba(254,142,10,0.1)]">
            <div className="flex items-start gap-4 md:gap-3">
              <div className="flex-shrink-0 w-12 h-12 md:w-10 md:h-10 flex items-center justify-center bg-rental-orange-500 rounded-full animate-pulse">
                <svg width="24" height="24" className="w-6 h-6 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#FE8E0A" strokeWidth="2" strokeDasharray="4 4"/>
                  <path d="M12 6V12L16 14" stroke="#FE8E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-rental-orange-500 font-outfit text-lg md:text-base font-bold mb-2 tracking-tight">Account Under Review</h3>
                <p className="text-amber-900 font-outfit text-sm md:text-[13px] font-normal leading-relaxed m-0">Your account is currently being processed by our admin team. You can create listings, but they won't be visible to users until your account is approved. This typically takes 1-3 business days.</p>
              </div>
            </div>
          </div>
        )}
        
        {children}
      </main>
    </div>
  )
}

export default AgentLayout

