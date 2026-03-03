'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import { ASSETS } from '@/utils/assets'
import { Pagination, BlogCardSkeleton } from '@/components/common'

export default function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
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
  const heroPosts = blogs.slice(0, 3)
  const thumbnailPosts = blogs.slice(3, 7)
  const featuredPost = blogs[7] || blogs[0]
  const otherPosts = blogs.slice(8, 14)
  const sidebarPosts = blogs.slice(14, 18)
  const instagramPosts = blogs.slice(0, 6) // Using first 6 for visual demo

  const DateBadge = ({ date }: { date: string | null }) => {
    if (!date) return null
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    return (
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-md p-1.5 flex flex-col items-center justify-center min-w-[45px] shadow-sm z-10">
        <span className="text-gray-900 font-bold text-lg leading-none font-outfit">{day}</span>
        <span className="text-gray-500 font-bold text-[10px] leading-none font-outfit">{month}</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      {/* ── Previous Hero Section ── */}
      <section className="w-full relative min-h-[280px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[500px] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src="/assets/images/blog/blog-hero-bg.png"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 z-[2] bg-gradient-to-b from-[#224580]/20 to-transparent" aria-hidden />
        </div>
        <div className="relative z-[3] max-w-[var(--page-max-width)] mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px] py-10 sm:py-16 md:py-24 lg:py-32 w-full flex items-center justify-center flex-1">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 w-full max-w-6xl">
            {/* Left: paper illustration */}
            <div className="hidden lg:block flex-shrink-0 w-32 xl:w-40 order-1">
              <img src="/assets/images/blog/blog-paper.png" alt="" className="w-full h-auto object-contain" />
            </div>
            {/* Center: title + description */}
            <div className="flex flex-col items-center justify-center text-center flex-1 order-2 min-w-0">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-rental-orange-500 font-outfit uppercase m-0 mb-3 sm:mb-6">
                BLOGS
              </h1>
              <p className="text-white font-outfit text-xs sm:text-sm md:text-base lg:text-lg max-w-[720px] leading-relaxed m-0 px-1">
                Stay Ahead Of The Curve With Expert Insights, Market Trends, And Essential Guides To Philippine Real
                Estate. From Investment Tips To Neighborhood Spotlights, We Bring You The Stories Shaping The Future
                Of Homeownership.
              </p>
            </div>
            {/* Right: laptop illustration */}
            <div className="hidden lg:block flex-shrink-0 w-32 xl:w-40 order-3">
              <img src="/assets/images/blog/blog-laptop.png" alt="" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
        <div className="relative z-[3] w-full h-3 bg-rental-orange-500" />
      </section>

      {/* ── 1. Hero Carousel (3 items) ── */}
      <section className="w-full px-4 sm:px-6 md:px-10 lg:px-[150px] mb-8 mt-12 sm:mt-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 h-auto md:h-[450px]">
          {/* Main Large Item */}
          <div className="md:col-span-7 relative h-[300px] md:h-full overflow-hidden group">
            {heroPosts[0] && (
              <Link href={`/blog/${heroPosts[0].id}`}>
                <img src={getImageUrl(heroPosts[0].image)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <DateBadge date={heroPosts[0].published_at} />
                <div className="absolute bottom-10 left-8 right-8">
                  <span className="text-rental-orange-500 font-bold text-xs uppercase tracking-wider mb-2 block">{heroPosts[0].category}</span>
                  <h2 className="text-white text-2xl md:text-3xl font-bold font-outfit line-clamp-2 leading-tight">
                    {heroPosts[0].title}
                  </h2>
                </div>
              </Link>
            )}
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center border border-white/20 hover:bg-black/40 transition-colors">‹</button>
          </div>

          {/* Right Two Smaller Items */}
          <div className="md:col-span-5 flex flex-col gap-1 h-full">
            {heroPosts.slice(1, 3).map((post, idx) => (
              <div key={post.id} className="relative flex-1 overflow-hidden group">
                <Link href={`/blog/${post.id}`}>
                  <img src={getImageUrl(post.image)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <DateBadge date={post.published_at} />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="text-rental-orange-500 font-bold text-[10px] uppercase tracking-wider mb-1 block">{post.category}</span>
                    <h3 className="text-white text-lg font-bold font-outfit line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                  </div>
                </Link>
                {idx === 1 && (
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center border border-white/20 hover:bg-black/40 transition-colors">›</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Thumbnail Row (4 items) ── */}
      <section className="w-full px-4 sm:px-6 md:px-10 lg:px-[150px] mb-12 sm:mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {thumbnailPosts.map(post => (
            <Link key={post.id} href={`/blog/${post.id}`} className="group relative aspect-square overflow-hidden rounded-sm">
              <img src={getImageUrl(post.image)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center p-2">
                <p className="text-white text-[10px] sm:text-xs font-bold font-outfit text-center line-clamp-2">{post.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. Main Body: Content + Sidebar ── */}
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-[150px] mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            {/* Featured Post */}
            {featuredPost && (
              <div className="flex flex-col gap-6">
                <div className="relative aspect-[16/10] overflow-hidden group">
                  <img src={getImageUrl(featuredPost.image)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <DateBadge date={featuredPost.published_at} />
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <span className="text-rental-orange-500 font-bold text-xs uppercase tracking-widest">{featuredPost.category}</span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-outfit max-w-[90%] mx-auto leading-tight">
                    {featuredPost.title}
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>by {featuredPost.author}</span>
                    <span>•</span>
                    <span>{formatDateShort(featuredPost.published_at)}</span>
                    <span>•</span>
                    <span>No Comments</span>
                  </div>
                  <p className="text-gray-600 font-outfit leading-relaxed max-w-[85%] mx-auto mt-2">
                    {featuredPost.content || "Proin ac rhoncus eros. Ut vulputate lacus non sodales pretium. Maecenas tristique massa mi, nec condimentum libero accumsan nec. Interdum et malesuada fames ac ante ipsum primis in faucibus."}
                  </p>
                  <Link
                    href={`/blog/${featuredPost.id}`}
                    className="mt-4 px-8 py-3 bg-white border-2 border-gray-100 text-gray-900 font-black text-xs font-outfit tracking-[0.2em] rounded-sm hover:border-rental-orange-500 hover:text-rental-orange-500 transition-all uppercase"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            )}

            {/* Grid of Other Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mt-4">
              {otherPosts.map(post => (
                <article key={post.id} className="flex flex-col gap-4">
                  <div className="relative aspect-[16/11] overflow-hidden group">
                    <img src={getImageUrl(post.image)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <DateBadge date={post.published_at} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-rental-orange-500 font-bold text-[10px] uppercase tracking-[0.15em]">{post.category}</span>
                    <h3 className="text-xl font-bold text-gray-900 font-outfit line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex gap-2">
                      <span>by {post.author}</span>
                      <span>•</span>
                      <span>No Comments</span>
                    </div>
                    <p className="text-gray-600 text-sm font-outfit leading-relaxed line-clamp-3 mt-1">
                      {post.content || post.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {/* Centered Pagination Button */}
            <div className="flex justify-center mt-6">
              <button className="px-10 py-3.5 bg-gray-50 text-gray-900 font-black text-xs font-outfit tracking-[0.25em] rounded-md hover:bg-gray-100 transition-colors uppercase border border-gray-100">
                Load More
              </button>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            {/* About Me */}
            <section>
              <h3 className="text-xs font-black font-outfit text-gray-900 uppercase tracking-[0.3em] mb-6 border-b border-gray-200 pb-2">About Me</h3>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-full aspect-[4/3] overflow-hidden bg-gray-100 mb-2">
                  <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" alt="Author" className="w-full h-full object-cover" />
                </div>
                <h4 className="font-serif italic text-xl text-gray-900">I'm Catherine Patterson</h4>
                <p className="text-gray-500 text-sm font-outfit leading-relaxed italic">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
                </p>
                <Link href="/about" className="text-[10px] font-black font-outfit text-rental-orange-500 uppercase tracking-[0.2em] mt-2 border-b border-rental-orange-200">Read More</Link>
                <div className="flex gap-4 mt-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer text-sm">f</div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-400 transition-colors cursor-pointer text-sm">t</div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer text-sm">p</div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-pink-600 transition-colors cursor-pointer text-sm">i</div>
                </div>
              </div>
            </section>

            {/* Feature Posts */}
            <section>
              <h3 className="text-xs font-black font-outfit text-gray-900 uppercase tracking-[0.3em] mb-6 border-b border-gray-200 pb-2">Feature Posts</h3>
              <div className="flex flex-col gap-6">
                {sidebarPosts.map(post => (
                  <Link key={post.id} href={`/blog/${post.id}`} className="group flex flex-col gap-2">
                    <div className="relative aspect-[21/9] overflow-hidden">
                      <img src={getImageUrl(post.image)} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <h4 className="text-white text-xs font-bold text-center drop-shadow-md leading-tight group-hover:scale-110 transition-transform">{post.title}</h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Categories */}
            <section>
              <h3 className="text-xs font-black font-outfit text-gray-900 uppercase tracking-[0.3em] mb-6 border-b border-gray-200 pb-2">Categories</h3>
              <div className="flex flex-col text-xs font-bold font-outfit text-gray-500 tracking-[0.1em] uppercase">
                {displayTags.slice(0, 6).map((tag, idx) => (
                  <Link key={tag} href={`/blog/category/${tag.toLowerCase()}`} className="flex justify-between items-center py-2.5 border-b border-gray-50 hover:text-rental-orange-500 transition-colors">
                    <span>{tag}</span>
                    <span className="text-gray-300">({(12 - idx)})</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Newsletter */}
            <section className="bg-gray-50 p-8 text-center border border-gray-100">
              <h3 className="text-xs font-black font-outfit text-gray-900 uppercase tracking-[0.3em] mb-4">Newsletter</h3>
              <p className="text-gray-500 text-xs font-outfit leading-relaxed mb-6">
                Subscribe to get latest news and property updates.
              </p>
              <form className="flex flex-col gap-3">
                <input type="email" placeholder="Your Email Address" className="w-full py-2.5 px-4 bg-white border border-gray-200 text-xs font-outfit outline-none focus:border-rental-orange-500" />
                <button className="w-full py-3 bg-rental-orange-500 text-white font-black text-[10px] font-outfit uppercase tracking-[0.2em] hover:bg-rental-orange-600 transition-colors">Subscribe</button>
              </form>
            </section>
          </div>
        </div>
      </div>

      {/* ── 4. Instagram Feed (6 items) ── */}
      <section className="w-full pt-10 border-t border-gray-50 relative">
        {/* Username Badge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white px-6 py-2 shadow-sm border border-gray-100 flex items-center gap-3 rounded-full">
            <div className="w-6 h-6 rounded-full bg-rental-orange-500 flex items-center justify-center text-[10px] text-white">★</div>
            <span className="text-xs font-black font-outfit text-gray-900 tracking-wider">@RENTALPH</span>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6">
          {instagramPosts.map((post, idx) => (
            <div key={idx} className="aspect-square relative overflow-hidden group">
              <img src={getImageUrl(post.image)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xl">♥</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
