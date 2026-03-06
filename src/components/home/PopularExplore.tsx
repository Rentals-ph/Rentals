'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiChevronDown } from 'react-icons/fi'
import FadeInOnView from '@/components/common/FadeInOnView'

// ---------- Property searches ----------

const propertyTypeSearches = {
  'Apartment / Condo': [
    { label: 'Apartments for rent in Metro Manila', type: 'Apartment', location: 'Metro Manila' },
    { label: 'Apartments for rent in Makati', type: 'Apartment', location: 'Makati City' },
    { label: 'Apartments for rent in BGC', type: 'Apartment', location: 'BGC' },
    { label: 'Condominiums for rent in Quezon City', type: 'Condominium', location: 'Quezon City' },
    { label: 'Condominiums for rent in Cebu City', type: 'Condominium', location: 'Cebu City' },
  ],
  House: [
    { label: 'Houses for rent in Metro Manila', type: 'House', location: 'Metro Manila' },
    { label: 'Houses for rent in Quezon City', type: 'House', location: 'Quezon City' },
    { label: 'Houses for rent in Davao City', type: 'House', location: 'Davao City' },
    { label: 'Houses for rent in Cebu City', type: 'House', location: 'Cebu City' },
    { label: 'Houses for rent in Makati', type: 'House', location: 'Makati City' },
  ],
  Studio: [
    { label: 'Studios for rent in Makati', type: 'Studio', location: 'Makati City' },
    { label: 'Studios for rent in BGC', type: 'Studio', location: 'BGC' },
    { label: 'Studios for rent in Quezon City', type: 'Studio', location: 'Quezon City' },
    { label: 'Studios for rent in Mandaluyong', type: 'Studio', location: 'Mandaluyong' },
    { label: 'Studios for rent in Pasig', type: 'Studio', location: 'Pasig' },
  ],
  'Commercial / Office': [
    { label: 'Commercial spaces in Metro Manila', type: 'Commercial Spaces', location: 'Metro Manila' },
    { label: 'Office spaces in Makati', type: 'Office Spaces', location: 'Makati City' },
    { label: 'Office spaces in BGC', type: 'Office Spaces', location: 'BGC' },
    { label: 'Commercial spaces in Cebu City', type: 'Commercial Spaces', location: 'Cebu City' },
    { label: 'Warehouses in Metro Manila', type: 'WareHouse', location: 'Metro Manila' },
  ],
  Others: [
    { label: 'Townhouses for rent in Metro Manila', type: 'TownHouse', location: 'Metro Manila' },
    { label: 'Bed spaces in Makati', type: 'Bed Space', location: 'Makati City' },
    { label: 'Dormitories in Quezon City', type: 'Dormitory', location: 'Quezon City' },
    { label: 'Bed spaces in Manila', type: 'Bed Space', location: 'Manila' },
    { label: 'Townhouses for rent in Quezon City', type: 'TownHouse', location: 'Quezon City' },
  ],
}

