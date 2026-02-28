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

  // Organize news into sections
  const bigNewsBox = news[0] || null // Left column - big box
  const topRightBlock = news[1] || null // Right column top - single block
  const bottomRightBlocks = news.slice(2, 4) // Right column bottom - 2 blocks side by side
  const recentPosts = news.slice(4, 10)
  const latestNews = news.slice(10, 16)
  const headlineNews = news.slice(0, 5) // For ticker animation

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      {/* Red Hero Banner */}
      <section className="w-full bg-red-600 py-6 sm:py-8 md:py-10">
        <div className="px-4 sm:px-6 md:px-10 lg:px-[150px] flex flex-col sm:flex-row gap-4 sm:gap-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-outfit uppercase text-start mb-0 sm:mb-4">
            NEWS
          </h1>
          
          {/* Headline Ticker Animation */}
          {headlineNews.length > 0 && (
            <div className="relative overflow-hidden bg-black/20 py-2 sm:py-3 h-auto sm:h-13 rounded justify-center items-center flex flex-1 min-w-0">
              <div 
                className="flex whitespace-nowrap"
                style={{
                  animation: 'scrollRight 40s linear infinite'
                }}
              >
                {/* Duplicate content for seamless loop */}
                {[...Array(3)].map((_, loopIndex) => (
                  <div key={loopIndex} className="flex items-center gap-8 px-4">
                    {headlineNews.map((article, index) => (
                      <div key={`${loopIndex}-${index}`} className="flex items-center gap-4">
                        <span className="text-white font-outfit text-sm md:text-base font-semibold">
                          {article.title}
                        </span>
                        <span className="text-white/60 text-lg">•</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes scrollRight {
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
      </section>

      {/* Main Content Area with Background Texture */}
      <div 
        className="relative w-full"
        style={{
          backgroundImage: `url(${ASSETS.BG_NEWS})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-white/90"></div>
        
        <main className="relative z-10 mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-[150px] py-8 sm:py-12">
          {loading ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12 items-stretch">
                <div className="lg:col-span-1 flex">
                  <NewsArticleSkeleton variant="feature" className="w-full" />
                </div>
                <div className="flex flex-col gap-4">
                  <NewsArticleSkeleton variant="card" className="w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <NewsArticleSkeleton variant="card" />
                    <NewsArticleSkeleton variant="card" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <NewsArticleSkeleton key={i} variant="card" />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Header Section - Two Columns Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12 items-stretch">
                {/* Left Column - Big News Box */}
                <div className="lg:col-span-1 flex">
                  {bigNewsBox && (
                    <Link href={`/news/${bigNewsBox.id}`} className="no-underline w-full">
                      <article className="relative overflow-hidden rounded-lg h-full w-full">
                        <div className="relative h-[600px] w-full overflow-hidden">
                          <img 
                            src={getImageUrl(bigNewsBox.image)} 
                            alt={bigNewsBox.title} 
                            className="h-full w-full object-cover" 
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
                            <div className="mb-3">
                              <span className="bg-black/80 px-3 py-1 rounded text-white font-outfit text-sm font-semibold uppercase">
                                {bigNewsBox.category}
                              </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white font-outfit mb-3 leading-tight">
                              {bigNewsBox.title}
                            </h2>
                            <div className="text-white font-outfit text-sm">
                              Lorem ipsum • {formatDate(bigNewsBox.published_at)}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )}
                </div>

                {/* Right Column - Top Block and Bottom Two Blocks */}
                <div className="lg:col-span-1 flex flex-col gap-4 h-[600px] max-h-[600px] min-h-0">
                  {/* Top Block */}
                  {topRightBlock && (
                    <Link href={`/news/${topRightBlock.id}`} className="no-underline flex-1 min-h-0">
                      <article className="relative overflow-hidden rounded-lg h-full">
                        <div className="relative h-full w-full overflow-hidden">
                          <img 
                            src={getImageUrl(topRightBlock.image)} 
                            alt={topRightBlock.title} 
                            className="h-full w-full object-cover" 
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                            <div className="mb-2">
                              <span className="bg-black/80 px-2 py-1 rounded text-white font-outfit text-xs font-semibold uppercase">
                                {topRightBlock.category}
                              </span>
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-white font-outfit mb-2 leading-tight line-clamp-2">
                              {topRightBlock.title}
                            </h3>
                            <div className="text-white font-outfit text-xs">
                              Lorem ipsum • {formatDateShort(topRightBlock.published_at)}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )}

                  {/* Bottom Two Blocks - Side by Side */}
                  <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                    {bottomRightBlocks.map((article) => (
                      <Link key={article.id} href={`/news/${article.id}`} className="no-underline h-full min-h-0">
                        <article className="relative overflow-hidden rounded-lg h-full">
                          <div className="relative h-full w-full overflow-hidden">
                            <img 
                              src={getImageUrl(article.image)} 
                              alt={article.title} 
                              className="h-full w-full object-cover" 
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                              <div className="mb-2">
                                <span className="bg-black/80 px-2 py-1 rounded text-white font-outfit text-xs font-semibold uppercase">
                                  {article.category}
                                </span>
                              </div>
                              <h3 className="text-sm md:text-base font-bold text-white font-outfit mb-2 leading-tight line-clamp-2">
                                {article.title}
                              </h3>
                              <div className="text-white font-outfit text-xs">
                                Lorem ipsum • {formatDateShort(article.published_at)}
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Content Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                {/* Left Column - Latest News */}
                <div className="lg:col-span-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 font-outfit mb-4 sm:mb-6 uppercase">
                    LATEST NEWS
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-[400px] sm:h-[600px] overflow-y-auto">
                    {latestNews.map((article) => (
                      <Link key={article.id} href={`/news/${article.id}`} className="no-underline">
                        <article className="flex gap-4 pb-6 border-b border-gray-200 hover:opacity-80 transition-opacity">
                          {/* Image */}
                          <div className="w-36 h-36 flex-shrink-0 overflow-hidden rounded-lg">
                            <img 
                              src={getImageUrl(article.image)} 
                              alt={article.title} 
                              className="h-full w-full object-cover" 
                            />
                          </div>
                          {/* Content */}
                          <div className="flex flex-col flex-1 gap-2">
                            <h3 className="text-base font-bold text-gray-900 font-outfit leading-tight line-clamp-2">
                              {article.title}
                            </h3>
                            <div className="text-sm text-gray-600 font-outfit">
                              Lorem Ipsum • {formatDateShort(article.published_at)}
                            </div>
                            <div className="mt-1">
                              <span 
                                className="text-xs font-semibold font-outfit px-2 py-1 rounded"
                                style={{ 
                                  color: getCategoryColor(article.category),
                                  backgroundColor: `${getCategoryColor(article.category)}20`
                                }}
                              >
                                {article.category}
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right Column - Recent Posts Sidebar */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-bold text-gray-900 font-outfit mb-4 uppercase">
                    RECENT POSTS
                  </h3>
                  <div className="relative h-[600px] overflow-hidden">
                    <div 
                      className="flex flex-col gap-3"
                      style={{
                        animation: 'scrollDown 30s linear infinite'
                      }}
                    >
                      {/* First set of posts */}
                      {recentPosts.map((article, index) => (
                        <Link key={`first-${article.id}-${index}`} href={`/news/${article.id}`} className="no-underline">
                          <div className="flex gap-3 items-start hover:opacity-80 transition-opacity">
                            <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                              <img 
                                src={getImageUrl(article.image)} 
                                alt={article.title} 
                                className="h-full w-full object-cover" 
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 font-outfit leading-tight line-clamp-2">
                                {article.title}
                              </h4>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {/* Duplicate set for seamless loop */}
                      {recentPosts.map((article, index) => (
                        <Link key={`second-${article.id}-${index}`} href={`/news/${article.id}`} className="no-underline">
                          <div className="flex gap-3 items-start hover:opacity-80 transition-opacity">
                            <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                              <img 
                                src={getImageUrl(article.image)} 
                                alt={article.title} 
                                className="h-full w-full object-cover" 
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900 font-outfit leading-tight line-clamp-2">
                                {article.title}
                              </h4>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      @keyframes scrollDown {
                        0% {
                          transform: translateY(0);
                        }
                        100% {
                          transform: translateY(-50%);
                        }
                      }
                    `
                  }} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
