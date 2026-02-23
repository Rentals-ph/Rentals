'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppSidebar from '../../components/common/AppSidebar'
import BrokerHeader from '../../components/broker/BrokerHeader'
import { agentsApi, propertiesApi } from '../../api'
import { brokerApi } from '../../api'
import type { Agent } from '../../api/endpoints/agents'
import type { Property } from '../../types'
import {
  FiUsers,
  FiHome,
  FiCheck,
  FiEdit,
  FiUserPlus,
  FiX,
  FiTarget,
  FiBarChart2,
  FiLayers,
} from 'react-icons/fi'

// Mock data for Top Performers (display like image: name, deals closed, amount)
const topPerformersMock = [
  { name: 'David Wilson', deals: 15, amount: '$890K', color: '#3B82F6' },
  { name: 'Lisa Johnson', deals: 12, amount: '$745K', color: '#10B981' },
  { name: 'Robert Taylor', deals: 11, amount: '$682K', color: '#F59E0B' },
  { name: 'Jennifer Lee', deals: 9, amount: '$567K', color: '#8B5CF6' },
  { name: 'James Brown', deals: 8, amount: '$523K', color: '#EC4899' },
]

const pendingApprovals = [
  { name: 'Sarah Miller', description: 'New agent registration', color: '#F59E0B' },
  { name: 'Michael Chen', description: 'Listing modification', color: '#8B5CF6' },
  { name: 'Emma Davis', description: 'New listing submission', color: '#EC4899' },
]

const recentActivity = [
  { name: 'David Wilson', action: 'closed a deal', time: '2 hours ago', icon: 'check', color: 'green' },
  { name: 'Lisa Johnson', action: 'added new listing', time: '4 hours ago', icon: 'home', color: 'blue' },
  { name: 'Sarah Miller', action: 'joined the team', time: '1 day ago', icon: 'user', color: 'purple' },
  { name: 'Michael Chen', action: 'updated listing', time: '1 day ago', icon: 'edit', color: 'orange' },
  { name: 'Emma Davis', action: 'listing expired', time: '2 days ago', icon: 'x', color: 'red' },
]

// Team Performance chart data (Deals Closed & Revenue by month)
const performanceData = [
  { month: 'Jan', dealsClosed: 32, revenue: 1.9 },
  { month: 'Feb', dealsClosed: 38, revenue: 2.2 },
  { month: 'Apr', dealsClosed: 35, revenue: 2.0 },
  { month: 'May', dealsClosed: 42, revenue: 2.5 },
  { month: 'Jun', dealsClosed: 45, revenue: 2.8 },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'check':
      return <FiCheck />
    case 'home':
      return <FiHome />
    case 'user':
      return <FiUserPlus />
    case 'edit':
      return <FiEdit />
    case 'x':
      return <FiX />
    default:
      return <FiCheck />
  }
}

