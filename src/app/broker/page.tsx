'use client'

import { useEffect, useState } from 'react'
import AppSidebar from '../../components/common/AppSidebar'
import BrokerHeader from '../../components/broker/BrokerHeader'
import { agentsApi, propertiesApi } from '../../api'
import type { Agent } from '../../api/endpoints/agents'
import type { Property } from '../../types'
import {
  FiUsers,
  FiHome,
  FiTrendingUp,
  FiCheck,
  FiPlus,
  FiEdit,
  FiUserPlus,
  FiX,
  FiTarget,
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind

// Mock data
const topPerformers = [
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

const recentListings = [
  {
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    badge: 'For Sale',
    badgeType: 'sale',
    price: '$1,250,000',
    specs: '4 bd | 3 ba | 2,800 sqft',
    address: '123 Oak Street, Beverly Hills',
    agent: 'David Wilson',
    agentColor: '#3B82F6',
  },
  {
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    badge: 'For Rent',
    badgeType: 'rent',
    price: '$3,500/mo',
    specs: '2 bd | 2 ba | 1,400 sqft',
    address: '456 Pine Ave, Downtown',
    agent: 'Lisa Johnson',
    agentColor: '#10B981',
  },
  {
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
    badge: 'Sold',
    badgeType: 'sold',
    price: '$875,000',
    specs: '3 bd | 2.5 ba | 2,200 sqft',
    address: '789 Maple Dr, Westwood',
    agent: 'Robert Taylor',
    agentColor: '#F59E0B',
  },
  {
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    badge: 'For Sale',
    badgeType: 'sale',
    price: '$2,100,000',
    specs: '3 bd | 3 ba | 2,500 sqft',
    address: '321 Beach Blvd, Santa Monica',
    agent: 'Jennifer Lee',
    agentColor: '#8B5CF6',
  },
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
  const [userName, setUserName] = useState('John Anderson')
  const [activeTab, setActiveTab] = useState<'month' | 'quarter' | 'year'>('quarter')
  const [loading, setLoading] = useState(true)
  const [totalAgents, setTotalAgents] = useState(0)
  const [activeListings, setActiveListings] = useState(0)
  const [dealsClosed, setDealsClosed] = useState(0)
  const [recentProperties, setRecentProperties] = useState<Property[]>([])
  const [topPerformers, setTopPerformers] = useState<Array<{ name: string; deals: number; listings: number; color: string }>>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('agent_name') || localStorage.getItem('user_name') || 'John Anderson')
    }
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // Fetch agents
        const agents = await agentsApi.getAll()
        setTotalAgents(agents.length)
        
        // Fetch properties
        const propertiesResponse = await propertiesApi.getAll()
        const properties = Array.isArray(propertiesResponse) ? propertiesResponse : (propertiesResponse as any).data || []
        
        const active = properties.filter((p: Property) => p.published_at).length
        setActiveListings(active)
        
        // Get recent properties (last 4)
        const recent = properties
          .sort((a: Property, b: Property) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
            return dateB - dateA
          })
          .slice(0, 4)
        setRecentProperties(recent)
        
        // Calculate top performers based on property count
        const agentPropertyCounts: Record<number, { agent: Agent; count: number }> = {}
        properties.forEach((p: Property) => {
          if (p.agent_id) {
            if (!agentPropertyCounts[p.agent_id]) {
              const agent = agents.find(a => a.id === p.agent_id)
              if (agent) {
                agentPropertyCounts[p.agent_id] = { agent, count: 0 }
              }
            }
            if (agentPropertyCounts[p.agent_id]) {
              agentPropertyCounts[p.agent_id].count++
            }
          }
        })
        
        const performers = Object.values(agentPropertyCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((item, index) => {
            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
            return {
              name: item.agent.full_name || `${item.agent.first_name} ${item.agent.last_name}` || 'Unknown',
              deals: item.count,
              listings: item.count,
              color: colors[index] || '#3B82F6'
            }
          })
        setTopPerformers(performers)
        
        // Deals closed would need additional data from backend
        setDealsClosed(0)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* broker-dashboard */}
      <AppSidebar />
      <main className="main-with-sidebar flex-1 min-h-screen"> {/* broker-main */}
        <div className="p-8 lg:py-6 md:py-4 md:pt-15">
          <BrokerHeader 
            title="Dashboard Overview" 
            subtitle={`Welcome back, ${userName.split(' ')[0]}! Here's what's happening with your team.`} 
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-5 mb-6 lg:grid-cols-2 md:grid-cols-1"> {/* broker-stats-grid */}
            <div className="bg-white rounded-[14px] py-5 px-6 flex items-center gap-4 shadow-sm transition-shadow duration-200 hover:shadow-md"> {/* broker-stat-card */}
              <div className="w-12.5 h-12.5 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0 bg-blue-100 text-blue-600"> {/* broker-stat-icon blue */}
                <FiUsers />
              </div>
              <div className="flex-1"> {/* broker-stat-info */}
                <div className="flex items-center justify-between mb-1"> {/* broker-stat-top */}
                  <span className="text-xs font-medium text-gray-400">Total Agents</span> {/* broker-stat-label */}
                </div>
                <div className="text-[28px] font-bold text-gray-900 leading-tight">{loading ? '...' : totalAgents}</div> {/* broker-stat-value */}
              </div>
            </div>

            <div className="bg-white rounded-[14px] py-5 px-6 flex items-center gap-4 shadow-sm transition-shadow duration-200 hover:shadow-md"> {/* broker-stat-card */}
              <div className="w-12.5 h-12.5 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0 bg-emerald-100 text-emerald-600"> {/* broker-stat-icon green */}
                <FiHome />
              </div>
              <div className="flex-1"> {/* broker-stat-info */}
                <div className="flex items-center justify-between mb-1"> {/* broker-stat-top */}
                  <span className="text-xs font-medium text-gray-400">Active Listings</span> {/* broker-stat-label */}
                </div>
                <div className="text-[28px] font-bold text-gray-900 leading-tight">{loading ? '...' : activeListings}</div> {/* broker-stat-value */}
              </div>
            </div>

            <div className="bg-white rounded-[14px] py-5 px-6 flex items-center gap-4 shadow-sm transition-shadow duration-200 hover:shadow-md"> {/* broker-stat-card */}
              <div className="w-12.5 h-12.5 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0 bg-amber-100 text-amber-600"> {/* broker-stat-icon orange */}
                <FiTarget />
              </div>
              <div className="flex-1"> {/* broker-stat-info */}
                <div className="flex items-center justify-between mb-1"> {/* broker-stat-top */}
                  <span className="text-xs font-medium text-gray-400">Total Listings</span> {/* broker-stat-label */}
                </div>
                <div className="text-[28px] font-bold text-gray-900 leading-tight">{loading ? '...' : recentProperties.length > 0 ? recentProperties.length : 0}</div> {/* broker-stat-value */}
              </div>
            </div>
          </div>

          {/* Middle Section: Top Performers + Pending Approvals */}
          <div className="grid grid-cols-[1fr_340px] gap-5 mb-6 lg:grid-cols-1"> {/* broker-middle-section */}
            <div className="bg-white rounded-[14px] p-6 shadow-sm"> {/* broker-card */}
              <div className="flex items-center justify-between mb-5"> {/* broker-card-header */}
                <h3 className="text-base font-bold text-gray-900 m-0">Top Performers</h3> {/* broker-card-title */}
              </div>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : topPerformers.length > 0 ? (
                <div className="flex flex-col gap-4"> {/* broker-performers-list */}
                  {topPerformers.map((performer, index) => (
                    <div className="flex items-center gap-3" key={index}> {/* broker-performer-item */}
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" /* broker-performer-avatar */
                        style={{ background: performer.color }}
                      >
                        {getInitials(performer.name)}
                      </div>
                      <div className="flex-1"> {/* broker-performer-info */}
                        <div className="text-sm font-semibold text-gray-900">{performer.name}</div> {/* broker-performer-name */}
                        <div className="text-xs text-gray-500"> {/* broker-performer-deals */}
                          {performer.listings} listing{performer.listings !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{performer.listings}</div> {/* broker-performer-amount */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No performers data available</div>
              )}
            </div>

          <div className="bg-white rounded-[14px] p-6 shadow-sm"> {/* broker-card broker-approvals-card */}
            <div className="flex items-center justify-between mb-5"> {/* broker-card-header */}
              <h3 className="text-base font-bold text-gray-900 m-0">Pending Approvals</h3> {/* broker-card-title */}
            </div>
            <div className="flex flex-col gap-4"> {/* broker-approvals-list */}
              {pendingApprovals.map((approval, index) => (
                <div className="flex gap-3" key={index}> {/* broker-approval-item */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" /* broker-approval-avatar */
                    style={{ background: approval.color }}
                  >
                    {getInitials(approval.name)}
                  </div>
                  <div className="flex-1 flex flex-col gap-2"> {/* broker-approval-info */}
                    <div className="text-sm font-semibold text-gray-900">{approval.name}</div> {/* broker-approval-name */}
                    <div className="text-xs text-gray-500">{approval.description}</div> {/* broker-approval-desc */}
                    <div className="flex gap-2"> {/* broker-approval-actions */}
                      <button className="py-1 px-3 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-md border-0 cursor-pointer transition-all duration-200 hover:bg-emerald-100">Approve</button> {/* broker-btn-approve */}
                      <button className="py-1 px-3 bg-red-50 text-red-600 text-xs font-medium rounded-md border-0 cursor-pointer transition-all duration-200 hover:bg-red-100">Reject</button> {/* broker-btn-reject */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <a href="/broker/approvals" className="block text-center mt-5 pt-4 border-t border-gray-100 text-sm font-medium text-blue-600 no-underline transition-colors duration-200 hover:text-blue-700"> {/* broker-view-all-link */}
              View All (5)
            </a>
          </div>
        </div>

          {/* Bottom Section: Listings by Status, Recent Activity */}
          <div className="grid grid-cols-2 gap-5 mb-6 lg:grid-cols-1"> {/* broker-bottom-section */}

          <div className="bg-white rounded-[14px] p-6 shadow-sm"> {/* broker-card */}
            <div className="flex items-center justify-between mb-5"> {/* broker-card-header */}
              <h3 className="text-base font-bold text-gray-900 m-0">Listings by Status</h3> {/* broker-card-title */}
            </div>
            <div className="h-50 flex items-center justify-center"> {/* broker-doughnut-container */}
              <svg viewBox="0 0 200 200" className="w-full h-full max-w-[200px]"> {/* broker-doughnut-chart */}
                {/* Active - 50% - Blue */}
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="35"
                  strokeDasharray={`${0.50 * 439.82} 439.82`}
                  transform="rotate(-90 100 100)"
                />
                {/* Sold - 22.4% - Green */}
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="35"
                  strokeDasharray={`${0.224 * 439.82} 439.82`}
                  strokeDashoffset={`${-0.50 * 439.82}`}
                  transform="rotate(-90 100 100)"
                />
                {/* Pending - 18.8% - Yellow */}
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="35"
                  strokeDasharray={`${0.188 * 439.82} 439.82`}
                  strokeDashoffset={`${-(0.50 + 0.224) * 439.82}`}
                  transform="rotate(-90 100 100)"
                />
                {/* Expired - 8.82% - Red */}
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="35"
                  strokeDasharray={`${0.0882 * 439.82} 439.82`}
                  strokeDashoffset={`${-(0.50 + 0.224 + 0.188) * 439.82}`}
                  transform="rotate(-90 100 100)"
                />
                {/* Center labels */}
                <text x="78" y="60" fontSize="8" fontWeight="700" fill="#fff">Active</text>
                <text x="82" y="72" fontSize="7" fill="#fff">50%</text>

                <text x="130" y="120" fontSize="7" fontWeight="700" fill="#fff">Sold</text>
                <text x="130" y="131" fontSize="6" fill="#fff">22.4%</text>

                <text x="55" y="135" fontSize="7" fontWeight="700" fill="#fff">Pending</text>
                <text x="60" y="146" fontSize="6" fill="#fff">18.8%</text>

                <text x="105" y="170" fontSize="6" fontWeight="700" fill="#fff">Expired</text>
                <text x="108" y="179" fontSize="5" fill="#fff">8.82%</text>
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-[14px] p-6 shadow-sm"> {/* broker-card */}
            <div className="flex items-center justify-between mb-5"> {/* broker-card-header */}
              <h3 className="text-base font-bold text-gray-900 m-0">Recent Activity</h3> {/* broker-card-title */}
            </div>
            <div className="flex flex-col gap-4"> {/* broker-activity-list */}
              {recentActivity.map((activity, index) => (
                <div className="flex gap-3" key={index}> {/* broker-activity-item */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-base flex-shrink-0 ${
                    activity.color === 'green' ? 'bg-emerald-100 text-emerald-600' :
                    activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    activity.color === 'purple' ? 'bg-indigo-100 text-indigo-600' :
                    activity.color === 'orange' ? 'bg-amber-100 text-amber-600' :
                    'bg-red-100 text-red-600'
                  }`}> {/* broker-activity-icon */}
                    <ActivityIcon type={activity.icon} />
                  </div>
                  <div className="flex-1"> {/* broker-activity-content */}
                    <div className="text-sm text-gray-900"> {/* broker-activity-text */}
                      <strong>{activity.name}</strong> {activity.action}
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div> {/* broker-activity-time */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

          {/* Recent Listings */}
          <div className="bg-white rounded-[14px] p-6 shadow-sm"> {/* broker-listings-section */}
            <div className="flex items-center justify-between mb-5"> {/* broker-listings-header */}
              <h3 className="text-base font-bold text-gray-900 m-0">Recent Listings</h3>
              <a href="/broker/listings" className="text-sm font-medium text-blue-600 no-underline transition-colors duration-200 hover:text-blue-700"> {/* broker-view-all-link */}
                View All
              </a>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading listings...</div>
            ) : recentProperties.length > 0 ? (
              <div className="grid grid-cols-4 gap-5 xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-1"> {/* broker-listings-grid */}
                {recentProperties.map((property) => {
                  const agent = topPerformers.find(p => p.name.includes(property.agent_id?.toString() || ''))
                  const agentColor = agent?.color || '#3B82F6'
                  const agentName = property.agent_id ? `Agent ${property.agent_id}` : 'Unknown'
                  
                  return (
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-200 hover:shadow-md" key={property.id}> {/* broker-listing-card */}
                      <div className="relative h-48 overflow-hidden"> {/* broker-listing-image */}
                        <img 
                          src={property.image_url || property.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'} 
                          alt={property.title} 
                          className="w-full h-full object-cover" 
                        />
                        <span className="absolute top-3 left-3 py-1 px-2.5 rounded-md text-xs font-semibold bg-emerald-600 text-white"> {/* broker-listing-badge */}
                          For Rent
                        </span>
                      </div>
                      <div className="p-4 flex flex-col gap-2"> {/* broker-listing-details */}
                        <div className="text-lg font-bold text-gray-900">₱{property.price?.toLocaleString()}/{property.price_type || 'mo'}</div> {/* broker-listing-price */}
                        <div className="text-xs text-gray-500">{property.bedrooms || 0} bd | {property.bathrooms || 0} ba</div> {/* broker-listing-specs */}
                        <div className="text-sm text-gray-700 line-clamp-2">{property.location || property.street_address || 'Address not available'}</div> {/* broker-listing-address */}
                        <div className="flex items-center gap-2 pt-2 mt-auto border-t border-gray-100"> {/* broker-listing-agent */}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" /* broker-listing-agent-avatar */
                            style={{ background: agentColor }}
                          >
                            {getInitials(agentName)}
                          </div>
                          <span className="text-xs font-medium text-gray-700">{agentName}</span> {/* broker-listing-agent-name */}
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
