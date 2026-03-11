'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import BrokerHeader from '@/components/broker/BrokerHeader'
import { brokerApi, type TeamProductivityRow } from '@/api'
import {
  FiChevronDown,
  FiTrendingUp,
  FiMessageCircle,
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind

// Stats data (summary from report when available)
const getStatsFromReport = (rows: TeamProductivityRow[]) => {
  const totalInquiries = rows.reduce((s, r) => s + r.total_inquiries, 0)
  const totalListings = rows.reduce((s, r) => s + r.total_listings, 0)
  const ratio = totalListings > 0 ? (totalInquiries / totalListings).toFixed(1) : '0'
  return [
    {
      icon: 'inquiries' as const,
      label: 'Total Team Inquiries',
      value: totalInquiries.toLocaleString(),
      change: 'From your team and agents',
      changeColor: 'green',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
    },
    {
      icon: 'conversion' as const,
      label: 'Conversion Rate',
      value: '—',
      change: 'Track over time',
      changeColor: 'green',
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
    },
    {
      icon: 'response' as const,
      label: 'Average Response Time',
      value: '—',
      change: 'Track over time',
      changeColor: 'green',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
    },
    {
      icon: 'channel' as const,
      label: 'Inquiry-to-Listing Ratio',
      value: ratio,
      change: totalListings > 0 ? `Across ${totalListings} listings` : 'No listings yet',
      changeColor: 'green',
      iconBg: '#D1FAE5',
      iconColor: '#10B981',
    },
  ]
}

function StatIcon({ type }: { type: string }) {
  switch (type) {
    case 'inquiries':
      return <FiMessageCircle />
    case 'conversion':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18" />
          <path d="M8 6h10v10" />
        </svg>
      )
    case 'response':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case 'channel':
      return <FiMessageCircle />
    default:
      return <FiMessageCircle />
  }
}

