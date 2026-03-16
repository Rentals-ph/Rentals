'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiChevronDown } from 'react-icons/fi'

// Agent-focused popular searches: by location and by license type
const locationSearches: Record<string, { label: string; location: string }[]> = {
  'Metro Manila': [
    { label: 'Rent managers in Metro Manila', location: 'Metro Manila' },
    { label: 'Property managers in Metro Manila', location: 'Metro Manila' },
    { label: 'Rental agents in Metro Manila', location: 'Metro Manila' },
    { label: 'Real estate brokers in Metro Manila', location: 'Metro Manila' },
    { label: 'Licensed agents in Metro Manila', location: 'Metro Manila' },
  ],
  'Makati City': [
    { label: 'Rent managers in Makati City', location: 'Makati City' },
    { label: 'Property managers in Makati', location: 'Makati City' },
    { label: 'Rental agents in Makati City', location: 'Makati City' },
    { label: 'Brokers in Makati City', location: 'Makati City' },
    { label: 'Agents in Makati', location: 'Makati City' },
  ],
  'Quezon City': [
    { label: 'Rent managers in Quezon City', location: 'Quezon City' },
    { label: 'Property managers in Quezon City', location: 'Quezon City' },
    { label: 'Rental agents in Quezon City', location: 'Quezon City' },
    { label: 'Brokers in Quezon City', location: 'Quezon City' },
    { label: 'Licensed agents in QC', location: 'Quezon City' },
  ],
  'Cebu City': [
    { label: 'Rent managers in Cebu City', location: 'Cebu City' },
    { label: 'Property managers in Cebu', location: 'Cebu City' },
    { label: 'Rental agents in Cebu City', location: 'Cebu City' },
    { label: 'Brokers in Cebu City', location: 'Cebu City' },
    { label: 'Agents in Cebu', location: 'Cebu City' },
  ],
  'BGC': [
    { label: 'Rent managers in BGC', location: 'BGC' },
    { label: 'Property managers in BGC', location: 'BGC' },
    { label: 'Rental agents in BGC', location: 'BGC' },
    { label: 'Brokers in BGC', location: 'BGC' },
    { label: 'Agents in Bonifacio Global City', location: 'BGC' },
  ],
  'Davao City': [
    { label: 'Rent managers in Davao City', location: 'Davao City' },
    { label: 'Property managers in Davao', location: 'Davao City' },
    { label: 'Rental agents in Davao City', location: 'Davao City' },
    { label: 'Brokers in Davao City', location: 'Davao City' },
    { label: 'Agents in Davao', location: 'Davao City' },
  ],
}

const licenseTypeSearches: Record<string, { label: string; license: string; location: string }[]> = {
  'Broker': [
    { label: 'Licensed brokers in Metro Manila', license: 'broker', location: 'Metro Manila' },
    { label: 'Brokers in Makati City', license: 'broker', location: 'Makati City' },
    { label: 'Brokers in Quezon City', license: 'broker', location: 'Quezon City' },
    { label: 'Brokers in Cebu City', license: 'broker', location: 'Cebu City' },
    { label: 'Brokers in BGC', license: 'broker', location: 'BGC' },
  ],
  'Salesperson': [
    { label: 'Salespersons in Metro Manila', license: 'salesperson', location: 'Metro Manila' },
    { label: 'Salespersons in Makati City', license: 'salesperson', location: 'Makati City' },
    { label: 'Salespersons in Quezon City', license: 'salesperson', location: 'Quezon City' },
    { label: 'Salespersons in Cebu City', license: 'salesperson', location: 'Cebu City' },
    { label: 'Salespersons in Davao City', license: 'salesperson', location: 'Davao City' },
  ],
}

type TabType = 'location' | 'license'

function buildAgentSearchUrl(params: { location?: string; license?: string }) {
  const search = new URLSearchParams()
  if (params.location) search.set('location', params.location)
  if (params.license) search.set('license', params.license)
  const q = search.toString()
  return `/agents${q ? `?${q}` : ''}`
}

