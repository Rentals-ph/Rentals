'use client'

import Testimonials from '@/components/home/Testimonials'
import Footer from '@/components/layout/Footer'
import Partners from '@/components/common/misc/Partners'
import { ASSETS } from '@/utils/assets'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col flex-1 w-full max-w-full overflow-x-hidden font-outfit">

      {/* --- HERO SECTION --- */}
      <section className="w-full relative min-h-[280px] xs:min-h-[340px] sm:min-h-[400px] md:min-h-[500px] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src={ASSETS.ABOUT_BACKGROUND}
            alt="About Us background"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlay method matched with Blog hero */}
          <div
            className="absolute top-0 left-0 w-full h-full z-[2]"
            style={{
              background:
                'linear-gradient(135deg, rgba(32, 94, 215, 0.85) 0%, rgba(105, 187, 255, 0.75) 50%, rgba(254, 142, 10, 0.85) 100%)',
                opacity: 0.85,
            }}
          />
        </div>

        <div className="relative z-[3] max-w-[var(--page-max-width)] mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 w-full flex items-center justify-center flex-1">
          <div className="text-center flex flex-col items-center justify-center">
            <h1 className="font-extrabold text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl leading-tight m-0 tracking-tight">
              <span className="text-rental-blue-500">About</span>{" "}
              <span className="text-rental-orange-500">Rentals.ph</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-white m-0 mt-2 sm:mt-3">
              We provide full service at every step.
            </p>
          </div>
        </div>

        {/* Bottom Orange Bar */}
        <div className="relative z-[3] w-full h-3 sm:h-4 bg-[#f97316]" />
      </section>

      {/* --- CORE SECTIONS (STORY, MISSION, VISION) --- */}
      <section className="bg-white py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10 lg:px-[150px] overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #e8f0ff 0%, #ffffff 100%)' }}>
        <div className="mx-auto max-w-[var(--page-max-width)] grid grid-rows-[repeat(3,auto)] gap-10 sm:gap-8 md:gap-12 items-stretch">

          {/* OUR STORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-10 items-stretch min-h-0">
            {/* Image Left */}
            <div className="relative z-10 mx-auto w-full max-w-[400px] md:max-w-none order-2 md:order-1 h-full min-h-[200px] sm:min-h-[220px] md:min-h-0 md:max-h-[260px]">
              <img
                src={ASSETS.ABOUT_OUR_STORY}
                alt="Our Story"
                className="w-full h-full object-cover object-center rounded-2xl"
              />
            </div>
            {/* Text Right */}
            <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left relative order-1 md:order-2 py-2 overflow-hidden">
              {/* Decorative Blob - smaller on mobile to avoid overflow */}
              <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-[#fff3cd] rounded-full blur-[40px] sm:blur-[60px] opacity-50 sm:opacity-70 z-0 pointer-events-none"></div>

              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold mb-2 relative z-10 w-full">
                <span className="text-[#205ed7]">OUR</span> <span className="text-[#f97316]">STORY</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg font-normal leading-snug text-gray-700 relative z-10 max-w-full">
                Established in 2014 under Philippine Real Estate Management Solutions Inc., Rentals.ph was organized with one clear goal: to serve as the vehicle in translating real estate investments into productive assets. Today, we stand as the <span className="font-bold border-b-2 border-[#f97316]">only rental portal</span> backed by realtors, rent managers, and licensed real estate professionals.
              </p>
            </div>
          </div>

          {/* OUR MISSION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-stretch min-h-0">
            {/* Text Left */}
            <div className="flex flex-col justify-center items-center md:items-end text-center md:text-right relative order-1 py-2 overflow-hidden">
              {/* Decorative Blob - smaller on mobile */}
              <div className="absolute left-[-20px] top-[-20px] w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-[#efe5ff] rounded-full blur-[40px] sm:blur-[60px] opacity-50 sm:opacity-80 z-0 pointer-events-none"></div>

              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold mb-2 relative z-10 w-full">
                <span className="text-[#205ed7]">OUR</span> <span className="text-[#f97316]">MISSION</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg font-normal leading-snug text-gray-700 relative z-10 max-w-full">
                To transform real estate investments into productive assets while providing exceptional service to property owners and tenants across the Philippines.
              </p>
            </div>
            {/* Image Right */}
            <div className="relative z-10 mx-auto w-full max-w-[400px] md:max-w-none order-2 h-full min-h-[200px] sm:min-h-[220px] md:min-h-0 md:max-h-[260px]">
              <img
                src={ASSETS.ABOUT_OUR_MISSION}
                alt="Our Mission"
                className="w-full h-full object-cover object-center rounded-lg"
              />
            </div>
          </div>

          {/* OUR VISION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-10 items-stretch min-h-0">
            {/* Image Left */}
            <div className="relative z-10 mx-auto w-full max-w-[400px] md:max-w-none order-2 md:order-1 h-full min-h-[200px] sm:min-h-[220px] md:min-h-0 md:max-h-[260px]">
              <img
                src={ASSETS.ABOUT_OUR_VISION}
                alt="Our Vision"
                className="w-full h-full object-cover object-center rounded-lg"
              />
            </div>
            {/* Text Right */}
            <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left relative order-1 md:order-2 py-2 overflow-hidden">
              {/* Decorative Blob - smaller on mobile */}
              <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-[#e8f0ff] rounded-full blur-[40px] sm:blur-[60px] opacity-50 sm:opacity-80 z-0 pointer-events-none"></div>

              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold mb-2 relative z-10 w-full">
                <span className="text-[#205ed7]">OUR</span> <span className="text-[#f97316]">VISION</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg font-normal leading-snug text-gray-700 relative z-10 max-w-full">
                To be the leading rental platform that connects property owners with quality tenants through innovative technology and trusted professional networks.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* --- WHAT WE OFFER SECTION --- */}
      <section className="bg-white pt-6 sm:pt-8 px-4 sm:px-6 md:px-10 lg:px-[150px] pb-12 sm:pb-16 md:pb-20 border-t border-gray-100">
        <div className="mx-auto max-w-[var(--page-max-width)]">
          <h2 className="text-center text-xl sm:text-3xl md:text-4xl font-extrabold text-[#205ed7] mb-6 sm:mb-8 md:mb-10 tracking-tight">
            WHAT WE OFFER
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 md:p-8 rounded-xl border-2 border-[#f97316] bg-white shadow-sm"
            style={{
              border: '2px solid #f97316',
            }}>
              <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 flex items-center justify-center">
                <img src={ASSETS.ABOUT_RENTPH_CARES} alt="Rent.ph Cares" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-xl md:text-2xl font-bold text-[#205ed7] mb-0.5">Rent.ph Cares <span className="text-[#f97316]">Your Rental, Their Hope</span></h4>
                <p className="text-sm sm:text-base md:text-xl text-gray-600 leading-snug m-0">Every transaction gives back to communities in need.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 md:p-8 rounded-xl border-2 border-[#f97316] bg-white shadow-sm"
            style={{
              border: '2px solid #f97316',
            }}>
              <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 flex items-center justify-center">
                <img src={ASSETS.ABOUT_TRUSTED_PARTNER} alt="Trusted Partner" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-xl md:text-2xl font-bold text-[#205ed7] mb-0.5">Your Trusted <span className="text-[#f97316]">Rental Partner</span></h4>
                <p className="text-sm sm:text-base md:text-xl text-gray-600 leading-snug m-0">Certified real estate professionals, integrity, and personalized service.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 md:p-8 rounded-xl border-2 border-[#f97316] bg-white shadow-sm"
            style={{
              border: '2px solid #f97316',
            }}>
              <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 flex items-center justify-center">
                <img src={ASSETS.ABOUT_TRANSFORMING} alt="Transforming" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-xl md:text-2xl font-bold text-[#205ed7] mb-0.5">Transforming Investment <span className="text-[#f97316]">Into Assets</span></h4>
                <p className="text-sm sm:text-base md:text-xl text-gray-600 leading-snug m-0">Comprehensive rental solutions for productive assets.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 md:p-8 rounded-xl border-2 border-[#f97316] bg-white shadow-sm"
            style={{
              border: '2px solid #f97316',
            }}>
              <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 flex items-center justify-center">
                <img src={ASSETS.ABOUT_COMPREHENSIVE} alt="Comprehensive" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-xl md:text-2xl font-bold text-[#205ed7] mb-0.5">Comprehensive <span className="text-[#f97316]">Rental Solution Nationwide</span></h4>
                <p className="text-sm sm:text-base md:text-xl text-gray-600 leading-snug m-0">Rental solutions across the Philippines.</p>
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
