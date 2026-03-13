'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole: 'admin' | 'agent' | 'broker'
}

/**
 * ProtectedRoute component that checks if user is authenticated and has the required role
 * Redirects to home page if user is not authenticated or doesn't have the required role
 * This is a client-side component for Next.js app directory
 */
function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authentication on client side
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('auth_token')
      const userRole = localStorage.getItem('user_role') || localStorage.getItem('agent_role')

      // If no token or wrong role, redirect to home
      if (!authToken || userRole !== requiredRole) {
        router.push('/')
        setIsAuthorized(false)
      } else {
        setIsAuthorized(true)
      }
    }
  }, [router, requiredRole])

  // Show nothing while checking (prevents flash of content)
  if (isAuthorized === null || !isAuthorized) {
    return null
  }

  // User is authenticated and has the correct role
  return children
}

export default ProtectedRoute

