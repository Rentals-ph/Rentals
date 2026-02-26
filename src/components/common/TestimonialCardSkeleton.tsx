'use client'

interface TestimonialCardSkeletonProps {
  className?: string
}

/**
 * Skeleton matching TestimonialCard layout. Use while testimonials are loading.
 */
export function TestimonialCardSkeleton({ className = '' }: TestimonialCardSkeletonProps) {
  return (
    <article
      className={`flex w-[300px] flex-shrink-0 flex-col overflow-visible rounded-xl border border-white/20 bg-white/8 backdrop-blur-lg sm:w-[360px] xs:w-[240px] ${className}`}
      aria-hidden
    >
      <div className="relative h-[400px] w-full overflow-visible sm:h-[340px] xs:h-[160px]">
        <div className="h-full w-full rounded-t-xl bg-gray-300/50 animate-pulse" />
        <div className="absolute -bottom-5 left-5 z-10">
          <div className="h-11 w-11 rounded-full bg-gray-300 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-1 flex-col rounded-b-xl bg-white px-5 pb-5 pt-5 xs:px-4 xs:pb-4 xs:pt-6">
        <div className="space-y-2 flex-1">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className="block h-4 w-full rounded bg-gray-100 animate-pulse"
              style={{ width: i === 3 ? '80%' : '100%' }}
            />
          ))}
        </div>
        <div className="mt-auto space-y-1">
          <span className="block h-4 w-28 rounded bg-gray-200 animate-pulse" />
          <span className="block h-3 w-20 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    </article>
  )
}

export default TestimonialCardSkeleton
