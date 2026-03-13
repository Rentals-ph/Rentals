'use client'

interface VerticalPropertyCardSkeletonProps {
  className?: string
}

/**
 * Skeleton placeholder matching VerticalPropertyCard layout. Use while property list is loading.
 */
export function VerticalPropertyCardSkeleton({ className = '' }: VerticalPropertyCardSkeletonProps) {
  return (
    <article
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col w-full max-w-[550px] h-full shadow-sm ${className}`}
      aria-hidden
    >
      {/* Image placeholder */}
      <div className="relative w-full aspect-[4/3] rounded-t-xl bg-gray-200 animate-pulse" />

      {/* Content */}
      <div className="flex flex-col flex-1 px-8 py-4 gap-3 overflow-hidden">
        <div className="flex justify-between items-center gap-2">
          <span className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="h-8 w-24 rounded bg-gray-200 animate-pulse" />
          <span className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
        </div>
        <div className="min-w-0 space-y-1">
          <span className="block h-5 w-full max-w-[90%] rounded bg-gray-200 animate-pulse" />
          <span className="block h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
        </div>

        {/* Bed, bath, size */}
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((i) => (
            <span key={i} className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
          ))}
        </div>

        {/* Agent strip */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
          <span className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <span className="block h-3.5 w-24 rounded bg-gray-200 animate-pulse" />
            <span className="block h-3 w-16 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="flex-1 h-10 rounded-lg bg-gray-200 animate-pulse" />
          <span className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse" />
          <span className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
    </article>
  )
}

export default VerticalPropertyCardSkeleton
