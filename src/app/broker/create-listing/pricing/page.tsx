'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../../../components/common/AppSidebar'
import { useCreateListing } from '../../../../contexts/CreateListingContext'
import {
  FiBell,
  FiPlus,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiDollarSign
} from 'react-icons/fi'
// import '../../broker-shared.css' // Removed - converted to Tailwind
// import '../../../agent/create-listing/AgentCreateListingCategory.css' // Removed - converted to Tailwind
// import '../../../agent/create-listing/pricing/page.css' // Removed - file doesn't exist

function ProgressRing({ percent }: { percent: number }) {
  const { radius, stroke, normalizedRadius, circumference, strokeDashoffset } = useMemo(() => {
    const r = 26; const s = 6; const nr = r - s / 2; const c = nr * 2 * Math.PI; const offset = c - (percent / 100) * c
    return { radius: r, stroke: s, normalizedRadius: nr, circumference: c, strokeDashoffset: offset }
  }, [percent])
  return (
    <div className="relative w-13 h-13 flex-shrink-0"> {/* aclc-progress */}
      <svg height={radius * 2} width={radius * 2} className="-rotate-90"> {/* aclc-progress-svg */}
        <circle stroke="#E5E7EB" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle stroke="#2563EB" fill="transparent" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset }} r={normalizedRadius} cx={radius} cy={radius} className="transition-all duration-250 ease-in" /> {/* aclc-progress-ring */}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">{percent}%</div> {/* aclc-progress-text */}
    </div>
  )
}

export default function BrokerCreateListingPricing() {
  const router = useRouter()
  const { data, updateData } = useCreateListing()
  const [price, setPrice] = useState(data.price)
  const [priceType, setPriceType] = useState<'Monthly' | 'Weekly' | 'Daily' | 'Yearly'>(data.priceType)

  useEffect(() => {
    setPrice(data.price)
    setPriceType(data.priceType)
  }, [data])

  const stepLabels = [
    'Basic Information',
    'Visuals & Features',
    'Pricing',
    'Owner Info & Review'
  ]

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* broker-dashboard */}
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15"> {/* broker-main */}
        <header className="flex items-center justify-between mb-7 md:flex-col md:items-start md:gap-3.5"> {/* broker-header */}
          <div> {/* broker-header-left */}
            <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1 md:text-xl">Create Listing</h1>
            <p className="text-sm text-gray-400 m-0">Set property pricing.</p>
          </div>
          <div className="flex items-center gap-3.5 md:w-full md:justify-between md:gap-2.5"> {/* broker-header-right */}
            <button className="w-10.5 h-10.5 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-600 text-lg transition-all hover:bg-gray-50 hover:text-gray-900 md:w-9.5 md:h-9.5 md:text-base md:flex-shrink-0"><FiBell /></button> {/* broker-notification-btn */}
            <a href="/broker/create-listing" className="bg-blue-600 text-white border-none py-2.5 px-5.5 rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-2 transition-colors no-underline hover:bg-blue-700 md:py-2.25 md:px-4.5 md:text-xs md:flex-1 md:justify-center md:min-w-0"><FiPlus /> Add Listing</a> {/* broker-add-listing-btn */}
          </div>
        </header>

        <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 my-1.5 mx-0 mb-4"> {/* aclc-breadcrumb */}
          <span className="text-gray-900">Create Listing</span> {/* aclc-breadcrumb-strong */}
          <span className="text-gray-400 font-medium">&gt;</span> {/* aclc-breadcrumb-sep */}
          <span className="text-gray-400 font-semibold">Pricing</span> {/* aclc-breadcrumb-muted */}
        </div>

        <div className="flex items-center gap-4 p-5 mb-6 bg-white rounded-xl shadow-sm md:flex-col md:items-start"> {/* section-card aclc-stepper-card */}
          <div className="flex items-center gap-3 min-w-[220px]"> {/* aclc-stepper-left */}
            <ProgressRing percent={75} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div> {/* aclc-stepper-left-title */}
          </div>
          <div className="flex-1 grid grid-cols-4 items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start"> {/* aclc-steps */}
            {stepLabels.map((label, idx) => {
              const step = idx + 1; const isActive = step === 3; const isDone = step < 3
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}> {/* aclc-step */}
                  <div className="w-full flex items-center relative"> {/* aclc-step-top */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{isDone ? <FiCheck className="text-lg" /> : step}</div> {/* aclc-step-circle */}
                    {step !== stepLabels.length && <div className={`h-1.5 bg-gray-200 rounded-full flex-1 ml-2 mr-2 min-w-0 ${step < 3 ? 'bg-blue-600' : ''}`} />} {/* aclc-step-line */}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div> {/* aclc-step-label */}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm max-w-full"> {/* section-card aclc-form-card */}
          <h2 className="m-0 mb-4 text-3xl font-bold text-gray-900">Pricing</h2> {/* aclc-form-title */}

          <div className="grid grid-cols-2 gap-5 mb-8 md:grid-cols-1"> {/* acpr-row */}
            <div className="flex flex-col gap-2"> {/* acpr-column */}
              <div className="text-sm font-semibold text-blue-600 mb-1">Price</div> {/* acpr-column-label */}
              <div className="flex flex-col gap-0"> {/* acpr-form-group */}
                <div className="relative flex items-center"> {/* acpr-price-input-wrapper */}
                  <div className="absolute left-3.5 flex items-center justify-center text-gray-600 text-lg pointer-events-none"><FiDollarSign /></div> {/* acpr-price-icon */}
                  <input id="price" type="text" className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none transition-all focus:border-blue-600 focus:shadow-outline-blue" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} /> {/* acpr-price-input */}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2"> {/* acpr-column */}
              <div className="text-sm font-semibold text-blue-600 mb-1">Price Type</div> {/* acpr-column-label */}
              <div className="flex flex-col gap-0"> {/* acpr-form-group */}
                <div className="relative w-full"> {/* aclc-select-wrap */}
                  <select id="price-type" className="w-full h-12 px-4 pr-11 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none appearance-none focus:border-blue-600 focus:shadow-outline-blue" value={priceType} onChange={(e) => setPriceType(e.target.value as 'Monthly' | 'Weekly' | 'Daily' | 'Yearly')}> {/* aclc-select */}
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Daily">Daily</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-xs">▼</div> {/* aclc-select-caret */}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3 mt-8 md:flex-col md:items-stretch"> {/* acpr-footer-actions */}
            <button className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border-2 border-blue-600 bg-white text-blue-600 font-bold text-sm cursor-pointer transition-all duration-150 ease-in-out hover:bg-blue-50 hover:-translate-y-px hover:shadow-md hover:shadow-blue-600/10 md:w-full md:justify-center" onClick={() => router.push('/broker/create-listing/visuals-features')} type="button"> {/* acld-prev-btn */}
              <FiArrowLeft /><span>Previous</span>
            </button>
            <button className="h-11 px-5 rounded-lg border-none bg-blue-600 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 transition-all duration-150 ease-in-out hover:bg-blue-700 hover:translate-y-px hover:shadow-xl hover:shadow-blue-600/25 disabled:bg-blue-300 disabled:cursor-not-allowed disabled:shadow-none md:w-full md:justify-center" onClick={() => { updateData({ price, priceType }); router.push('/broker/create-listing/owner-review') }} type="button"> {/* aclc-next-btn */}
              <span>Next: Owner Info & Review</span><FiArrowRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
