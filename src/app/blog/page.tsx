'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { blogsApi } from '../../api'
import type { Blog } from '../../types'
import { ASSETS } from '@/utils/assets'
import { Pagination } from '../../components/common'

export default function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const postsPerPage = 6

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

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Date not available'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatReadTime = (minutes: number): string => {
    return `${minutes} min`
  }

  const formatDateShort = (dateString: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.PLACEHOLDER_PROPERTY_MAIN
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.startsWith('/') ? image.slice(1) : image}`
    }
    return image
  }

  // Get featured post (first one) and trending posts (next 3)
  const featuredPost = blogs.length > 0 ? blogs[0] : null
  const trendingPosts = blogs.slice(1, 4)
  const regularPosts = blogs.slice(4)
  
  // Pagination logic
  const totalPages = Math.ceil(regularPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const paginatedPosts = regularPosts.slice(startIndex, endIndex)

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section with BLOG background */}
      <section className="w-full relative min-h-[500px] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src={ASSETS.BG_BLOG}
            alt="Blog background"
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-bold text-white font-outfit uppercase m-0">
              BLOG
            </h1>
          </div>
        </div>
        <div className="relative z-[3] w-full h-3 bg-rental-orange-500" />
      </section>

      <main className="mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-[150px] pt-8 sm:pt-12">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-600">Loading blogs...</p>
          </div>
        ) : (
          <>
            {/* Featured and Trending Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {/* Left Column - Featured Article */}
              <div className="lg:col-span-1">
                {featuredPost && (
                  <Link href={`/blog/${featuredPost.id}`} className="no-underline h-full">
                    <article className="flex flex-col overflow-hidden rounded-lg bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg h-full">
                      {/* Image */}
                      <div className="h-64 md:h-80 lg:h-96 w-full overflow-hidden flex-shrink-0">
                        <img 
                          src={getImageUrl(featuredPost.image)} 
                          alt={featuredPost.title} 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                      {/* Content */}
                      <div className="flex flex-col gap-3 p-4 sm:p-6 flex-1">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black font-outfit leading-tight">
                          {featuredPost.title}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-700 font-outfit leading-relaxed">
                          {featuredPost.excerpt}
                        </p>
                        {/* Author and Date */}
                        <div className="flex items-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.314 0 6 1.343 6 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1c0-1.657 2.686-3 6-3Z" fill="#2563eb"/>
                            </svg>
                            <span className="text-blue-600 font-outfit text-sm font-medium">
                              {featuredPost.author}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 2a1 1 0 1 1 2 0v1h4V2a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V2a1 1 0 1 1 2 0v1Zm10 3H4v11h12V5Zm-2 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="#2563eb"/>
                            </svg>
                            <span className="text-blue-600 font-outfit text-sm font-medium">
                              {formatDate(featuredPost.published_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                )}
              </div>

              {/* Right Column - Trending Articles */}
              <div className="lg:col-span-1">
                <div className="mb-6">
                  {/* TRENDINGS Header with colorful background */}
                  <div className="mb-6 px-6 py-4 rounded-lg" style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 50%, #f59e0b 75%, #d97706 100%)',
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                  }}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-outfit uppercase">
                      TRENDINGS
                    </h2>
                  </div>
                  
                  {/* Trending Posts */}
                  <div className="flex flex-col gap-4">
                    {trendingPosts.map((post) => (
                      <Link key={post.id} href={`/blog/${post.id}`} className="no-underline">
                        <article className="flex gap-3 sm:gap-4 overflow-hidden rounded-lg bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg p-3 sm:p-4">
                          {/* Image Thumbnail */}
                          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex-shrink-0 overflow-hidden rounded-lg">
                            <img 
                              src={getImageUrl(post.image)} 
                              alt={post.title} 
                              className="h-full w-full object-cover" 
                            />
                          </div>
                          {/* Content */}
                          <div className="flex flex-col flex-1 gap-1.5 sm:gap-2 min-w-0">
                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-black font-outfit leading-tight line-clamp-2">
                              {post.title}
                            </h3>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                              <span className="text-xs sm:text-sm text-gray-600 font-outfit">
                                {formatDateShort(post.published_at)} • {formatReadTime(post.read_time)}
                              </span>
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded bg-blue-100 text-blue-600 text-[10px] sm:text-xs font-semibold font-outfit">
                                Featured
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Regular Blog Posts Grid */}
            <div className="mb-8 sm:mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.id}`} className="no-underline h-full">
                    <article className="flex flex-col overflow-hidden rounded-lg bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg h-full">
                      {/* Image */}
                      <div className="h-48 sm:h-56 md:h-64 w-full overflow-hidden flex-shrink-0">
                        <img 
                          src={getImageUrl(post.image)} 
                          alt={post.title} 
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" 
                        />
                      </div>
                      {/* Content */}
                      <div className="flex flex-col gap-2 sm:gap-2.5 p-4 sm:p-6 flex-1 min-h-[180px]">
                        <div className="mb-1.5 sm:mb-2 flex items-center gap-2 sm:gap-2.5 flex-wrap">
                          <span className="rounded bg-green-600 px-2 sm:px-3 py-0.5 sm:py-1 font-outfit text-[10px] sm:text-xs font-semibold text-white uppercase">
                            {post.category}
                          </span>
                          <span className="font-outfit text-[10px] sm:text-xs text-gray-600">
                            {formatReadTime(post.read_time)} read
                          </span>
                        </div>
                        <h3 className="m-0 font-outfit text-base sm:text-lg font-semibold leading-snug text-black line-clamp-2 flex-1">
                          {post.title}
                        </h3>
                        <span className="ml-auto mt-auto self-end font-outfit text-xs sm:text-sm font-semibold text-blue-600 transition-colors hover:text-orange-500">
                          Read More →
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mb-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="blogs-pagination"
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Newsletter Section */}
      <div className="mt-2.5 w-full bg-blue-600 px-0 py-8 sm:py-15 text-center">
        <div className="mx-auto max-w-7xl py-6 sm:py-10 px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <h2 className="mb-3 sm:mb-4 font-outfit text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Subscribe to Our Newsletter
          </h2>
          <p className="mb-6 sm:mb-8 font-outfit text-sm sm:text-base md:text-lg leading-relaxed text-white opacity-95 px-2">
            Get the latest rental tips, market insights, and property updates delivered to your inbox.
          </p>
          <form className="mx-auto flex max-w-2xl justify-center gap-2 sm:gap-2.5 items-stretch sm:items-center flex-col sm:flex-row px-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-lg border-0 bg-white px-4 sm:px-6 py-3 sm:py-4 font-outfit text-sm sm:text-base text-black outline-none placeholder:text-gray-500 min-w-0"
              required
            />
            <button 
              type="submit" 
              className="whitespace-nowrap rounded-lg border-0 bg-rental-blue-600 px-6 sm:px-8 py-3 sm:py-4 font-outfit text-sm sm:text-base font-semibold text-white transition-all hover:bg-rental-blue-700 hover:shadow-md flex-shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
