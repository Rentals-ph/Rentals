'use client'

import Testimonials from '@/components/home/Testimonials'
import Footer from '@/components/layout/Footer'
import Partners from '@/components/common/misc/Partners'
import { ASSETS } from '@/utils/assets'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col flex-1 w-full max-w-full overflow-x-hidden font-outfit">

      {/* --- HERO SECTION --- */}
      <section className="w-full relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src={ASSETS.ABOUT_BACKGROUND}
            alt="About Us background"
            className="w-full h-full object-cover object-center"
            style={{ imageRendering: 'auto' }}
          />
          {/* Light overlay for text readability */}
          <div
            className="absolute top-0 left-0 w-full h-full z-[2] bg-black/20"
          />
        </div>

        <div className="relative z-[3] max-w-[var(--page-max-width)] mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 w-full flex items-center justify-center flex-1">
          <div className="text-center flex flex-col items-center justify-center">
            <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight m-0 tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              About Rentals.ph
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-semibold text-white m-0 mt-3 sm:mt-4 max-w-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              We provide full service at every step to make real estate better.
            </p>
          </div>
        </div>
      </section>

      {/* --- KEY FEATURES SECTION --- */}
      <section className="bg-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-10 lg:px-[150px]">
        <div className="mx-auto max-w-[var(--page-max-width)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {/* Card 01 - Rent.ph Cares */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col min-h-[280px]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center">
                  <img src={ASSETS.ABOUT_RENTPH_CARES} alt="Rent.ph Cares" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#205ed7] mb-2">
                    Rent.ph Cares Your Rental, Their Hope
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Your Rentals, Their Hope. With Rent.ph Cares, every transaction fuels community programs and transforms lives. Rent a home, inspire a future.
                  </p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-6xl md:text-7xl font-bold text-[#f97316]/30 leading-none">
                01
              </div>
            </div>

            {/* Card 02 - Your Trusted Rental Partner */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col min-h-[280px]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center">
                  <img src={ASSETS.ABOUT_TRUSTED_PARTNER} alt="Trusted Partner" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#205ed7] mb-2">
                    Your Trusted Rental Partner
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    The Philippines' most trusted rental brand. Backed by a network of licensed realtors and managers, we provide the expert, personal assistance property owners and clients deserve.
                  </p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-6xl md:text-7xl font-bold text-[#f97316]/20 leading-none">
                02
              </div>
            </div>

            {/* Card 03 - Transforming Real Estate Investment */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col min-h-[280px]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center">
                  <img src={ASSETS.ABOUT_TRANSFORMING} alt="Transforming" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#205ed7] mb-2">
                    Transforming Real Estate Investment into Productive Assets
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Since 2014, Rent.ph has been dedicated to a single goal: turning real estate investments into productive assets through expert management solutions.
                  </p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-6xl md:text-7xl font-bold text-[#f97316]/20 leading-none">
                03
              </div>
            </div>

            {/* Card 04 - Comprehensive Rental Solution */}
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col min-h-[280px]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center">
                  <img src={ASSETS.ABOUT_COMPREHENSIVE} alt="Comprehensive" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#205ed7] mb-2">
                    Your Comprehensive Rental Solution Nationwide
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Together with Filipino Homes, we provide nationwide marketing for all property types—houses, condos, and warehouses—through our expert network in key cities and provinces.
                  </p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-6xl md:text-7xl font-bold text-[#f97316]/20 leading-none">
                04
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- OUR COMPANY STORY SECTION --- */}
      <section className="bg-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-10 lg:px-[150px]">
        <div className="mx-auto max-w-[var(--page-max-width)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Text Left */}
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4">
                <span className="text-[#205ed7]">Our Company</span> <span className="text-[#f97316]">Story</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                Established in 2014 under Philippine Real Estate Management Solutions Inc., Rentals.ph was organized with one clear goal: to serve as the vehicle in translating real estate investments into productive assets. Today, we stand as the only rental portal backed by realtors, rent managers, and licensed real estate professionals.
              </p>
              <button className="self-start bg-[#205ed7] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a4ba8] transition-colors">
                Read More
              </button>
            </div>
            {/* Image Right with Overlay */}
            <div className="relative min-h-[400px] md:min-h-[500px]">
              <img
                src={ASSETS.ABOUT_OUR_STORY}
                alt="Our Company Story - Team Working"
                className="w-full h-full object-cover object-center rounded-lg absolute inset-0"
              />
              {/* Overlay with Rentals.ph logo centered */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <div className="relative flex flex-col items-center gap-4">
                  {/* House Icon and Rentals.ph Text - Horizontal Layout */}
                  <div className="flex items-center gap-3">
                    {/* House Icon from SVG */}
                    <div className="flex-shrink-0">
                      <img 
                        src={ASSETS.LOGO_ICON} 
                        alt="Rentals.ph Logo" 
                        className="w-16 h-16 md:w-20 md:h-20"
                      />
                    </div>
                    {/* Rentals.ph Text */}
                    <div className="flex flex-col">
                      <div className="text-2xl md:text-3xl font-bold leading-tight">
                        <span className="text-[#205ed7]">Rentals</span>
                        <span className="text-[#f97316]">.ph</span>
                      </div>
                      <div className="text-xs md:text-sm font-bold text-[#f97316] uppercase tracking-wide mt-1">
                        PHILIPPINES #1 PROPERTY RENTAL WEBSITE
                      </div>
                    </div>
                  </div>
                  {/* Speech Bubble - Positioned below */}
                  <div className="relative bg-[#205ed7] text-white px-4 py-2 rounded-lg shadow-xl">
                    <span className="text-sm md:text-base">This website is made with love </span>
                    <span className="text-red-400">❤</span>
                    {/* Speech bubble tail pointing up */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#205ed7]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATISTICS SECTION --- */}
      <section className="bg-[#205ed7] py-10 sm:py-12 md:py-14 px-4 sm:px-6 relative overflow-hidden">
        {/* Abstract glowing shapes background */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[min(900px,100%)] opacity-15">
          <div className="absolute top-12 left-8 w-44 h-44 sm:w-56 sm:h-56 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-12 right-8 w-56 h-56 sm:w-72 sm:h-72 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 sm:w-64 sm:h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-[var(--page-max-width)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-1">762</div>
              <div className="text-sm sm:text-base md:text-lg text-white/90">Registered Agents</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-1">853</div>
              <div className="text-sm sm:text-base md:text-lg text-white/90">Registered Brokers</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-1">12,453</div>
              <div className="text-sm sm:text-base md:text-lg text-white/90">Happy Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- THE CREW SECTION --- */}
      <section className="bg-white py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-10 lg:px-[150px]">
        <div className="mx-auto max-w-[var(--page-max-width)]">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-1">
              <span className="text-[#205ed7]">The Crew</span>
            </h2>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
              Our Awesome Team
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {/* Team Member 1 - Christian Yancha */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-[240px] mx-auto w-full hover:shadow-md transition-shadow">
              <div className="aspect-square w-full bg-gray-100 relative">
                <img
                  src={ASSETS.ABOUT_TEAM_LEADER}
                  alt="Christian Yancha"
                  className="w-full h-full object-cover object-center"
                  style={{ imageRendering: 'crisp-edges' }}
                  loading="lazy"
                />
              </div>
              <div className="p-3 text-center">
                <h4 className="font-bold text-base text-gray-900 leading-tight">Christian Yancha</h4>
                <p className="text-xs text-gray-600 mt-0.5">Team Leader</p>
              </div>
            </div>

            {/* Team Member 2 - Ian Dal */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-[240px] mx-auto w-full hover:shadow-md transition-shadow">
              <div className="aspect-square w-full bg-gray-100 relative">
                <img
                  src={ASSETS.ABOUT_TEAM_IAN}
                  alt="Ian Dal"
                  className="w-full h-full object-cover object-center"
                  style={{ imageRendering: 'crisp-edges' }}
                  loading="lazy"
                />
              </div>
              <div className="p-3 text-center">
                <h4 className="font-bold text-base text-gray-900 leading-tight">Ian Dal</h4>
                <p className="text-xs text-gray-600 mt-0.5">Full Stack Developer</p>
              </div>
            </div>

            {/* Team Member 3 - Donielle Isaac Lacaylacay */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-[240px] mx-auto w-full hover:shadow-md transition-shadow">
              <div className="aspect-square w-full bg-gray-100 relative">
                <img
                  src={ASSETS.ABOUT_TEAM_ISAAC}
                  alt="Donielle Isaac Lacaylacay"
                  className="w-full h-full object-cover object-center"
                  style={{ imageRendering: 'crisp-edges' }}
                  loading="lazy"
                />
              </div>
              <div className="p-3 text-center">
                <h4 className="font-bold text-base text-gray-900 leading-tight">Donielle Isaac Lacaylacay</h4>
                <p className="text-xs text-gray-600 mt-0.5">UI/UX Designer</p>
              </div>
            </div>

            {/* Team Member 4 - Chris Niño Pagente */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-[240px] mx-auto w-full hover:shadow-md transition-shadow">
              <div className="aspect-square w-full bg-gray-100 relative">
                <img
                  src={ASSETS.ABOUT_TEAM_NYO}
                  alt="Chris Niño Pagente"
                  className="w-full h-full object-cover object-center"
                  style={{ imageRendering: 'crisp-edges' }}
                  loading="lazy"
                />
              </div>
              <div className="p-3 text-center">
                <h4 className="font-bold text-base text-gray-900 leading-tight">Chris Niño Pagente</h4>
                <p className="text-xs text-gray-600 mt-0.5">Web Developer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS & PARTNERS SECTIONS --- */}
      <section className="bg-gray-50 flex flex-col">
        <Testimonials />
        <div className="w-full">
          <Partners />
        </div>
      </section>

      <Footer />
    </div>
  )
}
