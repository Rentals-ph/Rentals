'use client'

import React from 'react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPageNumbers?: boolean
  maxVisiblePages?: number
  className?: string
  showInfo?: boolean
  totalItems?: number
  itemsPerPage?: number
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 5,
  className = '',
  showInfo = false,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  // Calculate visible page numbers
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    const half = Math.floor(maxVisiblePages / 2)

    if (currentPage <= half + 1) {
      // Show first pages
      for (let i = 1; i <= maxVisiblePages - 1; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - half) {
      // Show last pages
      pages.push(1)
      pages.push('ellipsis')
      for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show middle pages
      pages.push(1)
      pages.push('ellipsis')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number') {
      onPageChange(page)
    }
  }

  // Calculate results range for info display
  const getResultsInfo = () => {
    if (!totalItems || !itemsPerPage) return null
    
    const start = (currentPage - 1) * itemsPerPage + 1
    const end = Math.min(currentPage * itemsPerPage, totalItems)
    return { start, end, total: totalItems }
  }

  const resultsInfo = getResultsInfo()

  if (totalPages <= 1 && !showInfo) {
    return null
  }

  return (
    <div className={`mt-10 flex w-full flex-col items-center gap-4 pb-5 md:mt-8 md:gap-3 md:pb-4 xs:mt-6 xs:gap-2.5 xs:pb-3 ${className}`}>
      {showInfo && resultsInfo && (
        <div className="text-center font-outfit text-sm font-normal text-gray-500 md:text-xs xs:text-xs">
          Showing <strong className="font-semibold text-gray-900">{resultsInfo.start}</strong> to <strong className="font-semibold text-gray-900">{resultsInfo.end}</strong> of <strong className="font-semibold text-gray-900">{resultsInfo.total}</strong> results
        </div>
      )}
      
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-1.5 xs:gap-1">
        {/* Previous Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border-1.5 border-gray-200 bg-white p-0 font-outfit text-sm text-gray-700 shadow-sm transition-all hover:enabled:-translate-y-0.5 hover:enabled:border-rental-blue-600 hover:enabled:bg-blue-50 hover:enabled:text-rental-blue-600 hover:enabled:shadow-[0_2px_8px_rgba(32,94,215,0.2)] active:enabled:translate-y-0 active:enabled:shadow-[0_1px_4px_rgba(32,94,215,0.15)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-40 md:h-9 md:w-9 md:text-xs xs:h-8 xs:w-8 xs:text-xs"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:h-3.5 md:w-3.5 xs:h-3 xs:w-3">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Page Numbers */}
        {showPageNumbers && (
          <>
            {visiblePages.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className="flex select-none items-center px-1 font-outfit text-sm text-gray-400 md:px-0.5 md:text-xs xs:px-0.5 xs:text-xs" aria-hidden="true">
                    ...
                  </span>
                )
              }

              const pageNumber = page as number
              const isActive = pageNumber === currentPage

              return (
                <button
                  key={pageNumber}
                  className={`flex h-10 w-10 items-center text-gray-700 justify-center rounded-full border-1.5 p-0 font-outfit text-sm font-medium shadow-sm transition-all md:h-9 md:w-9 md:text-xs xs:h-8 xs:w-8 xs:text-xs ${
                    isActive
                      ? 'scale-105 border-rental-blue-600 bg-gradient-to-br from-rental-blue-600 to-rental-blue-700 font-semibold text-rental-blue-600 bg-rental-blue-50 shadow-[0_4px_12px_rgba(32,94,215,0.3)] hover:from-rental-blue-700 hover:to-rental-blue-800 hover:shadow-[0_6px_16px_rgba(32,94,215,0.4)]'
                      : 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-rental-blue-600 hover:bg-blue-50 hover:text-rental-blue-600 hover:shadow-[0_2px_8px_rgba(32,94,215,0.2)] active:translate-y-0 active:shadow-[0_1px_4px_rgba(32,94,215,0.15)]'
                  }`}
                  onClick={() => handlePageClick(pageNumber)}
                  aria-label={`Go to page ${pageNumber}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              )
            })}
          </>
        )}

        {/* Next Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border-1.5 border-gray-200 bg-white p-0 font-outfit text-sm text-gray-700 shadow-sm transition-all hover:enabled:-translate-y-0.5 hover:enabled:border-rental-blue-600 hover:enabled:bg-blue-50 hover:enabled:text-rental-blue-600 hover:enabled:shadow-[0_2px_8px_rgba(32,94,215,0.2)] active:enabled:translate-y-0 active:enabled:shadow-[0_1px_4px_rgba(32,94,215,0.15)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-40 md:h-9 md:w-9 md:text-xs xs:h-8 xs:w-8 xs:text-xs"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:h-3.5 md:w-3.5 xs:h-3 xs:w-3">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Pagination
