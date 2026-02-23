'use client'

import AppSidebar from '../../components/common/AppSidebar'
import DashboardHeader from '../../components/common/DashboardHeader'
import { 
  FiUsers, 
  FiHome, 
  FiDollarSign,
  FiLayers,
  FiCheckCircle
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind

export default function AdminDashboard() {

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar/>
      <main className="ml-[280px] flex-1 w-[calc(100%-280px)] p-8 min-h-screen lg:ml-[240px] lg:w-[calc(100%-240px)] lg:p-6 md:ml-0 md:w-full md:p-4 md:pt-15">
        <DashboardHeader
          title="Dashboard Overview"
          subtitle="Welcome back, Admin"
          showNotifications={true}
        />

        <div className="grid grid-cols-4 gap-6 mb-8 lg:grid-cols-2 md:grid-cols-1">
          <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-blue-100 text-blue-600">
              <FiLayers />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Properties</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">1,247</p>
              <p className="text-xs font-medium text-emerald-600">↑ 12% from last month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-orange-100 text-orange-600">
              <FiUsers />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Agents</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">89</p>
              <p className="text-xs font-medium text-emerald-600">↑ 8% from last month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-emerald-100 text-emerald-600">
              <FiCheckCircle />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Monthly Bookings</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">342</p>
              <p className="text-xs font-medium text-emerald-600">↑ 15% from last month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-emerald-100 text-emerald-600">
              <FiDollarSign />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">$24,890</p>
              <p className="text-xs font-medium text-emerald-600">↑ 22% from last month</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 lg:grid-cols-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Overview</h2>
            <div className="w-full h-[200px]">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 160 L 80 120 L 140 80 L 200 100 L 260 60 L 320 40 L 380 30"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  className="transition-all duration-300" /* chart-line */
                />
                <path
                  d="M 20 160 L 80 120 L 140 80 L 200 100 L 260 60 L 320 40 L 380 30 L 380 200 L 20 200 Z"
                  fill="url(#areaGradient)"
                />
                <g>
                  <text x="20" y="195" fontSize="12" fill="#6B7280">Jan</text>
                  <text x="80" y="195" fontSize="12" fill="#6B7280">Feb</text>
                  <text x="140" y="195" fontSize="12" fill="#6B7280">Mar</text>
                  <text x="200" y="195" fontSize="12" fill="#6B7280">Apr</text>
                  <text x="260" y="195" fontSize="12" fill="#6B7280">May</text>
                  <text x="320" y="195" fontSize="12" fill="#6B7280">Jun</text>
                </g>
                <g>
                  <text x="5" y="200" fontSize="12" fill="#6B7280">0</text>
                  <text x="5" y="160" fontSize="12" fill="#6B7280">5k</text>
                  <text x="5" y="120" fontSize="12" fill="#6B7280">10k</text>
                  <text x="5" y="80" fontSize="12" fill="#6B7280">15k</text>
                  <text x="5" y="40" fontSize="12" fill="#6B7280">20k</text>
                  <text x="5" y="10" fontSize="12" fill="#6B7280">25k</text>
                </g>
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Property Types</h2>
            <div className="flex flex-col items-center">
              <svg className="w-[200px] h-[200px]" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="40"
                  strokeDasharray={`${0.45 * 502.4} 502.4`}
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="40"
                  strokeDasharray={`${0.25 * 502.4} 502.4`}
                  strokeDashoffset={`-${0.45 * 502.4}`}
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="40"
                  strokeDasharray={`${0.20 * 502.4} 502.4`}
                  strokeDashoffset={`-${(0.45 + 0.25) * 502.4}`}
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="40"
                  strokeDasharray={`${0.10 * 502.4} 502.4`}
                  strokeDashoffset={`-${(0.45 + 0.25 + 0.20) * 502.4}`}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="mt-6 w-full flex flex-col gap-2">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="text-sm text-gray-700">Apartments</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">45%</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                    <span className="text-sm text-gray-700">Houses</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">25%</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                    <span className="text-sm text-gray-700">Condos</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">20%</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                    <span className="text-sm text-gray-700">Studios</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Recent Agents</h2>
              <a href="#" className="text-sm text-blue-600 font-medium hover:underline">View All</a>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <div className="text-white font-semibold text-sm">SJ</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">Sarah Johnson</h4>
                  <p className="text-gray-500 text-xs">23 properties listed</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <div className="text-white font-semibold text-sm">MC</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">Mike Chen</h4>
                  <p className="text-gray-500 text-xs">18 properties listed</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                  <div className="text-white font-semibold text-sm">ED</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">Emma Davis</h4>
                  <p className="text-gray-500 text-xs">31 properties listed</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                  <div className="text-white font-semibold text-sm">AR</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">Alex Rodriguez</h4>
                  <p className="text-gray-500 text-xs">15 properties listed</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Recent Properties</h2>
              <a href="#" className="text-sm text-blue-600 font-medium hover:underline">View All</a>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 text-2xl">
                  <FiLayers />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">Modern Apartment</h4>
                  <p className="text-gray-500 text-xs">Downtown • $2,500/month</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Listed</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 text-2xl">
                  <FiLayers />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">Luxury Condo</h4>
                  <p className="text-gray-500 text-xs">Uptown • $3,200/month</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Rented</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 text-2xl">
                  <FiHome />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">Family House</h4>
                  <p className="text-gray-500 text-xs">Suburbs • $2,800/month</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 text-2xl">
                  <FiLayers />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-900 font-semibold text-sm truncate">Studio Apartment</h4>
                  <p className="text-gray-500 text-xs">City Center • $1,800/month</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Listed</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

