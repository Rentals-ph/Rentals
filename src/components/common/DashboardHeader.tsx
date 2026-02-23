'use client'

import { FiBell } from 'react-icons/fi'

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
  showNotifications?: boolean
}

function DashboardHeader({
  title = 'Dashboard',
  subtitle = 'Welcome back',
  showNotifications = false,
}: DashboardHeaderProps) {
  return (
    <header className="mb-8 md:mb-6 w-full">
      <div className="flex justify-between items-start flex-col gap-4 md:flex-row w-full">
        <div className="flex flex-col gap-1 w-full min-w-0 flex-1">
          <h1 className="m-0 mb-2 text-[28px] md:text-[22px] sm:text-lg font-bold text-gray-900 break-words">{title}</h1>
          <p className="m-0 text-sm md:text-xs text-gray-500 break-words">{subtitle}</p>
        </div>
        {showNotifications && (
          <div className="flex items-center gap-5 flex-shrink-0">
            <FiBell className="text-2xl text-gray-500 cursor-pointer transition-colors hover:text-gray-900" />
          </div>
        )}
      </div>
    </header>
  )
}

export default DashboardHeader

