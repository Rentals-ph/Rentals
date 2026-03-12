'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { blogsApi } from '@/api'
import type { Blog, BlogComment } from '@/api/endpoints/blogs'
import { ASSETS } from '@/utils/assets'
import { FiHeart, FiMessageCircle, FiShare2, FiThumbsUp, FiReply } from 'react-icons/fi'
import { toast, ToastContainer } from '@/utils/toast'

export default function BlogDetailsPage() {
  const params = useParams()
  const id = (params?.id as string) || ''

  const [blogPost, setBlogPost] = useState<Blog | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [commentName, setCommentName] = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [comments, setComments] = useState<BlogComment[]>([])
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)
  const [loadingLikes, setLoadingLikes] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentLikes, setCommentLikes] = useState<Record<number, { liked: boolean; count: number }>>({})

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
        setLikesCount(data.likes_count || data.likes || 0)
        setCommentsCount(data.comments_count || data.comments || 0)
        
        // Fetch related articles
        const allBlogs = await blogsApi.getAll()
        const related = allBlogs
          .filter((b) => b.id !== data.id)
          .slice(0, 8)
        setRelatedArticles(related)

        // Fetch likes status
        if (data.id) {
          fetchLikesStatus(data.id)
          fetchComments(data.id)
        }
      } catch (err) {
        console.error('Error fetching blog:', err)
        setBlogPost(null)
      } finally {
        setLoading(false)
      }
    }
    fetchBlog()
  }, [id])

  const fetchLikesStatus = async (blogId: number) => {
    try {
      setLoadingLikes(true)
      const result = await blogsApi.getLikes(blogId)
      setLiked(result.liked)
      setLikesCount(result.likes_count)
    } catch (error) {
      console.error('Error fetching likes:', error)
    } finally {
      setLoadingLikes(false)
    }
  }

  const fetchComments = async (blogId: number) => {
    try {
      setLoadingComments(true)
      const fetchedComments = await blogsApi.getComments(blogId)
      setComments(fetchedComments)
      
      // Fetch likes for each comment
      const likesPromises = fetchedComments.map(async (comment) => {
        try {
          const likes = await blogsApi.getCommentLikes(blogId, comment.id)
          return { id: comment.id, ...likes }
        } catch {
          return { id: comment.id, liked: false, likes_count: 0 }
        }
      })
      
      // Also fetch likes for replies
      const replyLikesPromises = fetchedComments.flatMap(comment => 
        (comment.replies || []).map(async (reply) => {
          try {
            const likes = await blogsApi.getCommentLikes(blogId, reply.id)
            return { id: reply.id, ...likes }
          } catch {
            return { id: reply.id, liked: false, likes_count: 0 }
          }
        })
      )

      const allLikes = await Promise.all([...likesPromises, ...replyLikesPromises])
      const likesMap: Record<number, { liked: boolean; count: number }> = {}
      allLikes.forEach(like => {
        likesMap[like.id] = { liked: like.liked, count: like.likes_count }
      })
      setCommentLikes(likesMap)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLikeToggle = async () => {
    if (!blogPost?.id) return
    try {
      const result = await blogsApi.toggleLike(blogPost.id)
      setLiked(result.liked)
      setLikesCount(result.likes_count)
    } catch (error: any) {
      console.error('Error toggling like:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to like blog post'
      toast.error(errorMessage)
      
      // If rate limited, show a more user-friendly message
      if (error.response?.status === 429) {
        toast.error('Please wait a moment before liking again.')
      }
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blogPost?.id) return
    
    const content = replyingTo ? replyText.trim() : commentText.trim()
    if (!content) return
    
    if (!commentName.trim() || !commentEmail.trim()) {
      toast.error('Please provide your name and email')
      return
    }

    try {
      setSubmittingComment(true)
      const newComment = await blogsApi.postComment(blogPost.id, {
        content: content,
        name: commentName,
        email: commentEmail,
        parent_id: replyingTo || undefined,
      })
      
      toast.success(replyingTo ? 'Reply posted successfully' : 'Comment posted successfully')
      if (!replyingTo) {
        setCommentName('')
        setCommentEmail('')
        setCommentText('')
      }
      setReplyText('')
      setReplyingTo(null)
      
      // Refresh comments
      await fetchComments(blogPost.id)
      setCommentsCount(prev => prev + 1)
    } catch (error: any) {
      console.error('Error posting comment:', error)
      toast.error(error.response?.data?.message || 'Failed to post comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleReplyClick = (commentId: number) => {
    setReplyingTo(commentId)
    setReplyText('')
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setReplyText('')
  }

  const handleCommentLikeToggle = async (commentId: number) => {
    if (!blogPost?.id) return
    try {
      const result = await blogsApi.toggleCommentLike(blogPost.id, commentId)
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: { liked: result.liked, count: result.likes_count }
      }))
    } catch (error: any) {
      console.error('Error toggling comment like:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to like comment'
      toast.error(errorMessage)
      
      // If rate limited, show a more user-friendly message
      if (error.response?.status === 429) {
        toast.error('Please wait a moment before liking again.')
      }
    }
  }

  const formatDate = (value: string | null): string => {
    if (!value) return 'Date not available'
    const d = new Date(value)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.BLOG_IMAGE_1
    if (image.startsWith('http://') || image.startsWith('https://')) return image
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.replace(/^\//, '')}`
    }
    return image
  }

  const getCommentAvatar = (comment: BlogComment): string => {
    if (comment.user?.image_path) {
      return comment.user.image_path.startsWith('http') 
        ? comment.user.image_path 
        : `/api/${comment.user.image_path}`
    }
    return ASSETS.PLACEHOLDER_PROFILE
  }

  const getCommentName = (comment: BlogComment): string => {
    if (comment.user) {
      return `${comment.user.first_name} ${comment.user.last_name}`
    }
    return comment.name || 'Guest'
  }

  const paragraphs = blogPost?.content ? blogPost.content.split('\n\n').filter(Boolean) : []

  // Derived tags from category or static fallback
  const tags = blogPost?.category
    ? blogPost.category.split(',').map(t => t.trim()).filter(Boolean)
    : ['Pets', 'Property', 'Safety', 'Cleanliness']

  const renderComment = (comment: BlogComment, isReply = false) => {
    const commentLikeInfo = commentLikes[comment.id] || { liked: false, count: comment.likes_count || 0 }
    
    return (
      <div key={comment.id} className={isReply ? 'ml-8 mt-4' : ''}>
        <div className="flex gap-4 items-start">
          <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            <img
              src={getCommentAvatar(comment)}
              alt={getCommentName(comment)}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div className="flex flex-col flex-1 gap-1">
            <div className="flex items-center gap-2">
              <span className="font-outfit text-sm font-bold text-gray-900">{getCommentName(comment)}</span>
              <span className="font-outfit text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
            </div>
            <p className="font-outfit text-sm text-gray-600 leading-relaxed m-0">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleCommentLikeToggle(comment.id)}
                className={`flex items-center gap-1 text-xs font-outfit transition-colors ${
                  commentLikeInfo.liked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <FiThumbsUp className="w-4 h-4" />
                <span>{commentLikeInfo.count}</span>
              </button>
              {!isReply && (
                <button
                  onClick={() => handleReplyClick(comment.id)}
                  className="flex items-center gap-1 text-xs font-outfit text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <FiReply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              )}
            </div>
            
            {/* Reply form */}
            {replyingTo === comment.id && (
              <form onSubmit={handleCommentSubmit} className="mt-3 flex flex-col gap-2">
                {(!commentName || !commentEmail) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full px-3 py-2 text-sm text-gray-900 font-outfit bg-white outline-none focus:ring-2 focus:ring-[#266FFD]"
                      style={{ border: '1px solid #D1D5DB' }}
                    />
                    <input
                      type="email"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      placeholder="Your email"
                      required
                      className="w-full px-3 py-2 text-sm text-gray-900 font-outfit bg-white outline-none focus:ring-2 focus:ring-[#266FFD]"
                      style={{ border: '1px solid #D1D5DB' }}
                    />
                  </div>
                )}
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-sm text-gray-900 font-outfit bg-white outline-none focus:ring-2 focus:ring-[#266FFD] resize-vertical"
                  style={{ border: '1px solid #D1D5DB' }}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-4 py-2 bg-[#266FFD] text-white font-outfit font-semibold text-sm hover:bg-[#1a5dd8] transition-colors disabled:opacity-50"
                  >
                    {submittingComment ? 'Posting...' : 'Post Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReply}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-outfit font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ToastContainer />
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
                    <button
                      onClick={handleLikeToggle}
                      disabled={loadingLikes}
                      className={`flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                        liked ? 'text-red-600 hover:bg-white' : 'text-gray-700 hover:bg-white'
                      }`}
                    >
                      <FiHeart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      <span>{likesCount}</span>
                    </button>
                    <button className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors">
                      <FiMessageCircle className="w-4 h-4 text-blue-500" />
                      <span>{commentsCount}</span>
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
                    <span className="text-[#205ED7]">{commentsCount}</span>
                  </h2>

                  {loadingComments ? (
                    <div className="text-center py-8 text-gray-500">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No comments yet. Be the first to comment!</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {comments.map(comment => renderComment(comment))}
                    </div>
                  )}
                </section>

                {/* ── Comment form ── */}
                <section className="mt-8 pt-6" style={{ borderTop: '2px solid #E5E7EB' }}>
                  <h2 className="font-outfit text-lg sm:text-xl font-bold text-gray-900 mb-5 m-0">
                    {replyingTo ? 'Reply to Comment' : 'Submit a Comment'}
                  </h2>
                  <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4">
                    {!replyingTo && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-outfit text-sm text-gray-700">Your name</label>
                          <input
                            type="text"
                            value={commentName}
                            onChange={(e) => setCommentName(e.target.value)}
                            placeholder="Isaac Lacaylocay"
                            required={!replyingTo}
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
                            required={!replyingTo}
                            className="w-full px-4 py-3 text-sm text-gray-900 font-outfit bg-white outline-none focus:ring-2 focus:ring-[#266FFD]"
                            style={{ border: '1px solid #D1D5DB' }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-outfit text-sm text-gray-700">Your Review</label>
                      <textarea
                        value={replyingTo ? replyText : commentText}
                        onChange={(e) => replyingTo ? setReplyText(e.target.value) : setCommentText(e.target.value)}
                        placeholder={replyingTo ? "Write a reply..." : "This property I recommend to everyone"}
                        required
                        rows={5}
                        className="w-full px-4 py-3 text-sm text-gray-900 font-outfit bg-white outline-none focus:ring-2 focus:ring-[#266FFD] resize-vertical"
                        style={{ border: '1px solid #D1D5DB' }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submittingComment}
                        className="flex-1 py-3.5 bg-[#266FFD] text-white font-outfit font-semibold text-sm hover:bg-[#1a5dd8] transition-colors disabled:opacity-50"
                      >
                        {submittingComment ? 'Submitting...' : replyingTo ? 'Post Reply' : 'Submit Review'}
                      </button>
                      {replyingTo && (
                        <button
                          type="button"
                          onClick={handleCancelReply}
                          className="px-6 py-3.5 border border-gray-300 text-gray-700 font-outfit font-semibold text-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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
