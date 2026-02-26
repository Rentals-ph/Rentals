'use client'

interface LoadingSkeletonProps {
  className?: string
  /** Number of skeleton lines (for text blocks). */
  lines?: number
}

/**
 * Simple skeleton placeholder for content. Use in Suspense fallbacks for sections.
 */
export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`} role="status" aria-label="Loading">
      {lines >= 1 ? (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded max-w-full"
              style={{ width: i === lines - 1 && lines > 1 ? '75%' : '100%' }}
            />
          ))}
        </div>
      ) : (
        <div className="h-4 bg-gray-200 rounded w-full" />
      )}
    </div>
  )
}
