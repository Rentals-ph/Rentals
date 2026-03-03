import Link from 'next/link'

import { ReactNode } from 'react'

interface BlogCardProps {
  image: string
  category: string
  title: string
  excerpt: string
  author: string | ReactNode
  date: string | ReactNode
  readTime: string
  link?: string
  /**
   * Kept for backwards compatibility but no longer changes layout.
   * All blog cards now use a single unified design.
   */
  size?: 'small' | 'large'
}

function BlogCard({
  image,
  category,
  title,
  excerpt,
  author,
  date,
  readTime,
  link = '#read-more',
}: BlogCardProps) {
  return (
    <Link href={link} style={{ textDecoration: 'none', display: 'block' }}>
      <article className="relative flex w-full max-w-[380px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.15)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(15,23,42,0.22)] touch-manipulation">
        {/* Image */}
        <div className="h-[180px] xs:h-[200px] sm:h-[220px] w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-outfit text-[11px] font-semibold uppercase tracking-wide text-rental-blue-600">
                {category}
              </span>
              <span className="font-outfit text-[11px] text-gray-500 whitespace-nowrap">
                {readTime}
              </span>
            </div>
            <h3 className="m-0 font-outfit text-base xs:text-lg sm:text-xl font-semibold leading-snug text-gray-900 line-clamp-1">
              {title}
            </h3>
            <p className="m-0 font-outfit text-xs xs:text-sm sm:text-[13px] leading-relaxed text-gray-600 line-clamp-3">
              {excerpt}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 text-gray-700">
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0 text-gray-700"
              >
                <path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.314 0 6 1.343 6 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1c0-1.657 2.686-3 6-3Z" />
              </svg>
              <div className="flex flex-col">
                <span className="font-outfit text-xs xs:text-sm font-medium text-gray-900 line-clamp-1">
                  {author}
                </span>
                <span className="font-outfit text-[11px] text-gray-500">{date}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 font-outfit text-xs xs:text-sm sm:text-[13px] font-semibold text-rental-blue-600 hover:text-rental-orange-500">
              Read More
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-4"
              >
                <path
                  d="M12 1L19 8.5L12 16M19 8.5H1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default BlogCard
