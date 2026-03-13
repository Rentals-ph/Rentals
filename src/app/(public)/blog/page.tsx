'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import { ASSETS } from '@/utils/assets'
import { BlogCardSkeleton } from '@/components/common'
import { FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi'

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

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
    if (!dateString) return 'February 10, 2026'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.PLACEHOLDER_PROPERTY_MAIN
    if (image.startsWith('http://') || image.startsWith('https://')) return image
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.startsWith('/') ? image.slice(1) : image}`
    }
    return image
  }

  // Category tags for sidebar
  const allTags = Array.from(new Set(blogs.map(b => b.category).filter(Boolean)))
  const displayTags = allTags.length > 0 ? allTags : ['Music', 'Fashion', 'Interior', 'Beauty', 'Properties', 'Agents']

  // Dark overlay gradient (reused on thumbnail cards)
  const darkOverlay = 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0) 100%)'

  // Small blog card component (reused in grids)
  const BlogCard = ({ post }: { post: Blog }) => (
    <article className="flex flex-col bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={getImageUrl(post.image)}
          alt={post.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs text-[#205ED7] font-outfit font-medium">
          {post.category || 'Real Estate'}
        </span>
        <h3 className="text-sm font-bold text-gray-900 font-outfit line-clamp-2 leading-tight">
          {post.title}
        </h3>
        <p className="text-xs text-gray-600 font-outfit line-clamp-3 leading-relaxed flex-1">
          {post.excerpt || post.content?.substring(0, 100) + '...'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            <span className="text-gray-500 font-semibold text-[10px]">{post.author?.charAt(0) || 'A'}</span>
          </div>
          <span className="text-[11px] text-gray-500 font-outfit">By {post.author || 'Anonymous'}</span>
        </div>
        <span className="text-[11px] text-gray-400 font-outfit">{formatDate(post.published_at)}</span>
        <Link
          href={`/blog/${post.id}`}
          className="flex items-center justify-center px-4 py-2 bg-[#266FFD] text-white font-semibold text-xs font-outfit rounded-md hover:bg-[#1a5dd8] transition-colors w-full mt-1"
        >
          READ MORE
        </Link>
      </div>
    </article>
  )

  // Sidebar thumbnail card
  const SidebarCard = ({ post }: { post: Blog }) => (
    <Link href={`/blog/${post.id}`} className="block relative overflow-hidden group">
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={getImageUrl(post.image)}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div style={{ background: darkOverlay }} className="absolute inset-0" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-xs text-[#60A5FA] font-outfit">{post.category || 'Real Estate'}</span>
          <h4 className="text-white font-bold text-sm leading-tight font-outfit mt-0.5 line-clamp-2">
            {post.title}
          </h4>
          <p className="text-white/65 text-xs font-outfit mt-0.5 line-clamp-2">
            {post.excerpt || post.content?.substring(0, 60) + '...'}
          </p>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden" style={{ background: '#F5F9FF' }}>

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="w-full relative min-h-[220px] xs:min-h-[260px] sm:min-h-[320px] md:min-h-[400px] flex flex-col overflow-hidden">
        <div className="absolute inset-0 z-[1]">
          <img
            src="/assets/images/blog/blog-hero-bg.png"
            alt="Blog hero background"
            className="w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0 z-[2]"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.35) 100%)',
              opacity: 0.9,
            }}
          />
          {/* Paper illustration — left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[2] hidden lg:block">
            <img src="/assets/images/blog/blog-paper.png" alt="" className="w-32 xl:w-40 h-auto object-contain" />
          </div>
          {/* Laptop illustration — right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-[2] hidden lg:block">
            <img src="/assets/images/blog/blog-laptop.png" alt="" className="w-32 xl:w-40 h-auto object-contain" />
          </div>
        </div>
        <div className="relative z-[3] page-x py-10 sm:py-14 md:py-16 w-full flex items-center flex-1">
          <div className="page-w">
            <div className="flex flex-col items-start justify-center max-w-lg">
              <h1 className="font-outfit font-extrabold text-white tracking-tight leading-tight m-0 text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                BLOGS
              </h1>
              <p className="font-outfit text-white m-0 mt-3 text-sm sm:text-base drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                Stay Ahead Of The Curve With Expert Insights, Market Trends, And Essential Guides To Philippine Real Estate.
                From Investment Tips To Neighborhood Spotlights, We Bring You The Stories Shaping The Future Of Homeownership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          DARK CONTENT AREA
      ══════════════════════════════════════ */}
      <div className="w-full page-x py-8" style={{ background: '#F5F9FF' }}>
        <div className="page-w">

          {/* ── FEATURED POST (70 / 30) ── */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] mb-8">
              <div className="aspect-[16/9] bg-gray-700 animate-pulse" />
              <div className="bg-gray-800 animate-pulse" />
            </div>
          ) : blogs.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] mb-8">
              {/* Left: large image */}
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={getImageUrl(blogs[0].image)}
                  alt={blogs[0].title}
                  className="w-full h-full object-cover"
                />
                {/* Engagement icons */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiHeart className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs">{blogs[0].likes_count ?? blogs[0].likes ?? 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiMessageCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs">{blogs[0].comments_count ?? blogs[0].comments ?? 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                    <FiShare2 className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Right: white content panel */}
              <div className="flex flex-col justify-between bg-white p-6 lg:p-7">
                <div>
                  <span className="text-sm text-[#205ED7] font-outfit font-medium">
                    {blogs[0].category || 'Pets & Travel'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-outfit mt-2 mb-3 leading-tight">
                    {blogs[0].title}
                  </h2>
                  <p className="text-sm text-gray-600 font-outfit leading-relaxed">
                    {blogs[0].excerpt || blogs[0].content?.substring(0, 150) + '...' ||
                      'Tips and strategies for finding and securing pet-friendly rental properties.'}
                  </p>
                </div>
                <div>
                  <div className="h-px w-full bg-gray-200 my-4" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <span className="text-gray-500 font-semibold text-xs">{blogs[0].author?.charAt(0) || 'A'}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 font-outfit">
                      By {blogs[0].author || 'Isaac Lacaylocay'}
                    </span>
                    <span className="text-xs text-gray-500 font-outfit ml-auto whitespace-nowrap">
                      {formatDate(blogs[0].published_at)}
                    </span>
                  </div>
                  <Link
                    href={`/blog/${blogs[0].id}`}
                    className="flex items-center justify-center px-6 py-2.5 bg-[#266FFD] text-white font-semibold text-sm font-outfit rounded-md hover:bg-[#1a5dd8] transition-colors w-full"
                  >
                    READ MORE
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── TWO-COLUMN LAYOUT: Left content / Right sidebar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-8">

              {/* Blog cards grid — row 1 */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <BlogCardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(blogs.slice(1, 4).length > 0
                    ? blogs.slice(1, 4)
                    : Array.from({ length: 3 }, (_, i): Blog => ({
                        id: i + 1, title: 'Pet-Friendly Rentals: Finding the Right Place', content: '',
                        excerpt: 'Tips and strategies for finding and securing pet-friendly rental properties.',
                        category: 'Pets & Travel', read_time: 3, likes: 0, comments: 0,
                        author: 'Isaac Lacaylocay', image: null, published_at: '2026-02-10',
                      }))
                  ).map(post => <BlogCard key={post.id} post={post} />)}
                </div>
              )}

              {/* Second featured post */}
              {!loading && blogs.length > 4 && (
                <div className="bg-white overflow-hidden">
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <img
                      src={getImageUrl(blogs[4].image)}
                      alt={blogs[4].title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                      <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                        <FiHeart className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs">{blogs[4].likes_count ?? blogs[4].likes ?? 0}</span>
                      </button>
                      <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                        <FiMessageCircle className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs">{blogs[4].comments_count ?? blogs[4].comments ?? 0}</span>
                      </button>
                      <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                        <FiShare2 className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="text-sm text-[#205ED7] font-outfit font-medium">
                      {blogs[4].category || 'Pets & Travel'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-outfit mt-2 mb-3 leading-tight">
                      {blogs[4].title}
                    </h2>
                    <p className="text-sm text-gray-600 font-outfit leading-relaxed mb-4">
                      {blogs[4].excerpt || blogs[4].content?.substring(0, 200) + '...' ||
                        'Tips and strategies for finding and securing pet-friendly rental properties.'}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <span className="text-gray-500 font-semibold text-xs">{blogs[4].author?.charAt(0) || 'A'}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900 font-outfit">
                        By {blogs[4].author || 'Isaac Lacaylocay'}
                      </span>
                      <span className="text-xs text-gray-500 font-outfit ml-auto">
                        {formatDate(blogs[4].published_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Blog cards grid — row 2 */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <BlogCardSkeleton key={i} />)}
                </div>
              ) : blogs.length > 5 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {blogs.slice(5, 8).map(post => <BlogCard key={post.id} post={post} />)}
                </div>
              )}

            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-4 h-fit">

              {/* Categories box */}
              <div className="bg-white p-5">
                <h3 className="text-base font-bold text-gray-900 font-outfit mb-3">Categories</h3>
                <ul className="flex flex-col list-none m-0 p-0">
                  {displayTags.map(tag => (
                    <li key={tag} className="list-none flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      <Link
                        href={`/blog/category/${tag.toLowerCase()}`}
                        className="text-sm text-gray-700 font-outfit hover:text-[#266FFD] transition-colors"
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sidebar thumbnail cards */}
              {loading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="aspect-[4/3] bg-gray-700 animate-pulse" />
                  ))}
                </>
              ) : (
                (blogs.slice(8, 11).length > 0
                  ? blogs.slice(8, 11)
                  : blogs.slice(0, 3)
                ).map(post => <SidebarCard key={post.id + '-sb'} post={post} />)
              )}

            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
