'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { EmptyState, EmptyStateAction } from '@/shared/components/misc'
import { newsApi } from '@/api'
import type { News } from '@/features/blog'
import { ASSETS } from '@/utils/assets'

export default function NewsDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [news, setNews] = useState<News | null>(null)
  const [relatedNews, setRelatedNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const id = parseInt(params.id as string)
        if (isNaN(id)) {
          router.push('/news')
          return
        }
        const data = await newsApi.getById(id)
        setNews(data)

        // Fetch related news
        try {
          const all = await newsApi.getAll()
          const related = all.filter((n: News) => n.id !== id).slice(0, 8)
          setRelatedNews(related)
        } catch {
          // silently ignore related news fetch errors
        }
      } catch (error) {
        console.error('Error fetching news:', error)
        router.push('/news')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchNews()
    }
  }, [params.id, router])

  const formatDate = (dateString: string | null): string => {
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

  // Parse content into sections with headings
  const parseContent = (content: string) => {
    if (!content) return []
    const lines = content.split('\n').filter(l => l.trim())
    const sections: Array<{ type: 'heading' | 'paragraph'; content: string }> = []
    let currentParagraph = ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        if (currentParagraph) {
          sections.push({ type: 'paragraph', content: currentParagraph })
          currentParagraph = ''
        }
        continue
      }
      const isHeading =
        trimmed.startsWith('#') ||
        (trimmed.length < 100 &&
          trimmed.split(' ').length < 15 &&
          (trimmed === trimmed.toUpperCase() ||
            trimmed.split(' ').every(w => w[0] === w[0]?.toUpperCase())))

      if (isHeading) {
        if (currentParagraph) {
          sections.push({ type: 'paragraph', content: currentParagraph })
          currentParagraph = ''
        }
        sections.push({ type: 'heading', content: trimmed.replace(/^#+\s*/, '') })
      } else {
        currentParagraph = currentParagraph ? currentParagraph + ' ' + trimmed : trimmed
      }
    }
    if (currentParagraph) sections.push({ type: 'paragraph', content: currentParagraph })
    return sections.length > 0 ? sections : [{ type: 'paragraph' as const, content }]
  }

  // Overlay gradient
  const overlayGradient = 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)'

  // Placeholder related article
  const placeholderRelated = (i: number): News => ({
    id: 9000 + i,
    title: 'POPULAR TOURIST DESTINATION IMPLEMENTS NEW ENTRY RULES',
    content: '',
    excerpt: 'NEW ENTRY RULES',
    category: 'Travel',
    author: 'Lorem ipsum',
    image: null,
    published_at: '2026-01-15',
  })

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-1 page-x py-8 w-full"><div className="page-w">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-gray-200 rounded w-48" />
            <div className="h-10 bg-gray-200 rounded w-3/4" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
              <div className="flex flex-col gap-4">
                <div className="aspect-[16/9] bg-gray-200 rounded" />
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded" />)}
              </div>
            </div>
          </div>
        </div></main>
        <Footer />
      </div>
    )
  }

  if (!news) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-1 flex items-center justify-center page-x py-20 w-full"><div className="page-w flex items-center justify-center">
          <EmptyState
            variant="notFound"
            title="Article not found"
            description="This article may have been removed or the link might be incorrect."
            action={<EmptyStateAction href="/news" primary>Back to news</EmptyStateAction>}
          />
        </div></main>
        <Footer />
      </div>
    )
  }

  const contentSections = parseContent(news.content)
  // Small cards: first 5, large image cards: next 3
  const displayRelated = relatedNews.length > 0
    ? relatedNews
    : Array.from({ length: 8 }, (_, i) => placeholderRelated(i))
  const smallCards = displayRelated.slice(0, 5)
  const largeCards = displayRelated.slice(5, 8)

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">

      {/* ══════════════════════════════════
          BREADCRUMB + "NEWS DETAILS" HEADER
      ══════════════════════════════════ */}
      <section className="w-full bg-white page-x pt-4 pb-5">
        <div className="page-w">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-4 flex-wrap">
            <Link href="/news" className="text-gray-500 hover:text-gray-800 font-outfit transition-colors">
              News
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-[#205ED7] font-outfit truncate max-w-xs sm:max-w-none">
              {news.title}
            </span>
          </nav>

          {/* "■ NEWS DETAILS ████████" */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black flex-shrink-0" />
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-black font-outfit uppercase tracking-wide flex-shrink-0">
              NEWS
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-outfit uppercase tracking-wide flex-shrink-0" style={{ color: '#CC1A1A' }}>
              DETAILS
            </span>
            <div className="flex-1 h-8 sm:h-10 md:h-12 flex-shrink" style={{ background: '#CC1A1A' }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TWO-COLUMN BODY
      ══════════════════════════════════ */}
      <section className="w-full bg-white page-x pb-10">
        <div className="page-w">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-10 items-start">

            {/* ══ LEFT: article ══ */}
            <article className="flex flex-col gap-0 min-w-0">

              {/* Article title */}
              <h1 className="font-outfit text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight mt-4 mb-3 m-0">
                {news.title}
              </h1>

              {/* Excerpt / summary */}
              {news.excerpt && (
                <p className="font-outfit text-sm sm:text-base text-gray-600 leading-relaxed text-justify mb-4 m-0">
                  {news.excerpt}
                </p>
              )}

              {/* Hero image */}
              <div className="w-full overflow-hidden mb-5 bg-gray-100" style={{ aspectRatio: '16/9' }}>
                <img
                  src={getImageUrl(news.image)}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Sub-title (repeat) */}
              <h2 className="font-outfit text-base sm:text-lg font-bold text-gray-900 leading-snug mb-4 m-0">
                {news.title}
              </h2>

              {/* Body content */}
              <div className="flex flex-col gap-4">
                {contentSections.map((section, idx) =>
                  section.type === 'heading' ? (
                    <h3
                      key={idx}
                      className="font-outfit text-base sm:text-lg font-bold text-gray-900 leading-snug m-0 mt-2"
                    >
                      {section.content}
                    </h3>
                  ) : (
                    <p
                      key={idx}
                      className="font-outfit text-sm sm:text-base text-gray-800 leading-relaxed text-justify m-0"
                    >
                      {section.content}
                    </p>
                  )
                )}
              </div>

              {/* Author + date footer */}
              <div className="mt-8 pt-4 flex items-center gap-3 flex-wrap" style={{ borderTop: '1px solid #E5E7EB' }}>
                <span className="text-xs text-gray-500 font-outfit">
                  By <strong className="text-gray-700">{news.author || 'Staff'}</strong>
                </span>
                <span className="text-gray-300 text-xs">•</span>
                <span className="text-xs text-gray-500 font-outfit">{formatDate(news.published_at)}</span>
              </div>
            </article>

            {/* ══ RIGHT: Related News sidebar ══ */}
            <aside className="hidden lg:flex flex-col gap-0 min-w-0 mt-4">

              {/* "RELATED NEWS" red header */}
              <div
                className="w-full px-4 py-3 mb-3"
                style={{ background: '#CC1A1A' }}
              >
                <span className="text-white font-bold text-sm tracking-widest uppercase font-outfit">
                  RELATED NEWS
                </span>
              </div>

              {/* Small horizontal cards (5) */}
              <div className="flex flex-col gap-0" style={{ borderTop: '1px solid #E5E7EB' }}>
                {smallCards.map((article, i) => (
                  <Link
                    key={article.id + '-sc-' + i}
                    href={`/news/${article.id}`}
                    className="flex gap-0 group bg-white hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                  >
                    {/* Thumbnail */}
                    <div className="w-[100px] flex-shrink-0 overflow-hidden bg-gray-200" style={{ minHeight: '80px' }}>
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{ minHeight: '80px' }}
                      />
                    </div>
                    {/* Text */}
                    <div className="flex-1 p-2.5 flex flex-col gap-1 justify-center min-w-0">
                      <h3 className="font-outfit text-[11px] font-bold text-gray-900 leading-snug line-clamp-2 uppercase m-0">
                        {article.title}{' '}
                        <span style={{ color: '#CC1A1A' }}>
                          {article.excerpt?.substring(0, 20) || 'NEW ENTRY RULES'}
                        </span>
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500 font-outfit">{article.author || 'Lorem ipsum'}</span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-gray-500 font-outfit">{formatDate(article.published_at)}</span>
                      </div>
                      <div>
                        <span
                          className="text-[10px] text-white px-2 py-0.5 font-outfit inline-block"
                          style={{ background: '#1C1C1C' }}
                        >
                          {article.category || 'Travel'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Large image cards (3) */}
              <div className="flex flex-col gap-2 mt-2">
                {largeCards.map((article, i) => (
                  <Link
                    key={article.id + '-lc-' + i}
                    href={`/news/${article.id}`}
                    className="block relative overflow-hidden group"
                    style={{ minHeight: '160px' }}
                  >
                    <div className="relative w-full overflow-hidden" style={{ minHeight: '160px' }}>
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ minHeight: '160px', display: 'block' }}
                      />
                      <div style={{ background: overlayGradient }} className="absolute inset-0" />
                      <div className="absolute top-2 left-2">
                        <span
                          className="text-[10px] text-white px-2 py-0.5 font-outfit inline-block"
                          style={{ background: '#1C1C1C' }}
                        >
                          {article.category || 'Travel'}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-outfit text-[11px] font-bold text-white leading-snug line-clamp-2 uppercase m-0">
                          {article.title}{' '}
                          <span style={{ color: '#FF4444' }}>
                            {article.excerpt?.substring(0, 20) || 'NEW ENTRY RULES'}
                          </span>
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-white/75 font-outfit">{article.author || 'Lorem ipsum'}</span>
                          <span className="text-[10px] text-white/50">•</span>
                          <span className="text-[10px] text-white/75 font-outfit">{formatDate(article.published_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

            </aside>
          </div>

          {/* Mobile related news */}
          <div className="mt-8 pt-6 lg:hidden" style={{ borderTop: '2px solid #E5E7EB' }}>
            <div className="px-4 py-3 mb-4" style={{ background: '#CC1A1A' }}>
              <span className="text-white font-bold text-sm tracking-widest uppercase font-outfit">RELATED NEWS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {smallCards.map((article, i) => (
                <Link
                  key={article.id + '-m-' + i}
                  href={`/news/${article.id}`}
                  className="flex gap-0 bg-white hover:shadow-md transition-shadow group"
                  style={{ border: '1px solid #E5E7EB' }}
                >
                  <div className="w-24 flex-shrink-0 overflow-hidden bg-gray-200">
                    <img
                      src={getImageUrl(article.image)}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      style={{ minHeight: '80px' }}
                    />
                  </div>
                  <div className="flex-1 p-3 flex flex-col gap-1 justify-center min-w-0">
                    <h3 className="font-outfit text-xs font-bold text-gray-900 leading-snug line-clamp-2 uppercase m-0">
                      {article.title}
                    </h3>
                    <span className="text-[10px] text-gray-500 font-outfit">{formatDate(article.published_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