export default function PopularRentManagers() {
  const [activeTab, setActiveTab] = useState<TabType>('location')
  const [showMore, setShowMore] = useState<Record<string, boolean>>({})

  const data = activeTab === 'location' ? locationSearches : licenseTypeSearches
  const categories = Object.keys(data)

  const toggleShowMore = (category: string) => {
    setShowMore((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  const INITIAL_VISIBLE = 5

  return (
    <section className="bg-white min-h-[50vh] flex px-4 sm:px-6 md:px-10 lg:px-[150px] py-10 sm:py-12 flex-col justify-center">
      <div className="w-full mx-auto">
        <h2
          className="text-center font-outfit text-xl sm:text-2xl md:text-4xl font-bold"
          style={{ color: '#1A3DBF' }}
        >
          Find Rent Managers
        </h2>

        {/* Tabs */}
        <div className="flex justify-center gap-0 mb-8 sm:mb-10 border-b border-gray-200">
          <button
            className={`px-4 sm:px-6 md:px-8 py-3 bg-transparent border-none font-outfit text-sm sm:text-base md:text-lg font-medium cursor-pointer relative transition-colors ${
              activeTab === 'location'
                ? 'font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:bg-[#2563EB] after:rounded-t-[3px]'
                : 'text-gray-500 hover:text-[#2563EB]'
            }`}
            style={
              activeTab === 'location'
                ? { color: '#2563EB' as const }
                : undefined
            }
            onClick={() => setActiveTab('location')}
          >
            By Location
          </button>
          <button
            className={`px-4 sm:px-6 md:px-8 py-3 bg-transparent border-none font-outfit text-sm sm:text-base md:text-lg font-medium cursor-pointer relative transition-colors ${
              activeTab === 'license'
                ? 'font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:bg-[#2563EB] after:rounded-t-[3px]'
                : 'text-gray-500 hover:text-[#2563EB]'
            }`}
            style={
              activeTab === 'license'
                ? { color: '#2563EB' as const }
                : undefined
            }
            onClick={() => setActiveTab('license')}
          >
            By License Type
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-x-[60px] md:gap-y-2 items-start">
          {categories.map((category) => {
            const items =
              activeTab === 'location'
                ? (data as typeof locationSearches)[category]
                : (data as typeof licenseTypeSearches)[category]
            const isExpanded = showMore[category]
            const visibleItems = isExpanded ? items : items.slice(0, INITIAL_VISIBLE)

            return (
              <div key={category} className="grid grid-rows-subgrid row-span-3 flex flex-col">
                <h3
                  className="font-outfit text-base font-bold tracking-wide pb-2"
                  style={{ color: '#374151' }}
                >
                  {category.toUpperCase()}
                </h3>
                <ul className="list-none p-0 m-0 flex flex-col gap-1">
                  {visibleItems.map((item, idx) => {
                    const href =
                      activeTab === 'location'
                        ? buildAgentSearchUrl({
                            location: (item as { label: string; location: string }).location,
                          })
                        : buildAgentSearchUrl({
                            location: (item as { label: string; license: string; location: string })
                              .location,
                            license: (item as { label: string; license: string; location: string })
                              .license,
                          })
                    return (
                      <li key={idx}>
                        <Link
                          href={href}
                          className="font-outfit text-[15px] font-light text-gray-600 no-underline transition-colors hover:text-[#2563EB] hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
                {items.length > INITIAL_VISIBLE && (
                  <button
                    type="button"
                    className="flex items-center gap-2 mt-4 px-0 py-2 bg-transparent border-none font-outfit text-sm font-medium cursor-pointer transition-colors hover:opacity-90"
                    style={{ color: '#2563EB' }}
                    onClick={() => toggleShowMore(category)}
                  >
                    {isExpanded ? 'View Less' : 'View More'}
                    <FiChevronDown
                      className={`text-base transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
