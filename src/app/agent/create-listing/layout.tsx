'use client'

import { CreateListingProvider } from '../../../contexts/CreateListingContext'

export default function CreateListingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CreateListingProvider>{children}</CreateListingProvider>
}

