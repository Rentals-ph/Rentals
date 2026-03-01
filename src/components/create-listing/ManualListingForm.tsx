'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/common/AppSidebar'
import AgentHeader from '@/components/agent/AgentHeader'
import LocationMap from '@/components/agent/LocationMap'
import { useCreateListing } from '@/contexts/CreateListingContext'
import { createThumbnail } from '@/utils/imageCompression'
import { compressImage } from '@/utils/imageCompression'
import { uploadWithProgress } from '@/utils/uploadProgress'
import { getApiBaseUrl } from '@/config/api'
import { formatPrice } from '@/utils/format'
import { api } from '@/lib/api'
import { getFallbackDescription } from '@/utils/aiDescription'
import { philippinesProvinces, getCitiesByProvince } from '@/data/philippinesLocations'
import {
  FiCheck,
  FiChevronDown,
  FiArrowRight,
  FiUploadCloud,
  FiPlayCircle,
  FiDollarSign,
  FiEdit,
} from 'react-icons/fi'

const CATEGORIES = ['Apartment / Condo', 'House', 'Townhouse', 'Studio', 'Bedspace', 'Commercial', 'Office', 'Warehouse']
const AMENITIES_LIST = ['Air Conditioning', 'Breakfast', 'Kitchen', 'Parking', 'Pool', 'Wi-Fi Internet', 'Pet-Friendly']

function ProgressRing({ percent }: { percent: number }) {
  const { radius, stroke, normalizedRadius, circumference, strokeDashoffset } = useMemo(() => {
    const r = 26
    const s = 6
    const nr = r - s / 2
    const c = nr * 2 * Math.PI
    const offset = c - (percent / 100) * c
    return { radius: r, stroke: s, normalizedRadius: nr, circumference: c, strokeDashoffset: offset }
  }, [percent])
  return (
    <div className="relative w-13 h-13 flex-shrink-0">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle stroke="#E5E7EB" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
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
          className="transition-all duration-250 ease-in"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">{percent}%</div>
    </div>
  )
}

