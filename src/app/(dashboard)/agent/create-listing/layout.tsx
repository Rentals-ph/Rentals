'use client'

import { CreateListingProvider } from '@/features/listings'

export default function CreateListingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CreateListingProvider>{children}</CreateListingProvider>
}

