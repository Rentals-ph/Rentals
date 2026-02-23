'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import AgentHeader from '../../../components/agent/AgentHeader'
import { propertiesApi, agentsApi } from '../../../api'
import type { Property } from '../../../types'
import {
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiHelpCircle
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind

export default function AgentRentalTracker() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const days = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  useEffect(() => {
    const fetchAgentProperties = async () => {
      try {
        // Get current agent
        const agent = await agentsApi.getCurrent()
        
        if (agent?.id) {
          // Fetch properties for this agent
          const agentProperties = await propertiesApi.getByAgentId(agent.id)
          setProperties(agentProperties)
        }
      } catch (error) {
        console.error('Error fetching agent properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgentProperties()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar/>

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <AgentHeader 
          title="Rental Tracker" 
          subtitle="Track and analyze your rental property performance." 
        />

        <div className="flex-1 overflow-y-auto p-6">
          

          <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xl font-bold text-gray-900">Rental Due Calendar</span>
              </div>
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200" type="button">
                Add Rental Dues
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <div className="text-lg font-semibold text-gray-900">{formatMonthYear(currentDate)}</div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 border border-gray-300" type="button" onClick={goToToday}>
                    Today
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-gray-600 hover:bg-gray-100 transition-colors duration-200 border border-gray-300" type="button" aria-label="Previous month" onClick={goToPreviousMonth}>
                    <FiChevronLeft />
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200" type="button" aria-label="Next month" onClick={goToNextMonth}>
                    <FiChevronRight />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => (
                    <div
                      key={index}
                      className={`aspect-square flex items-center justify-center rounded-lg border transition-colors duration-200 ${day === null ? 'border-transparent' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'} ${day !== null && isToday(day) ? 'bg-blue-600 text-white font-bold border-blue-600 hover:bg-blue-700' : 'text-gray-900'}`}
                    >
                      {day !== null && <span>{day}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add/Edit Rental Due</h3>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">Select Property By Title</span>
                  <div className="relative">
                    <select 
                      value={selectedPropertyId} 
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        {loading ? 'Loading properties...' : 'Select...'}
                      </option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id.toString()}>
                          {property.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4 lg:grid-cols-1">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">Firstname</span>
                  <input className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">Lastname</span>
                  <input className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">Tenant Email</span>
                  <input className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="" />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4 lg:grid-cols-1">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Rent Amount
                    <span className="text-gray-400 cursor-help" title="Enter monthly rent amount">
                      <FiHelpCircle />
                    </span>
                  </span>
                  <input className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">Due Date</span>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      type="date"
                      placeholder="mm/dd/yyyy" 
                    />
                  </div>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">Duration (Months)</span>
                  <div className="relative">
                    <select defaultValue="1" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer">
                      <option value="1">1 month</option>
                      <option value="2">2 months</option>
                      <option value="3">3 months</option>
                      <option value="6">6 months</option>
                      <option value="12">12 months</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">Notes</span>
                  <textarea className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" placeholder="Your message here..." rows={5} />
                </label>
              </div>

              <div className="flex justify-end">
                <button className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors duration-200" type="button">
                  Save
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h3 className="text-xl font-bold text-gray-900">Rental Payment History</h3>
              <div className="relative flex-1 max-w-sm">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search payments..."
                  type="search"
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <div className="min-w-full">
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-t-xl font-semibold text-sm text-gray-700">
                  <div>Tenant</div>
                  <div>Propery Name</div>
                  <div>Payment Paid</div>
                  <div className="text-right">Actions</div>
                </div>
                <div className="flex items-center justify-center p-8 text-gray-500">No Payment History Found.</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
