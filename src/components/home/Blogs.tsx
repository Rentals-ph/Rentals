'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Pagination from '../common/Pagination'
import { BlogCardSkeleton } from '../common/BlogCardSkeleton'
import { blogsApi } from '../../api'
import type { Blog } from '../../types'
import { ASSETS } from '@/utils/assets'

const Blogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(1) // Index of the large blog (start at 1)

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

  // Always show 3 cards: left (small), center (large), right (small)
  // If not enough blogs, reuse first or show placeholder
  const getThreeBlogs = (index: number) => {
    // index: center (large) blog index
    const count = blogs.length
    const placeholder = {
      id: 'placeholder',
      image: ASSETS.BLOG_IMAGE_MAIN,
      category: 'Blog',
      title: 'No Blog Available',
      excerpt: 'Stay tuned for more updates!',
      author: 'Rental.ph',
      published_at: '',
      read_time: 1,
    }
    if (count === 0) {
      return [placeholder, placeholder, placeholder]
    }
    // left: previous blog or first
    const left = blogs[(index - 1 + count) % count] || blogs[0] || placeholder
    // center: current
    const center = blogs[index % count] || blogs[0] || placeholder
    // right: next blog or first
    const right = blogs[(index + 1) % count] || blogs[0] || placeholder
    return [left, center, right]
  }

  // Pagination: each page is a center (large) blog
  const totalPages = blogs.length > 0 ? blogs.length : 1

  const handlePageChange = (newPage: number) => {
    if (blogs.length === 0) return
    const newIndex = (newPage - 1) % blogs.length
    if (newIndex === currentIndex) return
    setCurrentIndex(newIndex)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatReadTime = (minutes: number): string => {
    return `${minutes} min read`
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

  const [leftBlog, centerBlog, rightBlog] = getThreeBlogs(currentIndex)

  return (
    <section id="blog" className="bg-white px-4 sm:px-6 md:px-10 lg:px-[150px] w-full mt-0 min-h-[70vh] flex flex-col justify-center py-6 sm:py-8">
      <div className="w-full mx-auto overflow-visible py-4 sm:py-5">
        <div className="relative flex justify-center items-start mb-4 sm:mb-6">
          <div className="text-center">
            <h2 className="text-gray-900 font-outfit text-2xl sm:text-4xl font-bold leading-tight tracking-tight m-0 mb-2 sm:mb-2.5">
              Blogs
            </h2>
            <p className="text-gray-600 font-outfit text-sm sm:text-base font-light leading-snug tracking-tight m-0">
              Find the latest news and insights from the rentals.ph team.
            </p>
          </div>

          <Link
            href="/blog"
            className="absolute right-0 text-rental-blue-500 bg-white font-outfit text-base font-medium no-underline flex items-center gap-2 hover:bg-blue-200 transition-colors border-2 border-rental-blue-500 rounded-2xl px-5 py-2"
            style={{ border: '2px solid #205ED7' }}
          >
            Visit Blogs
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-10 items-stretch w-full overflow-visible relative">
            <div className="flex-1 min-w-0 lg:max-w-[28%] flex">
              <BlogCardSkeleton size="small" className="w-full" />
            </div>
            <div className="flex-[2] min-w-0 flex">
              <article className="relative rounded-xl sm:rounded-2xl overflow-hidden w-full h-[360px] sm:h-[450px] lg:h-[520px] bg-gray-200 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4 sm:p-5 md:p-5 z-10">
                  <div className="flex justify-between mb-2">
                    <span className="h-4 w-20 rounded bg-white/30 animate-pulse" />
                    <span className="h-4 w-16 rounded bg-white/20 animate-pulse" />
                  </div>
                  <span className="block h-7 w-full max-w-[90%] rounded bg-white/30 animate-pulse mb-2" />
                  <div className="space-y-2 mb-3">
                    <span className="block h-3 w-full rounded bg-white/20 animate-pulse" />
                    <span className="block h-3 w-4/5 rounded bg-white/20 animate-pulse" />
                  </div>
                  <span className="h-4 w-28 rounded bg-white/20 animate-pulse" />
                </div>
              </article>
            </div>
            <div className="flex-1 min-w-0 lg:max-w-[28%] flex">
              <BlogCardSkeleton size="small" className="w-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-10 items-stretch w-full overflow-visible relative">
            {/* Left Small Blog Card */}
            <div className="flex-1 min-w-0 lg:max-w-[28%] flex relative transition-all duration-600">
              <Link href={leftBlog.id === 'placeholder' ? '#' : `/blog/${leftBlog.id}`} className="no-underline w-full h-full">
                <article className="bg-white rounded-xl sm:rounded-2xl overflow-hidden flex flex-col h-full group shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-shadow">
                  <div className="w-full h-[140px] sm:h-[190px] overflow-hidden flex-shrink-0">
                    <img
                      src={getImageUrl(leftBlog.image)}
                      alt={leftBlog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                      <span className="text-rental-blue-600 font-outfit text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{leftBlog.category}</span>
                      <span className="text-gray-500 font-outfit text-[10px] sm:text-xs">{formatReadTime(leftBlog.read_time)}</span>
                    </div>
                    <h3 className="text-gray-900 font-outfit text-base sm:text-lg md:text-xl font-bold leading-snug mb-1.5 sm:mb-2 line-clamp-2">{leftBlog.title}</h3>
                    <p className="text-gray-600 font-outfit text-sm sm:text-base md:text-lg leading-relaxed mb-2 sm:mb-3 line-clamp-3 flex-1">{leftBlog.excerpt}</p>
                    <div className="flex flex-col gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
                        <svg width="20" height="20" className="sm:w-6 sm:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v3h14v-3c0-2.761-3.134-5-7-5z"/>
                        </svg>
                        <span className="font-outfit text-xs sm:text-sm md:text-base">{leftBlog.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                        <svg width="18" height="18" className="sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 2a1 1 0 1 1 2 0v1h4V2a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V2a1 1 0 1 1 2 0v1zm10 3H4v11h12V5zm-1 2v2H5V7h10z"/>
                        </svg>
                        <span className="font-outfit text-[10px] sm:text-xs">{formatDate(leftBlog.published_at)}</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <span className="bg-rental-blue-600 px-4 py-2 rounded-lg text-white font-outfit text-sm sm:text-base font-medium flex items-center gap-1.5 sm:gap-2 hover:bg-rental-blue-700 transition-colors">
                        Read More
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </div>

            {/* Center Large Blog Card */}
            <div className="flex-[2] min-w-0 flex relative transition-all duration-600 order-2 lg:order-none">
              <Link href={centerBlog.id === 'placeholder' ? '#' : `/blog/${centerBlog.id}`} className="no-underline w-full h-full">
                <article className="relative rounded-xl sm:rounded-2xl overflow-hidden group h-[360px] sm:h-[450px] lg:h-[520px] shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
                  <div className="absolute inset-0 w-full h-full">
                    <img
                      src={getImageUrl(centerBlog.image)}
                      alt={centerBlog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/30 z-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-5 md:p-5 z-20">
                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                      <span className="text-white font-outfit text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wider">{centerBlog.category}</span>
                      <span className="text-white/90 font-outfit text-xs sm:text-sm md:text-base">{formatReadTime(centerBlog.read_time)}</span>
                    </div>
                    <h3 className="text-white font-outfit text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-2 sm:mb-3">{centerBlog.title}</h3>
                    <p className="text-white/95 font-outfit text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4 line-clamp-3">{centerBlog.excerpt}</p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-3 sm:mb-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                        <svg width="20" height="20" className="sm:w-6 sm:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v3h14v-3c0-2.761-3.134-5-7-5z"/>
                        </svg>
                        <span className="font-outfit text-xs sm:text-sm md:text-base">{centerBlog.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-white/90">
                        <svg width="18" height="18" className="sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 2a1 1 0 1 1 2 0v1h4V2a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V2a1 1 0 1 1 2 0v1zm10 3H4v11h12V5zm-1 2v2H5V7h10z"/>
                        </svg>
                        <span className="font-outfit text-xs sm:text-sm md:text-base">{formatDate(centerBlog.published_at)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="bg-rental-blue-600 px-4 py-2 rounded-lg text-white font-outfit text-sm sm:text-base font-medium flex items-center gap-1.5 sm:gap-2 hover:bg-rental-blue-700 transition-colors">
                        Read More
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </div>

            {/* Right Small Blog Card */}
            <div className="flex-1 min-w-0 lg:max-w-[28%] flex relative transition-all duration-600 order-3">
              <Link href={rightBlog.id === 'placeholder' ? '#' : `/blog/${rightBlog.id}`} className="no-underline w-full h-full">
                <article className="bg-white rounded-xl sm:rounded-2xl overflow-hidden flex flex-col h-full group shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-shadow">
                  <div className="w-full h-[140px] sm:h-[190px] overflow-hidden flex-shrink-0">
                    <img
                      src={getImageUrl(rightBlog.image)}
                      alt={rightBlog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                      <span className="text-rental-blue-600 font-outfit text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{rightBlog.category}</span>
                      <span className="text-gray-500 font-outfit text-[10px] sm:text-xs">{formatReadTime(rightBlog.read_time)}</span>
                    </div>
                    <h3 className="text-gray-900 font-outfit text-base sm:text-lg md:text-xl font-bold leading-snug mb-2 sm:mb-3 line-clamp-2">{rightBlog.title}</h3>
                    <p className="text-gray-600 font-outfit text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4 line-clamp-3 flex-1">{rightBlog.excerpt}</p>
                    <div className="flex flex-col gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
                        <svg width="20" height="20" className="sm:w-6 sm:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v3h14v-3c0-2.761-3.134-5-7-5z"/>
                        </svg>
                        <span className="font-outfit text-xs sm:text-sm md:text-base">{rightBlog.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                        <svg width="18" height="18" className="sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 2a1 1 0 1 1 2 0v1h4V2a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V2a1 1 0 1 1 2 0v1zm10 3H4v11h12V5zm-1 2v2H5V7h10z"/>
                        </svg>
                        <span className="font-outfit text-[10px] sm:text-xs">{formatDate(rightBlog.published_at)}</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <span className="bg-rental-blue-600 px-4 py-2 rounded-lg text-white font-outfit text-sm sm:text-base font-medium flex items-center gap-1.5 sm:gap-2 hover:bg-rental-blue-700 transition-colors">
                        Read More
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && blogs.length > 1 && (
          <div className="flex justify-center mt-12">
            <Pagination
              currentPage={currentIndex + 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="blogs-pagination"
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default Blogs
