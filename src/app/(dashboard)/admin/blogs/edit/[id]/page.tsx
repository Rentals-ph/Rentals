'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from '@/features/dashboard'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import { toast, ToastContainer } from '@/utils/toast'
import { FiArrowLeft, FiImage, FiSave } from 'react-icons/fi'

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const blogId = parseInt(id)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    author: '',
    image: null as File | null,
    published_at: new Date().toISOString().split('T')[0],
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isNaN(blogId)) {
      toast.error('Invalid blog ID')
      router.push('/admin/blogs')
      return
    }
    loadBlog()
  }, [blogId])

  const loadBlog = async () => {
    try {
      setIsLoading(true)
      const blog = await blogsApi.getById(blogId)
      
      setFormData({
        title: blog.title || '',
        content: blog.content || '',
        excerpt: blog.excerpt || '',
        category: blog.category || '',
        author: blog.author || '',
        image: null,
        published_at: blog.published_at 
          ? new Date(blog.published_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })

      if (blog.image_url) {
        setExistingImageUrl(blog.image_url)
      }
    } catch (error: any) {
      console.error('Error loading blog:', error)
      toast.error(error.response?.data?.message || 'Failed to load blog post')
      router.push('/admin/blogs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setExistingImageUrl(null) // Clear existing image when new one is selected
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }
    
    if (!formData.content.trim()) {
      toast.error('Please enter content')
      return
    }

    try {
      setIsSubmitting(true)
      
      const publishedAt = formData.published_at 
        ? new Date(`${formData.published_at}T00:00:00`).toISOString()
        : null

      await blogsApi.update(blogId, {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        category: formData.category || undefined,
        author: formData.author || undefined,
        image: formData.image || undefined,
        published_at: publishedAt,
      })

      toast.success('Blog post updated successfully')
      router.push('/admin/blogs')
    } catch (error: any) {
      console.error('Error updating blog:', error)
      toast.error(error.response?.data?.message || 'Failed to update blog post')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isNaN(blogId)) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-red-600">Invalid blog ID</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <>
        <DashboardHeader
          title="Edit Blog Post"
          subtitle="Update blog post details"
          showNotifications={false}
        />
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading blog post...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ToastContainer />
      <DashboardHeader
        title="Edit Blog Post"
        subtitle="Update blog post details"
        showNotifications={false}
      />

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
              placeholder="Enter blog post title"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-gray-900 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={12}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 resize-y"
              placeholder="Write your blog post content here..."
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-semibold text-gray-900 mb-2">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 resize-y"
                placeholder="Short description or summary"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                Category
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
                placeholder="e.g., Real Estate, Lifestyle"
              />
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-sm font-semibold text-gray-900 mb-2">
                Author
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
                placeholder="Author name"
              />
            </div>

            {/* Publish Date */}
            <div>
              <label htmlFor="published_at" className="block text-sm font-semibold text-gray-900 mb-2">
                Publish Date
              </label>
              <input
                type="date"
                id="published_at"
                name="published_at"
                value={formData.published_at}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-semibold text-gray-900 mb-2">
              Featured Image
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="image"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <FiImage className="w-4 h-4" />
                  {formData.image ? 'Change Image' : 'Choose Image'}
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {formData.image && (
                  <span className="text-sm text-gray-600">{formData.image.name}</span>
                )}
              </div>
              {(imagePreview || existingImageUrl) && (
                <div className="mt-3">
                  <img
                    src={imagePreview || existingImageUrl || ''}
                    alt="Preview"
                    className="max-w-md h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/blogs')}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave className="w-4 h-4" />
              {isSubmitting ? 'Updating...' : 'Update Blog Post'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
