'use client'

import Link from 'next/link'

const HeroBanner = () => {
  return (
    <div className="flex flex-col sm:flex-row w-full absolute bottom-0 left-0 z-40 overflow-hidden shadow-md max-w-full items-stretch">
      {/* Left Section - Blue Panel */}
      <Link href="/properties" className="flex-1 no-underline block transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 group h-full flex">
        <div className="h-[80px] xs:h-[100px] sm:h-[130px] w-full bg-rental-blue-600/100 flex items-center justify-center px-4 sm:px-6 md:px-8 group-hover:bg-rental-blue-600/95 transition-colors">
          <div className="flex items-center justify-center gap-2 sm:gap-5 w-full max-w-full px-3 sm:px-5 flex-wrap">
            <h3 className="text-white font-outfit text-sm xs:text-base sm:text-2xl md:text-3xl font-bold m-0 text-center leading-tight break-words flex-shrink min-w-0">
              Rent a property
            </h3>
            <svg 
              className="flex-shrink-0 w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M5 12H19M19 12L12 5M19 12L12 19" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </Link>

      {/* Right Section - Orange Panel */}
      <Link href="/agents" className="flex-1 no-underline block transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 group h-full flex">
        <div className="h-[80px] xs:h-[100px] sm:h-[130px] w-full bg-rental-orange-500/100 flex items-center justify-center px-4 sm:px-6 md:px-8 group-hover:bg-rental-orange-500/85 transition-colors">
          <div className="flex items-center justify-center gap-2 sm:gap-5 w-full max-w-full px-3 sm:px-5 flex-wrap">
            <h3 className="text-white font-outfit text-sm xs:text-base sm:text-2xl md:text-3xl font-bold m-0 text-center leading-tight break-words flex-shrink min-w-0">
              Find a property agent
            </h3>
            <svg 
              className="flex-shrink-0 w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M5 12H19M19 12L12 5M19 12L12 19" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default HeroBanner

