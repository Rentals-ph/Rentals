'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LocationMap from '../agent/LocationMap'
import { useCreateListing } from '../../contexts/CreateListingContext'
import { FiChevronDown, FiArrowRight } from 'react-icons/fi'
import { generatePropertyDescription, getFallbackDescription } from '../../utils/aiDescription'

export interface BasicInfoStepContentProps {
  /** Path to navigate to on Next (e.g. /agent/create-listing/visuals-features or /broker/create-listing/visuals-features) */
  nextStepPath: string
  /** Show zoom level field (e.g. broker flow) */
  showZoom?: boolean
}

const CATEGORIES = ['Apartment / Condo', 'House', 'Townhouse', 'Studio', 'Bedspace', 'Commercial', 'Office', 'Warehouse']

export function BasicInfoStepContent({ nextStepPath, showZoom = false }: BasicInfoStepContentProps) {
  const router = useRouter()
  const { data, updateData } = useCreateListing()

  const [category, setCategory] = useState(data.category)
  const [title, setTitle] = useState(data.title)
  const [description, setDescription] = useState(data.description)
  const [bedrooms, setBedrooms] = useState<number>(data.bedrooms)
  const [bathrooms, setBathrooms] = useState<number>(data.bathrooms)
  const [garage, setGarage] = useState<number>(data.garage)
  const [floorArea, setFloorArea] = useState<number>(data.floorArea)
  const [floorUnit, setFloorUnit] = useState<'Square Meters' | 'Square Feet'>(data.floorUnit)
  const [lotArea, setLotArea] = useState<number>(data.lotArea)
  const [country, setCountry] = useState(data.country || 'Philippines')
  const [state, setState] = useState(data.state || '')
  const [city, setCity] = useState(data.city || '')
  const [street, setStreet] = useState(data.street || '')
  const [latitude, setLatitude] = useState(data.latitude || '')
  const [longitude, setLongitude] = useState(data.longitude || '')
  const [zoom, setZoom] = useState(data.zoom || '15')
  const [isGenerating, setIsGenerating] = useState(false)

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
    setCountry(data.country || 'Philippines')
    setState(data.state || '')
    setCity(data.city || '')
    setStreet(data.street || '')
    setLatitude(data.latitude || '')
    setLongitude(data.longitude || '')
    setZoom(data.zoom || '15')
  }, [data])

  const canProceed = Boolean(category && title && description)

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

  const handleNext = () => {
    updateData({
      category,
      title,
      description,
      bedrooms,
      bathrooms,
      garage,
      floorArea,
      floorUnit,
      lotArea,
      country: country || 'Philippines',
      state: state || '',
      city: city || '',
      street: street || '',
      latitude: latitude || '',
      longitude: longitude || '',
      ...(showZoom && { zoom: zoom || '15' }),
    })
    router.push(nextStepPath)
  }

  const inputClass = 'w-full h-11 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
  const labelClass = 'block text-sm font-semibold text-gray-900 mb-2'
  const selectClass = 'w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">Basic Property Information</h2>
        <p className="text-sm text-gray-600 mt-1">Fill in the essential details about your property</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <label htmlFor="propertyCategory" className={labelClass}>
                Property Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select id="propertyCategory" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="" disabled>Select a property category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <label htmlFor="propertyTitle" className={labelClass}>
                Property Title <span className="text-red-500">*</span>
              </label>
              <input id="propertyTitle" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a title for your property" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="propertyDescription" className={labelClass}>
                Property Description <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-purple-600 bg-gradient-to-br from-purple-600 to-purple-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:from-purple-700 hover:to-purple-800 hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(124,58,237,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
                disabled={!category || !title || isGenerating}
                onClick={handleAiGenerate}
                title={!category || !title ? 'Select a category and enter a title first' : 'Generate description with AI'}
              >
                {isGenerating ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <span className="text-sm leading-none">✨</span>}
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50" aria-hidden="true">
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">B</button>
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">I</button>
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">U</button>
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">S</button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">•</button>
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">1.</button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">↺</button>
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">↻</button>
                <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors text-xs font-semibold" type="button">⤢</button>
              </div>
              <textarea
                id="propertyDescription"
                className="w-full px-4 py-3 border-0 rounded-b-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none resize-y min-h-[200px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your property in detail..."
                rows={8}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Property Specifications</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bedrooms" className={labelClass}>Bedrooms <span className="text-red-500">*</span></label>
                <input id="bedrooms" className={inputClass} type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} />
              </div>
              <div>
                <label htmlFor="bathrooms" className={labelClass}>Bathrooms <span className="text-red-500">*</span></label>
                <input id="bathrooms" className={inputClass} type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} />
              </div>
              <div>
                <label htmlFor="garage" className={labelClass}>Garage</label>
                <input id="garage" className={inputClass} type="number" min={0} value={garage} onChange={(e) => setGarage(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="floorArea" className={labelClass}>Floor Area</label>
                <input id="floorArea" className={inputClass} type="number" min={0} value={floorArea} onChange={(e) => setFloorArea(Number(e.target.value))} />
              </div>
              <div>
                <label htmlFor="floorUnit" className={labelClass}>Unit</label>
                <div className="relative">
                  <select id="floorUnit" className={selectClass} value={floorUnit} onChange={(e) => setFloorUnit(e.target.value as 'Square Meters' | 'Square Feet')}>
                    <option value="Square Meters">Square Meters</option>
                    <option value="Square Feet">Square Feet</option>
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="lotArea" className={labelClass}>Lot Area</label>
                <input id="lotArea" className={inputClass} type="number" min={0} value={lotArea} onChange={(e) => setLotArea(Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Location</h3>
          <div className="mt-4">
            <LocationMap
              latitude={latitude || null}
              longitude={longitude || null}
              onLocationChange={(lat, lng) => {
                setLatitude(lat)
                setLongitude(lng)
              }}
              onAddressChange={(address) => {
                if (address.country) setCountry(address.country)
                if (address.state) setState(address.state)
                if (address.city) setCity(address.city)
                if (address.street) setStreet(address.street)
              }}
            />
          </div>
          {showZoom && (
            <div className="mt-4">
              <label htmlFor="zoom" className={labelClass}>Zoom Level</label>
              <input id="zoom" className={inputClass} value={zoom} onChange={(e) => setZoom(e.target.value)} />
            </div>
          )}
          <input type="hidden" name="country" value={country} />
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="city" value={city} />
          <input type="hidden" name="street" value={street} />
          <input type="hidden" name="latitude" value={latitude} />
          <input type="hidden" name="longitude" value={longitude} />
        </div>
      </div>

      <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 flex justify-end">
        <button
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          disabled={!canProceed}
          onClick={handleNext}
          type="button"
        >
          <span>Next: Visuals & Features</span>
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
