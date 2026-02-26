'use client'

interface RentManagerCardSkeletonProps {
  variant?: 'grid' | 'list'
  className?: string
}

/**
 * Skeleton matching rent manager card (grid or list). Use while rent managers list is loading.
 */
export function RentManagerCardSkeleton({
  variant = 'grid',
  className = '',
}: RentManagerCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <div
        className={`bg-white overflow-hidden rounded-2xl border border-gray-200 flex flex-col sm:flex-row ${className}`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
        aria-hidden
      >
        <div className="w-full sm:w-48 flex-shrink-0 aspect-square bg-gray-200 animate-pulse" />
        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center gap-2">
            <span className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
            <span className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
          <span className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
          <div className="border-t border-gray-200 my-2" />
          <span className="h-3 w-full max-w-[200px] rounded bg-gray-100 animate-pulse" />
          <span className="h-3 w-40 rounded bg-gray-100 animate-pulse" />
          <span className="h-10 w-32 rounded-lg bg-gray-200 animate-pulse mt-2" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white overflow-hidden rounded-2xl border border-gray-200 ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
      aria-hidden
    >
      <div className="w-full pt-0 pb-4">
        <div className="relative w-full aspect-[4/3] rounded-t-2xl bg-gray-200 animate-pulse" />
      </div>
      <div className="px-3 sm:px-8 pb-3 sm:pb-4">
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="h-5 flex-1 max-w-[60%] rounded bg-gray-200 animate-pulse" />
          <span className="h-4 w-20 rounded bg-gray-100 animate-pulse flex-shrink-0" />
        </div>
        <span className="block h-3 w-24 rounded bg-gray-100 animate-pulse mb-3 sm:mb-4" />
        <div className="border-t border-gray-200 mb-3 sm:mb-4" />
        <div className="flex flex-col gap-2 mb-3 sm:mb-4">
          <span className="h-3 w-full max-w-[180px] rounded bg-gray-100 animate-pulse" />
          <span className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
        </div>
        <span className="block h-10 w-full rounded-lg bg-gray-200 animate-pulse" />
      </div>
    </div>
  )
}

export default RentManagerCardSkeleton
