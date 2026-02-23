'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../../../components/common/AppSidebar'
import AgentHeader from '../../../../components/agent/AgentHeader'
import { useCreateListing } from '../../../../contexts/CreateListingContext'
import { compressImage } from '../../../../utils/imageCompression'
import { uploadWithProgress } from '../../../../utils/uploadProgress'
import { getApiBaseUrl } from '../../../../config/api'

import {
  FiCheck,
  FiEdit,
  FiArrowLeft,
  FiArrowRight,
  FiUpload,
  FiDollarSign,
  FiChevronDown
} from 'react-icons/fi'
// Converted to Tailwind CSS

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

export default function AgentCreateListingOwnerReview() {
  const router = useRouter()
  const { data, updateData, resetData } = useCreateListing()
  
  // Streamlined 3-step flow (pricing merged into this step)
  const stepLabels = [
    'Basic Information',
    'Visuals & Features',
    'Owner Info & Review'
  ]

  // Owner Info state
  const [formData, setFormData] = useState({
    firstname: data.ownerFirstname,
    lastname: data.ownerLastname,
    phone: data.ownerPhone,
    email: data.ownerEmail,
    country: data.ownerCountry,
    state: data.ownerState,
    city: data.ownerCity,
    streetAddress: data.ownerStreetAddress
  })
  const [countryCode, setCountryCode] = useState('+63')
  const [rapaFile, setRapaFile] = useState<File | null>(data.rapaFile)

  // Pricing state
  const [price, setPrice] = useState(data.price)
  const [priceType, setPriceType] = useState<'Monthly' | 'Weekly' | 'Daily' | 'Yearly'>(data.priceType)

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    setFormData({
      firstname: data.ownerFirstname,
      lastname: data.ownerLastname,
      phone: data.ownerPhone,
      email: data.ownerEmail,
      country: data.ownerCountry,
      state: data.ownerState,
      city: data.ownerCity,
      streetAddress: data.ownerStreetAddress
    })
    setRapaFile(data.rapaFile)
    setPrice(data.price)
    setPriceType(data.priceType)
    
    // Check if agent account is processing
    const registrationStatus = localStorage.getItem('agent_registration_status')
    const agentStatus = localStorage.getItem('agent_status')
    
    if (registrationStatus === 'processing' || 
        agentStatus === 'processing' || 
        agentStatus === 'pending' || 
        agentStatus === 'under_review') {
      setIsProcessing(true)
    }
  }, [data])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRapaFile(e.target.files[0])
    }
  }

  const propertyData = {
    category: data.category || 'Not Set',
    title: data.title || 'Not Set',
    price: price ? `₱${price}` : 'Not Set',
    priceType: priceType || 'Monthly',
    location: data.street 
      ? `${data.street}, ${data.city || ''}, ${data.state || ''}`.trim()
      : data.city || data.state || 'Not Set',
    bedrooms: data.bedrooms?.toString() || '0',
    bathrooms: data.bathrooms?.toString() || '0',
    floorArea: data.floorArea ? `${data.floorArea} ${data.floorUnit}` : 'Not Set',
  }

  const handleEdit = (section: string) => {
    const stepMap: Record<string, string> = {
      category: '/agent/create-listing/basic-info',
      title: '/agent/create-listing/basic-info',
      price: '/agent/create-listing/owner-review',
      location: '/agent/create-listing/basic-info',
      bedrooms: '/agent/create-listing/basic-info',
      bathrooms: '/agent/create-listing/basic-info',
      floorArea: '/agent/create-listing/basic-info',
      video: '/agent/create-listing/visuals-features',
      amenities: '/agent/create-listing/visuals-features',
    }
    const route = stepMap[section] || '/agent/create-listing/basic-info'
    router.push(route)
  }

  const handlePublish = async () => {
    setIsSubmitting(true)
    setIsCompressing(true)
    setSubmitError(null)
    setUploadProgress(0)

    try {
      // Update owner info and pricing
      updateData({
        ownerFirstname: formData.firstname,
        ownerLastname: formData.lastname,
        ownerPhone: formData.phone,
        ownerEmail: formData.email,
        ownerCountry: formData.country,
        ownerState: formData.state,
        ownerCity: formData.city,
        ownerStreetAddress: formData.streetAddress,
        rapaFile,
        price,
        priceType,
      })

      // Compress images
      let compressedImage: File | null = null
      if (data.images.length > 0) {
        try {
          compressedImage = await compressImage(data.images[0], {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            maxSizeMB: 2,
          })
        } catch (compressError) {
          console.warn('Image compression failed, using original:', compressError)
          compressedImage = data.images[0]
        }
      }
      setIsCompressing(false)

      // Create FormData
      const formDataObj = new FormData()
      
      const propertyDataObj = {
        title: data.title,
        description: data.description,
        type: data.category,
        location: data.street || data.city || data.state || data.country,
        price: price,
        price_type: priceType,
        bedrooms: data.bedrooms.toString(),
        bathrooms: data.bathrooms.toString(),
        garage: data.garage.toString(),
        area: data.floorArea.toString(),
        lot_area: data.lotArea.toString(),
        floor_area_unit: data.floorUnit,
      }
      
      Object.entries(propertyDataObj).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })
      
      if (data.amenities.length > 0) {
        formDataObj.append('amenities', JSON.stringify(data.amenities))
      }
      
      const locationData = {
        latitude: data.latitude,
        longitude: data.longitude,
        country: data.country,
        state_province: data.state,
        city: data.city,
        street_address: data.street,
      }
      
      Object.entries(locationData).forEach(([key, value]) => {
        if (value) formDataObj.append(key, value)
      })
      
      if (data.videoUrl) {
        formDataObj.append('video_url', data.videoUrl)
      }
      
      if (compressedImage) {
        formDataObj.append('image', compressedImage)
      }
      
      // Upload with progress
      const API_BASE_URL = getApiBaseUrl()
      const token = localStorage.getItem('auth_token')
      
      const response = await uploadWithProgress(
        `${API_BASE_URL}/properties`,
        formDataObj,
        token,
        (progress) => {
          setUploadProgress(progress.percent)
        }
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
    } catch (error) {
      console.error('Error publishing listing:', error)
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while publishing. Please try again.')
    } finally {
      setIsSubmitting(false)
      setIsCompressing(false)
    }
  }


  return (
    <div className="flex min-h-screen bg-gray-50 font-outfit">
      <AppSidebar/>
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="Create Listing" 
          subtitle="Add owner information and review your listing." 
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <span className="text-gray-900">Create Listing</span>
          <span className="text-gray-400 font-medium">&gt;</span>
          <span className="text-gray-400 font-semibold">Owner Info & Review</span>
        </div>

        {/* Progress Stepper Card */}
        <div className="flex items-center gap-4 p-6 mb-6 bg-white rounded-xl shadow-sm border border-gray-100 md:flex-col md:items-start">
          <div className="flex items-center gap-3 min-w-[220px]">
            <ProgressRing percent={100} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div>
          </div>

          <div className="flex-1 grid grid-cols-3 items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start">
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 3
              const isDone = step < 3
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}>
                  <div className="w-full flex items-center relative">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {isDone ? <FiCheck className="text-lg" /> : step}
                    </div>
                    {step !== stepLabels.length && (
                      <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 ${step < 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900">Owner Information & Review</h2>
            <p className="text-sm text-gray-600 mt-1">Complete owner details and review your listing before publishing</p>
          </div>

          {isProcessing && (
            <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#FE8E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 6V10M10 14H10.01" stroke="#FE8E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> Your account is currently under review. Your listing will be saved but won't be visible to users until your account is approved.
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Two Column Layout: Owner Info (Left) and Property Summary (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Property Owner Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Property Owner Information</h3>
                
                {/* RAPA Upload Card */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">RAPA Upload</h4>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="rapa-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                    />
                    <label 
                      htmlFor="rapa-upload" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <FiUpload className="w-4 h-4" />
                      <span>Choose File</span>
                    </label>
                    <div className="text-sm text-gray-600 mt-2">
                      {rapaFile ? (
                        <span className="font-medium text-gray-900">{rapaFile.name}</span>
                      ) : (
                        <span className="text-gray-500">No file chosen</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Owner Info Card */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Lessor/Property Owner Info</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="firstname">Firstname</label>
                      <input
                        id="firstname"
                        type="text"
                        className="w-full h-11 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter First Name"
                        value={formData.firstname}
                        onChange={(e) => handleInputChange('firstname', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="lastname">Lastname</label>
                      <input
                        id="lastname"
                        type="text"
                        className="w-full h-11 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter Last Name"
                        value={formData.lastname}
                        onChange={(e) => handleInputChange('lastname', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="phone">Phone</label>
                      <div className="flex gap-2">
                        <div className="relative w-40 flex-shrink-0">
                          <select
                            className="w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                          >
                            <option value="+63">(+63) Philippines</option>
                            <option value="+1">(+1) United States</option>
                            <option value="+44">(+44) United Kingdom</option>
                          </select>
                          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          className="flex-1 h-11 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter Phone Number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        className="w-full h-11 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="ownerCountry">Country</label>
                      <div className="relative">
                        <select
                          id="ownerCountry"
                          className="w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                        >
                          <option value="Philippines">Philippines</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="ownerState">State/Province</label>
                      <div className="relative">
                        <select
                          id="ownerState"
                          className="w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                        >
                          <option value="">--Select State/Province--</option>
                          <option value="Metro Manila">Metro Manila</option>
                          <option value="Calabarzon">Calabarzon</option>
                          <option value="Central Luzon">Central Luzon</option>
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="ownerCity">City</label>
                      <div className="relative">
                        <select
                          id="ownerCity"
                          className="w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                        >
                          <option value="">--Select City--</option>
                          <option value="Manila">Manila</option>
                          <option value="Makati">Makati</option>
                          <option value="Quezon City">Quezon City</option>
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="streetAddress">Street Address</label>
                      <input
                        id="streetAddress"
                        type="text"
                        className="w-full h-11 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter Street Address"
                        value={formData.streetAddress}
                        onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Card */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Pricing</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <FiDollarSign className="w-5 h-5" />
                        </div>
                        <input
                          id="price"
                          type="text"
                          className="w-full h-11 pl-11 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Price Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="price-type"
                          className="w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                          value={priceType}
                          onChange={(e) => setPriceType(e.target.value as 'Monthly' | 'Weekly' | 'Daily' | 'Yearly')}
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Daily">Daily</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Property Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Summary</h3>
                
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 sticky top-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                      <div className="text-sm font-semibold text-gray-600">Category</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 text-right">{propertyData.category}</div>
                        <button 
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" 
                          onClick={() => handleEdit('category')} 
                          type="button"
                        >
                          <FiEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                      <div className="text-sm font-semibold text-gray-600">Title</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 text-right max-w-xs truncate">{propertyData.title}</div>
                        <button 
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" 
                          onClick={() => handleEdit('title')} 
                          type="button"
                        >
                          <FiEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                      <div className="text-sm font-semibold text-gray-600">Price</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 text-right">{propertyData.price} ({propertyData.priceType})</div>
                        <button 
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" 
                          onClick={() => handleEdit('price')} 
                          type="button"
                        >
                          <FiEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                      <div className="text-sm font-semibold text-gray-600">Location</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 text-right max-w-xs truncate">{propertyData.location}</div>
                        <button 
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" 
                          onClick={() => handleEdit('location')} 
                          type="button"
                        >
                          <FiEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                      <div className="text-sm font-semibold text-gray-600">Bedrooms</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 text-right">{propertyData.bedrooms}</div>
                        <button 
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" 
                          onClick={() => handleEdit('bedrooms')} 
                          type="button"
                        >
                          <FiEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                      <div className="text-sm font-semibold text-gray-600">Bathrooms</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 text-right">{propertyData.bathrooms}</div>
                        <button 
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" 
                          onClick={() => handleEdit('bathrooms')} 
                          type="button"
                        >
                          <FiEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0">
                      <div className="text-sm font-semibold text-gray-600">Floor Area</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 text-right">{propertyData.floorArea}</div>
                        <button 
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors" 
                          onClick={() => handleEdit('floorArea')} 
                          type="button"
                        >
                          <FiEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold text-sm rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
              onClick={() => router.push('/agent/create-listing/visuals-features')}
              type="button"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              onClick={handlePublish}
              type="button"
              disabled={isSubmitting || isCompressing || !price}
            >
              <span>
                {isCompressing 
                  ? 'Compressing images...' 
                  : isSubmitting 
                    ? `Publishing... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` 
                    : 'Publish Listing'}
              </span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

