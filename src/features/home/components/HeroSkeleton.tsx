'use client'

/**
 * Skeleton for the Hero section. Use as Suspense fallback or when hero content is loading.
 */
export function HeroSkeleton() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pb-[200px] mt-0 min-h-[670px] max-h-[670px] flex flex-col justify-center items-center"
      aria-hidden
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-gray-200 animate-pulse" />

      {/* Content */}
      <div className="flex flex-col items-center justify-center w-full min-h-[600px] text-center relative z-10 px-4">
        {/* Title */}
        <span className="block h-10 sm:h-12 w-full max-w-2xl rounded-lg bg-gray-300 animate-pulse mb-3 mx-auto" />
        <span className="block h-5 w-full max-w-xl rounded bg-gray-200 animate-pulse mx-auto" />

        {/* AI / Search CTA button */}
        <span className="mt-6 h-14 w-48 rounded-full bg-gray-300 animate-pulse" />

        {/* Search / filters area */}
        <div className="mt-8 w-full max-w-6xl mx-auto max-h-[400px]">
          <div className="rounded-xl border border-gray-200 bg-white/90 p-4 sm:p-6 space-y-4">
            <span className="block h-12 w-full rounded-lg bg-gray-200 animate-pulse" />
            <div className="flex gap-3 flex-wrap">
              {[1, 2, 3].map((i) => (
                <span key={i} className="h-10 w-28 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
            <span className="block h-10 w-32 rounded-lg bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom banner (Rent / Find agent) */}
      <div className="absolute bottom-0 left-0 right-0 z-[100] flex w-full max-w-full">
        <div className="flex-1 h-[130px] bg-gray-300 animate-pulse" />
        <div className="flex-1 h-[130px] bg-gray-200 animate-pulse" />
      </div>
    </section>
  )
}

export default HeroSkeleton
