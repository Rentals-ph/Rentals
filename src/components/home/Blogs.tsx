'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { BlogCardSkeleton } from '../common/BlogCardSkeleton'
import { blogsApi } from '../../api'
import type { Blog } from '../../types'
import { ASSETS } from '@/utils/assets'
import FadeInOnView from '@/components/common/FadeInOnView'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const Blogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await blogsApi.getAll()
        setBlogs(data)
      } catch (error) {
        console.error('Error fetching blogs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [])

  // Calculate visible count based on screen width
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth
      if (width >= 1536) { // 2xl
        setVisibleCount(4)
      } else if (width >= 1280) { // xl
        setVisibleCount(4)
      } else if (width >= 1024) { // lg
        setVisibleCount(3)
      } else if (width >= 768) { // md
        setVisibleCount(2)
      } else {
        setVisibleCount(1)
      }
    }

    updateVisibleCount()
    window.addEventListener('resize', updateVisibleCount)
    return () => window.removeEventListener('resize', updateVisibleCount)
  }, [])

  // Update scroll buttons state
  useEffect(() => {
    const totalBlogs = blogs.length > 0 ? blogs.slice(1).length : 0 // Exclude featured blog
    setCanScrollLeft(currentIndex > 0)
    setCanScrollRight(currentIndex + visibleCount < totalBlogs)
  }, [currentIndex, visibleCount, blogs.length])

  // Get first blog for featured card image, and remaining blogs for carousel
  const featuredBlog = blogs[0] || null
  const carouselBlogs = blogs.slice(1) // All blogs except the first one

  const scrollLeft = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const scrollRight = () => {
    const maxIndex = Math.max(0, carouselBlogs.length - visibleCount)
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.BLOG_IMAGE_MAIN
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.startsWith('/') ? image.slice(1) : image}`
    }
    return image
  }

  const getAuthorImage = (authorName: string): string => {
    // Try to resolve author image, fallback to placeholder
    return ASSETS.PLACEHOLDER_PROFILE
  }

  return (
    <section id="blog" className="bg-white w-full mt-0 flex flex-col justify-center py-6 sm:py-8">
      <div className="w-full overflow-visible">
        <FadeInOnView
          as="div"
          delayMs={100}
          className="flex flex-col lg:flex-row gap-0 lg:gap-0 items-stretch"
        >
          {/* Left: Featured Blog Header Card */}
          <div className="w-full lg:w-[428px] lg:flex-shrink-0 relative overflow-hidden">
            {loading ? (
              <div className="w-full h-[492px] bg-gray-200 animate-pulse" />
            ) : (
              <div
                className="relative w-full h-[300px] sm:h-[400px] lg:h-[492px] bg-cover bg-center"
                style={{
                  backgroundImage: featuredBlog
                    ? `url(${getImageUrl(featuredBlog.image)})`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-[rgba(0,64,188,0.89)]" />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-start px-[58px] sm:px-[60px] pt-[76px] pb-6">
                  <h2 className="text-white font-outfit text-[40px] font-bold leading-[1em] tracking-[-0.0125em] m-0 mb-4">
                    Blogs
                  </h2>
                  <p className="text-white font-outfit text-[24px] font-medium leading-[1.26] m-0 max-w-[315px]">
                    Find the latest blogs and insights from the rentals.ph team.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Blog Cards Carousel */}
          <div className="flex-1 relative mt-4 lg:mt-0 overflow-hidden">
            {/* Carousel Container with overflow hidden */}
            <div className="overflow-hidden">
              <div 
                ref={scrollContainerRef}
                className="flex flex-col lg:flex-row gap-0 lg:gap-0 transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                }}
              >
                {loading ? (
                  <>
                    {Array.from({ length: Math.max(visibleCount, 3) }).map((_, idx) => (
                      <div key={idx} className="flex-shrink-0" style={{ width: `${100 / visibleCount}%` }}>
                        <BlogCardSkeleton className="w-full h-[492px]" />
                      </div>
                    ))}
                  </>
                ) : carouselBlogs.length > 0 ? (
                  carouselBlogs.map((blog, index) => {
                    return (
                      <div
                        key={blog.id}
                        className="flex-shrink-0"
                        style={{
                          width: `${100 / visibleCount}%`,
                          minWidth: '333px',
                        }}
                      >
                        <Link href={`/blog/${blog.id}`} className="block w-full h-full">
                          <article className="relative w-full h-[300px] sm:h-[400px] lg:h-[492px] overflow-hidden group">
                            {/* Image with darker overlay */}
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                              style={{
                                backgroundImage: `url(${getImageUrl(blog.image)})`,
                              }}
                            >
                              {/* Darker overlay for better text visibility */}
                              <div className="absolute inset-0 bg-black/60" />
                              {/* Additional gradient overlay at bottom for better text contrast */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-[21.72px] sm:p-[30px]">
                              <div className="space-y-4">
                                {/* Title and Excerpt */}
                                <div className="space-y-4">
                                  <h3 className="text-white font-outfit text-[18px] font-bold leading-[1.56] tracking-[0.0167em] m-0 line-clamp-2">
                                    {blog.title}
                                  </h3>
                                  <p className="text-white font-poppins text-[16px] font-normal leading-[1.625] tracking-[0.01875em] m-0 line-clamp-3">
                                    {blog.excerpt}
                                  </p>
                                </div>

                                {/* Author and Read More */}
                                <div className="flex items-center justify-between gap-4 pt-4">
                                  <div className="flex items-center gap-[18.28px]">
                                    <img
                                      src={getAuthorImage(blog.author)}
                                      alt={blog.author}
                                      className="w-[37.9px] h-[37.9px] rounded-full object-cover flex-shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.src = ASSETS.PLACEHOLDER_PROFILE
                                      }}
                                    />
                                    <span className="text-white font-outfit text-[11px] font-medium leading-[1.26]">
                                      By {blog.author}
                                    </span>
                                  </div>
                                  <Link
                                    href={`/blog/${blog.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-[15px] py-[10.49px] bg-[#387CFF] rounded-[5px] text-white font-inter text-[13px] font-medium leading-[1.21] hover:bg-[#266FFD] transition-colors whitespace-nowrap"
                                  >
                                    Read More
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </article>
                        </Link>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-600">No blog posts available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Carousel Navigation Arrows */}
            {!loading && carouselBlogs.length > visibleCount && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={scrollLeft}
                  disabled={!canScrollLeft}
                  className={`absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-700 transition-all duration-300 ${
                    canScrollLeft
                      ? 'opacity-100 cursor-pointer hover:scale-110 active:scale-95'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  aria-label="Previous blogs"
                >
                  <FiChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 transition-transform duration-200" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={scrollRight}
                  disabled={!canScrollRight}
                  className={`absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-700 transition-all duration-300 ${
                    canScrollRight
                      ? 'opacity-100 cursor-pointer hover:scale-110 active:scale-95'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  aria-label="Next blogs"
                >
                  <FiChevronRight className="w-6 h-6 lg:w-7 lg:h-7 transition-transform duration-200" />
                </button>
              </>
            )}
          </div>
        </FadeInOnView>
      </div>
    </section>
  )
}

export default Blogs
