'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PageLoading } from './PageLoading'

interface PublicPageLoadingProps {
  message?: string
}

/**
 * Full loading UI with Navbar + spinner + Footer. Use only at the ROOT level (e.g. app/loading.tsx)
 * when the layout tree is not yet mounted. Do NOT use inside (public) routes — the public layout
 * already provides the Navbar; use PublicLayoutLoading instead to avoid double navbar.
 */
export function PublicPageLoading({ message = 'Loading...' }: PublicPageLoadingProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Navbar />
      <PageLoading message={message} fullPage={true} />
      <Footer />
    </div>
  )
}

/**
 * Loading UI for use inside (public) layout only: spinner + message, no Navbar/Footer.
 * The layout already renders the Navbar, so this prevents double navbar during navigation.
 */
export function PublicLayoutLoading({ message = 'Loading...' }: PublicPageLoadingProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] w-full bg-white">
      <PageLoading message={message} fullPage={false} />
    </div>
  )
}
