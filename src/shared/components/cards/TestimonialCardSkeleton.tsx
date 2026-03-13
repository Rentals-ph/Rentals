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
      className={`flex w-full flex-col bg-white rounded-lg sm:rounded-xl shadow-sm p-5 sm:p-6 md:p-7 min-h-[200px] ${className}`}
      aria-hidden
    >
      {/* Header section with profile, name/role, and quote icon */}
      <div className="relative flex items-start gap-3 mb-4">
        {/* Profile picture skeleton - circular, left side */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-300 animate-pulse" />
        </div>
        
        {/* Name and role skeleton - next to profile picture */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="h-5 w-32 sm:w-40 rounded bg-gray-200 animate-pulse mb-2" />
          <div className="h-4 w-24 sm:w-32 rounded bg-gray-100 animate-pulse" />
        </div>
        
        {/* Quote icon skeleton - top right corner */}
        <div className="flex-shrink-0 absolute top-0 right-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
      
      {/* Testimonial text skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-4 sm:h-5 rounded bg-gray-100 animate-pulse"
            style={{ width: i === 4 ? '80%' : '100%' }}
          />
        ))}
      </div>
    </article>
  )
}

export default TestimonialCardSkeleton
