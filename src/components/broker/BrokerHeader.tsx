'use client'

import Link from 'next/link'
import { FiPlus } from 'react-icons/fi'
import DashboardHeader from '../common/DashboardHeader'

interface BrokerHeaderProps {
  title?: string
  subtitle?: string
  showNotifications?: boolean
  showAddListing?: boolean
}

function BrokerHeader({ title = 'Dashboard', subtitle = 'Welcome back, manage your team and properties.', showNotifications = false, showAddListing = false }: BrokerHeaderProps) {
  return (
    <DashboardHeader
      title={title}
      subtitle={subtitle}
      showNotifications={showNotifications}
      rightAction={showAddListing ? (
        <Link
          href="/broker/create-listing"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="text-base" />
          Add Listing
        </Link>
      ) : undefined}
    />
  )
}

export default BrokerHeader

