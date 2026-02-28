'use client'

import { useState, useEffect } from 'react'
import Navbar, { SIDEBAR_WIDTH, SIDEBAR_WIDTH_SM } from './Navbar'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isMobile, sidebarOffset } = useMobileLayout()

  const pushStyle =
    isMobile && mobileMenuOpen
      ? {
          transform: `translateX(${sidebarOffset}px)`,
          transition: 'transform 300ms ease-in-out',
        }
      : isMobile
        ? { transition: 'transform 300ms ease-in-out' as const }
        : undefined

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col"
      style={pushStyle}
    >
      <header className="flex-shrink-0">
        <Navbar
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuToggle={setMobileMenuOpen}
        />
      </header>
      <main className="flex-1 min-h-0 flex flex-col w-full">
        {children}
      </main>
    </div>
  )
}
