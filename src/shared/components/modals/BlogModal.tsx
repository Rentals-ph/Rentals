'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { blogsApi } from '@/api'
import type { CreateBlogData } from '@/api'
import { toast, ToastContainer } from '@/shared/utils/toast'

const TARGET_PLATFORMS = [
  'Apply Na',
  'Bayanihan',
  'Faceofmind',
  'fhiglobal',
  'FilipinoHomes',
  'HomesPH',
  'RentalsPH',
  'PropertyPH',
  'RealEstatePH',
  'ManilaHomes',
]

const CATEGORIES = [
  'Real Estate',
  'Lifestyle',
  'Investment',
  'Tips & Advice',
  'Market News',
  'Community',
  'Culture',
]

const COUNTRIES = ['Philippines', 'Australia', 'USA', 'Canada', 'UK', 'UAE', 'Singapore']

interface SimpleBlogModalProps {
  onClose?: () => void
}

export function SimpleBlogModal({ onClose }: SimpleBlogModalProps) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [country, setCountry] = useState('Philippines')
  const [author, setAuthor] = useState('HOMESPH NEWS')
  const [urlSlug, setUrlSlug] = useState('')
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0])
  const [publishTime, setPublishTime] = useState('14:30')
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const togglePlatform = (platform: string) => {
    setTargetPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform],
    )
  }

  const buildContentBlocks = () => {
    return [
      {
        id: '1',
        type: 'text',
        content: { text: content },
      },
    ]
  }

  const handleDone = () => {
    if (onClose) {
      onClose()
    } else {
      router.push('/admin/blogs')
    }
  }

  const saveBlog = async (publish: boolean) => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!content.trim()) {
      toast.error('Please enter content')
      return
    }

    try {
      setIsSaving(true)

      const contentBlocks = buildContentBlocks()
      const publishDateTime = new Date(`${publishDate}T${publishTime}`)

      const blogData: CreateBlogData = {
        title: title.trim(),
        content: JSON.stringify(contentBlocks),
        excerpt: summary,
        category,
        author,
        published_at: publish ? publishDateTime.toISOString() : null,
        url_slug: urlSlug,
        country,
        publish_date: publishDate,
        publish_time: publishTime,
        target_platforms: targetPlatforms,
        content_blocks: contentBlocks as any,
      }

      await blogsApi.create(blogData)

      toast.success(publish ? 'Blog published successfully' : 'Draft saved successfully')
      handleDone()
    } catch (error: any) {
      console.error('Error saving blog:', error)
      toast.error(error?.response?.data?.message || 'Failed to save blog')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">Create Blog</h2>
              <p className="text-xs text-gray-500">Use a simple form to quickly publish a blog.</p>
            </div>
            <button
              type="button"
              onClick={handleDone}
              className="rounded-full px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Title & Summary */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter title"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary / Abstract</label>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Short summary shown in listings..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your blog content here..."
                rows={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Meta Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Author & Slug */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={urlSlug}
                  onChange={e => setUrlSlug(e.target.value)}
                  placeholder="url-slug"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Publish date/time */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={e => setPublishDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publish Time</label>
                <input
                  type="time"
                  value={publishTime}
                  onChange={e => setPublishTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Target platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Platforms</label>
              <div className="flex flex-wrap gap-2">
                {TARGET_PLATFORMS.map(platform => {
                  const active = targetPlatforms.includes(platform)
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {platform}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-3">
            <button
              type="button"
              onClick={handleDone}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveBlog(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveBlog(true)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

