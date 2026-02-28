'use client'

interface SimplePropertyCardSkeletonProps {
  className?: string
}

/**
 * Skeleton placeholder matching SimplePropertyCard layout. Use with Suspense fallback or while loading.
 */
export function SimplePropertyCardSkeleton({ className = '' }: SimplePropertyCardSkeletonProps) {
  return (
    <div
      className={`min-h-[200px] w-full flex-shrink-0 overflow-hidden rounded-lg bg-white shadow-sm md:min-h-[180px] ${className}`}
      aria-hidden
    >
      <div className="relative h-[220px] w-full overflow-hidden bg-gray-200 md:h-[180px]">
        {/* Image placeholder */}
        <div className="h-full w-full animate-pulse bg-gray-300" />

        {/* Bottom overlay - matches SimplePropertyCard gradient + label area */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-3">
          <div className="flex flex-col gap-1 rounded-md bg-black/40 px-2 py-1.5 md:px-1.5 md:py-1">
            {/* Title - 2 lines */}
            <div className="flex flex-col gap-1">
              <span className="h-4 w-full max-w-[95%] rounded bg-white/30 animate-pulse" />
              <span className="h-4 w-3/4 rounded bg-white/20 animate-pulse" />
            </div>
            {/* Location */}
            <span className="h-3.5 w-2/3 rounded bg-white/25 animate-pulse mt-0.5" />
            {/* Price */}
            <span className="h-5 w-24 rounded bg-white/40 animate-pulse mt-1" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimplePropertyCardSkeleton
