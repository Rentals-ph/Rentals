'use client'

import { CreateListingProvider } from '@/features/listings'

export default function BrokerCreateListingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CreateListingProvider>{children}</CreateListingProvider>
}
