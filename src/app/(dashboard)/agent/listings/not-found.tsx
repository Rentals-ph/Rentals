'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiHome, FiArrowLeft } from 'react-icons/fi'

export default function AgentListingNotFound() {
  const router = useRouter()

  return (
    <>

        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center w-full">
            {/* 404 Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-100 mb-4">
                <FiHome className="text-4xl text-orange-600" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Listing Not Found
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-8 text-base sm:text-lg leading-relaxed">
              The listing you're trying to access doesn't exist, may have been removed, 
              or you don't have permission to view it.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                <FiArrowLeft className="text-lg" />
                Go Back
              </button>
              <Link
                href="/agent/listings"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <FiHome className="text-lg" />
                View All Listings
              </Link>
            </div>
          </div>
        </div>
    </>
  )
}

