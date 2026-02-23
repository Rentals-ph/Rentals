'use client'

import { ProtectedRoute } from '../../components/common'

// Note: revalidate and dynamic exports are not allowed in Client Components
// These need to be in Server Components only

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="agent">
      {children}
    </ProtectedRoute>
  )
}

