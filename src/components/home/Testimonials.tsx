'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import TestimonialCard from '../common/TestimonialCard'
import { testimonialsApi } from '../../api'
import type { Testimonial } from '../../types'
import { ASSETS } from '@/utils/assets'

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
    <section className="relative top-0 min-h-[80vh] flex items-center justify-center overflow-hidden mb-0 px-6 md:px-10 lg:px-[150px] py-12" id="testimonials">
      {/* Background image */}
      <div 
        className="absolute top-0 left-0 w-full h-full z-[1] bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url(/assets/backgrounds/testimonials-bg.png)',
          backgroundColor: 'rgba(32, 94, 215, 0.4)'
        }}
      />
      
      {/* Overlay */}
      <div className="absolute top-0 left-0 w-full h-full z-[2]" style={{ background: 'rgba(32, 94, 215, 0.2)' }}>
        <div className="absolute top-0 left-0 w-full h-full bg-black/20" />
      </div>
      
      {/* Main content container */}
      <div className="relative z-[3] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-[50px] items-start w-full">
          {/* Left Section - Promotional Block */}
          <div className="flex flex-col gap-0 relative pt-0 w-full">
            <div className="relative w-[150px] h-[150px] -mt-5 mb-5 ml-0 self-start">
              <div className="w-[150px] h-[150px] rounded-full flex items-center justify-center shadow-lg" style={{ background: 'rgba(32, 94, 215, 0.9)' }}>
                <svg className="w-[60px] h-[60px] text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 7.5V14H7.5C7.5 15.3807 8.61929 16.5 10 16.5V18.5C7.51472 18.5 5.5 16.4853 5.5 14V7.5H11ZM18.5 7.5V14H15C15 15.3807 16.1193 16.5 17.5 16.5V18.5C15.0147 18.5 13 16.4853 13 14V7.5H18.5Z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="font-outfit text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                Testimonials
              </h1>
              <h2 className="font-outfit text-2xl md:text-3xl font-semibold text-white mb-3 leading-tight">
                Trusted By The Industry's Best
              </h2>
              <p className="font-outfit text-base md:text-lg font-normal leading-relaxed text-white/95 mb-6 max-w-md">
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
          </div>

          {/* Right Section - Testimonials Cards (Horizontal Scroll) */}
          <div className="w-full overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-white font-outfit text-lg">Loading testimonials...</p>
              </div>
            ) : testimonials.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" ref={scrollRef}>
                {testimonials.map((testimonial) => (
                  <TestimonialCard
                    key={testimonial.id}
                    avatar={getAvatarUrl(testimonial.avatar)}
                    text={testimonial.content}
                    name={testimonial.name}
                    role={testimonial.role}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-white font-outfit text-lg">No testimonials available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials

