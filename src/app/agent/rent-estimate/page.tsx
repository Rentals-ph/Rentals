'use client'

import { useMemo, useState } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import AgentHeader from '../../../components/agent/AgentHeader'
import {
  FiMapPin,
  FiChevronDown
} from 'react-icons/fi'

export default function AgentRentEstimate() {
  const [propertyType, setPropertyType] = useState('')
  const [location, setLocation] = useState('')
  const [keyword, setKeyword] = useState('')
  const [estimate, setEstimate] = useState<string | null>(null)

  const propertyTypeOptions = useMemo(
    () => [
      { value: '', label: 'Select Property Type' },
      { value: 'condo', label: 'Condominium' },
      { value: 'apartment', label: 'Apartment' },
      { value: 'house', label: 'House' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'commercial', label: 'Commercial Space' }
    ],
    []
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const base = propertyType ? 28000 : 0
    const bonus = location.trim() ? 4000 : 0
    const kw = keyword.trim() ? 2000 : 0
    const computed = base + bonus + kw
    setEstimate(computed ? `P${computed.toLocaleString()} /month` : null)
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar/>

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="Rent Estimate" 
          subtitle="Calculate estimated rental value for your properties." 
        />

        <section className="flex flex-col gap-[18px]">
          <div className="w-full max-w-[520px] bg-white rounded-[10px] shadow-[0_10px_25px_rgba(17,24,39,0.12)] overflow-hidden mx-auto md:max-w-full">
            <div className="bg-blue-600 py-[18px] px-[22px]">
              <h3 className="m-0 text-lg font-bold text-white text-center">Get Rental Price Estimates Instantly</h3>
            </div>

            <form className="p-[22px] flex flex-col gap-3.5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label htmlFor="propertyType" className="text-sm font-semibold text-gray-900">Select Property Type</label>
                <div className="relative">
                  <select
                    id="propertyType"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full py-3 pl-3.5 pr-11 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 outline-none appearance-none focus:border-blue-600 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                  >
                    {propertyTypeOptions.map((opt) => (
                      <option key={opt.value || 'empty'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="location" className="text-sm font-semibold text-gray-900">Search Location</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full py-3 pr-3.5 pl-[42px] border border-gray-300 rounded-lg bg-white text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-600 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                    placeholder="Select Property Type"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="keyword" className="text-sm font-semibold text-gray-900">Custom Keyword (Optional)</label>
                <input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full py-3 px-3.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-600 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                  placeholder="e.g., Property Name, near IT Park, with sea view"
                />
              </div>

              <button type="submit" className="mt-1 w-full py-[13px] px-4 border-0 rounded-lg bg-blue-600 text-white text-sm font-bold cursor-pointer transition-all duration-75 ease-in hover:bg-blue-700 active:translate-y-px">
                Get Estimate
              </button>

              {estimate && (
                <div className="flex items-baseline justify-between gap-2.5 py-3 px-3.5 rounded-[10px] bg-blue-50 border border-blue-200" role="status" aria-live="polite">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Estimated Rent</span>
                  <span className="text-base font-extrabold text-gray-900">{estimate}</span>
                </div>
              )}

              <div className="pt-2 text-center text-gray-500 text-xs leading-relaxed">
                <p className="m-0">
                  <strong>Please take note:</strong> The estimated price should still be aligned with the
                  prices of neighboring properties.
                </p>
                <p className="m-0 mt-2">Kindly consider and listen to the current market trends when setting your price.</p>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
