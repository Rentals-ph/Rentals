'use client'

import AppSidebar from '@/components/common/AppSidebar'
import { useRouter } from 'next/navigation'
import { SimpleBlogModal } from '@/components/blog-editor/SimpleBlogModal'

export default function CreateBlogPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      <div className="relative ml-[280px] flex-1 lg:ml-[240px] md:ml-0">
        <SimpleBlogModal onClose={() => router.push('/admin/blogs')} />
      </div>
    </div>
  )
}
