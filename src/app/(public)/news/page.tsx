'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { newsApi } from '@/api'
import type { News } from '@/features/blog'
import { ASSETS } from '@/shared/utils/assets'
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [featuredIndex, setFeaturedIndex] = useState(0)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await newsApi.getAll()
        setNews(data)
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const formatDateShort = (dateString: string | null): string => {
    if (!dateString) return 'January 15, 2026'
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

  // Categories
  const staticCategories = ['All', 'Politics', 'Business', 'Technology', 'Health', 'Travel', 'Sports']
  const dynamicCategories = Array.from(new Set(news.map(n => n.category).filter(Boolean)))
  const displayCategories = dynamicCategories.length > 0 ? ['All', ...dynamicCategories] : staticCategories

  // Flash news headlines
  const flashHeadlines = news.length > 0
    ? news.slice(0, 8).map(n => n.title)
    : [
        'Rental Payment Platforms Simplify Transactions',
        'Student Housing Market Expands Near Universities',
        'Makati CBD Office Space Demand Reaches New High',
        'Property Values Rise in Key Metro Areas',
        'New Rental Regulations Announced for 2026',
      ]

  // Featured slider: 4 articles per "view"
  const totalSlides = Math.max(1, news.length - 3)
  const nextFeatured = () => setFeaturedIndex(prev => (prev + 1 >= totalSlides ? 0 : prev + 1))
  const prevFeatured = () => setFeaturedIndex(prev => (prev - 1 < 0 ? totalSlides - 1 : prev - 1))

  // Section slices
  const spotlightNews = news.slice(0, 6)
  const healthNews = news.slice(6, 10)
  const latestNews = news.slice(0, 3)

  // Overlay gradient (bottom-heavy dark)
  const overlayGradient = 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)'

  // Placeholder for loading/empty state
  const placeholder = (i: number): News => ({
    id: i,
    title: 'POPULAR TOURIST DESTINATION IMPLEMENTS NEW ENTRY RULES',
    content: '',
    excerpt: 'NEW ENTRY RULES',
    category: 'Travel',
    author: 'Lorem ipsum',
    image: null,
    published_at: '2026-01-15',
  })

  const getFeatured = (offset: number): News =>
    news[featuredIndex + offset] ?? placeholder(offset)

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F2F2] overflow-x-hidden">

      {/* Ticker keyframe */}
      <style>{`
        @keyframes newsTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .news-ticker-track {
          display: flex;
          width: max-content;
          animation: newsTicker 35s linear infinite;
        }
        .news-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ══════════════════════════════════════
          1. RED HERO HEADER
      ══════════════════════════════════════ */}
      <section style={{ background: '#CC1A1A' }} className="w-full page-x py-8">
        <div className="page-w flex items-center justify-between gap-8 flex-wrap">
          {/* Left: title + subtitle */}
          <div>
            <h1
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontWeight: 700 }}
              className="text-white text-3xl sm:text-4xl lg:text-5xl leading-tight m-0"
            >
              Welcome To Rentals News
            </h1>
            <p className="text-white/80 text-sm mt-2 m-0 font-outfit">
              Get the latest news and updates delivered to you
            </p>
          </div>
          {/* Right: Search */}
          <div className="flex-shrink-0 w-56 sm:w-64">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-9 pr-4 py-2.5 bg-white text-sm text-gray-700 outline-none font-outfit"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          2. CATEGORY TABS
      ══════════════════════════════════════ */}
      <section className="w-full bg-white page-x" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="page-w flex items-center gap-6 overflow-x-auto py-3 scrollbar-hide">
          {displayCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="whitespace-nowrap font-outfit text-sm transition-colors flex-shrink-0 bg-transparent"
              style={{
                fontWeight: activeCategory === cat ? 700 : 400,
                color: activeCategory === cat ? '#111' : '#6B7280',
                borderBottom: activeCategory === cat ? '2px solid #111' : '2px solid transparent',
                paddingBottom: '4px',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: activeCategory === cat ? '#111' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. FLASH NEWS TICKER
      ══════════════════════════════════════ */}
      <section className="w-full bg-white page-x py-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="page-w flex items-center gap-0 overflow-hidden">
          <span
            className="flex-shrink-0 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wide mr-3 font-outfit"
            style={{ background: '#CC1A1A' }}
          >
            FLASH NEWS
          </span>
          <div className="overflow-hidden flex-1">
            <div className="news-ticker-track">
              {[...flashHeadlines, ...flashHeadlines].map((headline, i) => (
                <span key={i} className="text-xs text-gray-700 flex-shrink-0 font-outfit pr-8">
                  {headline}
                  <span className="ml-4" style={{ color: '#CC1A1A' }}>•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. FEATURED ARTICLES SLIDER
      ══════════════════════════════════════ */}
      <section className="w-full bg-[#F2F2F2] page-x pt-6 pb-2">
        <div className="page-w">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[56%_44%] gap-2">
              <div className="aspect-[4/3] lg:h-80 bg-gray-300 animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-40 bg-gray-300 animate-pulse" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-36 bg-gray-300 animate-pulse" />
                  <div className="h-36 bg-gray-300 animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-[56%_44%] gap-2">

                {/* Left: large featured */}
                <Link href={`/news/${getFeatured(0).id}`} className="block relative overflow-hidden group">
                  <div className="lg:h-96 xl:h-[420px] aspect-[4/3] lg:aspect-auto relative overflow-hidden">
                    <img
                      src={getImageUrl(getFeatured(0).image)}
                      alt={getFeatured(0).title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div style={{ background: overlayGradient }} className="absolute inset-0" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span
                        className="inline-block text-white text-xs px-2 py-0.5 mb-2 font-outfit"
                        style={{ background: 'rgba(0,0,0,0.65)' }}
                      >
                        {getFeatured(0).category || 'Travel'}
                      </span>
                      <h2 className="text-white font-bold text-base sm:text-lg leading-tight m-0 font-outfit uppercase">
                        {getFeatured(0).title}
                      </h2>
                      <p className="font-bold text-sm mt-0.5 m-0 font-outfit uppercase" style={{ color: '#FF4444' }}>
                        {getFeatured(0).excerpt?.substring(0, 45) || 'NEW ENTRY RULES'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/75 text-xs font-outfit">{getFeatured(0).author || 'Lorem ipsum'}</span>
                        <span className="text-white/50 text-xs">•</span>
                        <span className="text-white/75 text-xs font-outfit">{formatDateShort(getFeatured(0).published_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Right: 1 medium + 2 small */}
                <div className="flex flex-col gap-2">
                  {/* Top medium */}
                  <Link href={`/news/${getFeatured(1).id}`} className="block relative overflow-hidden group">
                    <div className="h-44 lg:h-48 xl:h-52 relative overflow-hidden">
                      <img
                        src={getImageUrl(getFeatured(1).image)}
                        alt={getFeatured(1).title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div style={{ background: overlayGradient }} className="absolute inset-0" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <span
                          className="inline-block text-white text-xs px-2 py-0.5 mb-1 font-outfit"
                          style={{ background: 'rgba(0,0,0,0.65)' }}
                        >
                          {getFeatured(1).category || 'Travel'}
                        </span>
                        <h3 className="text-white font-bold text-sm leading-tight m-0 font-outfit uppercase">
                          {getFeatured(1).title}
                        </h3>
                        <p className="font-bold text-xs mt-0.5 m-0 font-outfit uppercase line-clamp-1" style={{ color: '#FF4444' }}>
                          {getFeatured(1).excerpt?.substring(0, 35) || 'NEW ENTRY RULES'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-white/70 text-xs font-outfit">{getFeatured(1).author || 'Lorem ipsum'}</span>
                          <span className="text-white/50 text-xs">•</span>
                          <span className="text-white/70 text-xs font-outfit">{formatDateShort(getFeatured(1).published_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Bottom 2 small */}
                  <div className="grid grid-cols-2 gap-2">
                    {([getFeatured(2), getFeatured(3)] as News[]).map((article, i) => (
                      <Link key={article.id + '-f-' + i} href={`/news/${article.id}`} className="block relative overflow-hidden group">
                        <div className="h-40 lg:h-44 xl:h-48 relative overflow-hidden">
                          <img
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div style={{ background: overlayGradient }} className="absolute inset-0" />
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <span
                              className="inline-block text-white text-[10px] px-1.5 py-0.5 mb-1 font-outfit"
                              style={{ background: 'rgba(0,0,0,0.65)' }}
                            >
                              {article.category || 'Travel'}
                            </span>
                            <h4 className="text-white font-bold text-[11px] leading-tight m-0 font-outfit uppercase line-clamp-2">
                              {article.title}
                            </h4>
                            <p className="font-bold text-[10px] mt-0.5 m-0 font-outfit uppercase line-clamp-1" style={{ color: '#FF4444' }}>
                              {article.excerpt?.substring(0, 22) || 'NEW ENTRY RULES'}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-white/65 text-[10px] font-outfit">{article.author || 'Lorem ipsum'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slider dots + arrows */}
              {totalSlides > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={prevFeatured}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalSlides, 6) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFeaturedIndex(i)}
                      style={{
                        width: featuredIndex === i ? 24 : 8,
                        height: 8,
                        borderRadius: featuredIndex === i ? 4 : '50%',
                        background: featuredIndex === i ? '#1a56db' : '#D1D5DB',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                  <button
                    onClick={nextFeatured}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. MAIN CONTENT  (left grid + right sidebar)
      ══════════════════════════════════════ */}
      <section className="w-full bg-[#F2F2F2] page-x py-6">
        <div className="page-w grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-6">

            {/* Community Spotlight */}
            <div>
              <div
                className="flex items-center px-4 py-2.5 mb-4"
                style={{ borderLeft: '4px solid #CC1A1A', background: '#1C1C1C' }}
              >
                <span className="text-white font-bold text-sm tracking-widest uppercase font-outfit">
                  COMMUNITY SPOTLIGHT
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-200 animate-pulse aspect-[4/3]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(spotlightNews.length > 0
                    ? spotlightNews
                    : Array.from({ length: 6 }, (_, i) => placeholder(i))
                  ).map((article, i) => (
                    <Link key={article.id + '-sp-' + i} href={`/news/${article.id}`} className="block group">
                      <article className="flex flex-col bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span
                            className="absolute bottom-2 left-2 text-white text-[10px] px-1.5 py-0.5 font-outfit"
                            style={{ background: 'rgba(0,0,0,0.7)' }}
                          >
                            {article.category || 'Travel'}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 uppercase m-0 font-outfit">
                            {article.title}
                          </h3>
                          <p className="text-xs font-bold mt-0.5 line-clamp-1 m-0 font-outfit uppercase" style={{ color: '#CC1A1A' }}>
                            {article.excerpt?.substring(0, 30) || 'NEW ENTRY RULES'}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-[10px] text-gray-500 font-outfit">{article.author || 'Lorem ipsum'}</span>
                            <span className="text-[10px] text-gray-400 mx-0.5">•</span>
                            <span className="text-[10px] text-gray-500 font-outfit">{formatDateShort(article.published_at)}</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Health & Wellness */}
            <div>
              <div
                className="flex items-center px-4 py-2.5 mb-4"
                style={{ borderLeft: '4px solid #CC1A1A', background: '#1C1C1C' }}
              >
                <span className="text-white font-bold text-sm tracking-widest uppercase font-outfit">
                  HEALTH &amp; WELLNESS
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(healthNews.length > 0
                    ? healthNews
                    : Array.from({ length: 3 }, (_, i) => placeholder(i + 10))
                  ).map((article, i) => (
                    <Link key={article.id + '-hw-' + i} href={`/news/${article.id}`} className="block group">
                      <article className="flex gap-4 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 w-32 lg:w-36 xl:w-40 h-28 lg:h-32 xl:h-36 overflow-hidden">
                          <img
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0">
                          <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 uppercase m-0 font-outfit">
                            {article.title}
                          </h3>
                          <p className="text-xs font-bold mt-0.5 line-clamp-1 m-0 font-outfit uppercase" style={{ color: '#CC1A1A' }}>
                            {article.excerpt?.substring(0, 30) || 'NEW ENTRY RULES'}
                          </p>
                          <div className="mt-1.5">
                            <span
                              className="text-[10px] text-white px-2 py-0.5 font-outfit inline-block"
                              style={{ background: '#1C1C1C' }}
                            >
                              {article.category || 'Travel'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-500 font-outfit">{article.author || 'Lorem ipsum'}</span>
                            <span className="text-[10px] text-gray-400 mx-0.5">•</span>
                            <span className="text-[10px] text-gray-500 font-outfit">{formatDateShort(article.published_at)}</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT COLUMN: Latest News ── */}
          <div className="lg:pl-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold m-0 font-outfit">
                <span className="text-gray-900">Latest </span>
                <span style={{ color: '#CC1A1A' }}>News</span>
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-24 h-20 bg-gray-200 animate-pulse flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3 bg-gray-200 animate-pulse rounded" />
                      <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {(latestNews.length > 0
                  ? latestNews
                  : Array.from({ length: 3 }, (_, i) => placeholder(i + 20))
                ).map((article, i) => (
                  <Link key={article.id + '-ln-' + i} href={`/news/${article.id}`} className="block group">
                    <article className="flex gap-3">
                      <div className="flex-shrink-0 w-28 lg:w-32 xl:w-36 h-24 lg:h-28 xl:h-32 overflow-hidden bg-gray-200">
                        <img
                          src={getImageUrl(article.image)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-gray-900 leading-snug m-0 font-outfit uppercase">
                          {article.title}{' '}
                          <span style={{ color: '#CC1A1A' }}>
                            {article.excerpt?.substring(0, 20) || 'NEW ENTRY RULES'}
                          </span>
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-gray-500 font-outfit">{article.author || 'Lorem ipsum'}</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-gray-500 font-outfit">{formatDateShort(article.published_at)}</span>
                        </div>
                        <div className="mt-1.5">
                          <span
                            className="text-[10px] text-white px-2 py-0.5 font-outfit inline-block"
                            style={{ background: '#1C1C1C' }}
                          >
                            {article.category || 'Travel'}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
