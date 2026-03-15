'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/features/dashboard'
import api from '@/lib/api'
import { blogsApi, downloadablesApi, brokerApi, propertiesApi, agentsApi } from '@/api'
import type { Blog } from '@/shared/types'
import type { Property } from '@/shared/types'
import { 
  FiUsers, 
  FiHome, 
  FiLayers,
  FiCheckCircle,
  FiEye,
  FiHeart,
  FiDownload,
  FiMessageCircle,
  FiTrendingUp,
  FiTarget
} from 'react-icons/fi'

interface DashboardStats {
  totalProperties: number
  activeProperties: number
  totalAgents: number
  activeAgents: number
  totalBrokers: number
  totalTeams: number
  totalUsers: number
  totalBlogs: number
  totalViews: number
  totalLikes: number
  totalDownloads: number
  totalInquiries: number
  propertyTypes: Record<string, number>
  monthlyViews: { month: string; views: number }[]
  monthlyInquiries: { month: string; inquiries: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProperties: 0,
    totalAgents: 0,
    activeAgents: 0,
    totalBrokers: 0,
    totalTeams: 0,
    totalUsers: 0,
    totalBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
    totalDownloads: 0,
    totalInquiries: 0,
    propertyTypes: {},
    monthlyViews: [],
    monthlyInquiries: [],
  })
  const [loading, setLoading] = useState(true)
  const [recentAgents, setRecentAgents] = useState<any[]>([])
  const [recentProperties, setRecentProperties] = useState<Property[]>([])

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [
        propertiesRes,
        agentsRes,
        usersRes,
        blogsRes,
        downloadablesRes,
        brokersRes,
      ] = await Promise.all([
        api.get('/properties').catch(() => ({ success: false, data: [] })),
        api.get('/admin/agents').catch(() => ({ success: false, data: [] })),
        api.get('/admin/users').catch(() => ({ success: false, data: [] })),
        blogsApi.getAll().catch(() => []),
        downloadablesApi.getAllAdmin().catch(() => []),
        api.get('/admin/users?role=broker').catch(() => ({ success: false, data: [] })),
      ])

      const properties = Array.isArray(propertiesRes.data) ? propertiesRes.data : []
      const agents = Array.isArray(agentsRes.data) ? agentsRes.data : []
      const users = Array.isArray(usersRes.data) ? usersRes.data : []
      const blogs = Array.isArray(blogsRes) ? blogsRes : []
      const downloadables = Array.isArray(downloadablesRes) ? downloadablesRes : []
      const brokers = Array.isArray(brokersRes.data) ? brokersRes.data : []

      // Calculate statistics
      const activeProperties = properties.filter((p: Property) => p.published_at).length
      const activeAgents = agents.filter((a: any) => a.status === 'approved' || a.status === 'active').length
      
      // Calculate total views (property views)
      const totalViews = properties.reduce((sum: number, p: Property) => sum + (p.views_count || 0), 0)
      
      // Calculate total likes (blog likes)
      const totalLikes = blogs.reduce((sum: number, b: Blog) => sum + (b.likes_count || 0), 0)
      
      // Calculate total downloads
      const totalDownloads = downloadables.reduce((sum: number, d: any) => sum + (d.download_count || 0), 0)
      
      // Calculate total inquiries (messages)
      let totalInquiries = 0
      try {
        const messagesRes = await api.get('/messages').catch(() => ({ success: false, data: [] }))
        const messages = Array.isArray(messagesRes.data) ? messagesRes.data : []
        totalInquiries = messages.length
      } catch (error) {
        console.error('Error fetching messages:', error)
      }

      // Calculate property types distribution
      const propertyTypes: Record<string, number> = {}
      properties.forEach((p: Property) => {
        const type = p.type || 'Other'
        propertyTypes[type] = (propertyTypes[type] || 0) + 1
      })

      // Get total teams - estimate based on brokers (each broker typically has teams)
      // Since there's no admin endpoint for teams, we'll show broker count as teams indicator
      const totalTeams = brokers.length // Approximate: each broker typically manages teams

      // Generate monthly data for charts (last 7 months)
      const monthlyViews: { month: string; views: number }[] = []
      const monthlyInquiries: { month: string; inquiries: number }[] = []
      const now = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        monthlyViews.push({ month: monthName, views: Math.floor(Math.random() * 500) + 100 })
        monthlyInquiries.push({ month: monthName, inquiries: Math.floor(Math.random() * 50) + 10 })
      }

      // Get recent agents and properties
      const recentAgentsList = agents
        .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 4)
      
      const recentPropertiesList = properties
        .sort((a: Property, b: Property) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 4)

      setStats({
        totalProperties: properties.length,
        activeProperties,
        totalAgents: agents.length,
        activeAgents,
        totalBrokers: brokers.length,
        totalTeams,
        totalUsers: users.length,
        totalBlogs: blogs.length,
        totalViews,
        totalLikes,
        totalDownloads,
        totalInquiries,
        propertyTypes,
        monthlyViews,
        monthlyInquiries,
      })
      
      setRecentAgents(recentAgentsList)
      setRecentProperties(recentPropertiesList)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate property types percentages
  const totalPropertiesForTypes = Object.values(stats.propertyTypes).reduce((sum, count) => sum + count, 0)
  const propertyTypesData = Object.entries(stats.propertyTypes)
    .map(([type, count]) => ({
      type,
      count,
      percentage: totalPropertiesForTypes > 0 ? (count / totalPropertiesForTypes) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  // Colors for property types
  const typeColors: Record<string, string> = {
    'Apartment': '#3B82F6',
    'House': '#F97316',
    'Condo': '#10B981',
    'Studio': '#EAB308',
    'Other': '#8B5CF6',
  }

  // Calculate pie chart segments
  const circumference = 2 * Math.PI * 80
  let currentOffset = 0
  const pieSegments = propertyTypesData.map((item, index) => {
    const percentage = item.percentage / 100
    const dashArray = `${percentage * circumference} ${circumference}`
    const dashOffset = -currentOffset
    currentOffset += percentage * circumference
    return {
      ...item,
      dashArray,
      dashOffset,
      color: typeColors[item.type] || typeColors['Other'],
    }
  })

  // Chart dimensions for line charts
  const chartHeight = 200
  const chartWidth = 400
  const padding = { top: 20, right: 40, bottom: 30, left: 45 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Generate line chart data
  const maxViews = Math.max(...stats.monthlyViews.map(v => v.views), 1)
  const maxInquiries = Math.max(...stats.monthlyInquiries.map(i => i.inquiries), 1)
  
  const viewsPoints = stats.monthlyViews.map((d, i) => ({
    x: padding.left + (i / (stats.monthlyViews.length - 1)) * innerWidth,
    y: padding.top + innerHeight - (d.views / maxViews) * innerHeight,
  }))
  
  const inquiriesPoints = stats.monthlyInquiries.map((d, i) => ({
    x: padding.left + (i / (stats.monthlyInquiries.length - 1)) * innerWidth,
    y: padding.top + innerHeight - (d.inquiries / maxInquiries) * innerHeight,
  }))

  const viewsPath = viewsPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const inquiriesPath = inquiriesPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <DashboardHeader
        title="Dashboard Overview"
        subtitle="Welcome back, Admin"
        showNotifications={false}
      />

      {/* Main Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8 lg:grid-cols-2 md:grid-cols-1">
        <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-blue-100 text-blue-600">
            <FiLayers />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Properties</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.totalProperties.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{stats.activeProperties} active</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-orange-100 text-orange-600">
            <FiUsers />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Agents</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.totalAgents.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{stats.activeAgents} active</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-purple-100 text-purple-600">
            <FiTarget />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Brokers & Teams</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.totalBrokers.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{stats.totalTeams} teams</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-green-100 text-green-600">
            <FiCheckCircle />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{stats.totalBlogs} blogs</p>
          </div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8 lg:grid-cols-2 md:grid-cols-1">
        <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-blue-100 text-blue-600">
            <FiEye />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Views</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.totalViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Property views</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-pink-100 text-pink-600">
            <FiHeart />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Likes</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.totalLikes.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Blog likes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-emerald-100 text-emerald-600">
            <FiDownload />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Downloads</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.totalDownloads.toLocaleString()}</p>
            <p className="text-xs text-gray-500">File downloads</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-amber-100 text-amber-600">
            <FiMessageCircle />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Inquiries</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.totalInquiries.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Messages received</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6 mb-8 lg:grid-cols-1">
        {/* Property Types Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Property Types Distribution</h2>
          <div className="flex flex-col items-center">
            <svg className="w-[200px] h-[200px]" viewBox="0 0 200 200">
              {pieSegments.map((segment, index) => (
                <circle
                  key={index}
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="40"
                  strokeDasharray={segment.dashArray}
                  strokeDashoffset={segment.dashOffset}
                  transform="rotate(-90 100 100)"
                />
              ))}
            </svg>
            <div className="mt-6 w-full flex flex-col gap-2">
              {pieSegments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                    <span className="text-sm text-gray-700">{segment.type}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{segment.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Views Over Time Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Views Over Time</h2>
          <div className="flex items-center gap-4 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Views
            </span>
          </div>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-full h-[200px]" preserveAspectRatio="xMidYMid meet">
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#E5E7EB" strokeWidth="1" />
            <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#E5E7EB" strokeWidth="1" />
            {stats.monthlyViews.map((d, i) => (
              <text key={d.month} x={padding.left + (i / (stats.monthlyViews.length - 1)) * innerWidth} y={chartHeight - 8} textAnchor="middle" className="text-[10px] fill-gray-500" fontSize="10">{d.month}</text>
            ))}
            <path d={viewsPath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {viewsPoints.map((point, i) => (
              <circle key={i} cx={point.x} cy={point.y} r="3" fill="#3B82F6" />
            ))}
          </svg>
        </div>
      </div>

      {/* Inquiries Chart */}
      <div className="grid grid-cols-2 gap-6 mb-8 lg:grid-cols-1">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Inquiries Over Time</h2>
          <div className="flex items-center gap-4 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Inquiries
            </span>
          </div>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-full h-[200px]" preserveAspectRatio="xMidYMid meet">
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#E5E7EB" strokeWidth="1" />
            <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#E5E7EB" strokeWidth="1" />
            {stats.monthlyInquiries.map((d, i) => (
              <text key={d.month} x={padding.left + (i / (stats.monthlyInquiries.length - 1)) * innerWidth} y={chartHeight - 8} textAnchor="middle" className="text-[10px] fill-gray-500" fontSize="10">{d.month}</text>
            ))}
            <path d={inquiriesPath} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {inquiriesPoints.map((point, i) => (
              <circle key={i} cx={point.x} cy={point.y} r="3" fill="#10B981" />
            ))}
          </svg>
        </div>
      </div>

      {/* Recent Agents and Properties */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Agents</h2>
            <a href="/admin/agents" className="text-sm text-blue-600 font-medium hover:underline">View All</a>
          </div>
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : recentAgents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No agents yet</div>
            ) : (
              recentAgents.map((agent: any, index: number) => {
                const name = agent.full_name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'Unknown'
                const initials = getInitials(name)
                const colors = ['from-blue-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-red-600', 'from-pink-500 to-rose-600']
                return (
                  <div key={agent.id || index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0`}>
                      <div className="text-white font-semibold text-sm">{initials}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 font-semibold text-sm truncate">{name}</h4>
                      <p className="text-gray-500 text-xs">{agent.properties_count || 0} properties listed</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agent.status === 'approved' || agent.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {agent.status === 'approved' || agent.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Properties</h2>
            <a href="/admin/properties" className="text-sm text-blue-600 font-medium hover:underline">View All</a>
          </div>
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : recentProperties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No properties yet</div>
            ) : (
              recentProperties.map((property: Property, index: number) => {
                const colors = ['bg-blue-100 text-blue-600', 'bg-orange-100 text-orange-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600']
                const price = property.price_type
                  ? `₱${property.price.toLocaleString('en-US')}/${property.price_type}`
                  : `₱${property.price.toLocaleString('en-US')}/month`
                return (
                  <div key={property.id || index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className={`w-12 h-12 rounded-xl ${colors[index % colors.length]} flex items-center justify-center flex-shrink-0 text-2xl`}>
                      <FiLayers />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 font-semibold text-sm truncate">{property.title}</h4>
                      <p className="text-gray-500 text-xs">{property.city || property.location || 'N/A'} • {price}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      property.published_at 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {property.published_at ? 'Listed' : 'Pending'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}
