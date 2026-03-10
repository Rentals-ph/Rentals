'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import PageHeader from '@/components/layout/PageHeader'
import { EmptyState, EmptyStateAction } from '@/components/common'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import { ASSETS, getAsset } from '@/utils/assets'
// import './page.css' // Removed - converted to Tailwind

export default function BlogDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [blogPost, setBlogPost] = useState<Blog | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [isPortraitImage, setIsPortraitImage] = useState(false)

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setIsPortraitImage(false) // Reset image orientation when loading new blog
        
        // Support both numeric ID and slug - backend handles both
        let data: Blog
        try {
          // Try to use the ID/slug directly (backend supports both)
          data = await blogsApi.getById(id)
        } catch (error: any) {
          // If direct fetch fails, try fetching all and finding by slug
          if (error?.response?.status === 404) {
            const allBlogs = await blogsApi.getAll()
            const blog = allBlogs.find((b: any) => (b as any).slug === id || b.id.toString() === id)
            if (!blog) {
              throw new Error('Blog not found')
            }
            data = blog
          } else {
            throw error
          }
        }
        
        setBlogPost(data)
        
        // Fetch related articles (other blogs in the same category)
        const allBlogs = await blogsApi.getAll()
        const related = allBlogs
          .filter(blog => blog.id !== data.id && blog.category === data.category)
          .slice(0, 3)
        setRelatedArticles(related)
      } catch (error: any) {
        console.error('Error fetching blog:', error)
        // Set blogPost to null to trigger 404 state
        setBlogPost(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [id])

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Date not available'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatReadTime = (minutes: number): string => {
    return `${minutes} min read`
  }

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.BLOG_IMAGE_1
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.startsWith('/') ? image.slice(1) : image}`
    }
    return image
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const width = img.naturalWidth
    const height = img.naturalHeight
    setIsPortraitImage(height > width)
  }

  const comments = [
    {
      id: 1,
      author: 'Pat M.',
      avatar: ASSETS.PLACEHOLDER_PROPERTY_MAIN,
      text: 'Great article! The tip about screening tenants is especially important. I learned this the hard way in my first year of property management.'
    },
    {
      id: 2,
      author: 'Pat M.',
      avatar: ASSETS.PLACEHOLDER_PROPERTY_MAIN,
      text: 'Great article! The tip about screening tenants is especially important. I learned this the hard way in my first year of property management.'
    }
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col flex-1 overflow-x-hidden"> {/* blog-details-page */}
      <main className="w-full px-4 sm:px-6 md:px-10 lg:px-[150px] py-5 sm:py-8 md:py-12 overflow-x-hidden max-w-[100vw]"> {/* blog-details-main-content */}
        {loading ? (
          <div className="text-center p-6 sm:p-10 min-h-[200px] flex items-center justify-center">
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
          <div className="mx-auto w-full max-w-full min-w-0"> {/* blog-details-layout */}
            {/* Breadcrumb - visible on both mobile and desktop (same pattern as agents/[id], news/[id]) */}
            <nav className="py-3 sm:py-4 flex items-center gap-2 text-xs sm:text-sm flex-wrap" aria-label="Breadcrumb">
              <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
              <span className="text-gray-400" aria-hidden="true">&gt;</span>
              <Link href="/blog" className="text-blue-600 hover:text-blue-800">Blog</Link>
              <span className="text-gray-400" aria-hidden="true">&gt;</span>
              <span className="text-gray-600 truncate max-w-[140px] sm:max-w-none" title={blogPost.title}>{blogPost.title}</span>
            </nav>
            <div className="flex flex-col gap-5 sm:gap-6 md:gap-7.5"> {/* blog-details-article-column */}
              <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-5"> {/* blog-details-header */}
                <h1 className="font-outfit text-lg xs:text-xl sm:text-3xl md:text-4xl font-bold text-black m-0 leading-tight break-words">{blogPost.title}</h1> {/* blog-details-title */}
                <div className="flex flex-wrap gap-2 sm:gap-5 items-center"> {/* blog-details-meta */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 font-outfit text-xs sm:text-sm shrink-0"> {/* blog-details-author */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 shrink-0">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="truncate max-w-[140px] xs:max-w-none">{blogPost.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 font-outfit text-xs sm:text-sm shrink-0"> {/* blog-details-date */}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 shrink-0">
                      <path d="M6 2V6M14 2V6M3 10H17M5 4H15C16.1046 4 17 4.89543 17 6V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{formatDate(blogPost.published_at)}</span>
                  </div>
                </div>
              </div>

              {isPortraitImage ? (
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,350px)_1fr] gap-4 sm:gap-5 lg:gap-6 items-start mt-0 min-w-0"> {/* blog-details-portrait-container */}
                  <div className="flex flex-col gap-4"> {/* blog-details-portrait-left */}
                    <div className="w-full mb-0 rounded overflow-hidden max-w-full"> {/* blog-details-featured-image portrait-layout */}
                      <img 
                        src={getImageUrl(blogPost.image)} 
                        alt={blogPost.title}
                        onLoad={handleImageLoad}
                        className="w-full h-auto max-w-full object-contain block"
                      />
                    </div>
                    <div className="w-full py-3 sm:py-4 border-t border-b border-gray-200 flex flex-col xs:flex-row justify-between items-stretch xs:items-center gap-3 xs:gap-0 flex-wrap"> {/* blog-details-social portrait-social */}
                      <div className="flex gap-2 sm:gap-6 items-center w-auto justify-start flex-shrink-0"> {/* blog-details-social-left */}
                        <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] text-[#E74C3C] touch-manipulation"> {/* social-btn social-like */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
                            <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{blogPost.likes || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] text-[#3498DB] touch-manipulation"> {/* social-btn social-comment */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{blogPost.comments || 0}</span>
                        </button>
                      </div>
                      <div className="flex gap-1 sm:gap-3 items-center w-auto justify-start xs:mt-0 flex-wrap"> {/* blog-details-social-right */}
                        <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] touch-manipulation"> {/* social-btn social-share */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
                            <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12549 15.0077 5.24919 15.0227 5.37063L8.08261 9.79866C7.54305 9.29212 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.7079 8.08261 14.2013L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.457 16.2921 15.9174 16.7987L8.97727 12.3706C8.99231 12.2492 9 12.1255 9 12C9 11.8745 8.99231 11.7508 8.97727 11.6294L15.9174 7.20134C16.457 7.70788 17.1911 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] touch-manipulation"> {/* social-btn social-email */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
                            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="L22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] touch-manipulation"> {/* social-btn social-whatsapp */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
                            <path d="M17.472 14.382C17.292 14.208 15.168 12.458 14.668 12.208C14.168 11.958 13.918 11.958 13.668 12.208C13.418 12.458 12.418 13.458 12.168 13.708C11.918 13.958 11.668 13.958 11.418 13.708C11.168 13.458 9.41797 11.708 8.91797 11.208C8.41797 10.708 8.16797 10.458 8.41797 10.208C8.66797 9.958 9.16797 9.458 9.41797 9.208C9.66797 8.958 9.66797 8.708 9.41797 8.458C9.16797 8.208 8.66797 7.458 8.41797 7.208C8.16797 6.958 7.91797 6.958 7.66797 7.208C7.41797 7.458 6.41797 8.458 6.16797 8.708C5.91797 8.958 5.66797 9.208 5.91797 9.458C6.16797 9.708 7.16797 10.958 8.16797 12.208C9.16797 13.458 10.168 14.458 10.418 14.708C10.668 14.958 10.918 15.208 11.168 15.208C11.418 15.208 11.668 15.208 11.918 15.208C12.168 15.208 12.418 15.208 12.668 15.208C12.918 15.208 13.168 15.208 13.418 15.208C13.668 15.208 13.918 15.208 14.168 15.208C14.418 15.208 14.668 15.208 14.918 15.208C15.168 15.208 15.418 15.208 15.668 15.208C15.918 15.208 16.168 15.208 16.418 15.208C16.668 15.208 16.918 15.208 17.168 15.208C17.418 15.208 17.668 15.208 17.918 15.208C18.168 15.208 18.418 15.208 18.668 15.208C18.918 15.208 19.168 15.208 19.418 15.208C19.668 15.208 19.918 15.208 20.168 15.208C20.418 15.208 20.668 15.208 20.918 15.208" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0"> {/* blog-details-portrait-right */}
                    <div className="relative w-full min-w-0"> {/* blog-details-content portrait-content */}
                {blogPost.content.split('\n\n').map((paragraph, index) => (
                  <div key={index}>
                    <p className="font-outfit text-sm sm:text-base leading-relaxed text-gray-800 m-0 mb-4 sm:mb-5 text-left sm:text-justify break-words"> {/* blog-details-paragraph */}
                      {paragraph}
                    </p>
                  </div>
                ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-full max-w-full mb-4 sm:mb-7.5 h-[200px] xs:h-[260px] sm:h-[280px] md:h-[320px] lg:h-[400px] overflow-hidden rounded"> {/* blog-details-featured-image landscape-layout */}
                    <img 
                      src={getImageUrl(blogPost.image)} 
                      alt={blogPost.title}
                      onLoad={handleImageLoad}
                      className="w-full h-full max-w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center py-3 sm:py-4 border-t border-b border-gray-200 gap-3 xs:gap-0 md:flex-row flex-wrap"> {/* blog-details-social */}
                    <div className="flex gap-2 sm:gap-6 items-center flex-shrink-0"> {/* blog-details-social-left */}
                      <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] text-[#E74C3C] touch-manipulation"> {/* social-btn social-like */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                          <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{blogPost.likes || 0}</span>
                      </button>
                      <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] text-[#3498DB] touch-manipulation"> {/* social-btn social-comment */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{blogPost.comments || 0}</span>
                      </button>
                    </div>
                    <div className="flex gap-1 sm:gap-3 items-center flex-wrap"> {/* blog-details-social-right */}
                      <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] touch-manipulation"> {/* social-btn social-share */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                          <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12549 15.0077 5.24919 15.0227 5.37063L8.08261 9.79866C7.54305 9.29212 6.80891 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15C6.80891 15 7.54305 14.7079 8.08261 14.2013L15.0227 18.6294C15.0077 18.7508 15 18.8745 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.1911 16 16.457 16.2921 15.9174 16.7987L8.97727 12.3706C8.99231 12.2492 9 12.1255 9 12C9 11.8745 8.99231 11.7508 8.97727 11.6294L15.9174 7.20134C16.457 7.70788 17.1911 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] touch-manipulation"> {/* social-btn social-email */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="L22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button className="flex items-center gap-1.5 sm:gap-2 bg-transparent border-0 text-gray-600 font-outfit text-xs sm:text-sm cursor-pointer py-1.5 px-2 sm:py-2 sm:px-3 rounded transition-all duration-200 hover:bg-gray-100 hover:text-[#002D84] touch-manipulation"> {/* social-btn social-whatsapp */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path d="M17.472 14.382C17.292 14.208 15.168 12.458 14.668 12.208C14.168 11.958 13.918 11.958 13.668 12.208C13.418 12.458 12.418 13.458 12.168 13.708C11.918 13.958 11.668 13.958 11.418 13.708C11.168 13.458 9.41797 11.708 8.91797 11.208C8.41797 10.708 8.16797 10.458 8.41797 10.208C8.66797 9.958 9.16797 9.458 9.41797 9.208C9.66797 8.958 9.66797 8.708 9.41797 8.458C9.16797 8.208 8.66797 7.458 8.41797 7.208C8.16797 6.958 7.91797 6.958 7.66797 7.208C7.41797 7.458 6.41797 8.458 6.16797 8.708C5.91797 8.958 5.66797 9.208 5.91797 9.458C6.16797 9.708 7.16797 10.958 8.16797 12.208C9.16797 13.458 10.168 14.458 10.418 14.708C10.668 14.958 10.918 15.208 11.168 15.208C11.418 15.208 11.668 15.208 11.918 15.208C12.168 15.208 12.418 15.208 12.668 15.208C12.918 15.208 13.168 15.208 13.418 15.208C13.668 15.208 13.918 15.208 14.168 15.208C14.418 15.208 14.668 15.208 14.918 15.208C15.168 15.208 15.418 15.208 15.668 15.208C15.918 15.208 16.168 15.208 16.418 15.208C16.668 15.208 16.918 15.208 17.168 15.208C17.418 15.208 17.668 15.208 17.918 15.208C18.168 15.208 18.418 15.208 18.668 15.208C18.918 15.208 19.168 15.208 19.418 15.208C19.668 15.208 19.918 15.208 20.168 15.208C20.418 15.208 20.668 15.208 20.918 15.208" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="relative min-w-0"> {/* blog-details-content */}
                    {blogPost.content.split('\n\n').map((paragraph, index) => (
                      <div key={index}>
                        <p className="font-outfit text-sm sm:text-base leading-relaxed text-gray-800 m-0 mb-4 sm:mb-5 text-left sm:text-justify break-words"> {/* blog-details-paragraph */}
                          {paragraph}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

            <div className="mt-4 sm:mt-5 pt-4 sm:pt-0 border-t-2 border-gray-200"> {/* blog-details-comments */}
              <h2 className="font-outfit text-lg sm:text-xl md:text-2xl font-bold text-black m-0 mb-3 sm:mb-6">Comments</h2> {/* blog-details-comments-title */}
              <div className="flex flex-col gap-3 sm:gap-6"> {/* blog-details-comments-list */}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 sm:gap-4 items-start min-w-0"> {/* blog-details-comment */}
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0"> {/* comment-avatar */}
                      <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1 sm:gap-2 min-w-0 overflow-hidden"> {/* comment-content */}
                      <div className="font-outfit text-xs sm:text-base font-semibold text-black">{comment.author}</div> {/* comment-author */}
                      <div className="font-outfit text-xs sm:text-sm leading-relaxed text-gray-600 break-words">{comment.text}</div> {/* comment-text */}
                      <a href="#" className="font-outfit text-sm text-[#002D84] no-underline self-start transition-colors duration-200 hover:text-[#FE8E0A]">Reply</a> {/* comment-reply */}
                    </div>
                  </div>
                ))}
              </div>
            </div>

              <div className="mt-5 sm:mt-10 pt-5 sm:pt-10 border-t-2 border-gray-200"> {/* blog-details-related */}
                <h2 className="font-outfit text-lg sm:text-xl md:text-2xl font-bold text-black m-0 mb-3 sm:mb-6">Related Articles</h2> {/* blog-details-related-title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"> {/* blog-details-related-grid */}
                  {relatedArticles.length > 0 ? (
                    relatedArticles.map((article) => (
                      <Link key={article.id} href={`/blog/${article.id}`} className="flex flex-col bg-white rounded overflow-hidden shadow-sm no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-md h-full min-w-0 active:opacity-90"> {/* blog-details-related-card */}
                        <div className="w-full h-36 xs:h-44 sm:h-56 md:h-64 overflow-hidden flex-shrink-0"> {/* related-card-image */}
                          <img src={getImageUrl(article.image)} alt={article.title} className="w-full h-full max-w-full object-cover transition-transform duration-300 hover:scale-105" />
                        </div>
                        <div className="p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2 flex-1 min-h-[100px] sm:min-h-[140px]"> {/* related-card-content */}
                          <div className="flex gap-2 items-center"> {/* related-card-meta */}
                            <span className="font-outfit text-xs font-medium text-[#32b241]">{article.category}</span> {/* related-card-category */}
                            <span className="font-outfit text-xs text-gray-600">{formatReadTime(article.read_time)}</span> {/* related-card-read-time */}
                          </div>
                          <h3 className="font-outfit text-sm sm:text-base font-semibold text-black m-0 leading-snug line-clamp-2">{article.title}</h3> {/* related-card-title */}
                          <span className="font-outfit text-sm font-semibold text-[#002D84] mt-2 transition-colors duration-200 hover:text-[#FE8E0A]">Read More →</span> {/* related-card-link */}
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
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

