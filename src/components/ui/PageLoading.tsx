'use client'

import { LoadingSpinner } from './LoadingSpinner'

interface PageLoadingProps {
  message?: string
  fullPage?: boolean
  /** If true, renders minimal spinner only (no message). */
  minimal?: boolean
}

/**
 * Full-page or section loading state. Use in loading.tsx or as Suspense fallback.
 */
export function PageLoading({
  message = 'Loading...',
  fullPage = true,
  minimal = false,
}: PageLoadingProps) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 text-gray-600 font-outfit ${
        fullPage ? 'min-h-[60vh] w-full' : 'py-12'
      }`}
    >
      <LoadingSpinner size="lg" />
      {!minimal && (
        <p className="text-sm sm:text-base animate-pulse" role="status">
          {message}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {content}
      </div>
    )
  }

  return content
}
