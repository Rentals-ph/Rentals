'use client'

interface NewsArticleSkeletonProps {
  variant?: 'feature' | 'card' | 'row'
  className?: string
}

/**
 * Skeleton for news article cards. Use while news list is loading.
 */
export function NewsArticleSkeleton({
  variant = 'card',
  className = '',
}: NewsArticleSkeletonProps) {
  if (variant === 'feature') {
    return (
      <article
        className={`relative overflow-hidden rounded-lg w-full ${className}`}
        aria-hidden
      >
        <div className="relative h-[600px] w-full bg-gray-200 animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <span className="inline-block h-6 w-24 rounded bg-white/30 animate-pulse mb-3" />
          <span className="block h-8 w-full max-w-[90%] rounded bg-white/20 animate-pulse mb-2" />
          <span className="block h-4 w-32 rounded bg-white/20 animate-pulse" />
        </div>
      </article>
    )
  }

  if (variant === 'row') {
    return (
      <article
        className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-white/80 ${className}`}
        aria-hidden
      >
        <div className="w-full sm:w-40 h-28 flex-shrink-0 rounded-lg bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <span className="block h-3 w-16 rounded bg-gray-200 animate-pulse" />
          <span className="block h-5 w-full rounded bg-gray-200 animate-pulse" />
          <span className="block h-3 w-full max-w-[80%] rounded bg-gray-100 animate-pulse" />
        </div>
      </article>
    )
  }

  return (
    <article
      className={`rounded-lg overflow-hidden bg-white shadow-sm ${className}`}
      aria-hidden
    >
      <div className="w-full aspect-video bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-2">
        <span className="block h-3 w-20 rounded bg-gray-200 animate-pulse" />
        <span className="block h-5 w-full rounded bg-gray-200 animate-pulse" />
        <span className="block h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
      </div>
    </article>
  )
}

export default NewsArticleSkeleton
