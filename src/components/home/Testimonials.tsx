"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import TestimonialCard from "../common/TestimonialCard"
import { TestimonialCardSkeleton } from "../common/TestimonialCardSkeleton"
import { testimonialsApi } from "../../api"
import type { Testimonial } from "../../types"
import { ASSETS } from "@/utils/assets"
import FadeInOnView from "@/components/common/FadeInOnView"

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await testimonialsApi.getAll()
        setTestimonials(data)
      } catch (error) {
        console.error('Error fetching testimonials:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  // Helper function to get avatar URL
  const getAvatarUrl = (avatar: string | null): string => {
    if (!avatar) return ASSETS.PLACEHOLDER_TESTIMONIAL_PERSON
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar
    }
    if (avatar.startsWith('storage/') || avatar.startsWith('/storage/')) {
      return `/api/${avatar.startsWith('/') ? avatar.slice(1) : avatar}`
    }
    return avatar
  }

  return (
    <section className="relative min-h-[55vh] sm:min-h-[60vh] flex items-center justify-center overflow-x-visible overflow-y-hidden mb-0 px-4 sm:px-6 md:px-10 lg:px-[150px] lg:pl-[150px] py-6 sm:py-10" id="testimonials">
      {/* Background image - non-interactive */}
      <div 
        className="absolute inset-0 z-[1] bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ 
          backgroundImage: 'url(/assets/backgrounds/testimonials-bg.png)',
          backgroundColor: 'rgba(32, 94, 215, 0.4)'
        }}
      />
      
      {/* Overlay - non-interactive so cards can scroll and receive clicks */}
      <div 
        className="absolute inset-0 z-[2] pointer-events-none" 
        style={{ background: 'linear-gradient(to bottom, rgba(32, 94, 215, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%)' }}
      />
      {/* Smooth blend into Partners section (dark blue #062858) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[35%] min-h-[140px] z-[2] pointer-events-none" 
        style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(6, 40, 88, 0.4) 50%, #062858 100%)' }}
      />
      
      {/* Main content container */}
      <div className="relative z-[3] w-full mx-auto min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-[50px] items-start w-full">
          {/* Left Section - Promotional Block */}
          <FadeInOnView className="flex flex-col gap-0 relative pt-0 w-full" as="div">
            <div className="relative w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] -mt-2 sm:-mt-5 mb-4 sm:mb-5 ml-0 self-start">
              <div className="w-full h-full rounded-full flex items-center justify-center shadow-lg" style={{ background: 'rgba(32, 94, 215, 0.9)' }}>
                <svg className="w-[40px] h-[40px] sm:w-[60px] sm:h-[60px] text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 7.5V14H7.5C7.5 15.3807 8.61929 16.5 10 16.5V18.5C7.51472 18.5 5.5 16.4853 5.5 14V7.5H11ZM18.5 7.5V14H15C15 15.3807 16.1193 16.5 17.5 16.5V18.5C15.0147 18.5 13 16.4853 13 14V7.5H18.5Z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:gap-4">
              <h1 className="font-outfit text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Testimonials
              </h1>
              <h2 className="font-outfit text-xl sm:text-2xl md:text-3xl font-semibold text-white leading-tight">
                Trusted By The Industry's Best
              </h2>
              <p className="font-outfit text-sm sm:text-base md:text-lg font-normal leading-relaxed text-white/95 mb-4 sm:mb-6 max-w-md">
                Discover Why The Most Successful Property Managers In The Philippines Rely On Rentals.Ph To Streamline Their Operations, Verify Quality Tenants, And Maximize Their Portfolio's Reach.
              </p>
              <Link href="/contact" style={{ background: "rgba(32, 94, 215, 0.9)" }}  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-white font-outfit text-base font-semibold rounded-full transition-all hover:bg-rental-orange-600 hover:gap-4 w-fit" >
                <span>Connect Now</span>
                <span className="transition-transform items-center justify-center flex">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Link>
            </div>
          </FadeInOnView>

          {/* Right Section - Testimonials Cards (Horizontal Scroll) */}
          <FadeInOnView
            as="div"
            delayMs={160}
            className="w-full min-w-0 overflow-x-auto overflow-y-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {loading ? (
              <div className="flex gap-6 pb-4 pr-4 md:pr-8 w-max">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TestimonialCardSkeleton key={i} />
                ))}
              </div>
            ) : testimonials.length > 0 ? (
              <div
                className="flex gap-6 pb-4 snap-x snap-mandatory pr-4 md:pr-8 w-max"
                ref={scrollRef}
                style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
              >
                {testimonials.map((testimonial, index) => (
                  <FadeInOnView
                    key={testimonial.id}
                    as="div"
                    delayMs={200 + index * 70}
                  >
                    <TestimonialCard
                      avatar={getAvatarUrl(testimonial.avatar)}
                      text={testimonial.content}
                      name={testimonial.name}
                      role={testimonial.role}
                    />
                  </FadeInOnView>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-white font-outfit text-lg">No testimonials available at the moment.</p>
              </div>
            )}
          </FadeInOnView>
        </div>
      </div>
    </section>
  )
}

export default Testimonials

