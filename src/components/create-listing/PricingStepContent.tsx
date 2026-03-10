'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateListing } from '../../contexts/CreateListingContext'
import { FiArrowLeft, FiArrowRight, FiDollarSign } from 'react-icons/fi'

export interface PricingStepContentProps {
  /** Path to navigate to on Previous */
  prevStepPath: string
  /** Path to navigate to on Next */
  nextStepPath: string
  /** Label for the Next button (e.g. "Next: Owner Info & Review") */
  nextButtonLabel: string
}

export function PricingStepContent({
  prevStepPath,
  nextStepPath,
  nextButtonLabel,
}: PricingStepContentProps) {
  const router = useRouter()
  const { data, updateData } = useCreateListing()

  const [listingType, setListingType] = useState<'for_rent' | 'for_sale'>(data.listingType)
  const [price, setPrice] = useState(data.price)
  const [priceType, setPriceType] = useState<
    'Monthly' | 'Weekly' | 'Daily' | 'Yearly'
  >(data.priceType)

  useEffect(() => {
    setListingType(data.listingType)
    setPrice(data.price)
    setPriceType(data.priceType)
  }, [data])

  const handleNext = () => {
    updateData({ listingType, price, priceType })
    router.push(nextStepPath)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
        <p className="text-sm text-gray-600 mt-1">
          Set the listing type and price for your property
        </p>
      </div>

      <div className="p-6">
        {/* Listing Type Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Listing Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setListingType('for_rent')}
              className={`flex-1 h-12 rounded-lg border-2 text-sm font-semibold transition-all ${
                listingType === 'for_rent'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >
              For Rent
            </button>
            <button
              type="button"
              onClick={() => setListingType('for_sale')}
              className={`flex-1 h-12 rounded-lg border-2 text-sm font-semibold transition-all ${
                listingType === 'for_sale'
                  ? 'bg-green-600 border-green-600 text-white shadow-md'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-green-400'
              }`}
            >
              For Sale
            </button>
          </div>
        </div>

        <div className={`grid gap-6 mb-6 ${listingType === 'for_rent' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              {listingType === 'for_sale' ? 'Selling Price (₱)' : 'Price (₱)'}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <FiDollarSign className="w-5 h-5" />
              </div>
              <input
                id="price"
                type="text"
                className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder={listingType === 'for_sale' ? 'Total selling price' : 'Price per period'}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          {listingType === 'for_rent' && (
            <div>
              <label
                htmlFor="price-type"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Price Type
              </label>
              <div className="relative">
                <select
                  id="price-type"
                  className="w-full h-12 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  value={priceType}
                  onChange={(e) =>
                    setPriceType(
                      e.target.value as
                        | 'Monthly'
                        | 'Weekly'
                        | 'Daily'
                        | 'Yearly'
                    )
                  }
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Daily">Daily</option>
                  <option value="Yearly">Yearly</option>
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">
                  ▼
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 md:flex-col md:items-stretch">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border-2 border-blue-600 bg-white text-blue-600 font-bold text-sm cursor-pointer transition-all duration-150 ease-in-out hover:bg-blue-50 hover:-translate-y-px hover:shadow-md hover:shadow-blue-600/10 md:w-full md:justify-center"
            onClick={() => router.push(prevStepPath)}
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            className="h-11 px-5 rounded-lg border-none bg-blue-600 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 transition-all duration-150 ease-in-out hover:bg-blue-700 hover:translate-y-px hover:shadow-xl hover:shadow-blue-600/25 disabled:bg-blue-300 disabled:cursor-not-allowed disabled:shadow-none md:w-full md:justify-center"
            onClick={handleNext}
            disabled={!price}
          >
            <span>{nextButtonLabel}</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
