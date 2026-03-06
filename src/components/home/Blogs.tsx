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
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories')

  // Number of cards per row based on screen size
  // Small screens: 1 column, Medium: 2-3 columns, Large: 4 columns
  const cardsPerPage = 4 // Maximum cards per row on large screens

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

  const effectiveBlogs = filteredBlogs.length > 0 ? filteredBlogs : blogs

  // Calculate pagination
  const totalPages = Math.ceil(effectiveBlogs.length / cardsPerPage)
  const startIndex = (currentPage - 1) * cardsPerPage
  const endIndex = startIndex + cardsPerPage
  const currentPageBlogs = effectiveBlogs.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Scroll to top of blog section when page changes
    const blogSection = document.getElementById('blog')
    if (blogSection) {
      blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Reset to page 1 when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
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
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {loading ? (
          <FadeInOnView
            as="div"
            delayMs={120}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch w-full overflow-visible"
          >
            {Array.from({ length: cardsPerPage }).map((_, idx) => (
              <div key={idx} className="flex justify-center">
                <BlogCardSkeleton size="small" className="w-full" />
              </div>
            ))}
          </FadeInOnView>
        ) : currentPageBlogs.length > 0 ? (
          <FadeInOnView
            as="div"
            delayMs={120}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch w-full overflow-visible"
          >
            {currentPageBlogs.map((blog, index) => (
              <div key={blog.id} className="flex justify-center">
                <FadeInOnView
                  as="div"
                  delayMs={160 + index * 50}
                  className="w-full"
                >
                  <BlogCard
                    image={getImageUrl(blog.image)}
                    category={blog.category}
                    title={blog.title}
                    excerpt={blog.excerpt}
                    author={blog.author}
                    date={formatDate(blog.published_at)}
                    readTime={formatReadTime(blog.read_time)}
                    link={`/blog/${blog.id}`}
                  />
                </FadeInOnView>
              </div>
            ))}
          </FadeInOnView>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-600 font-outfit text-base mb-4">No blog posts found in this category.</p>
            <button
              onClick={() => handleCategoryChange('All Categories')}
              className="px-4 py-2 rounded-full border-2 border-rental-blue-500 text-rental-blue-600 font-outfit text-sm font-semibold bg-white hover:bg-blue-50 transition-colors"
            >
              View All Categories
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && effectiveBlogs.length > 0 && (
          <div className="flex justify-center mt-8 sm:mt-12 overflow-x-auto px-2">
            <Pagination
              currentPage={currentPage}
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
