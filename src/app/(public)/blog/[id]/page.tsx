'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import { ASSETS } from '@/utils/assets'
import { FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi'

export default function BlogDetailsPage() {
  const params = useParams()
  const id = (params?.id as string) || ''

  const [blogPost, setBlogPost] = useState<Blog | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [commentName, setCommentName] = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (!id) return
    const fetchBlog = async () => {
      try {
        setLoading(true)
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
          .filter((b) => b.id !== data.id)
          .slice(0, 8)
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

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.BLOG_IMAGE_1
    if (image.startsWith('http://') || image.startsWith('https://')) return image
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.replace(/^\//, '')}`
    }
    return image
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentName || !commentEmail || !commentText) return
    setCommentName('')
    setCommentEmail('')
    setCommentText('')
  }

  const paragraphs = blogPost?.content ? blogPost.content.split('\n\n').filter(Boolean) : []

  // Derived tags from category or static fallback
  const tags = blogPost?.category
    ? blogPost.category.split(',').map(t => t.trim()).filter(Boolean)
    : ['Pets', 'Property', 'Safety', 'Cleanliness']

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="w-full page-x py-6 sm:py-8">
        <div className="page-w">
        {loading ? (
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
              <div className="flex flex-col gap-4">
                <div className="aspect-[16/9] bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded" />)}
              </div>
            </div>
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
          <>
            {/* ── Breadcrumb ── */}
            <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
              <Link href="/blog" className="text-gray-500 hover:text-[#205ED7] font-outfit transition-colors">
                Blog
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-[#205ED7] font-outfit truncate max-w-xs sm:max-w-none">
                {blogPost.title}
              </span>
            </nav>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-10 items-start">

              {/* ══ LEFT: main article ══ */}
              <section className="flex flex-col gap-0">

                {/* Hero image with engagement icons */}
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(blogPost.image)}
                    alt={blogPost.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Engagement icons — bottom left */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10">
                    <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                      <FiHeart className="w-4 h-4 text-red-500" />
                      <span>{blogPost.likes ?? 374}</span>
                    </button>
                    <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                      <FiMessageCircle className="w-4 h-4 text-blue-500" />
                      <span>{blogPost.comments ?? 23}</span>
                    </button>
                    <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                      <FiShare2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Title + author */}
                <div className="mt-5 mb-4 flex flex-col gap-3">
                  <h1 className="font-outfit text-2xl sm:text-3xl font-bold text-gray-900 leading-tight m-0">
                    {blogPost.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <span className="text-gray-500 font-semibold text-xs">
                        {blogPost.author?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 font-outfit">
                      By {blogPost.author || 'Anonymous'}
                    </span>
                  </div>
                </div>

                {/* Article body */}
                <article className="flex flex-col gap-4">
                  {paragraphs.length > 0 ? (
                    paragraphs.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="font-outfit text-sm sm:text-base leading-relaxed text-gray-700 text-justify m-0"
                      >
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="font-outfit text-sm sm:text-base leading-relaxed text-gray-700 text-justify m-0">
                      {blogPost.excerpt || 'No content available for this article.'}
                    </p>
                  )}
                </article>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {tags.map(tag => (
                    <Link
                      key={tag}
                      href={`/blog/category/${tag.toLowerCase()}`}
                      className="px-4 py-1.5 text-sm font-outfit text-gray-600 hover:bg-gray-100 transition-colors"
                      style={{ border: '1px solid #D1D5DB' }}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>

                {/* ── Comments ── */}
                <section className="mt-8 pt-6" style={{ borderTop: '2px solid #E5E7EB' }}>
                  <h2 className="font-outfit text-lg sm:text-xl font-bold text-gray-900 mb-5 m-0">
                    Comments{' '}
                    <span className="text-[#205ED7]">{blogPost.comments ?? 2}</span>
                  </h2>

                  {/* Static demo comments */}
                  <div className="flex flex-col gap-6">
                    {[
                      { name: 'Isaac Lacaylocay', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis mollis et sem sed sollicitudin. Donec non odio neque. Aliquam hendrerit sollicitudin purus, quis rutrum mi accumsan nec. Quisque bibendum orci ac nibh facilisis, at malesuada orci congue. Nullam tempus sollicitudin cursus. Ut et adipiscing erat. Curabitur this is a text link libero tempus congue......' },
                      { name: 'Isaac Lacaylocay', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis mollis et sem sed sollicitudin. Donec non odio neque. Aliquam hendrerit sollicitudin purus, quis rutrum mi accumsan nec. Quisque bibendum orci ac nibh facilisis, at malesuada orci congue. Nullam tempus sollicitudin cursus. Ut et adipiscing erat. Curabitur this is a text link libero tempus congue......' },
                    ].map((comment, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                          <img
                            src={ASSETS.PLACEHOLDER_PROFILE}
                            alt={comment.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                        <div className="flex flex-col flex-1 gap-1">
                          <span className="font-outfit text-sm font-bold text-gray-900">{comment.name}</span>
                          <p className="font-outfit text-sm text-gray-600 leading-relaxed m-0">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── Comment form ── */}
                <section className="mt-8 pt-6" style={{ borderTop: '2px solid #E5E7EB' }}>
                  <h2 className="font-outfit text-lg sm:text-xl font-bold text-gray-900 mb-5 m-0">
                    Submit a Comment
                  </h2>
                  <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-outfit text-sm text-gray-700">Your name</label>
                        <input
                          type="text"
                          value={commentName}
                          onChange={(e) => setCommentName(e.target.value)}
                          placeholder="Isaac Lacaylocay"
                          required
                          className="w-full px-4 py-3 text-sm text-gray-900 font-outfit bg-white outline-none focus:ring-2 focus:ring-[#266FFD]"
                          style={{ border: '1px solid #D1D5DB' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-outfit text-sm text-gray-700">Your email</label>
                        <input
                          type="email"
                          value={commentEmail}
                          onChange={(e) => setCommentEmail(e.target.value)}
                          placeholder="Isaaclocaylocay@gmail.com"
                          required
                          className="w-full px-4 py-3 text-sm text-gray-900 font-outfit bg-white outline-none focus:ring-2 focus:ring-[#266FFD]"
                          style={{ border: '1px solid #D1D5DB' }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-outfit text-sm text-gray-700">Your Review</label>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="This property I recommend to everyone"
                        required
                        rows={5}
                        className="w-full px-4 py-3 text-sm text-gray-900 font-outfit bg-white outline-none focus:ring-2 focus:ring-[#266FFD] resize-vertical"
                        style={{ border: '1px solid #D1D5DB' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#266FFD] text-white font-outfit font-semibold text-sm hover:bg-[#1a5dd8] transition-colors"
                    >
                      Submit Review
                    </button>
                  </form>
                </section>

              </section>

              {/* ══ RIGHT: related articles sidebar ══ */}
              <aside className="hidden lg:flex flex-col gap-3">
                {relatedArticles.length > 0 ? (
                  relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/blog/${article.id}`}
                      className="flex gap-0 bg-white overflow-hidden hover:shadow-md transition-shadow group"
                      style={{ border: '1px solid #E5E7EB' }}
                    >
                      {/* Thumbnail */}
                      <div className="w-[110px] flex-shrink-0 overflow-hidden">
                        <img
                          src={getImageUrl(article.image)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          style={{ minHeight: '90px' }}
                        />
                      </div>
                      {/* Text */}
                      <div className="flex-1 p-3 flex flex-col gap-1.5 justify-center min-w-0">
                        <h3 className="font-outfit text-xs font-bold text-gray-900 leading-snug line-clamp-2 m-0">
                          {article.title}
                        </h3>
                        <p className="font-outfit text-[11px] text-gray-500 leading-relaxed line-clamp-3 m-0">
                          {article.excerpt || article.content?.substring(0, 80) + '...'}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    variant="empty"
                    title="No related articles"
                    description="We couldn't find other articles yet."
                    compact
                  />
                )}
              </aside>

            </div>

            {/* Mobile related articles */}
            <section className="mt-8 pt-6 lg:hidden" style={{ borderTop: '2px solid #E5E7EB' }}>
              <h2 className="font-outfit text-lg font-bold text-gray-900 mb-4 m-0">Related Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.slice(0, 4).map(article => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.id}`}
                    className="flex gap-0 bg-white overflow-hidden hover:shadow-md transition-shadow group"
                    style={{ border: '1px solid #E5E7EB' }}
                  >
                    <div className="w-24 flex-shrink-0 overflow-hidden">
                      <img
                        src={getImageUrl(article.image)}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        style={{ minHeight: '80px' }}
                      />
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-1 justify-center min-w-0">
                      <h3 className="font-outfit text-xs font-bold text-gray-900 leading-snug line-clamp-2 m-0">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
