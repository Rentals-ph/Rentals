'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../../../components/common/AppSidebar'
import { useCreateListing } from '../../../../contexts/CreateListingContext'
import {
  FiBell,
  FiPlus,
  FiChevronDown,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi'
import { generatePropertyDescription, getFallbackDescription } from '../../../../utils/aiDescription'
// import '../../broker-shared.css' // Removed - converted to Tailwind
// import '../../../agent/create-listing/AgentCreateListingCategory.css' // Removed - converted to Tailwind
// import '../../../agent/create-listing/details/page.css' // Removed - file doesn't exist
// import '../../../agent/create-listing/location/page.css' // Removed - file doesn't exist
// import '../../../agent/create-listing/ai-generate.css' // Removed - converted to Tailwind

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

export default function BrokerCreateListingBasicInfo() {
  const router = useRouter()
  const { data, updateData } = useCreateListing()

  const stepLabels = [
    'Basic Information',
    'Visuals & Features',
    'Pricing',
    'Owner Info & Review'
  ]

  // Category state
  const [category, setCategory] = useState(data.category)
  const categories = ['Apartment / Condo', 'House', 'Townhouse', 'Studio', 'Bedspace', 'Commercial', 'Office', 'Warehouse']

  // Details state
  const [title, setTitle] = useState(data.title)
  const [description, setDescription] = useState(data.description)
  const [bedrooms, setBedrooms] = useState<number>(data.bedrooms)
  const [bathrooms, setBathrooms] = useState<number>(data.bathrooms)
  const [garage, setGarage] = useState<number>(data.garage)
  const [floorArea, setFloorArea] = useState<number>(data.floorArea)
  const [floorUnit, setFloorUnit] = useState<'Square Meters' | 'Square Feet'>(data.floorUnit)
  const [lotArea, setLotArea] = useState<number>(data.lotArea)

  // Location state
  const [country, setCountry] = useState(data.country)
  const [state, setState] = useState(data.state)
  const [city, setCity] = useState(data.city)
  const [street, setStreet] = useState(data.street)
  const [latitude, setLatitude] = useState(data.latitude)
  const [longitude, setLongitude] = useState(data.longitude)
  const [zoom, setZoom] = useState(data.zoom)

  useEffect(() => {
    setCategory(data.category)
    setTitle(data.title)
    setDescription(data.description)
    setBedrooms(data.bedrooms)
    setBathrooms(data.bathrooms)
    setGarage(data.garage)
    setFloorArea(data.floorArea)
    setFloorUnit(data.floorUnit)
    setLotArea(data.lotArea)
    setCountry(data.country)
    setState(data.state)
    setCity(data.city)
    setStreet(data.street)
    setLatitude(data.latitude)
    setLongitude(data.longitude)
    setZoom(data.zoom)
  }, [data])

  const canProceed = category && title && description

  const [isGenerating, setIsGenerating] = useState(false)

  const handleAiGenerate = async () => {
    if (!category || !title) return
    setIsGenerating(true)
    try {
      const result = await generatePropertyDescription(category, title)
      setDescription(result)
    } catch {
      setDescription(getFallbackDescription(category, title))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* broker-dashboard */}
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15"> {/* broker-main */}
        <header className="flex items-center justify-between mb-7 md:flex-col md:items-start md:gap-3.5"> {/* broker-header */}
          <div> {/* broker-header-left */}
            <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1 md:text-xl">Create Listing</h1>
            <p className="text-sm text-gray-400 m-0">Add basic property information.</p>
          </div>
          <div className="flex items-center gap-3.5 md:w-full md:justify-between md:gap-2.5"> {/* broker-header-right */}
            <button className="w-10.5 h-10.5 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-600 text-lg transition-all hover:bg-gray-50 hover:text-gray-900 md:w-9.5 md:h-9.5 md:text-base md:flex-shrink-0"><FiBell /></button> {/* broker-notification-btn */}
            <a href="/broker/create-listing" className="bg-blue-600 text-white border-none py-2.5 px-5.5 rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-2 transition-colors no-underline hover:bg-blue-700 md:py-2.25 md:px-4.5 md:text-xs md:flex-1 md:justify-center md:min-w-0"><FiPlus /> Add Listing</a> {/* broker-add-listing-btn */}
          </div>
        </header>

        <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 my-1.5 mx-0 mb-4"> {/* aclc-breadcrumb */}
          <span className="text-gray-900">Create Listing</span> {/* aclc-breadcrumb-strong */}
          <span className="text-gray-400 font-medium">&gt;</span> {/* aclc-breadcrumb-sep */}
          <span className="text-gray-400 font-semibold">Basic Information</span> {/* aclc-breadcrumb-muted */}
        </div>

        <div className="flex items-center gap-4 p-5 mb-6 bg-white rounded-xl shadow-sm md:flex-col md:items-start"> {/* section-card aclc-stepper-card */}
          <div className="flex items-center gap-3 min-w-[220px]"> {/* aclc-stepper-left */}
            <ProgressRing percent={25} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div> {/* aclc-stepper-left-title */}
          </div>
          <div className="flex-1 grid grid-cols-4 items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start"> {/* aclc-steps */}
            {stepLabels.map((label, idx) => {
              const step = idx + 1; const isActive = step === 1; const isDone = step < 1
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}> {/* aclc-step */}
                  <div className="w-full flex items-center relative"> {/* aclc-step-top */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{isDone ? <FiCheck className="text-lg" /> : step}</div> {/* aclc-step-circle */}
                    {step !== stepLabels.length && <div className={`h-1.5 bg-gray-200 rounded-full flex-1 ml-2 mr-2 min-w-0 ${step < 1 ? 'bg-blue-600' : ''}`} />} {/* aclc-step-line */}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div> {/* aclc-step-label */}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm max-w-full"> {/* section-card aclc-form-card */}
          <h2 className="m-0 mb-4 text-3xl font-bold text-gray-900">Basic Property Information</h2> {/* aclc-form-title */}

          {/* Category Section */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="aclc-label" htmlFor="propertyCategory">
              Property Category *
            </label>
            <div className="aclc-select-wrap">
              <select
                id="propertyCategory"
                className="aclc-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" disabled>Select a property category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <FiChevronDown className="aclc-select-caret" />
            </div>
          </div>

          {/* Details Section */}
          <div style={{ marginBottom: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px', color: '#111827' }}>Property Details</h3>

            <div className="acld-title-desc-grid">
              <div>
                <label className="aclc-label" htmlFor="propertyTitle">
                  Property Title *
                </label>
                <input
                  id="propertyTitle"
                  className="acld-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your property"
                />
                <div className="acld-grid-3-compact" style={{ marginTop: '16px' }}>
                  <div>
                    <label className="aclc-label" htmlFor="bedrooms">Bedrooms</label>
                    <input id="bedrooms" className="acld-input acld-input-compact" type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="aclc-label" htmlFor="bathrooms">Bathrooms</label>
                    <input id="bathrooms" className="acld-input acld-input-compact" type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="aclc-label" htmlFor="garage">Garage</label>
                    <input id="garage" className="acld-input acld-input-compact" type="number" min={0} value={garage} onChange={(e) => setGarage(Number(e.target.value))} />
                  </div>
                </div>
              </div>
              <div>
                <div className="ai-generate-row">
                  <label className="aclc-label" htmlFor="propertyDescription" style={{ marginBottom: 0 }}>
                    Property Description *
                  </label>
                  <button
                    type="button"
                    className="ai-generate-btn"
                    disabled={!category || !title || isGenerating}
                    onClick={handleAiGenerate}
                    title={!category || !title ? 'Select a category and enter a title first' : 'Generate description with AI'}
                  >
                    {isGenerating ? <span className="ai-spinner" /> : <span className="ai-sparkle">✨</span>}
                    {isGenerating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <div className="acld-editor">
                  <div className="acld-editor-toolbar" aria-hidden="true">
                    <button className="acld-tool-btn" type="button">B</button>
                    <button className="acld-tool-btn" type="button">I</button>
                    <button className="acld-tool-btn" type="button">U</button>
                    <button className="acld-tool-btn" type="button">S</button>
                    <button className="acld-tool-btn" type="button">•</button>
                    <button className="acld-tool-btn" type="button">1.</button>
                    <button className="acld-tool-btn" type="button">↺</button>
                    <button className="acld-tool-btn" type="button">↻</button>
                    <button className="acld-tool-btn" type="button">⤢</button>
                  </div>
                  <textarea
                    id="propertyDescription"
                    className="acld-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your property in detail..."
                    rows={7}
                  />
                </div>
              </div>
            </div>

            <div className="acld-grid-2" style={{ marginTop: '0' }}>
              <div>
                <label className="aclc-label" htmlFor="floorArea">Floor Area</label>
                <div className="acld-split">
                  <input id="floorArea" className="acld-input acld-split-left" type="number" min={0} value={floorArea} onChange={(e) => setFloorArea(Number(e.target.value))} />
                  <div className="aclc-select-wrap acld-split-right">
                    <select className="aclc-select acld-select-tight" value={floorUnit} onChange={(e) => setFloorUnit(e.target.value as 'Square Meters' | 'Square Feet')}>
                      <option value="Square Meters">Square Meters</option>
                      <option value="Square Feet">Square Feet</option>
                    </select>
                    <FiChevronDown className="aclc-select-caret" />
                  </div>
                </div>
              </div>
              <div>
                <label className="aclc-label" htmlFor="lotArea">Lot Area</label>
                <input id="lotArea" className="acld-input" type="number" min={0} value={lotArea} onChange={(e) => setLotArea(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '12px', color: '#111827' }}>Location</h3>

            <div className="acll-grid-3">
              <div>
                <label className="aclc-label" htmlFor="country">Country</label>
                <div className="aclc-select-wrap">
                  <select id="country" className="aclc-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="Philippines">Philippines</option>
                  </select>
                  <FiChevronDown className="aclc-select-caret" />
                </div>
              </div>
              <div>
                <label className="aclc-label" htmlFor="state">State/Province</label>
                <div className="aclc-select-wrap">
                  <select id="state" className="aclc-select" value={state} onChange={(e) => setState(e.target.value)}>
                    <option value="">--Select State/Province--</option>
                  </select>
                  <FiChevronDown className="aclc-select-caret" />
                </div>
              </div>
              <div>
                <label className="aclc-label" htmlFor="city">City</label>
                <div className="aclc-select-wrap">
                  <select id="city" className="aclc-select" value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value="">--Select City--</option>
                  </select>
                  <FiChevronDown className="aclc-select-caret" />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0', marginBottom: '16px' }}>
              <label className="aclc-label" htmlFor="street">Street Address</label>
              <input id="street" className="acld-input" placeholder="Enter street address, building name, etc." value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>

            <div className="acll-coords-grid">
              <div>
                <label className="aclc-label" htmlFor="latitude">Latitude</label>
                <input id="latitude" className="acld-input" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div>
                <label className="aclc-label" htmlFor="longitude">Longitude</label>
                <input id="longitude" className="acld-input" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
              <div>
                <label className="aclc-label" htmlFor="zoom">Zoom Level</label>
                <input id="zoom" className="acld-input" value={zoom} onChange={(e) => setZoom(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="aclc-next-btn"
              disabled={!canProceed}
              onClick={() => {
                updateData({
                  category, title, description, bedrooms, bathrooms, garage,
                  floorArea, floorUnit, lotArea, country, state, city, street,
                  latitude, longitude, zoom,
                })
                router.push('/broker/create-listing/visuals-features')
              }}
              type="button"
            >
              <span>Next: Visuals & Features</span>
              <FiArrowRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
