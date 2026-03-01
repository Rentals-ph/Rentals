'use client'

import { useState, useEffect } from 'react'
import Navbar, { SIDEBAR_WIDTH, SIDEBAR_WIDTH_SM } from './Navbar'
import { PublicSidebarProvider, type OpenSidebar } from '@/contexts/PublicSidebarContext'

function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOffset, setSidebarOffset] = useState(SIDEBAR_WIDTH)

  useEffect(() => {
    const update = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1024
      const mobile = width < 1024
      setIsMobile(mobile)
      setSidebarOffset(width >= 640 ? SIDEBAR_WIDTH_SM : SIDEBAR_WIDTH)
    }
    update()
    const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)') : null
    mq?.addEventListener('change', update)
    return () => mq?.removeEventListener('change', update)
  }, [])

  return { isMobile, sidebarOffset }
}

export default function PublicLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [openSidebar, setOpenSidebar] = useState<OpenSidebar>(null)
  const { isMobile, sidebarOffset } = useMobileLayout()

  const leftOpen = openSidebar === 'left'

  // Restrict page scroll when any public sidebar (left or right) is open; sidebar content still scrolls
  useEffect(() => {
    if (openSidebar) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [openSidebar])

  const pushStyle =
    isMobile && leftOpen
      ? {
          transform: `translateX(${sidebarOffset}px)`,
          transition: 'transform 300ms ease-in-out',
        }
      : isMobile
        ? { transition: 'transform 300ms ease-in-out' as const }
        : undefined

  return (
    <PublicSidebarProvider value={{ openSidebar, setOpenSidebar }}>
      <div
        className="min-h-screen min-h-[100dvh] flex flex-col"
        style={pushStyle}
      >
        <header className="flex-shrink-0 sticky top-0 z-[60] lg:static bg-white">
          <Navbar
            mobileMenuOpen={leftOpen}
            onMobileMenuToggle={(open) => setOpenSidebar(open ? 'left' : null)}
          />
        </header>
        <main className="flex-1 min-h-0 flex flex-col w-full">
          {children}
        </main>
      </div>
    </PublicSidebarProvider>
  )
}