export default function ReportsPage() {
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [productivityData, setProductivityData] = useState<TeamProductivityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    brokerApi.getTeamProductivityReport().then((data) => {
      if (!cancelled) setProductivityData(Array.isArray(data) ? data : [])
    }).catch(() => {
      if (!cancelled) setProductivityData([])
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const statsData = getStatsFromReport(productivityData)
  const allSelected = selectedRows.length === productivityData.length && productivityData.length > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([])
    } else {
      setSelectedRows(productivityData.map((_, i) => i))
    }
  }

  const toggleSelect = (i: number) => {
    setSelectedRows((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* broker-dashboard */}
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15"> {/* broker-main */}
        <BrokerHeader 
          title="Reports" 
          subtitle="You can view your team's performance, lead conversion, and inventory health." 
        />

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-5 mb-6 lg:grid-cols-2 md:grid-cols-1"> {/* rp-stats-grid */}
          {statsData.map((stat, index) => (
            <div className="bg-white rounded-[14px] py-5 px-6 flex items-center gap-4 shadow-sm" key={index}> {/* rp-stat-card */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0" /* rp-stat-icon */
                style={{ background: stat.iconBg, color: stat.iconColor }}
              >
                <StatIcon type={stat.icon} />
              </div>
              <div className="flex-1"> {/* rp-stat-info */}
                <div className="flex items-center justify-between mb-1"> {/* rp-stat-top */}
                  <span className="text-xs font-medium text-gray-400">{stat.label}</span> {/* rp-stat-label */}
                  <span className="text-xs font-semibold text-emerald-600">{stat.change}</span> {/* rp-stat-change */}
                </div>
                <div className="text-[28px] font-bold text-gray-900 leading-tight">{stat.value}</div> {/* rp-stat-value */}
              </div>
            </div>
          ))}
        </div>

        {/* Team Productivity Report Table */}
        <div className="bg-white rounded-[14px] p-6 shadow-sm mb-6"> {/* rp-table-card */}
          <div className="flex items-center justify-between mb-5"> {/* rp-table-header */}
            <h3 className="text-base font-bold text-gray-900 m-0">Team Productivity Report</h3> {/* rp-table-title */}
            <button className="inline-flex items-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-gray-200"> {/* rp-filter-btn */}
              Filter <FiChevronDown />
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 md:hidden"> {/* rp-table-wrapper rp-table-desktop */}
            <table className="w-full border-collapse min-w-[900px]"><thead>
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-12"> {/* rp-th-check */}
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 md:w-5 md:h-5" /* rp-checkbox */
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Agent Name</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Total Listings</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Total Inquiries</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Most Popular Listing</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Inquiry-to-Listing Ratio</th>
                </tr>
              </thead><tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">Loading team productivity...</td></tr>
                ) : productivityData.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">No agents yet. Create or invite agents in Team Management.</td></tr>
                ) : (
                  productivityData.map((row, index) => (
                    <tr key={row.agent_id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b border-gray-100 w-12"> {/* rp-td-check */}
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(index)}
                          onChange={() => toggleSelect(index)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 md:w-5 md:h-5" /* rp-checkbox */
                        />
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100 font-semibold text-gray-900">{row.name}</td> {/* rp-td-name */}
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-700 text-center">{row.total_listings}</td> {/* rp-td-num */}
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-700 text-center">{row.total_inquiries}</td> {/* rp-td-num */}
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-600 italic">{row.most_popular_listing}</td> {/* rp-td-popular */}
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-700 text-center">{row.inquiry_to_listing_ratio}</td> {/* rp-td-num */}
                    </tr>
                  ))
                )}
              </tbody></table>
          </div>

          {/* Mobile Card View */}
          <div className="hidden md:block"> {/* rp-table-mobile */}
            <div className="flex items-center gap-2 py-3 px-4 bg-gray-50 rounded-lg mb-3"> {/* rp-mobile-select-all */}
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 md:w-5 md:h-5" /* rp-checkbox */
              />
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </div>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading team productivity...</div>
            ) : productivityData.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No agents yet. Create or invite agents in Team Management.</div>
            ) : (
              productivityData.map((row, index) => (
                <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200 transition-all duration-200 hover:border-blue-300 hover:shadow-sm" key={row.agent_id}> {/* rp-mobile-card */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200"> {/* rp-mobile-card-header */}
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(index)}
                      onChange={() => toggleSelect(index)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 md:w-5 md:h-5" /* rp-checkbox */
                    />
                    <h4 className="text-base font-bold text-gray-900 m-0">{row.name}</h4> {/* rp-mobile-card-name */}
                  </div>
                  <div className="flex flex-col gap-2.5"> {/* rp-mobile-card-body */}
                    <div className="flex items-center justify-between"> {/* rp-mobile-card-row */}
                      <span className="text-xs font-medium text-gray-500 uppercase">Total Listings</span> {/* rp-mobile-label */}
                      <span className="text-sm font-semibold text-gray-900">{row.total_listings}</span> {/* rp-mobile-value */}
                    </div>
                    <div className="flex items-center justify-between"> {/* rp-mobile-card-row */}
                      <span className="text-xs font-medium text-gray-500 uppercase">Total Inquiries</span> {/* rp-mobile-label */}
                      <span className="text-sm font-semibold text-gray-900">{row.total_inquiries}</span> {/* rp-mobile-value */}
                    </div>
                    <div className="flex items-center justify-between"> {/* rp-mobile-card-row */}
                      <span className="text-xs font-medium text-gray-500 uppercase">Most Popular Listing</span> {/* rp-mobile-label */}
                      <span className="text-sm text-gray-600 italic text-right">{row.most_popular_listing}</span> {/* rp-mobile-value-popular */}
                    </div>
                    <div className="flex items-center justify-between"> {/* rp-mobile-card-row */}
                      <span className="text-xs font-medium text-gray-500 uppercase">Inquiry-to-Listing Ratio</span> {/* rp-mobile-label */}
                      <span className="text-sm font-semibold text-gray-900">{row.inquiry_to_listing_ratio}</span> {/* rp-mobile-value */}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory Insights */}
        <h3 className="text-xl font-bold text-gray-900 mb-5 mt-8">Inventory Insights</h3> {/* rp-section-title */}
        <div className="grid grid-cols-2 gap-5 mb-6 lg:grid-cols-1"> {/* rp-insights-grid */}
          {/* Listing Distribution - Pie Chart */}
          <div className="bg-white rounded-[14px] p-6 shadow-sm"> {/* rp-chart-card */}
            <h4 className="text-base font-bold text-gray-900 mb-5 m-0">Listing Distribution</h4> {/* rp-chart-title */}
            <div className="flex items-center justify-center"> {/* rp-pie-container */}
              <svg viewBox="0 0 200 200" className="w-[200px] h-[200px]"> {/* rp-pie-chart */}
                {/* Condos - 50% - Blue */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#3B82F6" strokeWidth="35"
                  strokeDasharray={`${0.50 * 439.82} 439.82`}
                  transform="rotate(-90 100 100)" />
                {/* Houses - 22.4% - Green */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#10B981" strokeWidth="35"
                  strokeDasharray={`${0.224 * 439.82} 439.82`}
                  strokeDashoffset={`${-0.50 * 439.82}`}
                  transform="rotate(-90 100 100)" />
                {/* Studios - 18.8% - Orange */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#F59E0B" strokeWidth="35"
                  strokeDasharray={`${0.188 * 439.82} 439.82`}
                  strokeDashoffset={`${-(0.50 + 0.224) * 439.82}`}
                  transform="rotate(-90 100 100)" />
                {/* Apartments - 8.82% - Red */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#EF4444" strokeWidth="35"
                  strokeDasharray={`${0.0882 * 439.82} 439.82`}
                  strokeDashoffset={`${-(0.50 + 0.224 + 0.188) * 439.82}`}
                  transform="rotate(-90 100 100)" />
                {/* Labels */}
                <text x="125" y="70" fontSize="7" fontWeight="700" fill="#fff">Houses</text>
                <text x="128" y="80" fontSize="6" fill="#fff">22.4%</text>
                <text x="80" y="105" fontSize="8" fontWeight="700" fill="#fff">Condos</text>
                <text x="90" y="115" fontSize="7" fill="#fff">50%</text>
                <text x="50" y="145" fontSize="7" fontWeight="700" fill="#fff">Studios</text>
                <text x="55" y="155" fontSize="6" fill="#fff">18.8%</text>
                <text x="100" y="175" fontSize="6" fontWeight="700" fill="#fff">Apartments</text>
                <text x="110" y="183" fontSize="5" fill="#fff">8.82%</text>
              </svg>
            </div>
            <div className="mt-5 flex flex-col gap-2.5"> {/* rp-pie-legend */}
              <div className="flex items-center gap-2 text-sm text-gray-700"> {/* rp-legend-item */}
                <span className="w-3 h-3 rounded-full" style={{ background: '#3B82F6' }}></span> {/* rp-legend-dot */}
                Condos
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700"> {/* rp-legend-item */}
                <span className="w-3 h-3 rounded-full" style={{ background: '#10B981' }}></span> {/* rp-legend-dot */}
                Houses
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700"> {/* rp-legend-item */}
                <span className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }}></span> {/* rp-legend-dot */}
                Studios
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700"> {/* rp-legend-item */}
                <span className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }}></span> {/* rp-legend-dot */}
                Apartments
              </div>
            </div>
          </div>

          {/* Location Performance - Bar Chart */}
          <div className="bg-white rounded-[14px] p-6 shadow-sm"> {/* rp-chart-card */}
            <h4 className="text-base font-bold text-gray-900 mb-5 m-0">Location Performance</h4> {/* rp-chart-title */}
            <div className="flex items-center justify-center"> {/* rp-bar-container */}
              <svg viewBox="0 0 400 260" className="w-full h-auto max-w-[400px]"> {/* rp-bar-chart */}
                {/* Y-axis labels */}
                <text x="35" y="30" fontSize="11" fill="#9CA3AF" textAnchor="end">4000</text>
                <text x="35" y="80" fontSize="11" fill="#9CA3AF" textAnchor="end">3000</text>
                <text x="35" y="130" fontSize="11" fill="#9CA3AF" textAnchor="end">2000</text>
                <text x="35" y="180" fontSize="11" fill="#9CA3AF" textAnchor="end">1000</text>
                <text x="35" y="225" fontSize="11" fill="#9CA3AF" textAnchor="end">0</text>

                {/* Grid lines */}
                <line x1="45" y1="27" x2="380" y2="27" stroke="#F3F4F6" strokeWidth="1" />
                <line x1="45" y1="77" x2="380" y2="77" stroke="#F3F4F6" strokeWidth="1" />
                <line x1="45" y1="127" x2="380" y2="127" stroke="#F3F4F6" strokeWidth="1" />
                <line x1="45" y1="177" x2="380" y2="177" stroke="#F3F4F6" strokeWidth="1" />
                <line x1="45" y1="222" x2="380" y2="222" stroke="#F3F4F6" strokeWidth="1" />

                {/* Cebu - ~3200 */}
                <rect x="60" y="62" width="40" height="160" rx="4" fill="#3B82F6" />
                {/* Makati - ~2600 */}
                <rect x="125" y="92" width="40" height="130" rx="4" fill="#10B981" />
                {/* BGC - ~2800 */}
                <rect x="190" y="82" width="40" height="140" rx="4" fill="#F59E0B" />
                {/* Davao - ~1800 */}
                <rect x="255" y="132" width="40" height="90" rx="4" fill="#8B5CF6" />
                {/* Manila - ~900 */}
                <rect x="320" y="177" width="40" height="45" rx="4" fill="#EF4444" />

                {/* X-axis labels */}
                <text x="80" y="245" fontSize="11" fill="#9CA3AF" textAnchor="middle">Cebu</text>
                <text x="145" y="245" fontSize="11" fill="#9CA3AF" textAnchor="middle">Makati</text>
                <text x="210" y="245" fontSize="11" fill="#9CA3AF" textAnchor="middle">BGC</text>
                <text x="275" y="245" fontSize="11" fill="#9CA3AF" textAnchor="middle">Davao</text>
                <text x="340" y="245" fontSize="11" fill="#9CA3AF" textAnchor="middle">Manila</text>
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
