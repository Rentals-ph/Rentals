'use client'

import Link from 'next/link'

const HeroBanner = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 flex justify-center px-3 pb-4 pointer-events-none">
      <div className="flex w-full max-w-4xl flex-col sm:flex-row items-stretch gap-2 sm:gap-3 rounded-2xl bg-white/50 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.25)] border border-white/60 pointer-events-auto">
        {/* Rent a property */}
        <Link
          href="/properties"
          className="flex-1 no-underline"
        >
          <div className="flex h-14 xs:h-16 sm:h-[70px] items-center justify-center rounded-2xl sm:rounded-l-2xl sm:rounded-r-none bg-rental-blue-600 text-white px-4 sm:px-6 md:px-8 transition-colors hover:bg-rental-blue-700">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <span className="font-outfit text-sm xs:text-base sm:text-lg font-semibold">
                Rent a property
              </span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </Link>

        {/* Find an agent */}
        <Link
          href="/agents"
          className="flex-1 no-underline"
        >
          <div className="flex h-14 xs:h-16 sm:h-[70px] items-center justify-center rounded-2xl sm:rounded-r-2xl sm:rounded-l-none bg-rental-orange-500 text-white px-4 sm:px-6 md:px-8 transition-colors hover:bg-rental-orange-600">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <span className="font-outfit text-sm xs:text-base sm:text-lg font-semibold">
                Find a property agent
              </span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default HeroBanner

