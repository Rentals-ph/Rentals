'use client'

interface HorizontalPropertyCardSkeletonProps {
  className?: string
}

/**
 * Skeleton placeholder matching HorizontalPropertyCard layout. Use while property list is loading.
 */
export function HorizontalPropertyCardSkeleton({ className = '' }: HorizontalPropertyCardSkeletonProps) {
  return (
    <article
      className={`w-full bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col sm:flex-row items-stretch shadow-sm min-h-[350px] max-h-[350px] ${className}`}
      aria-hidden
    >
      {/* Left: Image placeholder */}
      <div className="relative w-full sm:w-[50%] min-h-[250px] sm:min-h-0 sm:flex-shrink-0 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none bg-gray-200 animate-pulse" />

      {/* Right: Content */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3 sm:gap-4 min-w-0 overflow-hidden">
        <div className="flex justify-between items-start gap-2">
          <span className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
          <span className="h-3 w-16 rounded bg-gray-100 animate-pulse flex-shrink-0" />
        </div>
        <span className="h-9 w-28 rounded bg-gray-200 animate-pulse" />
        <div className="space-y-1">
          <span className="block h-5 w-full max-w-[95%] rounded bg-gray-200 animate-pulse" />
          <span className="block h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
        </div>

        <div className="flex items-center gap-4">
          {[1, 2, 3].map((i) => (
            <span key={i} className="h-4 w-14 rounded bg-gray-100 animate-pulse" />
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100">
          <span className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <span className="block h-3.5 w-24 rounded bg-gray-200 animate-pulse" />
            <span className="block h-3 w-16 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <span className="flex-1 h-10 rounded-lg bg-gray-200 animate-pulse" />
          <span className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
    </article>
  )
}

export default HorizontalPropertyCardSkeleton
