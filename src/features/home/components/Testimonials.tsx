"use client"

import { useState, useEffect } from "react"
import { TestimonialCard, TestimonialCardSkeleton } from "@/shared/components/cards"
import { Pagination } from "@/shared/components/misc"
import { testimonialsApi } from "@/api/endpoints/testimonials"
import type { Testimonial } from "@/shared/types"
import { ASSETS } from "@/shared/utils/assets"
import { FadeInOnView } from "@/shared/components/ui"

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4 // 1 row × 4 cards per row

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

  // Pagination calculations
  const totalPages = Math.ceil(testimonials.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTestimonials = testimonials.slice(startIndex, endIndex)

  return (
    <section className="bg-[#F5F9FF] w-full py-6 sm:py-10 md:py-14" id="testimonials">
      <div className="w-full">
        {/* Header: Centered Label, Title, and Description */}
        <FadeInOnView
          className="relative flex flex-col gap-4 mb-6 sm:mb-8 pb-4"
          as="div"
        >
          <div className="page-x w-full min-w-0">
            <div className="page-w text-center">
            <p className="text-[#205ED7] font-outfit text-[17px] font-medium leading-[1.26] mb-2 uppercase tracking-wide">
              TESTIMONIALS
            </p>
            <h2 className="text-[#111827] font-outfit text-2xl sm:text-3xl md:text-[40px] font-bold leading-[1em] tracking-[-0.0125em] m-0 mb-2">
              What Our Client Says
            </h2>
            <p className="text-[#374151] font-outfit text-[17px] font-medium leading-[1.5] mt-2 mb-0 max-w-2xl mx-auto">
              Discover Why The Most Successful Property Managers In The Philippines Rely On Rentals.Ph To Streamline Their Operations, Verify Quality Tenants, And Maximize Their Portfolio's Reach.
            </p>
            </div>
          </div>
        </FadeInOnView>

        {/* Testimonials Cards Grid - Full width, cards reach the sides */}
        <FadeInOnView
          as="div"
          delayMs={120}
          className="relative w-full mt-4 sm:mt-6"
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <TestimonialCardSkeleton key={i} />
              ))}
            </div>
          ) : paginatedTestimonials.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {paginatedTestimonials.map((testimonial, index) => (
                  <FadeInOnView
                    key={testimonial.id}
                    as="div"
                    delayMs={180 + index * 70}
                    className="w-full"
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
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="page-x mt-8 sm:mt-10 w-full">
                  <div className="page-w">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center w-full min-w-0">
              <p className="text-gray-600">No testimonials available</p>
            </div>
          )}
        </FadeInOnView>
      </div>
    </section>
  )
}

export default Testimonials

