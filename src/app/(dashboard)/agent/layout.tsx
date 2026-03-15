'use client'

import { ProtectedRoute } from '@/features/auth'
import { AppSidebar } from '@/features/dashboard'
import { AppHeader } from '@/features/dashboard'

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
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <main className="main-with-sidebar flex-1 p-5 min-h-screen ">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

