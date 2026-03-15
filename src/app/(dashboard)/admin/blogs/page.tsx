'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/features/dashboard'
import { DashboardHeader } from '@/features/dashboard'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import { toast, ToastContainer } from '@/utils/toast'
import { FiPlus, FiEdit3, FiTrash2, FiEye, FiCalendar } from 'react-icons/fi'

export default function AdminBlogsPage() {
  const router = useRouter()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadBlogs()
  }, [])

  const loadBlogs = async () => {
    try {
      setIsLoading(true)
      const data = await blogsApi.getAll()
      setBlogs(data)
    } catch (error) {
      console.error('Error loading blogs:', error)
      toast.error('Failed to load blogs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      await blogsApi.delete(id)
      toast.success('Blog deleted successfully')
      loadBlogs()
    } catch (error: any) {
      console.error('Error deleting blog:', error)
      toast.error(error.response?.data?.message || 'Failed to delete blog')
    }
  }

  return (
    <>
      <ToastContainer />
      <DashboardHeader
        title="Blog Management"
        subtitle="Create and manage blog posts"
        showNotifications={false}
      />

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">All Blog Posts</h2>
            <button
              onClick={() => router.push('/admin/blogs/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiPlus className="w-4 h-4" />
              Create New Blog
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading blogs...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No blog posts yet</p>
              <button
                onClick={() => router.push('/admin/blogs/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Blog Post
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Author</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Published</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog) => (
                    <tr key={blog.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{blog.title}</div>
                        {blog.excerpt && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-1">{blog.excerpt}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {blog.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{blog.author}</td>
                      <td className="py-3 px-4">
                        {blog.published_at ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiCalendar className="w-4 h-4" />
                            {new Date(blog.published_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Draft</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/blog/${blog.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/blogs/edit/${blog.id}`)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </>
  )
}

