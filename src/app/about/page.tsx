'use client'

import Navbar from '../../components/layout/Navbar'
import Testimonials from '../../components/home/Testimonials'
import Footer from '../../components/layout/Footer'
import Partners from '../../components/common/Partners'
import { ASSETS } from '@/utils/assets'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col flex-1 w-full font-outfit">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="w-full relative min-h-[400px] sm:min-h-[500px] flex flex-col overflow-hidden">
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
                'linear-gradient(135deg, rgba(32, 94, 215, 0.85) 0%, rgba(32, 94, 215, 0.75) 50%, rgba(254, 142, 10, 0.85) 100%)',
            }}
          />
        </div>

        <div className="relative z-[3] max-w-[var(--page-max-width)] mx-auto px-4 py-20 w-full flex items-center justify-center flex-1">
          <div className="text-center flex flex-col items-center justify-center mt-10">
            <h1 className="font-extrabold text-3xl sm:text-6xl md:text-8xl leading-tight m-0 tracking-tight">
              <span className="text-[#205ed7]">About</span>{" "}
              <span className="text-[#f97316]">Rentals.ph</span>
            </h1>
            <p className="text-base sm:text-lg font-semibold text-[#f97316] m-0 mt-2">
              We provide full service at every step.
            </p>
          </div>
        </div>

        {/* Bottom Orange Bar */}
        <div className="relative z-[3] w-full h-4 bg-[#f97316]" />
      </section>

      {/* --- CORE SECTIONS (STORY, MISSION, VISION) --- */}
      <section className="bg-white py-16 sm:py-24 px-4 sm:px-6 md:px-10 overflow-hidden">
        <div className="max-w-[1000px] mx-auto grid grid-rows-[repeat(3,minmax(0,1fr))] gap-24 sm:gap-32 items-stretch">

          {/* OUR STORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Image Left */}
            <div className="relative z-10 mx-auto w-full max-w-[400px] md:max-w-none order-2 md:order-1">
              <img
                src={ASSETS.ABOUT_OUR_STORY}
                alt="Our Story"
                className="w-full rounded-[24px] shadow-2xl object-cover"
              />
            </div>
            {/* Text Right */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left relative order-1 md:order-2">
              {/* Decorative Blob */}
              <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 bg-[#fff3cd] rounded-full blur-[60px] opacity-70 z-0 pointer-events-none"></div>

              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 relative z-10 w-full">
                <span className="text-[#205ed7]">OUR</span> <span className="text-[#f97316]">STORY</span>
              </h2>
              <p className="text-base font-normal leading-relaxed text-gray-700 relative z-10 max-w-md">
                Established in 2014 under Philippine Real Estate Management Solutions Inc., Rentals.ph was organized with one clear goal: to serve as the vehicle in translating real estate investments into productive assets. Today, we stand as the <span className="font-bold border-b-2 border-[#f97316]">only rental portal</span> backed by realtors, rent managers, and licensed real estate professionals.
              </p>
            </div>
          </div>

          {/* OUR MISSION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Text Left */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right relative order-1">
              {/* Decorative Blob */}
              <div className="absolute left-[-20px] top-[-20px] w-64 h-64 bg-[#efe5ff] rounded-full blur-[60px] opacity-80 z-0 pointer-events-none"></div>

              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 relative z-10 w-full">
                <span className="text-[#205ed7]">OUR</span> <span className="text-[#f97316]">MISSION</span>
              </h2>
              <p className="text-base font-normal leading-relaxed text-gray-700 relative z-10 max-w-md">
                To transform real estate investments into productive assets while providing exceptional service to property owners and tenants across the Philippines.
              </p>
            </div>
            {/* Image Right */}
            <div className="relative z-10 mx-auto w-full max-w-[400px] md:max-w-none order-2">
              <img
                src={ASSETS.ABOUT_OUR_MISSION}
                alt="Our Mission"
                className="w-full rounded-[24px] shadow-2xl object-cover"
              />
            </div>
          </div>

          {/* OUR VISION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Image Left */}
            <div className="relative z-10 mx-auto w-full max-w-[400px] md:max-w-none order-2 md:order-1">
              <img
                src={ASSETS.ABOUT_OUR_VISION}
                alt="Our Vision"
                className="w-full rounded-[24px] shadow-2xl object-cover"
              />
            </div>
            {/* Text Right */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left relative order-1 md:order-2">
              {/* Decorative Blob */}
              <div className="absolute right-[-40px] bottom-[-20px] w-64 h-64 bg-[#e8f0ff] rounded-full blur-[60px] opacity-80 z-0 pointer-events-none"></div>

              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 relative z-10 w-full">
                <span className="text-[#205ed7]">OUR</span> <span className="text-[#f97316]">VISION</span>
              </h2>
              <p className="text-base font-normal leading-relaxed text-gray-700 relative z-10 max-w-md">
                To be the leading rental platform that connects property owners with quality tenants through innovative technology and trusted professional networks.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* --- WHAT WE OFFER SECTION --- */}
      <section className="bg-white py-10 sm:py-16 px-4 sm:px-6 md:px-10 pb-20 border-t border-gray-100">
        <div className="max-w-[900px] mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-[#205ed7] mb-8 sm:mb-10 tracking-tight">
            WHAT WE OFFER
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#f97316] bg-white shadow-sm">
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                <img src={ASSETS.ABOUT_RENTPH_CARES} alt="Rent.ph Cares" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-[#205ed7] mb-0.5">Rent.ph Cares <span className="text-[#f97316]">Your Rental, Their Hope</span></h4>
                <p className="text-sm text-gray-600 leading-snug m-0">Every transaction gives back to communities in need.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#f97316] bg-white shadow-sm">
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                <img src={ASSETS.ABOUT_TRUSTED_PARTNER} alt="Trusted Partner" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-[#205ed7] mb-0.5">Your Trusted <span className="text-[#f97316]">Rental Partner</span></h4>
                <p className="text-sm text-gray-600 leading-snug m-0">Certified real estate professionals, integrity, and personalized service.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#f97316] bg-white shadow-sm">
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                <img src={ASSETS.ABOUT_TRANSFORMING} alt="Transforming" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-[#205ed7] mb-0.5">Transforming Investment <span className="text-[#f97316]">Into Assets</span></h4>
                <p className="text-sm text-gray-600 leading-snug m-0">Comprehensive rental solutions for productive assets.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-[#f97316] bg-white shadow-sm">
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                <img src={ASSETS.ABOUT_COMPREHENSIVE} alt="Comprehensive" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-[#205ed7] mb-0.5">Comprehensive <span className="text-[#f97316]">Rental Solution Nationwide</span></h4>
                <p className="text-sm text-gray-600 leading-snug m-0">Rental solutions across the Philippines.</p>
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
