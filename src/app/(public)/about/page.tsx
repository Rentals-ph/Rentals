'use client'

import Footer from '@/components/layout/Footer'
import { ASSETS } from '@/utils/assets'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col flex-1 w-full max-w-full overflow-x-hidden font-outfit">

      {/* --- HERO SECTION --- */}
      <section className="w-full relative min-h-[220px] xs:min-h-[260px] sm:min-h-[320px] md:min-h-[400px] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src={ASSETS.ABOUT_LANDING_PAGE}
            alt="About Us hero background"
            className="w-full h-full object-cover object-center"
          />
          <div
            className="absolute top-0 left-0 w-full h-full z-[2]"
            style={{
              background:
                'linear-gradient(90deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.50) 35%, rgba(0, 0, 0, 0.45) 65%, rgba(0, 0, 0, 0.35) 100%)',
              opacity: 0.9,
            }}
          />
        </div>

        <div className="relative z-[3] max-w-[var(--page-max-width)] mx-auto py-10 sm:py-14 md:py-16 w-full flex items-center justify-start flex-1">
          <div className="text-left flex flex-col items-start justify-center max-w-xl">
            <h1
              className="font-outfit font-extrabold text-white tracking-tight leading-tight m-0 text-xl xs:text-2xl mobile:text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            >
              ABOUT US
            </h1>
            <p className="max-w-3xl font-outfit text-white m-0 mt-3 px-1 text-sm xs:text-base md:text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
              We connect you to the perfect rental — wherever you are in the Philippines.
            </p>
          </div>
        </div>
      </section>

      {/* --- WHAT WE OFFER (3-CARD ROW) --- */}
      <section className="bg-[#F5F9FF] px-4 sm:px-6 md:px-10 lg:px-[150px] py-10 sm:py-14 md:py-16">
        <div className="mx-auto max-w-[var(--page-max-width)]">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-[#205ED7] font-outfit text-xs sm:text-sm md:text-[15px] font-semibold uppercase tracking-[0.18em] mb-2">
              OUR IMPACT
            </p>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight mb-3">
              WHAT WE OFFER
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#4B5563] max-w-3xl mx-auto">
              Three powerful ways Rentals.ph turns every rental journey into something more meaningful—for you, your property, and the communities we serve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="relative flex flex-row items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
                <img
                  src={ASSETS.ABOUT_RENTPH_CARES}
                  alt="Rent.ph Cares"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#111827] mb-0 leading-snug min-h-[3.25rem]">
                  Rent.ph Cares – Your Rental, Their Hope
                </h3>
                <div className="h-px w-full bg-[#E5E7EB] my-2" />
                <p className="text-xs sm:text-sm md:text-[15px] text-[#4B5563] leading-relaxed m-0">
                  Your rentals fuel community programs and transform lives. Every transaction contributes to outreach,
                  education, and support initiatives that give back to Filipinos in need.
                </p>
              </div>
              <span className="absolute top-3 right-4 text-xs sm:text-sm font-semibold text-[#9CA3AF]">
                01
              </span>
            </div>

            {/* Card 2 */}
            <div className="relative flex flex-row items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
                <img
                  src={ASSETS.ABOUT_TRUSTED_PARTNER}
                  alt="Your Trusted Rental Partner"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#111827] mb-0 leading-snug min-h-[3.25rem]">
                  Your Trusted Rental Partner
                </h3>
                <div className="h-px w-full bg-[#E5E7EB] my-2" />
                <p className="text-xs sm:text-sm md:text-[15px] text-[#4B5563] leading-relaxed m-0">
                  Backed by licensed real estate professionals, rent managers, and a nationwide network, we make every
                  step of your rental journey transparent, secure, and supported.
                </p>
              </div>
              <span className="absolute top-3 right-4 text-xs sm:text-sm font-semibold text-[#9CA3AF]">
                02
              </span>
            </div>

            {/* Card 3 */}
            <div className="relative flex flex-row items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
                <img
                  src={ASSETS.ABOUT_TRANSFORMING}
                  alt="Transforming Real Estate Investment into Productive Assets"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#111827] mb-0 leading-snug min-h-[3.25rem]">
                  Transforming Real Estate Investment into Productive Assets
                </h3>
                <div className="h-px w-full bg-[#E5E7EB] my-2" />
                <p className="text-xs sm:text-sm md:text-[15px] text-[#4B5563] leading-relaxed m-0">
                  Since 2014, we have helped property owners turn rentals into reliable income through expert
                  management, smart matching, and technology-driven rental solutions.
                </p>
              </div>
              <span className="absolute top-3 right-4 text-xs sm:text-sm font-semibold text-[#9CA3AF]">
                03
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --- OUR COMPANY STORY SPLIT SECTION --- */}
      <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-[150px] py-10 sm:py-14 md:py-16 overflow-visible">
        <div className="mx-auto max-w-[var(--page-max-width)] grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)] gap-8 md:gap-10 items-center">
          {/* Text column */}
          <div className="space-y-4 sm:space-y-5">
            <h2 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold tracking-tight text-[#111827]">
              Our Company Story
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#4B5563]">
              Your trusted platform for finding and managing rentals across the Philippines.
            </p>
            <p className="text-sm sm:text-base md:text-lg text-[#111827] leading-relaxed">
              Established in 2014 under Philippine Real Estate Management Solutions Inc., Rentals.ph was organized with
              one clear goal: to serve as the vehicle in translating real estate investments into productive assets.
              Today, we stand as the only rental portal backed by realtors, rent managers, and licensed real estate
              professionals.
            </p>
          </div>

          {/* Image + overlapping blue card */}
          <div className="relative flex justify-end items-stretch">
          <div className="w-full md:max-w-[620px] lg:max-w-[720px] h-[260px] sm:h-[300px] md:h-[340px] lg:h-[380px] overflow-hidden rounded-none md:rounded-[12px]">
              <img
                src={ASSETS.ABOUT_ISTOCK_11}
                alt="Team collaborating in meeting room"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Blue card overlapping bottom-right, overflowing overall page padding */}
            <div className="absolute bottom-[-18px] right-[-18px] sm:bottom-[-22px] sm:right-[-26px] md:bottom-[-26px] md:right-[-40px] bg-[#266FFD] text-white rounded-2xl shadow-[0_14px_40px_rgba(15,23,42,0.35)] px-4 py-3 sm:px-5 sm:py-4 max-w-[260px] sm:max-w-[320px] md:max-w-[360px]">
              <p className="text-xs sm:text-sm md:text-[15px] leading-relaxed m-0">
                Discover why the most successful property managers in the Philippines rely on Rentals.ph to streamline
                their operations, verify quality tenants, and maximize their portfolio&apos;s reach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- OUR PARTNERS SECTION --- */}
      <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-[150px] py-10 sm:py-14 md:py-16">
        <div className="mx-auto max-w-[var(--page-max-width)]">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-[#266FFD] font-outfit text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase mb-2">
              STRONG PARTNERS
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Our Partners
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Partner 1 */}
            <div className="flex flex-col items-center text-center">
              <div
                className="w-full rounded-2xl bg-white px-6 py-5 flex items-center justify-center"
                style={{ border: '1px solid rgba(148, 163, 184, 0.6)' }}
              >
                <img
                  src={ASSETS.PARTNER_1}
                  alt="Partner 1"
                  className="max-h-10 sm:max-h-12 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <p className="mt-3 text-sm sm:text-base font-semibold text-gray-900">
                Cebu Landmasters
              </p>
              <p className="text-xs sm:text-sm text-[#9CA3AF]">
                20,000 Properties
              </p>
            </div>

            {/* Partner 2 */}
            <div className="flex flex-col items-center text-center">
              <div
                className="w-full rounded-2xl bg-white px-6 py-5 flex items-center justify-center"
                style={{ border: '1px solid rgba(148, 163, 184, 0.6)' }}
              >
                <img
                  src={ASSETS.PARTNER_2}
                  alt="Partner 2"
                  className="max-h-10 sm:max-h-12 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <p className="mt-3 text-sm sm:text-base font-semibold text-gray-900">
                BE Residences
              </p>
              <p className="text-xs sm:text-sm text-[#9CA3AF]">
                5,000 Properties
              </p>
            </div>

            {/* Partner 3 */}
            <div className="flex flex-col items-center text-center">
              <div
                className="w-full rounded-2xl bg-white px-6 py-5 flex items-center justify-center"
                style={{ border: '1px solid rgba(148, 163, 184, 0.6)' }}
              >
                <img
                  src={ASSETS.PARTNER_3}
                  alt="Partner 3"
                  className="max-h-10 sm:max-h-12 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <p className="mt-3 text-sm sm:text-base font-semibold text-gray-900">
                AboitizLand
              </p>
              <p className="text-xs sm:text-sm text-[#9CA3AF]">
                15,000 Properties
              </p>
            </div>

            {/* Partner 4 */}
            <div className="flex flex-col items-center text-center">
              <div
                className="w-full rounded-2xl bg-white px-6 py-5 flex items-center justify-center"
                style={{ border: '1px solid rgba(148, 163, 184, 0.6)' }}
              >
                <img
                  src={ASSETS.PARTNER_5}
                  alt="Partner 4"
                  className="max-h-10 sm:max-h-12 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <p className="mt-3 text-sm sm:text-base font-semibold text-gray-900">
                WEE Community
              </p>
              <p className="text-xs sm:text-sm text-[#9CA3AF]">
                10,000 Properties
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}