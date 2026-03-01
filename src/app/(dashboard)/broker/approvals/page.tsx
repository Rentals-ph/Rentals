'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect from legacy Agent Approvals page to Create Agent.
 * Agent approval flow has been removed - brokers now create agents directly.
 */
export default function ApprovalsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/broker/agents/create')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  )
}
