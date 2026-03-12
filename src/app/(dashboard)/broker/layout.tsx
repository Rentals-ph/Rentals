'use client'

import { ProtectedRoute } from '@/components/common'
import AppSidebar from '@/components/common/AppSidebar'
import AppHeader from '@/components/common/dashboard/AppHeader'

export default function BrokerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="broker">
      <div className="flex flex-col min-h-screen font-outfit bg-gray-50">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <main className="main-with-sidebar flex-1 min-h-screen p-6 lg:p-6 md:p-4 md:pt-14 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
