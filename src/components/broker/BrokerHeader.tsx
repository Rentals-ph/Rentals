'use client'

import DashboardHeader from '../common/DashboardHeader'

interface BrokerHeaderProps {
  title?: string
  subtitle?: string
  showNotifications?: boolean
}

function BrokerHeader({ title = 'Dashboard', subtitle = 'Welcome back, manage your team and properties.', showNotifications = false }: BrokerHeaderProps) {
  return (
    <DashboardHeader
      title={title}
      subtitle={subtitle}
      showNotifications={showNotifications}
    />
  )
}

export default BrokerHeader

