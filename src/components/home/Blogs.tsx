'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Pagination from '../common/Pagination'
import { BlogCardSkeleton } from '../common/BlogCardSkeleton'
import { blogsApi } from '../../api'
import type { Blog } from '../../types'
import { ASSETS } from '@/utils/assets'
import FadeInOnView from '@/components/common/FadeInOnView'
import { BlogCard } from '@/components/common'

const Blogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(1) // Index of the large blog (start at 1)
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories')

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

  // Derive unique categories for chips
  const categories = ['All Categories', ...Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)))]

  // Filter blogs by selected category (if any)
  const filteredBlogs =
    selectedCategory === 'All Categories'
      ? blogs
      : blogs.filter((b) => b.category === selectedCategory)

  // Always show 3 cards from the filtered list: left (small), center (large), right (small)
  // If not enough blogs, reuse placeholder
  const getThreeBlogs = (list: Blog[], index: number) => {
    // index: center (large) blog index
    const count = list.length
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
    const left = list[(index - 1 + count) % count] || list[0] || placeholder
    // center: current
    const center = list[index % count] || list[0] || placeholder
    // right: next blog or first
    const right = list[(index + 1) % count] || list[0] || placeholder
    return [left, center, right]
  }

  const effectiveBlogs = filteredBlogs.length > 0 ? filteredBlogs : blogs

  // Pagination: each page is a center (large) blog from the currently filtered list
  const totalPages = effectiveBlogs.length > 0 ? effectiveBlogs.length : 1

  const handlePageChange = (newPage: number) => {
    if (effectiveBlogs.length === 0) return
    const newIndex = (newPage - 1) % effectiveBlogs.length
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

  const [leftBlog, centerBlog, rightBlog] = getThreeBlogs(effectiveBlogs, currentIndex)

  return (
    <section id="blog" className="bg-[#F9FAFB] px-4 sm:px-6 md:px-10 lg:px-[150px] w-full mt-0 min-h-[40vh] sm:min-h-[60vh] flex flex-col justify-center py-6 sm:py-8">
      <div className="w-full mx-auto overflow-visible py-4 sm:py-5">
        {/* Header: stack on mobile, row on larger screens */}
        <FadeInOnView className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8" as="div">
          <div className="text-center sm:text-left max-w-xl">
            <h2 className="text-gray-900 font-outfit text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight m-0 mb-2">
              Blogs
            </h2>
            <p className="text-gray-600 font-outfit text-sm sm:text-base md:text-lg leading-relaxed m-0">
              Find the latest news and insights from the rentals.ph team.
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full border-2 border-rental-blue-500 text-rental-blue-600 font-outfit text-sm sm:text-base font-semibold bg-white hover:bg-blue-50 transition-colors"
            >
              Visit Blogs
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M7 4L13 10L7 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </FadeInOnView>

        {/* Blog categories chips */}
        {blogs.length > 0 && (
          <div className="flex flex-col gap-2 sm:gap-3 mb-3">
            <div className="flex items-center justify-between gap-2 px-1 sm:px-0">
              <p className="text-gray-700 font-outfit text-xs sm:text-sm md:text-base font-medium m-0">
                Browse blog posts by category
              </p>
            </div>
            <div className="subcategory-row flex items-center gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden flex-nowrap sm:flex-wrap justify-start sm:justify-start p-1.5 sm:p-2 rounded-full sm:rounded-2xl bg-white shadow-[0_1px_4px_rgba(148,163,184,0.25)] w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-manipulation min-h-[32px] sm:min-h-[36px] ${
                    selectedCategory === cat
                      ? 'bg-rental-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]'
                      : 'bg-transparent text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat)
                    setCurrentIndex(1)
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-10 items-stretch w-full overflow-visible relative">
            <div className="flex-1 min-w-0 lg:max-w-[28%] flex order-2 lg:order-none">
              <BlogCardSkeleton size="small" className="w-full" />
            </div>
            <div className="flex-[2] min-w-0 flex order-1">
              <article className="relative rounded-xl sm:rounded-2xl overflow-hidden w-full h-[280px] xs:h-[320px] sm:h-[400px] md:h-[450px] lg:h-[520px] bg-gray-200 animate-pulse">
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
            <div className="flex-1 min-w-0 lg:max-w-[28%] flex order-3">
              <BlogCardSkeleton size="small" className="w-full" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-1 lg:gap-5 items-stretch w-full overflow-visible relative">
            {[leftBlog, centerBlog, rightBlog].map((blog, idx) => (
              <div key={blog.id === 'placeholder' ? `placeholder-${idx}` : blog.id} className="flex justify-center">
                <BlogCard
                  image={getImageUrl(blog.image)}
                  category={blog.category}
                  title={blog.title}
                  excerpt={blog.excerpt}
                  author={blog.author}
                  date={formatDate(blog.published_at)}
                  readTime={formatReadTime(blog.read_time)}
                  link={blog.id === 'placeholder' ? '#' : `/blog/${blog.id}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && blogs.length > 1 && (
          <div className="flex justify-center mt-8 sm:mt-12 overflow-x-auto px-2">
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
