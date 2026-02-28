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
  size = 'small',
}: BlogCardProps) {
  return (
    <Link href={link} style={{ textDecoration: 'none', display: 'block' }}>
      <article 
        className={`relative flex w-full flex-col overflow-hidden rounded-lg bg-white shadow-[0px_4px_21px_0px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-1 hover:shadow-[0px_6px_25px_0px_rgba(0,0,0,0.3)] touch-manipulation ${
          size === 'small' 
            ? 'min-h-[180px] xs:min-h-[200px] md:min-h-[260px] min-w-0 max-w-full xs:min-w-[200px] md:min-w-[220px] md:max-w-[300px] flex-[0_1_260px]' 
            : 'min-h-[200px] xs:min-h-[220px] md:h-auto md:min-h-[260px] min-w-0 max-w-full sm:min-w-[300px] md:min-w-[340px] md:max-w-[520px] flex-[0_1_420px] p-0'
        }`}
      >
        {size === 'large' ? (
          <>
            <img
              src={image}
              alt={title}
              className="absolute left-0 top-0 z-10 h-full w-full min-h-[200px] max-h-[240px] rounded-lg object-cover"
            />
            <div className="absolute bottom-3 left-3 right-3 z-20 flex h-auto flex-col gap-2 rounded-lg bg-white/87 px-6 py-4 md:gap-1.5 xs:bottom-2 xs:left-2 xs:right-2 xs:gap-1 xs:rounded-lg xs:px-4 xs:py-3">
              <div className="mb-1.5 flex items-center gap-4.25 xs:mb-1 xs:gap-2.5">
                <span className="rounded-full bg-rental-blue-600 px-3.5 py-1 font-outfit text-xs font-semibold uppercase tracking-wider text-white md:px-2.5 md:py-1 md:text-sm xs:rounded xs:px-1.5 xs:py-0.75 xs:text-sm">
                  {category}
                </span>
                <span className="font-outfit text-sm font-medium text-gray-600">
                  {readTime}
                </span>
              </div>
              <h3 className="m-0 mb-1.5 font-outfit text-lg font-normal leading-tight text-black md:text-base xs:mb-1 xs:text-sm xs:leading-snug">
                {title}
              </h3>
              <p className="m-0 mb-2 max-h-[4.84em] min-h-[4.84em] overflow-hidden text-ellipsis text-justify font-outfit text-base font-normal leading-tight text-black/80 line-clamp-4 md:mb-2 md:text-sm xs:mb-1.5 xs:text-sm xs:leading-snug">
                {excerpt}
              </p>
              <div className="mb-0 mt-1.5 flex items-center justify-between gap-2.5 md:mb-2 xs:mb-1.5">
                <div className="flex items-center gap-3.25 font-outfit text-base font-normal leading-tight text-gray-600 md:gap-2 md:text-sm xs:gap-1.25 xs:text-xs">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-black md:h-5 md:w-5 xs:h-3.5 xs:w-3.5">
                    <path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.314 0 6 1.343 6 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1c0-1.657 2.686-3 6-3Z" />
                  </svg>
                  <span>{author}</span>
                </div>
                <div className="flex items-center gap-3.25 font-outfit text-base font-normal leading-tight text-gray-600 md:gap-2 md:text-sm xs:gap-1.25 xs:text-xs">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-black md:h-5 md:w-5 xs:h-3.5 xs:w-3.5">
                    <path d="M6 2a1 1 0 1 1 2 0v1h4V2a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V2a1 1 0 1 1 2 0v1Zm10 3H4v11h12V5Zm-2 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                  </svg>
                  <span>{date}</span>
                </div>
              </div>
              <div className="mt-auto flex justify-end">
                <span className="flex items-center gap-2 font-outfit text-lg font-normal text-rental-blue-600 hover:opacity-80 md:text-base xs:gap-1.5 xs:text-sm">
                  Read More
                  <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.25 w-5 xs:h-3 xs:w-3.5">
                    <path d="M12 1L19 8.5L12 16M19 8.5H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <img
              src={image}
              alt={title}
              className="h-[140px] w-full flex-shrink-0 rounded-t-lg object-cover md:h-[160px] xs:h-[120px]"
            />
            <div className="flex flex-1 flex-col px-6 py-3 md:px-5 md:py-3 xs:gap-1.5 xs:px-3.5 xs:py-2.5">
              <div className="mb-1.5 flex items-center gap-4.25 xs:mb-1 xs:gap-2.5">
                <span className="rounded-full bg-rental-blue-600 px-3.5 py-1 font-outfit text-xs font-semibold uppercase tracking-wider text-white md:px-2.5 md:py-1 md:text-sm xs:rounded xs:px-1.5 xs:py-0.75 xs:text-sm">
                  {category}
                </span>
                <span className="font-outfit text-sm font-medium text-gray-600">
                  {readTime}
                </span>
              </div>
              <h3 className="m-0 mb-1.5 font-outfit text-xl font-normal leading-tight text-black md:text-lg xs:mb-1 xs:text-xs xs:leading-snug">
                {title}
              </h3>
              <p className="m-0 mb-2 max-h-[3.63em] min-h-[3.63em] overflow-hidden text-ellipsis text-justify font-outfit text-sm font-normal leading-tight text-black/80 line-clamp-3 md:mb-2 xs:mb-1.5 xs:leading-snug">
                {excerpt}
              </p>
              <div className="mb-0 mt-1.5 flex items-center justify-between gap-2.5 md:gap-10 xs:mb-1 xs:gap-5">
                <div className="flex items-center gap-3.25 font-outfit text-base font-normal leading-tight text-gray-600 md:gap-2 md:text-sm xs:gap-1.25 xs:text-xs">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-black md:h-5 md:w-5 xs:h-3.5 xs:w-3.5">
                    <path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.314 0 6 1.343 6 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1c0-1.657 2.686-3 6-3Z" />
                  </svg>
                  <span>{author}</span>
                </div>
                <div className="flex items-center gap-3.25 font-outfit text-base font-normal leading-tight text-gray-600 md:gap-2 md:text-sm xs:gap-1.25 xs:text-xs">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-black md:h-5 md:w-5 xs:h-3.5 xs:w-3.5">
                    <path d="M6 2a1 1 0 1 1 2 0v1h4V2a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V2a1 1 0 1 1 2 0v1Zm10 3H4v11h12V5Zm-2 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                  </svg>
                  <span>{date}</span>
                </div>
              </div>
              <div className="mt-auto flex justify-end">
                <span className="flex items-center gap-2 font-outfit text-xl font-normal text-[#2d5a4c] hover:opacity-80 md:text-lg xs:gap-1.5 xs:text-sm">
                  Read More
                  <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.25 w-5 xs:h-3 xs:w-3.5">
                    <path d="M12 1L19 8.5L12 16M19 8.5H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </>
        )}
      </article>
    </Link>
  )
}

export default BlogCard
