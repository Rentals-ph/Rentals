'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../common/AppSidebar'
import { getAsset } from '../../utils/assets'
import type { ReactNode } from 'react'

export interface CreateListingChoiceProps {
  /** Header element (e.g. AgentHeader or BrokerHeader) */
  header: ReactNode
  /** Route for manual flow (e.g. /agent/create-listing/basic-info or /broker/create-listing/basic-info) */
  manualHref: string
  /** Route for AI assistant (e.g. /agent/listing-assistant or /broker/listing-assistant) */
  aiAssistantHref: string
}

export function CreateListingChoice({
  header,
  manualHref,
  aiAssistantHref,
}: CreateListingChoiceProps) {
  const router = useRouter()
  const [hoveredOption, setHoveredOption] = useState<'manual' | 'ai' | null>(null)

  const handleManualCreate = () => {
    router.push(manualHref)
  }

  const handleAIAssistant = () => {
    router.push(aiAssistantHref)
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        {header}

        <div className="grid grid-cols-2 gap-6 my-4 mb-8 max-[900px]:grid-cols-1">
          {/* Manual Input Option */}
          <div
            className={`bg-white border-2 border-gray-200 rounded-2xl p-8 max-[640px]:p-6 cursor-pointer transition-all duration-[250ms] ease-out flex flex-col relative overflow-hidden ${
              hoveredOption === 'manual' ? 'border-blue-600 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.2)] -translate-y-1' : ''
            }`}
            onClick={handleManualCreate}
            onMouseEnter={() => setHoveredOption('manual')}
            onMouseLeave={() => setHoveredOption(null)}
          >
            <div className="w-[72px] h-[72px] max-[640px]:w-14 max-[640px]:h-14 rounded-2xl flex items-center justify-center mb-5 bg-blue-50 text-blue-600">
              <svg width="48" height="48" className="max-[640px]:w-8 max-[640px]:h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <h3 className="text-[22px] max-[640px]:text-lg font-bold text-gray-900 m-0 mb-2">Manual Input</h3>
              <p className="text-[15px] text-gray-500 m-0 mb-5 leading-normal">Fill out the listing form step by step with full control over every detail.</p>
              <ul className="list-none p-0 m-0 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                  <svg width="16" height="16" className="text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Complete control over all fields
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                  <svg width="16" height="16" className="text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Step-by-step guided process
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                  <svg width="16" height="16" className="text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload images at each step
                </li>
              </ul>
            </div>
            <div className="mt-auto">
              <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-blue-600 transition-all duration-200">
                Start Manual Entry
                <svg width="20" height="20" className={`transition-transform duration-200 ${hoveredOption === 'manual' ? 'translate-x-1' : ''}`} viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>

          {/* AI Assistant Option */}
          <div
            className={`border-2 border-blue-300 rounded-2xl p-8 max-[640px]:p-6 cursor-pointer transition-all duration-[250ms] ease-out flex flex-col relative overflow-hidden ${
              hoveredOption === 'ai' ? 'border-blue-500 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.25)] -translate-y-1' : ''
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(249, 115, 22, 0.2) 100%)'
            }}
            onClick={handleAIAssistant}
            onMouseEnter={() => setHoveredOption('ai')}
            onMouseLeave={() => setHoveredOption(null)}
          >
            <div className="absolute top-4 right-4 bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-gray-200">
              <img
                src={getAsset('LOGO_AI') || '/assets/logos/rentals-ai-logo.png'}
                alt="RentalsAI"
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-xs">Powered by RentalsAI</span>
            </div>
            <div className="w-[72px] h-[72px] max-[640px]:w-14 max-[640px]:h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-500">
              <svg width="48" height="48" className="max-[640px]:w-8 max-[640px]:h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <h3 className="text-[22px] max-[640px]:text-lg font-bold text-gray-900 m-0 mb-2">AI Assistant</h3>
              <p className="text-[15px] text-gray-500 m-0 mb-5 leading-normal">Describe your property naturally and let AI extract all the details for you.</p>
              <ul className="list-none p-0 m-0 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                  <svg width="16" height="16" className="text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Just describe your property
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                  <svg width="16" height="16" className="text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  AI fills out the form automatically
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                  <svg width="16" height="16" className="text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Generate professional descriptions
                </li>
              </ul>
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Example:</span>
                <span className="text-sm text-indigo-500 italic">&quot;3BR house in QC, 7.5M, with parking and garden&quot;</span>
              </div>
            </div>
            <div className="mt-auto">
              <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-indigo-500 transition-all duration-200">
                Try AI Assistant
                <svg width="20" height="20" className={`transition-transform duration-200 ${hoveredOption === 'ai' ? 'translate-x-1' : ''}`} viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Comparison section */}
        <div
          className="relative rounded-2xl px-8 py-6 text-center overflow-hidden border-2 border-blue-200 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(255, 247, 237, 0.8) 100%)'
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h4 className="text-lg font-bold text-gray-900 m-0">Not sure which to choose?</h4>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-start md:items-center max-w-3xl mx-auto">
              <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl px-5 py-4 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <strong className="text-base font-semibold text-gray-900">Manual Input</strong>
                </div>
                <p className="text-sm text-gray-600 m-0 leading-relaxed">
                  Great when you have specific details ready and want complete control.
                </p>
              </div>
              <div className="flex items-center justify-center text-gray-400 my-2 md:my-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl px-5 py-4 border border-orange-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-orange-600">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <strong className="text-base font-semibold text-gray-900">AI Assistant</strong>
                </div>
                <p className="text-sm text-gray-600 m-0 leading-relaxed">
                  Perfect when you want to describe the property naturally and save time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
