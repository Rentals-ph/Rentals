'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import { ASSETS } from '@/utils/assets'
import { Pagination, BlogCardSkeleton } from '@/components/common'
import { FiChevronLeft, FiChevronRight, FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi'

export default function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)
  const postsPerPage = 4

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
      day: 'numeric',
    })
  }

  const formatDateShort = (dateString: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.PLACEHOLDER_PROPERTY_MAIN
    if (image.startsWith('http://') || image.startsWith('https://')) return image
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.startsWith('/') ? image.slice(1) : image}`
    }
    return image
  }

  // Derive slices
  const newsArticles = blogs
  const totalPages = Math.ceil(newsArticles.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const paginatedNews = newsArticles.slice(startIndex, startIndex + postsPerPage)

  // Tags derived from blog categories
  const allTags = Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)))
  const displayTags =
    allTags.length > 0
      ? allTags
      : [
        'Real Estate',
        'Investment',
        'Market Trends',
        'Rental Tips',
        'Home Buying',
        'Neighborhood',
        'Finance',
        'Commercial',
        'Luxury',
      ]

  // Most Popular: top 4 by likes
  const mostPopular = [...blogs].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)).slice(0, 4)

  // Trending: 3 cards
  const trendingPosts = blogs.slice(0, 3)

  // Derive slices for the new layout
  const heroPostsVisible = blogs.slice(heroIndex, heroIndex + 4)
  const thumbnailPosts = blogs.slice(3, 7)
  const featuredPost = blogs[7] || blogs[0]
  const otherPosts = blogs.slice(8, 14)
  const sidebarPosts = blogs.slice(14, 18)
  const instagramPosts = blogs.slice(0, 6) // Using first 6 for visual demo

  const nextHero = () => {
    if (blogs.length <= 4) return
    setHeroIndex((prev) => (prev + 4 >= blogs.length ? 0 : prev + 4))
  }

  const prevHero = () => {
    if (blogs.length <= 4) return
    setHeroIndex((prev) => (prev - 4 < 0 ? Math.max(0, blogs.length - 4) : prev - 4))
  }

  const DateBadge = ({ date }: { date: string | null }) => {
    if (!date) return null
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    return (
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm p-2 flex flex-col items-center justify-center min-w-[50px] shadow-sm z-10 text-white">
        <span className="font-bold text-xl leading-none font-outfit">{day}</span>
        <span className="font-bold text-[10px] leading-none font-outfit">{month}</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F9FF] overflow-x-hidden">
      {/* ── Hero Section ── */}
      <section className="w-full relative min-h-[220px] xs:min-h-[260px] sm:min-h-[320px] md:min-h-[400px] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src="/assets/images/blog/blog-hero-bg.png"
            alt="Blog hero background"
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
          {/* Left: paper illustration */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[2] hidden lg:block">
            <img src="/assets/images/blog/blog-paper.png" alt="" className="w-32 xl:w-40 h-auto object-contain" />
          </div>
          {/* Right: laptop illustration */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-[2] hidden lg:block">
            <img src="/assets/images/blog/blog-laptop.png" alt="" className="w-32 xl:w-40 h-auto object-contain" />
          </div>
        </div>

        <div className="relative z-[3] max-w-[var(--page-max-width)] mx-auto py-10 sm:py-14 md:py-16 w-full flex items-center justify-start flex-1">
          <div className="text-left flex flex-col items-start justify-center max-w-xl">
            <h1
              className="font-outfit font-extrabold text-white tracking-tight leading-tight m-0 text-xl xs:text-2xl mobile:text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            >
              BLOGS
            </h1>
            <p className="max-w-3xl font-outfit text-white m-0 mt-3 px-1 text-sm xs:text-base md:text-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
              Stay Ahead Of The Curve With Expert Insights, Market Trends, And Essential Guides To Philippine Real Estate. From Investment Tips To Neighborhood Spotlights, We Bring You The Stories Shaping The Future Of Homeownership.
            </p>
          </div>
        </div>
      </section>

      {/* ── Featured Post Hero Section ── */}
      {blogs.length > 0 && (
        <section className="w-full bg-[#F5F9FF] px-4 sm:px-6 md:px-10 lg:px-[150px] pt-8 pb-4 sm:pt-12 md:pt-16 mx-auto">
          <div className="max-w-[var(--page-max-width)] ">
            <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] ">
              {/* Left: Large Image (70% width) */}
              <div className="relative aspect-[16/9] overflow-hidden">
                <img 
                  src={getImageUrl(blogs[0].image)} 
                  alt={blogs[0].title}
                  className="w-full h-full object-cover"
                />
                {/* Engagement Icons */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10">
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiHeart className="w-4 h-4 text-red-500" />
                    <span>{blogs[0].likes ?? 374}</span>
                  </button>
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiMessageCircle className="w-4 h-4 text-blue-500" />
                    <span>{blogs[0].comments ?? 23}</span>
                  </button>
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiShare2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Right: Content Panel (30% width) */}
              <div className="flex flex-col justify-between bg-white p-6 lg:p-8 rounded-lg">
                <div>
                  <span className="text-xs sm:text-sm text-[#205ED7] font-outfit mb-2">
                    {blogs[0].category || 'Real Estate'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-outfit mb-4 leading-tight">
                    {blogs[0].title}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 font-outfit mb-6 leading-relaxed">
                    {blogs[0].excerpt || blogs[0].content?.substring(0, 150) + '...' || 'Tips and strategies for finding and securing pet-friendly rental properties.'}
                  </p>
                </div>
                <div>
                  <div className="h-px w-full bg-gray-200 mb-6"></div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <span className="text-gray-600 font-semibold text-sm">
                        {blogs[0].author?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 font-outfit">
                        By {blogs[0].author || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 font-outfit">
                        {formatDate(blogs[0].published_at)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${blogs[0].id}`}
                    className="flex items-center justify-center px-6 py-3 bg-[#266FFD] text-white font-semibold text-sm font-outfit rounded-md hover:bg-[#1a5dd8] transition-colors w-full"
                  >
                    READ MORE
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Blog Grid + Categories Sidebar ── */}
      <section className="w-full bg-[#F5F9FF] px-4 sm:px-6 md:px-10 lg:px-[150px] pb-8 mx-auto">
        <div className="max-w-[var(--page-max-width)]">
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] ">
            {/* Left Column: Blog Grid (70% width) */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mr-5">
                  {[...Array(3)].map((_, i) => (
                    <BlogCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mr-5">
                  {blogs.slice(1, 4).map(post => (
                    <article key={post.id} className="flex flex-col bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Square Image */}
                      <div className="relative aspect-square overflow-hidden">
                        <img 
                          src={getImageUrl(post.image)} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Content */}
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <span className="text-sm text-gray-500 font-outfit">
                          {post.category || 'Real Estate'}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 font-outfit line-clamp-2 leading-tight">
                          {post.title}
                        </h3>
                        <p className="text-base text-gray-600 font-outfit line-clamp-2 leading-relaxed">
                          {post.excerpt || post.content?.substring(0, 100) + '...'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-outfit">
                          <span>By {post.author || 'Anonymous'}</span>
                          <span>•</span>
                          <span>{formatDateShort(post.published_at)}</span>
                        </div>
                        <Link
                          href={`/blog/${post.id}`}
                          className="flex items-center justify-center px-4 py-2 bg-[#266FFD] text-white font-semibold text-sm font-outfit rounded-md hover:bg-[#1a5dd8] transition-colors w-full mt-auto"
                        >
                          READ MORE
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Categories Sidebar (30% width) */}
            <div className="lg:sticky lg:top-8 h-fit">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 overflow-hidden">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 font-outfit mb-2">
                    Categories
                  </h3>
                  <div className="h-1 w-12 bg-gradient-to-r from-[#266FFD] to-[#205ED7] rounded-full"></div>
                </div>
                <ul className="flex flex-col gap-1.5 list-none">
                  {displayTags.map((tag, index) => (
                    <li key={tag} className="list-none">
                      <Link 
                        href={`/blog/category/${tag.toLowerCase()}`}
                        className="group relative flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 hover:bg-[#F5F9FF] border-l-4 border-transparent hover:border-[#266FFD] transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 font-outfit group-hover:text-[#266FFD] transition-colors duration-200">
                            {tag}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-[#266FFD] transition-colors duration-200 bg-white group-hover:bg-[#E8F0FE] px-2.5 py-1 rounded-full min-w-[2rem] text-center">
                          {blogs.filter(b => b.category === tag).length || (displayTags.length - index + 3)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Additional Blog Post Section (Vertical Layout) ── */}
      {blogs.length > 4 && (
        <section className="w-full bg-[#F5F9FF] px-4 sm:px-6 md:px-10  lg:px-[150px] py-8">
          <div className="max-w-[var(--page-max-width)] mx-auto">
            <div className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm">
              {/* Large Image */}
              <div className="relative w-full aspect-[16/9] overflow-hidden">
                <img 
                  src={getImageUrl(blogs[4].image)} 
                  alt={blogs[4].title}
                  className="w-full h-full object-cover"
                />
                {/* Engagement Icons */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10">
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiHeart className="w-4 h-4 text-red-500" />
                    <span>{blogs[4].likes ?? 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiMessageCircle className="w-4 h-4 text-blue-500" />
                    <span>{blogs[4].comments ?? 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiShare2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              {/* Content Below Image */}
              <div className="p-6 lg:p-8 flex flex-col">
                <span className="text-xs sm:text-sm text-gray-500 font-outfit mb-2">
                  {blogs[4].category || 'Real Estate'}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 font-outfit mb-4 leading-tight">
                  {blogs[4].title}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 font-outfit mb-6 leading-relaxed">
                  {blogs[4].excerpt || blogs[4].content?.substring(0, 200) + '...' || 'Stay informed with the latest insights and trends in Philippine real estate.'}
                </p>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <span className="text-gray-600 font-semibold text-sm">
                      {blogs[4].author?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 font-outfit">
                      By {blogs[4].author || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500 font-outfit">
                      {formatDate(blogs[4].published_at)}
                    </span>
                  </div>
                </div>
               
              </div>
            </div>
          </div>
        </section>
      )}


      <Footer />
    </div>
  )
}
