'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import { ASSETS } from '@/utils/assets'

export default function BlogDetailsPage() {
  const params = useParams()
  const id = (params?.id as string) || ''

  const [blogPost, setBlogPost] = useState<Blog | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [isPortraitImage, setIsPortraitImage] = useState(false)
  const [commentName, setCommentName] = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (!id) return

    const fetchBlog = async () => {
      try {
        setLoading(true)
        setIsPortraitImage(false)

        let data: Blog
        try {
          data = await blogsApi.getById(id)
        } catch (err: any) {
          if (err?.response?.status === 404) {
            const allBlogs = await blogsApi.getAll()
            const found = allBlogs.find((b: any) => (b as any).slug === id || String(b.id) === id)
            if (!found) throw new Error('Blog not found')
            data = found
          } else {
            throw err
          }
        }

        setBlogPost(data)

        const allBlogs = await blogsApi.getAll()
        const related = allBlogs
          .filter((b) => b.id !== data.id && b.category === data.category)
          .slice(0, 5)
        setRelatedArticles(related)
      } catch (err) {
        console.error('Error fetching blog:', err)
        setBlogPost(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [id])

  const formatDate = (value: string | null): string => {
    if (!value) return 'Date not available'
    const d = new Date(value)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatReadTime = (minutes: number): string => `${minutes} min read`

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.BLOG_IMAGE_1
    if (image.startsWith('http://') || image.startsWith('https://')) return image
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.replace(/^\//, '')}`
    }
    return image
  }

  const handleImageLoad = (e: any) => {
    const img = e.currentTarget as HTMLImageElement
    setIsPortraitImage(img.naturalHeight > img.naturalWidth)
  }

  const handleCommentSubmit = (e: any) => {
    e.preventDefault()
    if (!commentName || !commentEmail || !commentText) return
    setCommentName('')
    setCommentEmail('')
    setCommentText('')
  }

  const paragraphs = blogPost?.content ? blogPost.content.split('\n\n') : []

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="w-full px-4 sm:px-6 md:px-10 lg:px-[150px] py-6 sm:py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-sm sm:text-base text-gray-600">Loading blog post...</p>
          </div>
        ) : !blogPost ? (
          <EmptyState
            variant="notFound"
            title="Blog post not found"
            description="This article may have been removed or the link might be incorrect."
            action={
              <EmptyStateAction href="/blog" primary>
                Back to blog
              </EmptyStateAction>
            }
          />
        ) : (
          <div className="mx-auto w-full max-w-[1200px]">
            {/* Breadcrumb */}
            <nav
              className="pb-3 sm:pb-4 flex items-center gap-2 text-xs sm:text-sm flex-wrap"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Home
              </Link>
              <span className="text-gray-400">&gt;</span>
              <Link href="/blog" className="text-blue-600 hover:text-blue-800">
                Blog
              </Link>
              <span className="text-gray-400">&gt;</span>
              <span
                className="text-gray-600 truncate max-w-[180px] sm:max-w-none"
                title={blogPost.title}
              >
                {blogPost.title}
              </span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.4fr)_minmax(260px,1fr)] gap-6 lg:gap-10 items-start">
              {/* Left: main article */}
              <section className="flex flex-col gap-5 sm:gap-6 md:gap-7">
                {/* Title + meta */}
                <header className="flex flex-col gap-3 sm:gap-4">
                  <h1 className="font-outfit text-lg xs:text-xl sm:text-3xl md:text-4xl font-bold text-black leading-tight">
                    {blogPost.title}
                  </h1>
                  <div className="flex flex-wrap gap-3 sm:gap-5 items-center text-xs sm:text-sm text-gray-600 font-outfit">
                    <span>{blogPost.author}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    <span>{formatDate(blogPost.published_at)}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    <span>{formatReadTime(blogPost.read_time)}</span>
                  </div>
                </header>

                {/* Hero image */}
                <div
                  className={
                    isPortraitImage
                      ? 'w-full max-w-full rounded overflow-hidden border border-gray-200 bg-black/5 flex items-center justify-center'
                      : 'w-full max-w-full rounded overflow-hidden h-[220px] xs:h-[260px] sm:h-[300px] md:h-[360px] lg:h-[420px] border border-gray-200 bg-black/5'
                  }
                >
                  <img
                    src={getImageUrl(blogPost.image)}
                    alt={blogPost.title}
                    onLoad={handleImageLoad}
                    className={
                      isPortraitImage
                        ? 'max-h-[420px] w-auto object-contain'
                        : 'w-full h-full object-cover'
                    }
                  />
                </div>

                {/* Body */}
                <article className="space-y-4 sm:space-y-5">
                  {paragraphs.map((paragraph, idx) => (
                    <p
                      key={idx}
                      className="font-outfit text-sm sm:text-base leading-relaxed text-gray-800 text-left sm:text-justify"
                    >
                      {paragraph}
                    </p>
                  ))}
                </article>

                {/* Comments list */}
                <section className="mt-4 sm:mt-6 pt-4 border-t-2 border-gray-200">
                  <h2 className="font-outfit text-lg sm:text-xl md:text-2xl font-bold text-black mb-3 sm:mb-5">
                    Comments
                  </h2>
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex gap-3 sm:gap-4 items-start">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-1">
                        <div className="font-outfit text-sm sm:text-base font-semibold text-black">
                          Pat M.
                        </div>
                        <p className="font-outfit text-xs sm:text-sm text-gray-600 leading-relaxed">
                          Great article! The tip about screening tenants is especially important. I
                          learned this the hard way in my first year of property management.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Comment form */}
                <section className="mt-5 sm:mt-8 pt-5 sm:pt-8 border-t-2 border-gray-200">
                  <h2 className="font-outfit text-lg sm:text-xl md:text-2xl font-bold text-black mb-3 sm:mb-4">
                    Submit a Comment
                  </h2>
                  <form
                    onSubmit={handleCommentSubmit}
                    className="space-y-3 sm:space-y-4 max-w-[720px]"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-outfit text-xs sm:text-sm font-medium text-gray-700">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={commentName}
                          onChange={(e) => setCommentName(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-outfit text-xs sm:text-sm font-medium text-gray-700">
                          Your Email
                        </label>
                        <input
                          type="email"
                          value={commentEmail}
                          onChange={(e) => setCommentEmail(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-outfit text-xs sm:text-sm font-medium text-gray-700">
                        Your Message
                      </label>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[120px] resize-vertical"
                        placeholder="Share your thoughts about this article..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 bg-blue-600 text-white font-outfit font-semibold text-sm sm:text-base rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                      Submit Review
                    </button>
                  </form>
                </section>

                {/* Related (mobile / tablet) */}
                <section className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t-2 border-gray-200 lg:hidden">
                  <h2 className="font-outfit text-lg sm:text-xl md:text-2xl font-bold text-black mb-3 sm:mb-5">
                    Related Articles
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {relatedArticles.length ? (
                      relatedArticles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/blog/${article.id}`}
                          className="flex flex-col bg-white rounded overflow-hidden shadow-sm border border-gray-200 hover:-translate-y-1 hover:shadow-md transition-all"
                        >
                          <div className="w-full h-36 xs:h-40 sm:h-44 overflow-hidden">
                            <img
                              src={getImageUrl(article.image)}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3 sm:p-4 flex flex-col gap-1.5">
                            <div className="flex gap-2 items-center text-xs text-gray-600">
                              <span className="font-outfit font-medium text-green-600">
                                {article.category}
                              </span>
                              <span>{formatReadTime(article.read_time)}</span>
                            </div>
                            <h3 className="font-outfit text-sm sm:text-base font-semibold text-black line-clamp-2">
                              {article.title}
                            </h3>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <EmptyState
                        variant="empty"
                        title="No related articles"
                        description="We couldn't find other articles in this category yet."
                        compact
                      />
                    )}
                  </div>
                </section>
              </section>

              {/* Right: sidebar related list (desktop) */}
              <aside className="hidden lg:flex flex-col gap-4 pt-1">
                <h2 className="font-outfit text-lg md:text-xl font-bold text-black">Related Articles</h2>
                <div className="flex flex-col gap-3">
                  {relatedArticles.length ? (
                    relatedArticles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/blog/${article.id}`}
                        className="flex bg-white rounded border border-gray-200 shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all min-h-[88px]"
                      >
                        <div className="w-[120px] xl:w-[140px] h-full flex-shrink-0">
                          <img
                            src={getImageUrl(article.image)}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 px-3 py-2.5 flex flex-col justify-center gap-1 min-w-0">
                          <span className="font-outfit text-[11px] text-gray-500 line-clamp-1">
                            {formatReadTime(article.read_time)}
                          </span>
                          <h3 className="font-outfit text-xs md:text-sm font-semibold text-black leading-snug line-clamp-2">
                            {article.title}
                          </h3>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <EmptyState
                      variant="empty"
                      title="No related articles"
                      description="We couldn't find other articles in this category yet."
                      compact
                    />
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

