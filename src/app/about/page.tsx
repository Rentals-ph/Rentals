'use client'

import Navbar from '../../components/layout/Navbar'
import Testimonials from '../../components/home/Testimonials'
import Footer from '../../components/layout/Footer'
import Partners from '../../components/common/Partners'
import { ASSETS } from '@/utils/assets'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col flex-1 w-full">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full relative min-h-[500px] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src={ASSETS.ABOUT_BACKGROUND}
            alt="About Us background"
            className="w-full h-full object-cover object-center"
          />
          <div 
            className="absolute top-0 left-0 w-full h-full z-[2]"
            style={{ 
              background: 'linear-gradient(135deg, rgba(32, 94, 215, 0.85) 0%, rgba(32, 94, 215, 0.75) 50%, rgba(254, 142, 10, 0.85) 100%)' 
            }}
          />
        </div>
        <div className="relative z-[3] max-w-[var(--page-max-width)] mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px] py-16 sm:py-24 md:py-32 w-full flex items-center justify-center flex-1">
          <div className="text-center flex flex-col items-center justify-center max-w-[800px]">
            <h1 className="font-outfit font-bold text-3xl sm:text-4xl md:text-5xl lg:text-[55px] leading-tight text-white m-0">
              About Rentals.ph
            </h1>
            <p className="font-outfit text-base sm:text-lg md:text-xl font-light leading-relaxed text-white/95 m-0 mt-2 sm:mt-4">
              We provide full service at every step.
            </p>
          </div>
        </div>
        <div className="relative z-[3] w-full h-3 bg-rental-orange-500" />
      </section>

      {/* Main Content Section */}
      <section className="bg-white py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10 lg:px-[150px]">
        <div className=" mx-auto">
          <div className="w-full">
            <h2 className="font-outfit text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8">
              OUR STORY
            </h2>
            
            <p className="font-outfit text-base sm:text-lg font-light leading-relaxed text-gray-700 text-center mb-8 sm:mb-12 max-w-4xl mx-auto px-2">
              Established in 2014 under Philippine Real Estate Management Solutions Inc., Rentals.ph was organized with one clear goal: to serve as the vehicle in translating real estate investments into productive assets. Today, we stand as the only rental portal backed by realtors, rent managers, and licensed real estate professionals.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="bg-gray-50 p-6 sm:p-8 rounded-lg">
                <h3 className="font-outfit text-lg sm:text-xl font-bold text-rental-blue-600 mb-3 sm:mb-4">
                  OUR MISSION
                </h3>
                <p className="font-outfit text-base sm:text-lg font-light leading-relaxed text-gray-700">
                  To transform real estate investments into productive assets while providing exceptional service to property owners and tenants across the Philippines.
                </p>
              </div>
              <div className="bg-gray-50 p-6 sm:p-8 rounded-lg">
                <h3 className="font-outfit text-lg sm:text-xl font-bold text-rental-blue-600 mb-3 sm:mb-4">
                  OUR VISION
                </h3>
                <p className="font-outfit text-base sm:text-lg font-light leading-relaxed text-gray-700">
                  To be the leading rental platform that connects property owners with quality tenants through innovative technology and trusted professional networks.
                </p>
              </div>
            </div>

            <div className="mt-8 sm:mt-12">
              <h3 className="font-outfit text-xl sm:text-2xl font-bold text-gray-900 text-center mb-6 sm:mb-8">
                WHAT WE OFFER
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <img 
                      src={ASSETS.ABOUT_RENTPH_CARES} 
                      alt="Rent.ph Cares" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <h4 className="font-outfit text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                    Rent.ph Cares
                  </h4>
                  <p className="font-outfit text-sm sm:text-base md:text-lg font-light leading-relaxed text-gray-600 px-2">
                    Your Rentals, Their Hope—every transaction becomes an opportunity to give back to communities in need.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <img 
                      src={ASSETS.ABOUT_TRUSTED_PARTNER} 
                      alt="Trusted Partner" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <h4 className="font-outfit text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                    Trusted Partner
                  </h4>
                  <p className="font-outfit text-sm sm:text-base md:text-lg font-light leading-relaxed text-gray-600 px-2">
                    Backed by certified real estate professionals ensuring expertise, integrity, and personalized service.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <img 
                      src={ASSETS.ABOUT_TRANSFORMING} 
                      alt="Transforming Investment" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <h4 className="font-outfit text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                    Productive Assets
                  </h4>
                  <p className="font-outfit text-sm sm:text-base md:text-lg font-light leading-relaxed text-gray-600 px-2">
                    Transforming real estate investments into productive assets through comprehensive rental solutions.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <img 
                      src={ASSETS.ABOUT_COMPREHENSIVE} 
                      alt="Nationwide Solution" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <h4 className="font-outfit text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                    Nationwide Coverage
                  </h4>
                  <p className="font-outfit text-sm sm:text-base md:text-lg font-light leading-relaxed text-gray-600 px-2">
                    Comprehensive rental solutions across the Philippines through our network of rent professionals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-gray-50 py-8 sm:py-12">
        <Testimonials />
        <div className="px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <div className="mt-8 sm:mt-12">
            <Partners />
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}