const locationSearches = {
  'Metro Manila': [
    { label: 'Apartments for rent in Metro Manila', type: 'Apartment', location: 'Metro Manila' },
    { label: 'Condominiums for rent in Metro Manila', type: 'Condominium', location: 'Metro Manila' },
    { label: 'Houses for rent in Metro Manila', type: 'House', location: 'Metro Manila' },
    { label: 'Studios for rent in Metro Manila', type: 'Studio', location: 'Metro Manila' },
    { label: 'Commercial spaces in Metro Manila', type: 'Commercial Spaces', location: 'Metro Manila' },
  ],
  'Makati City': [
    { label: 'Apartments for rent in Makati', type: 'Apartment', location: 'Makati City' },
    { label: 'Condominiums for rent in Makati', type: 'Condominium', location: 'Makati City' },
    { label: 'Studios for rent in Makati', type: 'Studio', location: 'Makati City' },
    { label: 'Office spaces in Makati', type: 'Office Spaces', location: 'Makati City' },
    { label: 'Bed spaces in Makati', type: 'Bed Space', location: 'Makati City' },
  ],
  'Quezon City': [
    { label: 'Apartments for rent in Quezon City', type: 'Apartment', location: 'Quezon City' },
    { label: 'Condominiums for rent in Quezon City', type: 'Condominium', location: 'Quezon City' },
    { label: 'Houses for rent in Quezon City', type: 'House', location: 'Quezon City' },
    { label: 'Studios for rent in Quezon City', type: 'Studio', location: 'Quezon City' },
    { label: 'Townhouses for rent in Quezon City', type: 'TownHouse', location: 'Quezon City' },
  ],
  'Cebu City': [
    { label: 'Apartments for rent in Cebu City', type: 'Apartment', location: 'Cebu City' },
    { label: 'Condominiums for rent in Cebu City', type: 'Condominium', location: 'Cebu City' },
    { label: 'Houses for rent in Cebu City', type: 'House', location: 'Cebu City' },
    { label: 'Studios for rent in Cebu City', type: 'Studio', location: 'Cebu City' },
    { label: 'Commercial spaces in Cebu City', type: 'Commercial Spaces', location: 'Cebu City' },
  ],
  BGC: [
    { label: 'Apartments for rent in BGC', type: 'Apartment', location: 'BGC' },
    { label: 'Condominiums for rent in BGC', type: 'Condominium', location: 'BGC' },
    { label: 'Studios for rent in BGC', type: 'Studio', location: 'BGC' },
    { label: 'Office spaces in BGC', type: 'Office Spaces', location: 'BGC' },
    { label: 'Houses for rent in BGC', type: 'House', location: 'BGC' },
  ],
  'Davao City': [
    { label: 'Apartments for rent in Davao City', type: 'Apartment', location: 'Davao City' },
    { label: 'Condominiums for rent in Davao City', type: 'Condominium', location: 'Davao City' },
    { label: 'Houses for rent in Davao City', type: 'House', location: 'Davao City' },
    { label: 'Studios for rent in Davao City', type: 'Studio', location: 'Davao City' },
    { label: 'Commercial spaces in Davao City', type: 'Commercial Spaces', location: 'Davao City' },
  ],
}

type PropertyTab = 'type' | 'location'

function buildPropertySearchUrl(type: string, location: string) {
  const params = new URLSearchParams()
  params.set('type', type)
  params.set('location', location)
  return `/properties?${params.toString()}`
}

// ---------- Agent searches ----------