export default function BrokerDashboard() {
  const [userName, setUserName] = useState('John')
  const [activeTab, setActiveTab] = useState<'month' | 'quarter' | 'year'>('quarter')
  const [loading, setLoading] = useState(true)
  const [totalAgents, setTotalAgents] = useState(0)
  const [totalTeams, setTotalTeams] = useState(0)
  const [activeListings, setActiveListings] = useState(0)
  const [totalListings, setTotalListings] = useState(0)
  const [recentProperties, setRecentProperties] = useState<Property[]>([])
  const [topPerformers, setTopPerformers] = useState<Array<{ name: string; deals: number; amount: string; color: string }>>(topPerformersMock)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('agent_name') || localStorage.getItem('user_name') || 'John Anderson'
      setUserName(name.split(' ')[0] || 'John')
    }
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [agents, propertiesRes, dashboardData] = await Promise.all([
          agentsApi.getAll().catch(() => []),
          propertiesApi.getAll().catch(() => []),
          brokerApi.getDashboard().catch(() => null),
        ])
        const agentsList = Array.isArray(agents) ? agents : []
        setTotalAgents(agentsList.length)
        if (dashboardData?.teams_count != null) setTotalTeams(dashboardData.teams_count)
        else {
          const teams = await brokerApi.getTeams().catch(() => [])
          setTotalTeams(Array.isArray(teams) ? teams.length : 0)
        }
        const properties = Array.isArray(propertiesRes) ? propertiesRes : (propertiesRes as any)?.data ?? []
        const total = Array.isArray(properties) ? properties.length : 0
        setTotalListings(total)
        const active = Array.isArray(properties) ? properties.filter((p: Property) => p.published_at).length : 0
        setActiveListings(active)
        const recent = Array.isArray(properties)
          ? [...properties]
              .sort((a: Property, b: Property) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                return dateB - dateA
              })
              .slice(0, 4)
          : []
        setRecentProperties(recent)
        if (Array.isArray(properties) && agentsList.length > 0) {
          const agentPropertyCounts: Record<number, { agent: Agent; count: number }> = {}
          properties.forEach((p: Property) => {
            if (p.agent_id) {
              if (!agentPropertyCounts[p.agent_id]) {
                const agent = agentsList.find((a: Agent) => a.id === p.agent_id)
                if (agent) agentPropertyCounts[p.agent_id] = { agent, count: 0 }
              }
              if (agentPropertyCounts[p.agent_id]) agentPropertyCounts[p.agent_id].count++
            }
          })
          const performers = Object.values(agentPropertyCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((item, index) => {
              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
              const name = item.agent.full_name || `${item.agent.first_name || ''} ${item.agent.last_name || ''}`.trim() || 'Unknown'
              return {
                name,
                deals: item.count,
                amount: `₱${(item.count * 50000).toLocaleString()}`,
                color: colors[index] || '#3B82F6',
              }
            })
          if (performers.length > 0) setTopPerformers(performers)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const chartHeight = 220
  const chartWidth = 400
  const padding = { top: 20, right: 40, bottom: 30, left: 45 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom
  const dealsRange = { min: 30, max: 45 }
  const revenueRange = { min: 1.8, max: 2.8 }
  const pointsDeals = performanceData.map((d, i) => ({
    x: padding.left + (i / (performanceData.length - 1)) * innerWidth,
    y: padding.top + innerHeight - ((d.dealsClosed - dealsRange.min) / (dealsRange.max - dealsRange.min)) * innerHeight,
  }))
  const pointsRevenue = performanceData.map((d, i) => ({
    x: padding.left + (i / (performanceData.length - 1)) * innerWidth,
    y: padding.top + innerHeight - ((d.revenue - revenueRange.min) / (revenueRange.max - revenueRange.min)) * innerHeight,
  }))
  const linePathDeals = pointsDeals.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const linePathRevenue = pointsRevenue.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="flex min-h-screen bg-gray-50 font-outfit">
      <AppSidebar />
      <main className="main-with-sidebar flex-1 min-h-screen">
        <div className="p-8 lg:py-6 md:py-4 md:pt-15">
          <BrokerHeader
            title="Dashboard Overview"
            subtitle={`Welcome back, ${userName}! Here's what's happening with your team.`}
            showNotifications
            showAddListing
          />

          {/* Stats Cards - 4 compact box cards */}
          <div className="grid grid-cols-4 gap-3 mb-6  w-[100%] lg:grid-cols-4 md:grid-cols-2">
            <div className="bg-white rounded-2xl border border-gray-200 py-3.5 px-4 flex items-start gap-3 box-border shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-blue-50 text-blue-600 box-border">
                <FiUsers />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[16px] font-medium text-gray-500">Total Agents</span>
                 
                </div>
                <div className="text-lg font-bold text-gray-900 leading-tight">{loading ? '...' : totalAgents}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 py-3.5 px-4 flex items-start gap-3 box-border shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-emerald-50 text-emerald-600 box-border">
                <FiHome />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[16px] font-medium text-gray-500">Active Listings</span>
                
                </div>
                <div className="text-lg font-bold text-gray-900 leading-tight">{loading ? '...' : activeListings}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 py-3.5 px-4 flex items-start gap-3 box-border shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-amber-50 text-amber-600 box-border">
                <FiTarget />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[16px] font-medium text-gray-500">Total Listings</span>
                 
                </div>
                <div className="text-lg font-bold text-gray-900 leading-tight">{loading ? '...' : totalListings}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 py-3.5 px-4 flex items-start gap-3 box-border shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-violet-50 text-violet-600 box-border">
                <FiLayers />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[16px] font-medium text-gray-500">Total Teams</span>
                  
                </div>
                <div className="text-lg font-bold text-gray-900 leading-tight">{loading ? '...' : totalTeams}</div>
              </div>
            </div>
          </div>

          {/* Two-column layout: Left = Team Performance + Top Performers | Right = Pending Approvals + Listings by Status + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-6">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              {/* Team Performance */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-gray-900 m-0">Team Performance</h3>
                  <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    {(['month', 'quarter', 'year'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Deals Closed
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue (M)
                  </span>
                </div>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-full h-[220px]" preserveAspectRatio="xMidYMid meet">
                  <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#E5E7EB" strokeWidth="1" />
                  <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#E5E7EB" strokeWidth="1" />
                  {performanceData.map((d, i) => (
                    <text key={d.month} x={padding.left + (i / (performanceData.length - 1)) * innerWidth} y={chartHeight - 8} textAnchor="middle" className="text-[10px] fill-gray-500" fontSize="10">{d.month}</text>
                  ))}
                  <path d={linePathDeals} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={linePathRevenue} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Top Performers */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 m-0 mb-5">Top Performers</h3>
                {loading ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
                ) : topPerformers.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {topPerformers.map((performer, index) => (
                      <div className="flex items-center gap-3" key={index}>
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                          style={{ background: performer.color }}
                        >
                          {getInitials(performer.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{performer.name}</div>
                          <div className="text-xs text-gray-500">{performer.deals} deals closed</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 flex-shrink-0">{performer.amount}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">No performers data</div>
                )}
              </div>
            </div>

            {/* Right column: Pending Approvals, Listings by Status, Recent Activity */}
            <div className="flex flex-col gap-6">
              {/* Pending Approvals - side card */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 m-0 mb-5">Pending Approvals</h3>
                <div className="flex flex-col gap-4">
                  {pendingApprovals.map((approval, index) => (
                    <div className="flex gap-3" key={index}>
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                        style={{ background: approval.color }}
                      >
                        {getInitials(approval.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{approval.name}</div>
                        <div className="text-xs text-gray-500 mb-2">{approval.description}</div>
                        <div className="flex gap-2">
                          <button type="button" className="py-1.5 px-3 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-md border-0 cursor-pointer hover:bg-emerald-100 transition-colors">
                            Approve
                          </button>
                          <button type="button" className="py-1.5 px-3 bg-gray-100 text-gray-600 text-xs font-medium rounded-md border-0 cursor-pointer hover:bg-gray-200 transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/broker/approvals" className="block text-center mt-5 pt-4 border-t border-gray-100 text-sm font-medium text-blue-600 no-underline hover:text-blue-700">
                  View All (5)
                </Link>
              </div>

              {/* Listings by Status - doughnut */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 m-0 mb-5">Listings by Status</h3>
                <div className="flex items-center justify-center py-2">
                  <svg viewBox="0 0 200 200" className="w-full max-w-[200px] h-auto">
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#3B82F6" strokeWidth="35" strokeDasharray={`${0.5 * 439.82} 439.82`} transform="rotate(-90 100 100)" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#10B981" strokeWidth="35" strokeDasharray={`${0.224 * 439.82} 439.82`} strokeDashoffset={`${-0.5 * 439.82}`} transform="rotate(-90 100 100)" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#F59E0B" strokeWidth="35" strokeDasharray={`${0.188 * 439.82} 439.82`} strokeDashoffset={`${-(0.5 + 0.224) * 439.82}`} transform="rotate(-90 100 100)" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#EF4444" strokeWidth="35" strokeDasharray={`${0.0882 * 439.82} 439.82`} strokeDashoffset={`${-(0.5 + 0.224 + 0.188) * 439.82}`} transform="rotate(-90 100 100)" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                  <span className="text-gray-600"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 align-middle mr-1" /> Active 50%</span>
                  <span className="text-gray-600"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 align-middle mr-1" /> Sold 22.4%</span>
                  <span className="text-gray-600"><span className="inline-block w-2 h-2 rounded-full bg-amber-500 align-middle mr-1" /> Pending 18.8%</span>
                  <span className="text-gray-600"><span className="inline-block w-2 h-2 rounded-full bg-red-500 align-middle mr-1" /> Expired 8.82%</span>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-gray-900 m-0">Recent Activity</h3>
                  <Link href="#" className="text-sm font-medium text-blue-600 no-underline hover:text-blue-700">View All</Link>
                </div>
                <div className="flex flex-col gap-4">
                  {recentActivity.map((activity, index) => (
                    <div className="flex gap-3" key={index}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
                        activity.color === 'green' ? 'bg-emerald-100 text-emerald-600' :
                        activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        activity.color === 'purple' ? 'bg-violet-100 text-violet-600' :
                        activity.color === 'orange' ? 'bg-amber-100 text-amber-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <ActivityIcon type={activity.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900"><strong>{activity.name}</strong> {activity.action}</div>
                        <div className="text-xs text-gray-500">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Listings - full width */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 m-0">Recent Listings</h3>
              <Link href="/broker/listings" className="text-sm font-medium text-blue-600 no-underline hover:text-blue-700">
                View All
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading listings...</div>
            ) : recentProperties.length > 0 ? (
              <div className="grid grid-cols-4 gap-5 xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-1">
                {recentProperties.map((property) => {
                  const agent = topPerformers[0]
                  const agentColor = agent?.color || '#3B82F6'
                  const agentName = property.agent_id ? `Agent ${property.agent_id}` : 'Unknown'
                  return (
                    <div className="rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all" key={property.id}>
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={property.image_url || property.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'}
                          alt={property.title || 'Listing'}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 py-1 px-2.5 rounded-md text-xs font-semibold bg-emerald-600 text-white">
                          For Rent
                        </span>
                      </div>
                      <div className="p-4 flex flex-col gap-2">
                        <div className="text-lg font-bold text-gray-900">₱{property.price?.toLocaleString()}/{property.price_type || 'mo'}</div>
                        <div className="text-xs text-gray-500">{property.bedrooms ?? 0} bd | {property.bathrooms ?? 0} ba</div>
                        <div className="text-sm text-gray-700 line-clamp-2">{property.location || property.street_address || 'Address not available'}</div>
                        <div className="flex items-center gap-2 pt-2 mt-auto border-t border-gray-100">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: agentColor }}>
                            {getInitials(agentName)}
                          </div>
                          <span className="text-xs font-medium text-gray-700 truncate">{agentName}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No recent listings</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
