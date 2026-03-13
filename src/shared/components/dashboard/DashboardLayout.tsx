'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import AppSidebar from './AppSidebar'
import DashboardHeader from './DashboardHeader'
import { FiBell } from 'react-icons/fi'

interface HeaderContent {
  title?: string
  subtitle?: string
  showNotifications?: boolean
  rightAction?: ReactNode
}

interface DashboardLayoutContextType {
  setHeaderContent: (content: HeaderContent) => void
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | null>(null)

export const useDashboardHeader = () => {
  const context = useContext(DashboardLayoutContext)
  if (!context) {
    throw new Error('useDashboardHeader must be used within DashboardLayout')
  }
  return context
}

interface DashboardLayoutProps {
  children: ReactNode
  defaultTitle?: string
  defaultSubtitle?: string
}

export default function DashboardLayout({ 
  children, 
  defaultTitle = 'Dashboard',
  defaultSubtitle = 'Welcome back'
}: DashboardLayoutProps) {
  const [headerContent, setHeaderContent] = useState<HeaderContent>({
    title: defaultTitle,
    subtitle: defaultSubtitle,
    showNotifications: false,
    rightAction: undefined,
  })

  return (
    <DashboardLayoutContext.Provider value={{ setHeaderContent }}>
      <div className="flex flex-col min-h-screen font-outfit bg-gray-50">
        <DashboardHeader
          title={headerContent.title}
          subtitle={headerContent.subtitle}
          showNotifications={headerContent.showNotifications}
          rightAction={headerContent.rightAction}
        />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <main className="main-with-sidebar flex-1 min-h-screen p-6 lg:p-6 md:p-4 md:pt-14 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayoutContext.Provider>
  )
}

