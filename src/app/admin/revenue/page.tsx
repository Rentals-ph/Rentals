'use client'

import { useEffect, useState } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import DashboardHeader from '../../../components/common/DashboardHeader'
import { 
  FiDollarSign,
  FiRefreshCw,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi'

export default function RevenuePage() {

  return (
    <div className="admin-dashboard">
      <AppSidebar />

      <main className="admin-main">
        <DashboardHeader
          title="Dashboard Overview"
          subtitle="Welcome back, Admin"
          showNotifications={true}
        />

        <h2 className="revenue-title">Revenue</h2>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-content">
              <h3>Revenue</h3>
              <p className="metric-value">P89,230</p>
              <p className="metric-change positive">↑22% from last month</p>
            </div>
            <div className="metric-icon green">
              <FiDollarSign />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-content">
              <h3>Active Subscriptions</h3>
              <p className="metric-value">34</p>
              <p className="metric-change positive">↑22% from last month</p>
            </div>
            <div className="metric-icon blue">
              <FiRefreshCw />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-content">
              <h3>Pending Payouts</h3>
              <p className="metric-value">P56,912</p>
              <p className="metric-change positive">↑22% from last month</p>
            </div>
            <div className="metric-icon orange">
              <FiClock />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-content">
              <h3>Monthly Growth</h3>
              <p className="metric-value">+32%</p>
              <p className="metric-change positive">↑22% from last month</p>
            </div>
            <div className="metric-icon purple">
              <FiTrendingUp />
            </div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <h2>Earnings Chart</h2>
            <div className="chart-container">
              <svg className="line-chart" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="earningsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 100 L 80 80 L 140 60 L 200 80 L 260 70 L 320 50 L 380 40"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  className="chart-line"
                />
                <path
                  d="M 20 100 L 80 80 L 140 60 L 200 80 L 260 70 L 320 50 L 380 40 L 380 200 L 20 200 Z"
                  fill="url(#earningsGradient)"
                />
                <g className="chart-labels">
                  <text x="20" y="195" fontSize="12" fill="#6B7280">Jan</text>
                  <text x="80" y="195" fontSize="12" fill="#6B7280">Feb</text>
                  <text x="140" y="195" fontSize="12" fill="#6B7280">Mar</text>
                  <text x="200" y="195" fontSize="12" fill="#6B7280">Apr</text>
                  <text x="260" y="195" fontSize="12" fill="#6B7280">May</text>
                  <text x="320" y="195" fontSize="12" fill="#6B7280">Jun</text>
                </g>
                <g className="chart-y-labels">
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

          <div className="chart-card">
            <h2>Income Sources</h2>
            <div className="pie-chart-container">
              <svg className="pie-chart" viewBox="0 0 200 200">
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
              <div className="pie-legend">
                <div className="legend-item">
                  <div className="legend-color blue"></div>
                  <span>Agent Subscriptions</span>
                  <span className="legend-percent">45%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color orange"></div>
                  <span>Booking Fees</span>
                  <span className="legend-percent">25%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color green"></div>
                  <span>Featured Listing Ups</span>
                  <span className="legend-percent">20%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color yellow"></div>
                  <span>Agent Subscriptions</span>
                  <span className="legend-percent">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="transaction-section">
          <div className="transaction-card">
            <h2>Transaction History Table</h2>
            <div className="transaction-table-container">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date</th>
                    <th>Entity (Renter/Agent)</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="transaction-id" data-label="Transaction ID">TR-9901</td>
                    <td className="transaction-date" data-label="Date">Jan 28, 2026</td>
                    <td className="transaction-entity" data-label="Entity">Sofia Lim</td>
                    <td className="transaction-description" data-label="Description">Booking Deposit</td>
                    <td className="transaction-amount" data-label="Amount">P45,000</td>
                    <td data-label="Status">
                      <span className="status-badge successful">Successful</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="transaction-id" data-label="Transaction ID">TR-9902</td>
                    <td className="transaction-date" data-label="Date">Jan 27, 2026</td>
                    <td className="transaction-entity" data-label="Entity">Juan Dela Cruz</td>
                    <td className="transaction-description" data-label="Description">Pro Plan (Monthly)</td>
                    <td className="transaction-amount" data-label="Amount">P1,499</td>
                    <td data-label="Status">
                      <span className="status-badge successful">Successful</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

