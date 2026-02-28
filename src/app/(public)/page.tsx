'use client'

import { Suspense } from 'react'
import Hero from '@/components/home/Hero'
import FeaturedProperties from '@/components/home/FeaturedProperties'
import Testimonials from '@/components/home/Testimonials'
import Blogs from '@/components/home/Blogs'
import PopularSearches from '@/components/home/PopularSearches'
import Footer from '@/components/layout/Footer'
import { HeroSkeleton } from '@/components/home/HeroSkeleton'
import { VerticalPropertyCardSkeleton } from '@/components/common/VerticalPropertyCardSkeleton'
import { BlogCardSkeleton } from '@/components/common/BlogCardSkeleton'
import { TestimonialCardSkeleton } from '@/components/common/TestimonialCardSkeleton'

/** Featured Properties section skeleton (title + chips + carousel of cards) */
function FeaturedPropertiesFallback() {
  return (
    <section className="border-t-0 relative min-h-[60vh] flex px-6 md:px-10 lg:px-[150px] flex-col justify-center py-12 pb-4">
      <div className="w-full">
        <div className="relative flex justify-center items-end mb-4">
          <div className="text-center">
            <span className="block h-9 w-64 rounded bg-gray-200 animate-pulse mx-auto" />
            <span className="block h-4 w-80 rounded bg-gray-100 animate-pulse mx-auto mt-2" />
          </div>
        </div>
        <div className="flex justify-center mt-4 mb-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="h-9 w-24 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex gap-3 sm:gap-5 overflow-hidden mt-6 pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px] min-w-[280px] sm:w-[360px] sm:min-w-[360px] md:w-[420px] md:min-w-[420px] mx-1">
              <VerticalPropertyCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Blogs section skeleton (title + 3 cards) */
function BlogsFallback() {
  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-[150px] w-full min-h-[70vh] flex flex-col justify-center py-6 sm:py-8">
      <div className="w-full mx-auto py-4 sm:py-5">
        <div className="relative flex justify-center items-start mb-4 sm:mb-6">
          <div className="text-center">
            <span className="block h-9 w-32 rounded bg-gray-200 animate-pulse mx-auto" />
            <span className="block h-4 w-96 rounded bg-gray-100 animate-pulse mx-auto mt-2" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-10 items-stretch w-full">
          <div className="flex-1 min-w-0 lg:max-w-[28%] flex">
            <BlogCardSkeleton size="small" className="w-full" />
          </div>
          <div className="flex-[2] min-w-0 flex">
            <article className="relative rounded-xl w-full h-[360px] sm:h-[450px] lg:h-[520px] bg-gray-200 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4 sm:p-5 z-10">
                <span className="block h-6 w-24 rounded bg-white/30 animate-pulse mb-2" />
                <span className="block h-7 w-full max-w-[90%] rounded bg-white/30 animate-pulse mb-2" />
                <span className="block h-4 w-28 rounded bg-white/20 animate-pulse" />
              </div>
            </article>
          </div>
          <div className="flex-1 min-w-0 lg:max-w-[28%] flex">
            <BlogCardSkeleton size="small" className="w-full" />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Testimonials section skeleton (title block + 3 cards) */
function TestimonialsFallback() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden mb-0 lg:pl-[150px] py-12">
      <div className="absolute inset-0 z-[1] bg-gray-300/50" />
      <div className="relative z-[3] w-full mx-auto min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-[50px] items-start w-full">
          <div className="flex flex-col gap-4 pt-0 w-full">
            <span className="h-[150px] w-[150px] rounded-full bg-gray-200 animate-pulse" />
            <span className="block h-10 w-48 rounded bg-gray-200 animate-pulse" />
            <span className="block h-6 w-64 rounded bg-gray-100 animate-pulse" />
            <span className="block h-4 w-full max-w-md rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="w-full min-w-0 flex gap-6 pb-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <TestimonialCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<FeaturedPropertiesFallback />}>
        <FeaturedProperties />
      </Suspense>
      <Suspense fallback={<BlogsFallback />}>
        <Blogs />
      </Suspense>
      <Suspense fallback={<TestimonialsFallback />}>
        <Testimonials />
      </Suspense>
      <PopularSearches />
      <Footer />
    </div>
  )
}

