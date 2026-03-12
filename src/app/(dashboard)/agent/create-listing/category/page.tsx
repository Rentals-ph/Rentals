'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateListing } from '@/contexts/CreateListingContext'
import {
  FiChevronDown,
  FiArrowRight
} from 'react-icons/fi'

function ProgressRing({ percent }: { percent: number }) {
  const { radius, stroke, normalizedRadius, circumference, strokeDashoffset } = useMemo(() => {
    const r = 26
    const s = 6
    const nr = r - s / 2
    const c = nr * 2 * Math.PI
    const offset = c - (percent / 100) * c
    return {
      radius: r,
      stroke: s,
      normalizedRadius: nr,
      circumference: c,
      strokeDashoffset: offset
    }
  }, [percent])

  return (
    <div className="relative w-[52px] h-[52px] flex-shrink-0">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#2563EB"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-[stroke-dashoffset] duration-[250ms] ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">{percent}%</div>
    </div>
  )
}

export default function AgentCreateListingCategory() {
  const router = useRouter()
  const { data, updateData } = useCreateListing()
  const [category, setCategory] = useState(data.category)

  useEffect(() => {
    setCategory(data.category)
  }, [data.category])

  const categories = useMemo(
    () => [
      'Apartment / Condo',
      'House',
      'Townhouse',
      'Studio',
      'Bedspace',
      'Commercial',
      'Office',
      'Warehouse'
    ],
    []
  )

  const stepLabels = ['Category', 'Details', 'Location', 'Property Images', 'Pricing', 'Attributes', 'Owner Info', 'Publish']

  return (
    <>

        <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 my-1.5 mb-[18px]">
          <span className="text-gray-900">Create Listing</span>
          <span className="text-gray-400 font-medium">&gt;</span>
          <span className="text-gray-400 font-semibold">Category</span>
        </div>

        <div className="section-card flex items-center gap-[18px] p-5 px-[22px] mb-6 lg:flex-col lg:items-start">
          <div className="flex items-center gap-3.5 min-w-[220px]">
            <ProgressRing percent={10} />
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-500">Completion Status</div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-4 items-start gap-0 lg:w-full lg:overflow-x-auto lg:pb-1.5 lg:justify-start">
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 1
              const isDone = step < 1
              return (
                <div className="flex flex-col items-center min-w-0 lg:flex-[0_0_auto]" key={label}>
                  <div className="w-full flex items-center relative">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-[2] ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step}
                    </div>
                    {step !== stepLabels.length && <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 lg:w-9 lg:flex-[0_0_auto] ${
                      step < 1 ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="section-card p-[26px] max-w-full">
          <h2 className="m-0 mb-[18px] text-[28px] font-bold text-gray-900">Property Category</h2>

          <label className="block text-sm font-semibold text-blue-600 mb-2" htmlFor="propertyCategory">
            Property Category
          </label>

          <div className="relative w-full">
            <select
              id="propertyCategory"
              className="w-full h-12 px-4 pr-11 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none appearance-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" disabled>
                Select a property category
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg" />
          </div>

          <button
            className="mt-[18px] h-[46px] px-[22px] rounded-lg border-none bg-blue-600 text-white font-bold text-sm inline-flex items-center gap-2.5 cursor-pointer shadow-[0_6px_12px_rgba(37,99,235,0.22)] transition-all duration-150 ease-out hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_10px_18px_rgba(37,99,235,0.25)] disabled:bg-blue-300 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
            disabled={!category}
            onClick={() => {
              updateData({ category })
              router.push('/agent/create-listing/details')
            }}
            type="button"
          >
            <span>Next</span>
            <FiArrowRight />
          </button>
        </div>
    </>
  )
}

