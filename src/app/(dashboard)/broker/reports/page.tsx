'use client'

import { useState, useEffect } from 'react'
import { brokerApi, type TeamProductivityRow } from '@/api'
import {
  FiChevronDown,
  FiTrendingUp,
  FiMessageCircle,
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind

// Stats data (summary from report when available)
const getStatsFromReport = (
  rows: TeamProductivityRow[],
  conversionStats?: { conversion_rate: number; average_response_time_display: string }
) => {
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
      value: conversionStats?.conversion_rate ? `${conversionStats.conversion_rate.toFixed(1)}%` : '—',
      change: conversionStats?.conversion_rate ? `${conversionStats.total_conversions} conversions` : 'Track over time',
      changeColor: 'green',
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
    },
    {
      icon: 'response' as const,
      label: 'Average Response Time',
      value: conversionStats?.average_response_time_display || '—',
      change: conversionStats?.average_response_time_minutes ? 'Based on replies' : 'Track over time',
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
  const [propertyTypeDistribution, setPropertyTypeDistribution] = useState<Array<{ type: string; count: number; percentage: number }>>([])
  const [locationPerformance, setLocationPerformance] = useState<Array<{ city: string; property_count: number; total_views: number; inquiry_count: number; performance_score: number }>>([])
  const [conversionStats, setConversionStats] = useState<{ conversion_rate: number; total_inquiries: number; total_conversions: number; average_response_time_minutes: number; average_response_time_display: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    
    const fetchData = async () => {
      try {
        const [productivity, types, locations, stats] = await Promise.all([
          brokerApi.getTeamProductivityReport(),
          brokerApi.getPropertyTypeDistribution(),
          brokerApi.getLocationPerformance(),
          brokerApi.getConversionAndResponseStats(),
        ])
        
        if (!cancelled) {
          setProductivityData(Array.isArray(productivity) ? productivity : [])
          setPropertyTypeDistribution(types)
          setLocationPerformance(locations)
          setConversionStats(stats)
        }
      } catch (error) {
        console.error('Error fetching reports data:', error)
        if (!cancelled) {
          setProductivityData([])
          setPropertyTypeDistribution([])
          setLocationPerformance([])
          setConversionStats(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setChartsLoading(false)
        }
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  const statsData = getStatsFromReport(productivityData, conversionStats || undefined)
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

  // Helper function to generate pie chart segments
  const generatePieChartSegments = () => {
    if (propertyTypeDistribution.length === 0) return []
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
    const circumference = 2 * Math.PI * 70 // radius = 70
    let offset = 0
    
    return propertyTypeDistribution.map((item, index) => {
      const percentage = item.percentage / 100
      const dashArray = `${percentage * circumference} ${circumference}`
      const dashOffset = index === 0 ? 0 : -offset
      offset += percentage * circumference
      
      return {
        ...item,
        color: colors[index % colors.length],
        dashArray,
        dashOffset,
      }
    })
  }

  // Helper function to generate bar chart data
  const generateBarChartData = () => {
    if (locationPerformance.length === 0) return { bars: [], maxValue: 0 }
    
    const maxScore = Math.max(...locationPerformance.map(l => l.performance_score))
    const maxValue = Math.ceil(maxScore / 1000) * 1000 // Round up to nearest 1000
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#A855F7']
    const barWidth = 40
    const barSpacing = 65
    const chartHeight = 222
    const chartWidth = 380
    const paddingLeft = 45
    const paddingBottom = 38
    
    return {
      bars: locationPerformance.slice(0, 5).map((location, index) => {
        const height = maxValue > 0 ? (location.performance_score / maxValue) * (chartHeight - paddingBottom) : 0
        const x = paddingLeft + (index * barSpacing)
        const y = chartHeight - paddingBottom - height
        
        return {
          ...location,
          x,
          y,
          width: barWidth,
          height,
          color: colors[index % colors.length],
        }
      }),
      maxValue,
      yAxisLabels: [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue].map(v => Math.round(v)),
    }
  }

  const pieSegments = generatePieChartSegments()
  const barChartData = generateBarChartData()

  return (
    <> 
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
            {chartsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-sm text-gray-500">Loading chart data...</div>
              </div>
            ) : pieSegments.length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-sm text-gray-500">No property data available</div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center"> {/* rp-pie-container */}
                  <svg viewBox="0 0 200 200" className="w-[200px] h-[200px]"> {/* rp-pie-chart */}
                    {pieSegments.map((segment, index) => (
                      <circle
                        key={segment.type}
                        cx="100"
                        cy="100"
                        r="70"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="35"
                        strokeDasharray={segment.dashArray}
                        strokeDashoffset={segment.dashOffset}
                        transform="rotate(-90 100 100)"
                      />
                    ))}
                  </svg>
                </div>
                <div className="mt-5 flex flex-col gap-2.5"> {/* rp-pie-legend */}
                  {pieSegments.map((segment) => (
                    <div key={segment.type} className="flex items-center justify-between text-sm text-gray-700"> {/* rp-legend-item */}
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: segment.color }}></span> {/* rp-legend-dot */}
                        {segment.type}
                      </div>
                      <span className="font-medium">{segment.count} ({segment.percentage.toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Location Performance - Bar Chart */}
          <div className="bg-white rounded-[14px] p-6 shadow-sm"> {/* rp-chart-card */}
            <h4 className="text-base font-bold text-gray-900 mb-5 m-0">Location Performance</h4> {/* rp-chart-title */}
            {chartsLoading ? (
              <div className="flex items-center justify-center h-[260px]">
                <div className="text-sm text-gray-500">Loading chart data...</div>
              </div>
            ) : barChartData.bars.length === 0 ? (
              <div className="flex items-center justify-center h-[260px]">
                <div className="text-sm text-gray-500">No location data available</div>
              </div>
            ) : (
              <div className="flex items-center justify-center"> {/* rp-bar-container */}
                <svg viewBox="0 0 400 260" className="w-full h-auto max-w-[400px]"> {/* rp-bar-chart */}
                  {/* Y-axis labels */}
                  {barChartData.yAxisLabels.map((value, index) => {
                    const yPos = 222 - (index * 50)
                    return (
                      <text key={value} x="35" y={yPos} fontSize="11" fill="#9CA3AF" textAnchor="end">
                        {value.toLocaleString()}
                      </text>
                    )
                  })}

                  {/* Grid lines */}
                  {barChartData.yAxisLabels.map((_, index) => {
                    const yPos = 222 - (index * 50)
                    return (
                      <line
                        key={index}
                        x1="45"
                        y1={yPos - 5}
                        x2="380"
                        y2={yPos - 5}
                        stroke="#F3F4F6"
                        strokeWidth="1"
                      />
                    )
                  })}
                  <line x1="45" y1="222" x2="380" y2="222" stroke="#F3F4F6" strokeWidth="1" />

                  {/* Bars */}
                  {barChartData.bars.map((bar, index) => (
                    <g key={bar.city}>
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        rx="4"
                        fill={bar.color}
                      />
                      {/* X-axis labels */}
                      <text
                        x={bar.x + bar.width / 2}
                        y="245"
                        fontSize="11"
                        fill="#9CA3AF"
                        textAnchor="middle"
                      >
                        {bar.city.length > 8 ? bar.city.substring(0, 7) + '...' : bar.city}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>
        </div>
    </>
  )
}
