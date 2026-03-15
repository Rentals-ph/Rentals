'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type OpenSidebar = 'left' | 'right' | null

type PublicSidebarContextValue = {
  openSidebar: OpenSidebar
  setOpenSidebar: (value: OpenSidebar | ((prev: OpenSidebar) => OpenSidebar)) => void
}

const PublicSidebarContext = createContext<PublicSidebarContextValue | null>(null)

export function PublicSidebarProvider({
  value,
  children,
}: {
  value: PublicSidebarContextValue
  children: ReactNode
}) {
  return (
    <PublicSidebarContext.Provider value={value}>
      {children}
    </PublicSidebarContext.Provider>
  )
}

export function usePublicSidebar() {
  const ctx = useContext(PublicSidebarContext)
  return ctx
}
