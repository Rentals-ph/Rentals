'use client'

import { ProtectedRoute } from '@/components/common'
import AppSidebar from '@/components/common/AppSidebar'
import AgentHeader from '@/components/agent/AgentHeader'

// Note: revalidate and dynamic exports are not allowed in Client Components
// These need to be in Server Components only

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="agent">
      <div className="flex flex-col min-h-screen font-outfit bg-gray-50">
        <AgentHeader
          title="Dashboard"
          subtitle="Welcome back, manage your rental properties."
        />
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

