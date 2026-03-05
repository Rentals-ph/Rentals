'use client'

import { use } from 'react'
import BlogEditor from '@/components/blog-editor/BlogEditor'
import AppSidebar from '@/components/common/AppSidebar'
import { useRouter } from 'next/navigation'

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const blogId = parseInt(id)

  if (isNaN(blogId)) {
    return <div>Invalid blog ID</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <div className="ml-[280px] flex-1 lg:ml-[240px] md:ml-0">
        <BlogEditor blogId={blogId} onClose={() => router.push('/admin/blogs')} />
      </div>
    </div>
  )
}

