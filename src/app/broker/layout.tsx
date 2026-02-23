'use client'

import { ProtectedRoute } from '../../components/common'

export default function BrokerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="broker">
      {children}
    </ProtectedRoute>
  )
}
