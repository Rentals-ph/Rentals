'use client'

import { ProtectedRoute } from '@/features/auth'
import { AppSidebar } from '@/features/dashboard'
import { AppHeader } from '@/features/dashboard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex flex-col min-h-screen font-outfit bg-gray-50">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <main className="main-with-sidebar z-10 flex-1 min-h-screen p-6 lg:p-6 md:p-4 md:pt-14 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

