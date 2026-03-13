'use client'

interface BlogCardSkeletonProps {
  size?: 'small' | 'large'
  className?: string
}

/**
 * Skeleton matching BlogCard layout. Use while blog list is loading.
 */
export function BlogCardSkeleton({ size = 'small', className = '' }: BlogCardSkeletonProps) {
  if (size === 'large') {
    return (
      <article
        className={`relative flex min-h-[260px] w-full flex-col overflow-hidden rounded-lg bg-white shadow-sm min-w-[340px] max-w-[520px] flex-[0_1_420px] ${className}`}
        aria-hidden
      >
        <div className="absolute left-0 top-0 z-10 h-full w-full min-h-[200px] max-h-[240px] rounded-lg bg-gray-200 animate-pulse" />
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2 rounded-lg bg-white/95 px-6 py-4">
          <div className="flex items-center gap-4 mb-1.5">
            <span className="h-6 w-20 rounded-full bg-gray-200 animate-pulse" />
            <span className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
          </div>
          <span className="h-5 w-full max-w-[90%] rounded bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="block h-3 w-full rounded bg-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
            <span className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
          <span className="h-4 w-20 rounded bg-gray-200 animate-pulse self-end mt-2" />
        </div>
      </article>
    )
  }

  return (
    <article
      className={`relative flex h-[200px] min-h-[200px] max-h-[200px] w-full flex-col overflow-hidden rounded-lg bg-white shadow-sm min-w-[220px] max-w-[300px] flex-[0_1_260px] ${className}`}
      aria-hidden
    >
      <div className="h-[140px] w-full flex-shrink-0 rounded-t-lg bg-gray-200 animate-pulse md:h-[160px]" />
      <div className="flex flex-1 flex-col px-6 py-3">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
          <span className="h-3 w-14 rounded bg-gray-100 animate-pulse" />
        </div>
        <span className="mb-1.5 block h-5 max-w-[85%] w-full rounded bg-gray-200 animate-pulse" />
        <div className="space-y-1 mb-2">
          <span className="block h-3 w-full rounded bg-gray-100 animate-pulse" />
          <span className="block h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
        </div>
        <div className="flex justify-between gap-2 mt-auto">
          <span className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
          <span className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    </article>
  )
}

export default BlogCardSkeleton
