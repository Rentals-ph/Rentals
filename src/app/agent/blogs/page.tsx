'use client'

import { useMemo, useState } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import AgentHeader from '../../../components/agent/AgentHeader'
import { ASSETS } from '@/utils/assets'

type AgentBlogCard = {
  id: number
  title: string
  image: string
}

export default function AgentShareBlogs() {
  const [currentPage, setCurrentPage] = useState(1)

  const blogs: AgentBlogCard[] = useMemo(
    () => [
      { id: 1, title: 'How Much Rent Can You Really Afford in 2026?', image: ASSETS.BLOG_IMAGE_1 },
      { id: 2, title: 'Post-Holiday Budget Reset', image: ASSETS.BLOG_IMAGE_2 },
      { id: 3, title: 'Finding a Home Made Simple', image: ASSETS.BLOG_IMAGE_MAIN },
      { id: 4, title: 'Back-to-School Smart Living', image: ASSETS.BLOG_IMAGE_2 },
      { id: 5, title: 'Why January is the Smartest Month', image: ASSETS.BLOG_IMAGE_1 },
      { id: 6, title: 'Small Space, Big Holiday Glow', image: ASSETS.BLOG_IMAGE_MAIN }
    ],
    []
  )

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />

      <main className="main-with-sidebar flex-1 p-0 min-h-screen">
        <div className="pt-8 px-8 pb-0 mb-0 sm:pt-6 sm:px-[18px]">
          <AgentHeader 
            title="Share Blogs" 
            subtitle="Create and share blog posts with the community." 
          />
        </div>

        <section className="py-6 px-8 min-h-[600px] sm:p-[18px]">
          <div className="relative mt-[18px]">
            <button className="absolute top-1/2 -translate-y-1/2 left-1.5 w-11 h-11 rounded-full border-0 cursor-pointer bg-transparent text-gray-500 text-[42px] leading-none flex items-center justify-center hover:text-[#205ed7]" type="button" aria-label="Previous">
              ‹
            </button>

            <div className="w-full grid grid-cols-3 gap-[26px] py-2.5 px-11 md:grid-cols-2 sm:grid-cols-1 sm:px-8" role="list">
              {blogs.map((b) => (
                <article key={b.id} className="bg-transparent rounded-xl" role="listitem">
                  <div className="rounded-xl overflow-hidden bg-white shadow-[0px_6px_16px_rgba(17,24,39,0.14)] h-[190px] flex items-center justify-center sm:h-[200px]">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover block" />
                  </div>
                </article>
              ))}
            </div>

            <button className="absolute top-1/2 -translate-y-1/2 right-1.5 w-11 h-11 rounded-full border-0 cursor-pointer bg-transparent text-gray-500 text-[42px] leading-none flex items-center justify-center hover:text-[#205ed7]" type="button" aria-label="Next">
              ›
            </button>
          </div>

          <div className="mt-[22px] flex justify-center items-center gap-2.5 pb-3" aria-label="Pagination">
            <button className="w-[38px] h-[38px] rounded-full border-0 cursor-pointer font-outfit text-sm font-semibold inline-flex items-center justify-center bg-blue-700 text-white text-xl" type="button" aria-label="Previous page">
              ‹
            </button>
            <button
              className={`w-[38px] h-[38px] rounded-full border-0 cursor-pointer font-outfit text-sm font-semibold inline-flex items-center justify-center ${currentPage === 1 ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}
              type="button"
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>
            <button
              className={`w-[38px] h-[38px] rounded-full border-0 cursor-pointer font-outfit text-sm font-semibold inline-flex items-center justify-center ${currentPage === 2 ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}
              type="button"
              onClick={() => setCurrentPage(2)}
            >
              2
            </button>
            <button
              className={`w-[38px] h-[38px] rounded-full border-0 cursor-pointer font-outfit text-sm font-semibold inline-flex items-center justify-center ${currentPage === 3 ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}
              type="button"
              onClick={() => setCurrentPage(3)}
            >
              3
            </button>
            <span className="text-blue-700 font-bold px-1.5">…</span>
            <button
              className={`w-[38px] h-[38px] rounded-full border-0 cursor-pointer font-outfit text-sm font-semibold inline-flex items-center justify-center ${currentPage === 50 ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}
              type="button"
              onClick={() => setCurrentPage(50)}
            >
              50
            </button>
            <button className="w-[38px] h-[38px] rounded-full border-0 cursor-pointer font-outfit text-sm font-semibold inline-flex items-center justify-center bg-blue-700 text-white text-xl" type="button" aria-label="Next page">
              ›
            </button>
          </div>
        </section>

      </main>
    </div>
  )
}
