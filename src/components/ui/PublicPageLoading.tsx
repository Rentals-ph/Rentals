'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PageLoading } from './PageLoading'

interface PublicPageLoadingProps {
  message?: string
}

/**
 * Loading UI for public pages: Navbar + spinner + Footer. Use in loading.tsx for routes that share this layout.
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