const agentLocationSearches: Record<string, { label: string; location: string }[]> = {
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
  BGC: [
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

const agentLicenseSearches: Record<string, { label: string; license: string; location: string }[]> = {
  Broker: [
    { label: 'Licensed brokers in Metro Manila', license: 'broker', location: 'Metro Manila' },
    { label: 'Brokers in Makati City', license: 'broker', location: 'Makati City' },
    { label: 'Brokers in Quezon City', license: 'broker', location: 'Quezon City' },
    { label: 'Brokers in Cebu City', license: 'broker', location: 'Cebu City' },
    { label: 'Brokers in BGC', license: 'broker', location: 'BGC' },
  ],
  Salesperson: [
    { label: 'Salespersons in Metro Manila', license: 'salesperson', location: 'Metro Manila' },
    { label: 'Salespersons in Makati City', license: 'salesperson', location: 'Makati City' },
    { label: 'Salespersons in Quezon City', license: 'salesperson', location: 'Quezon City' },
    { label: 'Salespersons in Cebu City', license: 'salesperson', location: 'Cebu City' },
    { label: 'Salespersons in Davao City', license: 'salesperson', location: 'Davao City' },
  ],
}

type AgentTab = 'location' | 'license'

function buildAgentSearchUrl(params: { location?: string; license?: string }) {
  const search = new URLSearchParams()
  if (params.location) search.set('location', params.location)
  if (params.license) search.set('license', params.license)
  const q = search.toString()
  return `/agents${q ? `?${q}` : ''}`
}

type MainTab = 'searches' | 'agents'

export default function PopularExplore() {
  const [mainTab, setMainTab] = useState<MainTab>('searches')
  const [propertyTab, setPropertyTab] = useState<PropertyTab>('type')
  const [agentTab, setAgentTab] = useState<AgentTab>('location')
  const [propertyShowMore, setPropertyShowMore] = useState<Record<string, boolean>>({})
  const [agentShowMore, setAgentShowMore] = useState<Record<string, boolean>>({})

  const propertyData = propertyTab === 'type' ? propertyTypeSearches : locationSearches
  const propertyCategories = Object.keys(propertyData)

  const agentData = agentTab === 'location' ? agentLocationSearches : agentLicenseSearches
  const agentCategories = Object.keys(agentData)

  const INITIAL_VISIBLE = 5

  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-[150px] w-full py-8 sm:py-12 md:py-16">
      <div className="w-full mx-auto ">
        <FadeInOnView
          as="div"
          className="text-center mx-auto mb-6 sm:mb-8"
        >
          <div className="flex justify-center border-b border-gray-200 mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              className={`px-4 sm:px-6 py-2 sm:py-3 bg-transparent border-none font-outfit text-base sm:text-lg md:text-xl font-medium cursor-pointer relative transition-colors whitespace-nowrap flex-shrink-0 ${mainTab === 'searches'
                ? 'text-rental-blue-600 font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-rental-blue-600'
                : 'text-gray-500 hover:text-rental-blue-600'
                }`}
              onClick={() => setMainTab('searches')}
            >
              Popular Real Estate Searches
            </button>
            <button
              className={`px-4 sm:px-6 py-2 sm:py-3 bg-transparent border-none font-outfit text-base sm:text-lg md:text-xl font-medium cursor-pointer relative transition-colors whitespace-nowrap flex-shrink-0 ${mainTab === 'agents'
                ? 'text-rental-blue-600 font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-rental-blue-600'
                : 'text-gray-500 hover:text-rental-blue-600'
                }`}
              onClick={() => setMainTab('agents')}
            >
              Popular Real Estate Agents
            </button>
          </div>
          <p className="text-gray-600 font-outfit text-sm sm:text-base md:text-lg leading-relaxed">
            {mainTab === 'searches'
              ? 'Quickly jump into the most in-demand property searches.'
              : 'Find trusted agents in key Philippine cities.'}
          </p>
        </FadeInOnView>

        <div className="w-full mx-auto">
          {/* Popular property searches */}
          {mainTab === 'searches' && (
            <FadeInOnView as="div" delayMs={120}>
              <div className="flex justify-center border-b border-gray-200 mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  className={`px-3 sm:px-4 py-2 bg-transparent border-none font-outfit text-xs sm:text-sm md:text-base font-medium cursor-pointer relative transition-colors whitespace-nowrap flex-shrink-0 ${propertyTab === 'type'
                    ? 'text-rental-blue-600 font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-rental-blue-600'
                    : 'text-gray-500 hover:text-rental-blue-600'
                    }`}
                  onClick={() => setPropertyTab('type')}
                >
                  By Property Type
                </button>
                <button
                  className={`px-3 sm:px-4 py-2 bg-transparent border-none font-outfit text-xs sm:text-sm md:text-base font-medium cursor-pointer relative transition-colors whitespace-nowrap flex-shrink-0 ${propertyTab === 'location'
                    ? 'text-rental-blue-600 font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-rental-blue-600'
                    : 'text-gray-500 hover:text-rental-blue-600'
                    }`}
                  onClick={() => setPropertyTab('location')}
                >
                  By Location
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 md:gap-5 pr-1">
                {propertyCategories.map((category) => {
                  const items = (propertyData as any)[category] as {
                    label: string
                    type: string
                    location: string
                  }[]
                  const isExpanded = propertyShowMore[category]
                  const visibleItems = isExpanded ? items : items.slice(0, INITIAL_VISIBLE)

                  return (
                    <div key={category} className="flex flex-col">
                      <h4 className="font-outfit text-xs sm:text-sm font-semibold text-gray-700 tracking-wide pb-1.5">
                        {category.toUpperCase()}
                      </h4>
                      <ul className="list-none p-0 m-0 flex flex-col gap-1">
                        {visibleItems.map((item, idx) => (
                          <li key={idx}>
                            <Link
                              href={buildPropertySearchUrl(item.type, item.location)}
                              className="font-outfit text-[13px] sm:text-sm font-light text-gray-600 no-underline transition-colors hover:text-rental-blue-600 hover:underline"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {items.length > INITIAL_VISIBLE && (
                        <button
                          className="flex items-center gap-1.5 mt-3 px-0 py-1 bg-transparent border-none font-outfit text-xs sm:text-sm font-medium text-rental-blue-600 cursor-pointer transition-colors hover:text-rental-blue-700"
                          onClick={() =>
                            setPropertyShowMore((prev) => ({
                              ...prev,
                              [category]: !prev[category],
                            }))
                          }
                        >
                          {isExpanded ? 'View Less' : 'View More'}
                          <FiChevronDown
                            className={`text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </FadeInOnView>
          )}

          {/* Popular agent searches */}
          {mainTab === 'agents' && (
            <FadeInOnView as="div" delayMs={120}>
              <div className="flex justify-center border-b border-gray-200 mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  className={`px-3 sm:px-4 py-2 bg-transparent border-none font-outfit text-xs sm:text-sm md:text-base font-medium cursor-pointer relative transition-colors whitespace-nowrap flex-shrink-0 ${agentTab === 'location'
                    ? 'text-rental-blue-600 font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-rental-blue-600'
                    : 'text-gray-500 hover:text-rental-blue-600'
                    }`}
                  onClick={() => setAgentTab('location')}
                >
                  By Location
                </button>
                <button
                  className={`px-3 sm:px-4 py-2 bg-transparent border-none font-outfit text-xs sm:text-sm md:text-base font-medium cursor-pointer relative transition-colors whitespace-nowrap flex-shrink-0 ${agentTab === 'license'
                    ? 'text-rental-blue-600 font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-rental-blue-600'
                    : 'text-gray-500 hover:text-rental-blue-600'
                    }`}
                  onClick={() => setAgentTab('license')}
                >
                  By License Type
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 md:gap-5 pr-1">
                {agentCategories.map((category) => {
                  const items =
                    agentTab === 'location'
                      ? (agentData as typeof agentLocationSearches)[category]
                      : (agentData as typeof agentLicenseSearches)[category]
                  const isExpanded = agentShowMore[category]
                  const visibleItems = isExpanded ? items : items.slice(0, INITIAL_VISIBLE)

                  return (
                    <div key={category} className="flex flex-col">
                      <h4 className="font-outfit text-xs sm:text-sm font-semibold text-gray-700 tracking-wide pb-1.5">
                        {category.toUpperCase()}
                      </h4>
                      <ul className="list-none p-0 m-0 flex flex-col gap-1">
                        {visibleItems.map((item, idx) => {
                          const href =
                            agentTab === 'location'
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
                                className="font-outfit text-[13px] sm:text-sm font-light text-gray-600 no-underline transition-colors hover:text-rental-blue-600 hover:underline"
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
                          className="flex items-center gap-1.5 mt-3 px-0 py-1 bg-transparent border-none font-outfit text-xs sm:text-sm font-medium cursor-pointer transition-colors"
                          style={{ color: '#2563EB' }}
                          onClick={() =>
                            setAgentShowMore((prev) => ({
                              ...prev,
                              [category]: !prev[category],
                            }))
                          }
                        >
                          {isExpanded ? 'View Less' : 'View More'}
                          <FiChevronDown
                            className={`text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </FadeInOnView>
          )}
        </div>
      </div>
    </section>
  )
}