export function ManualListingForm() {
  const router = useRouter()
  const { data, updateData, resetData } = useCreateListing()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stepLabels = ['Category', 'Details', 'Location', 'Property Images', 'Pricing', 'Attributes', 'Review & Publish']
  const currentStepIndex = 6
  const percent = stepLabels.length > 0 ? Math.round(((currentStepIndex + 1) / stepLabels.length) * 100) : 0

  // Category
  const [category, setCategory] = useState(data.category)
  // Details
  const [title, setTitle] = useState(data.title)
  const [description, setDescription] = useState(data.description)
  const [bedrooms, setBedrooms] = useState<number>(data.bedrooms)
  const [bathrooms, setBathrooms] = useState<number>(data.bathrooms)
  const [garage, setGarage] = useState<number>(data.garage)
  const [floorArea, setFloorArea] = useState<number>(data.floorArea)
  const [floorUnit, setFloorUnit] = useState<'Square Meters' | 'Square Feet'>(data.floorUnit)
  const [lotArea, setLotArea] = useState<number>(data.lotArea)
  const [isGenerating, setIsGenerating] = useState(false)
  // Location
  const [country, setCountry] = useState(data.country || 'Philippines')
  const [state, setState] = useState(data.state || '')
  const [city, setCity] = useState(data.city || '')
  const [street, setStreet] = useState(data.street || '')
  const [latitude, setLatitude] = useState(data.latitude || '')
  const [longitude, setLongitude] = useState(data.longitude || '')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [isGeocoding, setIsGeocoding] = useState(false)
  // Images
  const [images, setImages] = useState<File[]>(data.images)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState(data.videoUrl)
  // Pricing
  const [price, setPrice] = useState(data.price)
  const [priceType, setPriceType] = useState<'Monthly' | 'Weekly' | 'Daily' | 'Yearly'>(data.priceType)
  // Attributes
  const [amenities, setAmenities] = useState<string[]>(data.amenities)
  // Publish
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

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
    setImages(data.images)
    setVideoUrl(data.videoUrl)
    setPrice(data.price)
    setPriceType(data.priceType)
    setAmenities(data.amenities)
  }, [data])

  useEffect(() => {
    if (state) {
      setAvailableCities(getCitiesByProvince(state))
      if (city && !getCitiesByProvince(state).includes(city)) setCity('')
    } else setAvailableCities([])
  }, [state])

  useEffect(() => {
    const generateThumbnails = async () => {
      const thumbs = await Promise.all(
        data.images.map((f) => createThumbnail(f, 200).catch(() => URL.createObjectURL(f)))
      )
      setThumbnails(thumbs)
    }
    if (data.images.length > 0) generateThumbnails()
    else setThumbnails([])
  }, [data.images])

  useEffect(() => {
    return () => thumbnails.forEach((url) => url.startsWith('blob:') && URL.revokeObjectURL(url))
  }, [thumbnails])

  const syncToContext = () => {
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
      state,
      city,
      street,
      latitude: latitude || '',
      longitude: longitude || '',
      images,
      videoUrl,
      price,
      priceType,
      amenities,
    })
  }

  const handleStreetChange = async (value: string) => {
    setStreet(value)
    if (value.trim().length > 10) {
      setIsGeocoding(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ', Philippines')}&limit=1`,
          { headers: { 'User-Agent': 'Rental.ph Property Listing' } }
        )
        const json = await res.json()
        if (json?.[0]) {
          const r = json[0]
          setLatitude(r.lat)
          setLongitude(r.lon)
          setCountry('Philippines')
          const addr = r.display_name || ''
          const prov = philippinesProvinces.find((p) => addr.includes(p.name))
          if (prov) {
            setState(prov.name)
            const cityMatch = prov.cities.find((c) => addr.includes(c))
            if (cityMatch) setCity(cityMatch)
          }
        }
      } catch {
        /* ignore */
      } finally {
        setIsGeocoding(false)
      }
    }
  }

  const handleAiGenerate = async () => {
    if (!category || !title) return
    setIsGenerating(true)
    try {
      const response = await api.generatePropertyDescription(category, title)
      setDescription(response?.success && response?.data ? response.data : getFallbackDescription(category, title))
    } catch {
      setDescription(getFallbackDescription(category, title))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    setImages((prev) => [...prev, ...files])
    const thumbs = await Promise.all(files.map((f) => createThumbnail(f, 200).catch(() => URL.createObjectURL(f))))
    setThumbnails((prev) => [...prev, ...thumbs])
  }
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
    setImages((prev) => [...prev, ...files])
    const thumbs = await Promise.all(files.map((f) => createThumbnail(f, 200).catch(() => URL.createObjectURL(f))))
    setThumbnails((prev) => [...prev, ...thumbs])
  }
  const handleRemoveImage = (index: number) => {
    if (thumbnails[index]?.startsWith('blob:')) URL.revokeObjectURL(thumbnails[index])
    setImages((prev) => prev.filter((_, i) => i !== index))
    setThumbnails((prev) => prev.filter((_, i) => i !== index))
  }
  const handleAmenityChange = (a: string) => {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  const handlePublish = async () => {
    syncToContext()
    setIsSubmitting(true)
    setIsCompressing(true)
    setSubmitError(null)
    setUploadProgress(0)
    try {
      let compressedImage: File | null = null
      const imagesToUse = images.length > 0 ? images : data.images
      if (imagesToUse.length > 0) {
        try {
          compressedImage = await compressImage(imagesToUse[0], { maxWidth: 1920, maxHeight: 1920, quality: 0.85, maxSizeMB: 2 })
        } catch {
          compressedImage = imagesToUse[0]
        }
      }
      setIsCompressing(false)
      const formDataObj = new FormData()
      const propertyData = {
        title,
        description,
        type: category,
        location: street || city || state || country,
        price,
        price_type: priceType,
        bedrooms: bedrooms.toString(),
        bathrooms: bathrooms.toString(),
        garage: garage.toString(),
        area: floorArea.toString(),
        lot_area: lotArea.toString(),
        floor_area_unit: floorUnit,
      }
      Object.entries(propertyData).forEach(([k, v]) => formDataObj.append(k, v))
      if (amenities.length > 0) formDataObj.append('amenities', JSON.stringify(amenities))
      const locationData = {
        latitude,
        longitude,
        country: country || 'Philippines',
        state_province: state,
        city,
        street_address: street,
      }
      Object.entries(locationData).forEach(([k, v]) => { if (v) formDataObj.append(k, v) })
      if (videoUrl) formDataObj.append('video_url', videoUrl)
      if (compressedImage) formDataObj.append('image', compressedImage)
      const token = localStorage.getItem('auth_token')
      const response = await uploadWithProgress(
        `${getApiBaseUrl()}/properties`,
        formDataObj,
        token,
        (p) => setUploadProgress(p.percent)
      )
      const responseData = await response.json()
      if (response.ok && responseData.success) {
        resetData()
        setUploadProgress(100)
        setTimeout(() => {
          window.alert('Listing published successfully!')
          router.push('/agent/listings')
        }, 300)
      } else {
        setSubmitError(responseData.message || 'Failed to publish listing. Please try again.')
        setUploadProgress(0)
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred while publishing.')
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
      setIsCompressing(false)
    }
  }

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const inputClass = 'w-full h-11 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]'
  const labelClass = 'block text-sm font-semibold text-blue-600 mb-2'
  const selectClass = 'w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm outline-none appearance-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]'

  const propertySummary = {
    category: category || 'Not Set',
    title: title || 'Not Set',
    price: price ? formatPrice(Number(price)) : 'Not Set',
    priceType: priceType || 'Monthly',
    location: street ? `${street}, ${city || ''}, ${state || ''}`.trim() : city || state || 'Not Set',
    bedrooms: bedrooms?.toString() ?? '0',
    bathrooms: bathrooms?.toString() ?? '0',
    floorArea: floorArea ? `${floorArea} ${floorUnit}` : 'Not Set',
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-outfit">
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader title="Create Listing" subtitle="Add a new property to your portfolio." />
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <a href="/agent/create-listing" className="text-gray-900 hover:text-blue-600 no-underline">Create Listing</a>
          <span className="text-gray-400">&gt;</span>
          <span className="text-gray-400 font-semibold">Manual Listing</span>
        </div>

        <div className="flex items-center gap-4 p-6 mb-6 bg-white rounded-xl shadow-sm border border-gray-100 md:flex-col md:items-start">
          <div className="flex items-center gap-3 min-w-[220px]">
            <ProgressRing percent={Math.min(percent, 100)} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div>
          </div>
          <div className="flex-1 grid items-start gap-0 w-full overflow-x-auto pb-1.5" style={{ gridTemplateColumns: `repeat(${stepLabels.length}, minmax(0, 1fr))` }}>
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = currentStepIndex === idx
              const isDone = currentStepIndex > idx
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}>
                  <div className="w-full flex items-center relative">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {isDone ? <FiCheck className="text-lg" /> : step}
                    </div>
                    {idx !== stepLabels.length - 1 && (
                      <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 ${isDone ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Category */}
          <section id="section-category" className="section-card p-7 pb-6 bg-white rounded-xl shadow-sm">
            <h2 className="m-0 mb-4 text-2xl font-bold text-gray-900">Property Category</h2>
            <label className={labelClass} htmlFor="propertyCategory">Property Category</label>
            <div className="relative w-full max-w-md">
              <select id="propertyCategory" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select a property category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg" />
            </div>
          </section>

          {/* Details */}
          <section id="section-details" className="section-card p-7 pb-6 bg-white rounded-xl shadow-sm">
            <h2 className="m-0 mb-4 text-2xl font-bold text-gray-900">Property Details</h2>
            <div className="grid grid-cols-[1fr_1.5fr] gap-4 w-full mb-4 xl:grid-cols-1">
              <div>
                <label className={labelClass} htmlFor="propertyTitle">Property Title</label>
                <input id="propertyTitle" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a title for your property" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass} htmlFor="propertyDescription">Property Description</label>
                  <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-purple-600 bg-gradient-to-br from-purple-600 to-purple-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:from-purple-700 hover:to-purple-800 disabled:opacity-55" disabled={!category || !title || isGenerating} onClick={handleAiGenerate}>
                    {isGenerating ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : '✨'} {isGenerating ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea id="propertyDescription" className="w-full py-3.5 px-4 border border-gray-300 rounded-lg resize-y text-sm text-gray-900 bg-white focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your property..." rows={5} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 md:grid-cols-1">
              <div><label className={labelClass} htmlFor="bedrooms">Bedrooms</label><input id="bedrooms" className={inputClass} type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} /></div>
              <div><label className={labelClass} htmlFor="bathrooms">Bathrooms</label><input id="bathrooms" className={inputClass} type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} /></div>
              <div><label className={labelClass} htmlFor="garage">Garage</label><input id="garage" className={inputClass} type="number" min={0} value={garage} onChange={(e) => setGarage(Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-1">
              <div className="flex gap-2">
                <div className="flex-1"><label className={labelClass} htmlFor="floorArea">Floor Area</label><input id="floorArea" className={inputClass} type="number" min={0} value={floorArea} onChange={(e) => setFloorArea(Number(e.target.value))} /></div>
                <div className="w-36"><label className={labelClass} htmlFor="floorUnit">Unit</label>
                  <div className="relative"><select id="floorUnit" className={selectClass} value={floorUnit} onChange={(e) => setFloorUnit(e.target.value as 'Square Meters' | 'Square Feet')}><option value="Square Meters">Sq m</option><option value="Square Feet">Sq ft</option></select><FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" /></div>
                </div>
              </div>
              <div><label className={labelClass} htmlFor="lotArea">Lot Area</label><input id="lotArea" className={inputClass} type="number" min={0} value={lotArea} onChange={(e) => setLotArea(Number(e.target.value))} /></div>
            </div>
          </section>

          {/* Location */}
          <section id="section-location" className="section-card p-7 pb-6 bg-white rounded-xl shadow-sm">
            <h2 className="m-0 mb-4 text-2xl font-bold text-gray-900">Property Location</h2>
            <div className="grid grid-cols-3 gap-4 mb-4 lg:grid-cols-1">
              <div><label className={labelClass} htmlFor="country">Country</label><select id="country" className={selectClass} value={country} onChange={(e) => setCountry(e.target.value)}><option value="Philippines">Philippines</option></select></div>
              <div><label className={labelClass} htmlFor="state">State/Province</label>
                <select id="state" className={selectClass} value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">--Select--</option>
                  {philippinesProvinces.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div><label className={labelClass} htmlFor="city">City</label>
                <select id="city" className={selectClass} value={city} onChange={(e) => setCity(e.target.value)} disabled={!state}>
                  <option value="">--Select--</option>
                  {availableCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className={labelClass} htmlFor="street">Street Address</label>
              <input id="street" className={inputClass} placeholder="Enter street address (location auto-detected)" value={street} onChange={(e) => handleStreetChange(e.target.value)} />
              {isGeocoding && <div className="mt-2 py-2 px-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">Detecting location...</div>}
            </div>
            <LocationMap latitude={latitude || null} longitude={longitude || null} onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng) }} onAddressChange={(addr) => { if (addr.country) setCountry(addr.country); if (addr.state) setState(addr.state); if (addr.city) setCity(addr.city); if (addr.street) setStreet(addr.street) }} />
          </section>

          {/* Property Images */}
          <section id="section-images" className="section-card p-7 pb-6 bg-white rounded-xl shadow-sm">
            <h2 className="m-0 mb-4 text-2xl font-bold text-gray-900">Property Gallery</h2>
            <p className="mb-4 text-sm text-gray-600">Upload at least 5 photos. First image will be the main image.</p>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
            <div className="mb-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-10 flex flex-col items-center text-center cursor-pointer hover:bg-sky-100 hover:border-blue-400" onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
              <FiUploadCloud className="text-[40px] text-blue-600 mb-2.5" />
              <p className="m-0 mb-1 text-lg font-semibold text-gray-900">Drop files here or click to upload</p>
              <p className="m-0 text-sm text-gray-600">Upload high-quality images. For best results, add at least 5 photos.</p>
            </div>
            {images.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative inline-block">
                    <img src={thumbnails[i] || URL.createObjectURL(img)} alt={`Preview ${i + 1}`} className="w-[100px] h-[100px] object-cover rounded-lg" />
                    <button type="button" onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white border-none rounded-full w-6 h-6 cursor-pointer flex items-center justify-center text-lg leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5">
              <label className={labelClass}>Video Link (Optional)</label>
              <div className="flex items-center gap-0">
                <div className="flex items-center justify-center px-3.5 bg-blue-50 border border-gray-300 border-r-0 rounded-l-lg"><FiPlayCircle className="text-xl text-blue-600" /></div>
                <input className="flex-1 border border-gray-300 p-2.5 px-3 text-sm rounded-r-lg outline-none" placeholder="Youtube/video link" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="section-pricing" className="section-card p-7 pb-6 bg-white rounded-xl shadow-sm">
            <h2 className="m-0 mb-4 text-2xl font-bold text-gray-900">Pricing</h2>
            <div className="grid grid-cols-[1.1fr_0.9fr] gap-6 lg:grid-cols-1">
              <div>
                <label className={labelClass}>Price</label>
                <div className="relative"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><FiDollarSign className="w-5 h-5" /></div><input type="text" className={`${inputClass} pl-11`} placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
              </div>
              <div>
                <label className={labelClass}>Price Type</label>
                <div className="relative"><select className={selectClass} value={priceType} onChange={(e) => setPriceType(e.target.value as 'Monthly' | 'Weekly' | 'Daily' | 'Yearly')}><option value="Monthly">Monthly</option><option value="Weekly">Weekly</option><option value="Daily">Daily</option><option value="Yearly">Yearly</option></select><FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" /></div>
              </div>
            </div>
          </section>

          {/* Attributes */}
          <section id="section-attributes" className="section-card p-7 pb-6 bg-white rounded-xl shadow-sm">
            <h2 className="m-0 mb-4 text-2xl font-bold text-gray-900">Attributes</h2>
            <h3 className="mb-3 text-base font-semibold text-gray-900">Amenities</h3>
            <div className="grid grid-cols-4 gap-4 xl:grid-cols-3 md:grid-cols-2">
              {AMENITIES_LIST.map((a) => (
                <label key={a} className="flex cursor-pointer select-none items-center gap-2.5">
                  <input type="checkbox" className="h-5 w-5 flex-shrink-0 accent-blue-600" checked={amenities.includes(a)} onChange={() => handleAmenityChange(a)} />
                  <span className="text-sm font-medium text-gray-900">{a}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Review & Publish */}
          <section id="section-review" className="section-card p-7 pb-6 bg-white rounded-xl shadow-sm">
            <h2 className="m-0 mb-4 text-2xl font-bold text-gray-900">Review & Publish</h2>
            <p className="text-sm text-gray-600 mb-4">Review your listing and publish. Listed by Agent — contact details are yours as the listing agent.</p>
            {submitError && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 text-sm">{submitError}</div>}
            {(isSubmitting || isCompressing) && (
              <div className="mb-4 rounded-lg bg-gray-100 p-4">
                <div className="mb-2 flex justify-between text-sm text-gray-600"><span>{isCompressing ? 'Compressing images...' : 'Uploading listing...'}</span><span>{uploadProgress}%</span></div>
                <div className="h-2 w-full overflow-hidden rounded bg-gray-200"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {([
                  { key: 'category', label: 'Category', value: propertySummary.category, sectionId: 'section-category' },
                  { key: 'title', label: 'Title', value: propertySummary.title, sectionId: 'section-details' },
                  { key: 'price', label: 'Price', value: `${propertySummary.price} (${propertySummary.priceType})`, sectionId: 'section-pricing' },
                  { key: 'location', label: 'Location', value: propertySummary.location, sectionId: 'section-location' },
                  { key: 'bedrooms', label: 'Bedrooms', value: propertySummary.bedrooms, sectionId: 'section-details' },
                  { key: 'bathrooms', label: 'Bathrooms', value: propertySummary.bathrooms, sectionId: 'section-details' },
                  { key: 'floorArea', label: 'Floor Area', value: propertySummary.floorArea, sectionId: 'section-details' },
                ] as const).map(({ label, value, sectionId }) => (
                  <div key={label} className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                    <div className="text-sm font-semibold text-gray-600">{label}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900 text-right max-w-xs truncate">{value}</div>
                      <button type="button" className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded" onClick={() => scrollToSection(sectionId)}><FiEdit className="w-3 h-3" /> Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-3">
              <button type="button" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold text-sm rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => syncToContext()}>Save draft</button>
              <button type="button" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handlePublish} disabled={isSubmitting || isCompressing || !price || !category || !title || images.length < 5}>
                {isCompressing ? 'Compressing...' : isSubmitting ? `Publishing... ${uploadProgress}%` : 'Publish Listing'} <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
