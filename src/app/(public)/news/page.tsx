'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { newsApi } from '@/api'
import type { News } from '@/api/endpoints/news'
import { ASSETS } from '@/utils/assets'
import { NewsArticleSkeleton } from '@/components/common/NewsArticleSkeleton'

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

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

  // Category colors mapping
  const categoryColors: { [key: string]: string } = {
    'Business': '#4A90E2',
    'Economy': '#50C878',
    'Technology': '#FF69B4',
    'Politics': '#E74C3C',
    'Health': '#50C878',
    'Sports': '#E74C3C',
    'Entertainment': '#E91E63',
    'Science': '#00BCD4',
    'Legal': '#E74C3C',
    'Property Management': '#4A90E2',
    'Environment': '#50C878',
    'Finance': '#4A90E2',
    'Real Estate': '#FF8C00',
    'Travel': '#000000',
    'Life': '#000000'
  }

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || '#999999'
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'January 15, 2026'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateShort = (dateString: string | null): string => {
    if (!dateString) return 'January 15, 2026'
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

  // Organize news into sections based on the photo
  const featureMain = news[0] || null
  const featureRight = news.slice(1, 4)
  const trendingNews = news.slice(4, 8)
  const carouselNews = news.slice(8, 11)
  const videoNews = news.slice(11, 14)
  const mainNewsList = news.slice(14, 18)
  const mostPopular = [...news].sort((a, b) => (b.id - a.id)).slice(0, 4)
  const displayTags = ['Business', 'Technology', 'Sport', 'Art', 'Lifestyle', 'Three', 'Photography', 'Education', 'Social']
  const headlineNews = news.slice(0, 5)

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      {/* Redesigned News Header */}
      <header className="w-full">
        {/* Top Red Bar */}
        <div className="bg-red-600 w-full px-4 sm:px-6 md:px-10 lg:px-[150px] py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
            {/* Logo and Subtitle */}
            <div className="text-white text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic font-serif leading-none tracking-tight">
                Welcome to Rentals News
              </h1>
              <p className="mt-1 text-xs sm:text-sm md:text-base font-medium opacity-90 font-outfit">
                News & Lifestyle Magazine Template
              </p>
            </div>

            {/* Right Side: Auth and Search */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full lg:w-auto">


              <div className="relative w-full sm:w-[300px] md:w-[400px]">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-white border border-white/40 rounded-md py-2 px-4 pr-10 text-gray-500 placeholder:text-gray-500/60 focus:outline-none focus:border-white transition-colors font-outfit"
                />
                <button className="absolute right-3 top-2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar (White) */}
        <nav className="w-full bg-white border-b border-gray-200 overflow-x-auto">
          <div className="mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px] flex items-center gap-6 sm:gap-8 py-4 whitespace-nowrap scrollbar-hide">
            <Link href="/news" className="text-gray-900 font-bold hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Home</Link>
            <div className="flex items-center gap-1 group cursor-pointer">
              <span className="text-gray-900 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Pages</span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex items-center gap-1 group cursor-pointer">
              <span className="text-gray-900 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Mega Menu</span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <Link href="/news/category/politics" className="text-gray-900 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Politics</Link>
            <Link href="/news/category/breaking" className="text-gray-500 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Breaking News</Link>
            <Link href="/news/category/business" className="text-gray-500 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Business</Link>
            <Link href="/news/category/technology" className="text-gray-500 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Technology</Link>
            <Link href="/news/category/health" className="text-gray-500 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Health</Link>
            <Link href="/news/category/travel" className="text-gray-500 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Travel</Link>
            <Link href="/news/category/sports" className="text-gray-500 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Sports</Link>
            <Link href="/contact" className="text-gray-500 font-medium hover:text-red-600 transition-colors font-outfit text-sm sm:text-base">Contact</Link>
          </div>
        </nav>

        {/* Headline Ticker Section */}
        {headlineNews.length > 0 && (
          <div className="w-full bg-gray-50 border-b border-gray-100 py-2 sm:py-3 relative overflow-hidden flex items-center pr-4 sm:pr-6 md:pr-10 lg:pr-[150px]">
            {/* Ticker Title Tag */}
            <div className="bg-red-600 text-white font-outfit font-bold text-[10px] sm:text-xs uppercase px-3 py-1 ml-4 sm:ml-6 md:ml-10 lg:ml-[150px] rounded shrink-0 z-10 shadow-sm">
              Flash News
            </div>

            <div className="flex-1 overflow-hidden ml-4">
              <div
                className="flex whitespace-nowrap"
                style={{
                  animation: 'scrollTicker 60s linear infinite'
                }}
              >
                {[...Array(3)].map((_, loopIndex) => (
                  <div key={loopIndex} className="flex items-center gap-6 sm:gap-10 px-4">
                    {headlineNews.map((article, index) => (
                      <Link
                        key={`${loopIndex}-${index}`}
                        href={`/news/${article.id}`}
                        className="flex items-center gap-2 group"
                      >
                        <span className="text-gray-700 font-outfit text-xs sm:text-sm font-medium hover:text-red-600 transition-colors">
                          {article.title}
                        </span>
                        <span className="text-gray-300 text-sm sm:text-lg select-none">•</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes scrollTicker {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-33.333%);
                  }
                }
              `
            }} />
          </div>
        )}
      </header>

      {/* Main Content Area with Background Texture */}
      <div
        className="relative w-full"
      /*style={{
        backgroundImage: `url(${ASSETS.BG_NEWS})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}*/
      >
        <div className="absolute inset-0 bg-white/90"></div>

        <main className="relative z-10 mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-[150px] py-8 sm:py-12">
          {loading ? (
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <NewsArticleSkeleton key={i} variant="card" />)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => <NewsArticleSkeleton key={i} variant="card" />)}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-12 sm:gap-16">

              {/* Combined Featured & News Block */}
              <div className="flex flex-col gap-8 sm:gap-10">
                {/* 0. Feature Grid Section */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 lg:h-250">
                  {/* Left: Big Feature */}
                  <div className="lg:col-span-7 h-[200px] sm:h-[300px] lg:h-[700px]">
                    {featureMain && (
                      <Link href={`/news/${featureMain.id}`} className="group relative block w-full h-full overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                        <img
                          src={getImageUrl(featureMain.image)}
                          alt={featureMain.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                        <div className="absolute bottom-0 p-6 md:p-8 w-full">
                          <span className="inline-block px-3 py-1 bg-black text-white text-[10px] md:text-xs font-bold font-outfit uppercase mb-3 rounded">
                            {featureMain.category || 'ECONOMY'}
                          </span>
                          <h2 className="text-white font-outfit text-xl md:text-2xl lg:text-3xl font-extrabold line-clamp-2 mb-2 leading-tight">
                            {featureMain.title}
                          </h2>
                          <div className="text-white/80 text-xs md:text-sm font-outfit font-medium">
                            Lorem ipsum • {formatDate(featureMain.published_at)}
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Right: 3 Smaller Features */}
                  <div className="lg:col-span-5 flex flex-col gap-3 md:gap-4 h-[700px]">
                    {/* Top wide in right col */}
                    {featureRight[0] && (
                      <Link href={`/news/${featureRight[0].id}`} className="group relative block w-full flex-1 overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                        <img
                          src={getImageUrl(featureRight[0].image)}
                          alt={featureRight[0].title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                        <div className="absolute bottom-0 p-4 md:p-5">
                          <span className="inline-block px-2 py-0.5 bg-black text-white text-[10px] font-bold font-outfit uppercase mb-2 rounded">
                            {featureRight[0].category || 'TECHNOLOGY'}
                          </span>
                          <h3 className="text-white font-outfit text-sm md:text-base lg:text-lg font-bold line-clamp-2 leading-tight">
                            {featureRight[0].title}
                          </h3>
                          <div className="text-white/80 text-[10px] md:text-xs font-outfit mt-1">
                            Lorem ipsum • {formatDateShort(featureRight[0].published_at)}
                          </div>
                        </div>
                      </Link>
                    )}

                    {/* Bottom two side by side in right col */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {featureRight.slice(1, 3).map((article, idx) => (
                        <Link key={article.id} href={`/news/${article.id}`} className="group relative block w-full h-full min-h-[160px] overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                          <img
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                          <div className="absolute bottom-0 p-4">
                            <span className="inline-block px-2 py-0.5 bg-black text-white text-[10px] font-bold font-outfit uppercase mb-2 rounded">
                              {article.category || (idx === 0 ? 'EDUCATION' : 'ECONOMY')}
                            </span>
                            <h3 className="text-white font-outfit text-xs md:text-sm lg:text-[15px] font-bold line-clamp-2 leading-tight">
                              {article.title}
                            </h3>
                            <div className="text-white/80 text-[10px] font-outfit mt-1">
                              Lorem ipsum • {formatDateShort(article.published_at)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 2. News (Carousel) Section */}
                <section>
                  <div className="flex justify-between items-center border-b-2 border-gray-100 mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold font-outfit text-gray-900 pb-2">News</h2>
                    <div className="flex gap-1">
                      <button className="p-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-400 rounded transition-colors">‹</button>
                      <button className="p-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-400 rounded transition-colors">›</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                    {carouselNews.map((article) => (
                      <Link key={article.id} href={`/news/${article.id}`} className="group flex flex-col gap-3">
                        <div className="aspect-[16/10] overflow-hidden rounded-md bg-gray-100">
                          <img
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-outfit text-sm sm:text-base font-bold line-clamp-2 leading-tight group-hover:text-red-600">
                            {article.title}
                          </h3>
                          <div className="text-gray-500 text-[10px] sm:text-xs font-outfit mt-1 uppercase">
                            🕒 {formatDateShort(article.published_at)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>



              {/* 4. Main Body: News + Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-10 lg:mb-12 items-stretch">
                {/* Left Column: News List */}
                <div className="flex flex-col gap-8">
                  <div className="border-b-2 border-gray-100 mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold font-outfit text-gray-900 pb-2">News</h2>
                  </div>
                  <div className="flex flex-col gap-6 sm:gap-10">
                    {mainNewsList.map((article) => (
                      <Link key={article.id} href={`/news/${article.id}`} className="group flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                        <div className="w-full sm:w-[240px] md:w-[280px] aspect-[4/3] flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                          <img
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 font-outfit leading-tight group-hover:text-red-600 transition-colors">
                            {article.title}
                          </h3>
                          <div className="text-xs sm:text-sm text-gray-500 font-outfit uppercase">
                            Lorem Ipsum • {formatDateShort(article.published_at)}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 font-outfit line-clamp-3 leading-relaxed">
                            {article.content || "Magna aliqua ut enim ad minim veniam quis nostrud quis xercitation ullamco. Thomson Smith - April 18, 2018 Amet consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation."}
                          </p>
                          <ul className="hidden md:block list-disc ml-4 text-[10px] sm:text-xs text-gray-500">
                            <li>Why 2017 Might Just Be the Worst Year for Gaming</li>
                            <li>Ghost Racer Wants to be the Most Ambitious Car Game</li>
                          </ul>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination placeholder */}
                  <div className="flex justify-center items-center gap-2 mt-4 sm:mt-8">
                    <button className="px-3 py-1 bg-gray-100 text-gray-400 text-xs sm:text-sm font-bold rounded">← PREVIOUS</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 text-xs sm:text-sm font-bold rounded">1</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-900 text-xs sm:text-sm font-bold rounded">2</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 text-xs sm:text-sm font-bold rounded">3</button>
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 text-xs sm:text-sm font-bold rounded">...</button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-400 text-xs sm:text-sm font-bold rounded">NEXT →</button>
                  </div>
                </div>

                {/* Right Column: Sidebar */}
                <div className="flex flex-col gap-10">
                  {/* Tags */}
                  <section>
                    <div className="border-b-2 border-gray-100 mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold font-outfit text-gray-900 pb-2">Tags</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4">
                      {displayTags.map(tag => (
                        <span key={tag} className="px-5 py-3 bg-gray-100 text-gray-600 text-sm sm:text-base md:text-lg font-bold font-outfit rounded-lg hover:bg-red-600 hover:text-white cursor-pointer transition-colors shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* Most Popular */}
                  <section>
                    <div className="border-b-2 border-gray-100 mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold font-outfit text-gray-900 pb-2">Most Popular</h2>
                    </div>
                    <div className="flex flex-col gap-8">
                      {mostPopular.map(article => (
                        <Link key={article.id} href={`/news/${article.id}`} className="group flex gap-5 sm:gap-8 items-start">
                          <div className="w-28 h-20 sm:w-40 sm:h-28 md:w-56 md:h-36 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-md">
                            <img src={getImageUrl(article.image)} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          <div className="flex-1 flex flex-col gap-2 sm:gap-3">
                            <h4 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 font-outfit line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                              {article.title}
                            </h4>
                            <div className="text-xs sm:text-sm md:text-base text-gray-500 font-outfit uppercase font-semibold">
                              🕒 {formatDateShort(article.published_at)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
              {/* 3. Video/Media Section */}
              <section>
                <div className="flex justify-between items-center border-b-2 border-gray-100 mb-6 pb-2">
                  <div className="flex gap-1 h-1 bg-gray-100 w-full mb-[-1.5rem]"></div>
                  <div className="flex gap-1 ml-auto">
                    <button className="p-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-400 rounded transition-colors">‹</button>
                    <button className="p-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-400 rounded transition-colors">›</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  {videoNews.map((article) => (
                    <Link key={article.id} href={`/news/${article.id}`} className="group flex flex-col gap-2">
                      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-gray-100">
                        <img
                          src={getImageUrl(article.image)}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <span className="text-white ml-1">▶</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-400 text-[10px] sm:text-xs font-outfit uppercase">
                        🕒 {formatDateShort(article.published_at)}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
              {/* 1. Trending Section */}
              <section>
                <div className="border-b-2 border-gray-100 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold font-outfit text-gray-900 pb-2">Trending</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {trendingNews.map((article) => (
                    <Link key={article.id} href={`/news/${article.id}`} className="group relative aspect-[4/3] overflow-hidden rounded-md bg-gray-200">
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-0 p-4">
                        <h3 className="text-white font-outfit text-sm font-bold line-clamp-2 mb-1 group-hover:underline">
                          {article.title}
                        </h3>
                        <div className="text-white/70 text-[10px] sm:text-xs font-outfit uppercase">
                          Lorem Ipsum • {formatDateShort(article.published_at)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
