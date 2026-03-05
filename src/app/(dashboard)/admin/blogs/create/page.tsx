'use client'

import BlogEditor from '@/components/blog-editor/BlogEditor'
import AppSidebar from '@/components/common/AppSidebar'
import { useRouter } from 'next/navigation'

export default function CreateBlogPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <div className="ml-[280px] flex-1 lg:ml-[240px] md:ml-0">
        <BlogEditor onClose={() => router.push('/admin/blogs')} />
      </div>
    </div>
  )
}

