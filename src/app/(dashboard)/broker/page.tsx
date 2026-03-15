'use client'

import { useEffect, useState } from 'react'
import { agentsApi, propertiesApi, messagesApi } from '@/api'
import { brokerApi } from '@/api'
import type { Agent } from '@/features/agents'
import type { Property } from '@/types'
import {
  FiUsers,
  FiHome,
  FiCheck,
  FiEdit,
  FiUserPlus,
  FiX,
  FiTarget,
  FiLayers,
  FiMail,
} from 'react-icons/fi'
import { CreateListingBanner } from '@/features/listing-assistant'

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
  const [totalListings, setTotalListings] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [totalInquiries, setTotalInquiries] = useState(0)
  const [unreadInquiries, setUnreadInquiries] = useState(0)
  const [teamSeries, setTeamSeries] = useState<
    {
      team_id: number
      team_name: string
      daily_listings: number[]
    }[]
  >([])
  const [timeLabels, setTimeLabels] = useState<string[]>([])
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
        const [agents, propertiesRes, dashboardData, messagesRes] = await Promise.all([
          agentsApi.getAll().catch(() => []),
          propertiesApi.getAll().catch(() => []),
          brokerApi.getDashboard().catch(() => null),
          messagesApi.getAll({}).catch(() => ({ data: [] })),
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

        if (dashboardData) {
          setTotalViews(dashboardData.total_views ?? 0)
          setTotalInquiries(dashboardData.total_inquiries ?? 0)
          setTimeLabels(dashboardData.timeseries?.labels ?? [])
          setTeamSeries(dashboardData.timeseries?.teams ?? [])
        }

        const msgs = Array.isArray((messagesRes as any).data) ? (messagesRes as any).data : []
        const unread = msgs.filter((m: any) => !m.is_read).length
        setUnreadInquiries(unread)

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
                amount: `₱${(item.count * 50000).toLocaleString('en-US')}`,
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

  const maxListingsPerDay = Math.max(
    1,
    ...teamSeries.flatMap((t) => t.daily_listings ?? []),
  )

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1']


  return (
    <>

          {/* Stats Cards - 4 compact box cards */}
          <div className="grid grid-cols-4 gap-3 mb-6 w-full lg:grid-cols-4 md:grid-cols-2">
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
                  <span className="text-[16px] font-medium text-gray-500">Total Listings</span>
                </div>
                <div className="text-lg font-bold text-gray-900 leading-tight">{loading ? '...' : totalListings}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 py-3.5 px-4 flex items-start gap-3 box-border shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-amber-50 text-amber-600 box-border">
                <FiTarget />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[16px] font-medium text-gray-500">Total Views</span>
                </div>
                <div className="text-lg font-bold text-gray-900 leading-tight">{loading ? '...' : totalViews}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 py-3.5 px-4 flex items-start gap-3 box-border shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-violet-50 text-violet-600 box-border">
                <FiLayers />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[16px] font-medium text-gray-500">Total Inquiries</span>
                </div>
                <div className="text-lg font-bold text-gray-900 leading-tight">{loading ? '...' : totalInquiries}</div>
              </div>
            </div>
          </div>

          {/* Create New Listing - same style as agent dashboard */}
          <CreateListingBanner createListingHref="/broker/create-listing" />

          {/* Team Performance — multi-line chart like agent dashboard but per team */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-900 m-0">Team Listings Over Time (last 7 days)</h3>
              </div>
              <div className="flex items-center gap-4 mb-2 flex-wrap">
                {teamSeries.map((team, idx) => (
                  <span
                    key={team.team_id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                    />
                    {team.team_name}
                  </span>
                ))}
              </div>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full max-w-full h-[220px]"
                preserveAspectRatio="xMidYMid meet"
              >
                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left}
                  y2={chartHeight - padding.bottom}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
                <line
                  x1={padding.left}
                  y1={chartHeight - padding.bottom}
                  x2={chartWidth - padding.right}
                  y2={chartHeight - padding.bottom}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
                {timeLabels.map((label, i) => (
                  <text
                    key={label + i}
                    x={
                      padding.left +
                      (timeLabels.length > 1 ? (i / (timeLabels.length - 1)) * innerWidth : 0)
                    }
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-gray-500"
                    fontSize="10"
                  >
                    {label}
                  </text>
                ))}
                {teamSeries.map((team, idx) => {
                  const color = colors[idx % colors.length]
                  const pts = (team.daily_listings ?? []).map((value, i) => ({
                    x:
                      padding.left +
                      (timeLabels.length > 1 ? (i / (timeLabels.length - 1)) * innerWidth : 0),
                    y:
                      padding.top +
                      innerHeight -
                      (value / maxListingsPerDay) * innerHeight,
                  }))
                  const path = pts
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ')
                  return (
                    <path
                      key={team.team_id}
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )
                })}
              </svg>
            </div>
          </div>
    </>
  )
}
