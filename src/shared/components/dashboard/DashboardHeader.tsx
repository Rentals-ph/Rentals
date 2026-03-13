'use client'

import { FiBell } from 'react-icons/fi'

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
  showNotifications?: boolean
  /** Optional right-side content (e.g. "+ Add Listing" button) */
  rightAction?: React.ReactNode
}

function DashboardHeader({
  title = 'Dashboard',
  subtitle = 'Welcome back',
  showNotifications = false,
  rightAction,
}: DashboardHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex justify-between items-start flex-col gap-4 md:flex-row w-full px-6 py-4 md:px-8 md:py-5">
        <div className="flex flex-col gap-1 w-full min-w-0 flex-1">
          <h1 className="m-0 mb-2 text-[28px] md:text-[22px] sm:text-lg font-bold text-gray-900 break-words">{title}</h1>
          <p className="m-0 text-sm md:text-xs text-gray-500 break-words">{subtitle}</p>
        </div>
        {(showNotifications || rightAction) && (
          <div className="relative flex flex-shrink-0 items-center gap-4">
            {showNotifications && (
              <FiBell className="text-xl text-gray-500 cursor-pointer transition-colors hover:text-gray-900" />
            )}
            {rightAction}
          </div>
        )}
      </div>
    </header>
  )
}

export default DashboardHeader
