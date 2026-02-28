'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/common/AppSidebar'
import AgentHeader from '@/components/agent/AgentHeader'
import { useCreateListing } from '@/contexts/CreateListingContext'
import {
  FiChevronDown,
  FiArrowLeft,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi'
import { generatePropertyDescription, getFallbackDescription } from '@/utils/aiDescription'
// import '../AgentCreateListingCategory.css' // Converted to Tailwind

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
    <div className="relative w-13 h-13 flex-shrink-0"> {/* aclc-progress */}
      <svg height={radius * 2} width={radius * 2} className="-rotate-90"> {/* aclc-progress-svg */}
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
          className="transition-all duration-250 ease-in" // aclc-progress-ring
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">{percent}%</div> {/* aclc-progress-text */}
    </div>
  )
}

export default function AgentCreateListingDetails() {
  const router = useRouter()
  const { data, updateData } = useCreateListing()

  const stepLabels = ['Category', 'Details', 'Location', 'Property Images', 'Pricing', 'Attributes', 'Owner Info', 'Publish']

  const [title, setTitle] = useState(data.title)
  const [description, setDescription] = useState(data.description)
  const [bedrooms, setBedrooms] = useState<number>(data.bedrooms)
  const [bathrooms, setBathrooms] = useState<number>(data.bathrooms)
  const [garage, setGarage] = useState<number>(data.garage)
  const [floorArea, setFloorArea] = useState<number>(data.floorArea)
  const [floorUnit, setFloorUnit] = useState<'Square Meters' | 'Square Feet'>(data.floorUnit)
  const [lotArea, setLotArea] = useState<number>(data.lotArea)

  useEffect(() => {
    setTitle(data.title)
    setDescription(data.description)
    setBedrooms(data.bedrooms)
    setBathrooms(data.bathrooms)
    setGarage(data.garage)
    setFloorArea(data.floorArea)
    setFloorUnit(data.floorUnit)
    setLotArea(data.lotArea)
  }, [data])

  const [isGenerating, setIsGenerating] = useState(false)

  const handleAiGenerate = async () => {
    if (!data.category || !title) return
    setIsGenerating(true)
    try {
      const result = await generatePropertyDescription(data.category, title)
      setDescription(result)
    } catch {
      setDescription(getFallbackDescription(data.category, title))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="agent-dashboard">
      <AppSidebar/>
     

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="Create Listing" 
          subtitle="Add property details." 
        />

        <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 my-1.5 mx-0 mb-4"> {/* aclc-breadcrumb */}
          <span className="text-gray-900">Create Listing</span> {/* aclc-breadcrumb-strong */}
          <span className="text-gray-400 font-medium">&gt;</span> {/* aclc-breadcrumb-sep */}
          <span className="text-gray-400 font-semibold">Details</span> {/* aclc-breadcrumb-muted */}
        </div>

        <div className="flex items-center gap-4 p-5 mb-6 bg-white rounded-xl shadow-sm md:flex-col md:items-start"> {/* section-card aclc-stepper-card */}
          <div className="flex items-center gap-3 min-w-[220px]"> {/* aclc-stepper-left */}
            <ProgressRing percent={20} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div> {/* aclc-stepper-left-title */}
          </div>

          <div className="flex-1 grid grid-cols-4 items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start"> {/* aclc-steps */}
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 2
              const isDone = step < 2
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}> {/* aclc-step */}
                  <div className="w-full flex items-center relative"> {/* aclc-step-top */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}> {/* aclc-step-circle */}
                      {isDone ? <FiCheck className="text-lg" /> : step}
                    </div>
                    {step !== stepLabels.length && (
                      <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 ${step < 2 ? 'bg-blue-600' : 'bg-gray-200'}`} /> // aclc-step-line
                    )}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div> {/* aclc-step-label */}
                </div>
              )
            })}
          </div>
        </div>

        <div className="section-card aclc-form-card">
          <h2 className="aclc-form-title">Property Details</h2>

          <div className="grid grid-cols-[1fr_1.5fr] gap-4 w-full mb-4 xl:grid-cols-1"> {/* acld-title-desc-grid */}
            <div>
          <label className="block text-sm font-semibold text-blue-600 mb-2" htmlFor="propertyTitle"> {/* aclc-label */}
            Property Title
          </label>
          <input
            id="propertyTitle"
            className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none transition-all duration-150 ease-in-out focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]" // acld-input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your property"
          />
            </div>
            <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-blue-600 mb-2" htmlFor="propertyDescription" style={{ marginBottom: 0 }}> {/* aclc-label */}
              Property Description
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-purple-600 bg-gradient-to-br from-purple-600 to-purple-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:from-purple-700 hover:to-purple-800 hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(124,58,237,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={!data.category || !title || isGenerating}
              onClick={handleAiGenerate}
              title={!data.category || !title ? 'Select a category and enter a title first' : 'Generate description with AI'}
            >
              {isGenerating ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <span className="text-sm leading-none">✨</span>}
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </button>
          </div>
          <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-white mb-0"> {/* acld-editor */}
            <div className="flex items-center gap-2 py-2.5 px-2.5 border-b border-gray-200 bg-white" aria-hidden="true"> {/* acld-editor-toolbar */}
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button"> {/* acld-tool-btn */}
                B
              </button>
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button">
                I
              </button>
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button">
                U
              </button>
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button">
                S
              </button>
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button">
                •
              </button>
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button">
                1.
              </button>
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button">
                ↺
              </button>
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button">
                ↻
              </button>
              <button className="h-7 min-w-[28px] px-2 border border-gray-200 rounded bg-white text-gray-900 font-bold text-xs cursor-default" type="button">
                ⤢
              </button>
            </div>
            <textarea
              id="propertyDescription"
              className="w-full py-3.5 px-4 border border-gray-300 rounded-lg resize-vertical text-sm outline-none text-gray-900 bg-white transition-all duration-150 ease-in-out focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your property in detail..."
              rows={7}
            />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full mt-0 md:grid-cols-1">
            <div>
              <label className="aclc-label" htmlFor="bedrooms">
                Bedrooms
              </label>
              <input
                id="bedrooms"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none transition-all duration-150 ease-in-out focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]"
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="aclc-label" htmlFor="bathrooms">
                Bathrooms
              </label>
              <input
                id="bathrooms"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none transition-all duration-150 ease-in-out focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]"
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="aclc-label" htmlFor="garage">
                Garage
              </label>
              <input
                id="garage"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none transition-all duration-150 ease-in-out focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]"
                type="number"
                min={0}
                value={garage}
                onChange={(e) => setGarage(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-0 md:grid-cols-1">
            <div>
              <label className="aclc-label" htmlFor="floorArea">
                Floor Area
              </label>
              <div className="acld-split">
                <input
                  id="floorArea"
                  className="acld-input acld-split-left"
                  type="number"
                  min={0}
                  value={floorArea}
                  onChange={(e) => setFloorArea(Number(e.target.value))}
                />
                <div className="aclc-select-wrap acld-split-right">
                  <select
                    className="aclc-select acld-select-tight"
                    value={floorUnit}
                    onChange={(e) => setFloorUnit(e.target.value as 'Square Meters' | 'Square Feet')}
                  >
                    <option value="Square Meters">Square Meters</option>
                    <option value="Square Feet">Square Feet</option>
                  </select>
                  <FiChevronDown className="aclc-select-caret" />
                </div>
              </div>
            </div>
            <div>
              <label className="aclc-label" htmlFor="lotArea">
                Lot Area
              </label>
              <input
                id="lotArea"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none transition-all duration-150 ease-in-out focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]"
                type="number"
                min={0}
                value={lotArea}
                onChange={(e) => setLotArea(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-between items-center w-full mt-6 md:flex-col md:items-stretch md:gap-3.5">
            <button className="h-[46px] py-0 px-5.5 rounded-lg border-2 border-blue-600 bg-white text-blue-600 font-bold text-sm inline-flex items-center gap-2.5 cursor-pointer transition-all duration-150 ease-in-out hover:bg-blue-50 hover:-translate-y-px hover:shadow-[0_10px_18px_rgba(37,99,235,0.14)]" onClick={() => router.push('/agent/create-listing/category')} type="button">
              <FiArrowLeft />
              <span>Previous</span>
            </button>

            <button
              className="aclc-next-btn"
              onClick={() => {
                updateData({
                  title,
                  description,
                  bedrooms,
                  bathrooms,
                  garage,
                  floorArea,
                  floorUnit,
                  lotArea,
                })
                router.push('/agent/create-listing/location')
              }}
              type="button"
            >
              <span>Next</span>
              <FiArrowRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

