'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BrokerCreateListing() {
  const router = useRouter()

  useEffect(() => {
    router.push('/broker/create-listing/basic-info')
  }, [router])

  return null
}
