'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../../../components/common/AppSidebar'
import AgentHeader from '../../../../components/agent/AgentHeader'
import { useCreateListing } from '../../../../contexts/CreateListingContext'
import { createThumbnail } from '../../../../utils/imageCompression'

import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiUploadCloud,
  FiPlayCircle
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

export default function AgentCreateListingVisualsFeatures() {
  const router = useRouter()
  const { data, updateData } = useCreateListing()
  
  // Streamlined 4-step flow
  const stepLabels = [
    'Basic Information',
    'Visuals & Features',
    'Owner Info & Review'
  ]

  // Images state
  const [images, setImages] = useState<File[]>(data.images)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState(data.videoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Attributes state
  const [amenities, setAmenities] = useState<string[]>(data.amenities)

  const amenitiesList = [
    'Air Conditioning',
    'Breakfast',
    'Kitchen',
    'Parking',
    'Pool',
    'Wi-Fi Internet',
    'Pet-Friendly',
    'Gym / Fitness Center',
    'Security',
    'Elevator',
    'Balcony',
    'Garden',
    'Laundry',
    'Dishwasher',
    'Microwave',
    'Refrigerator',
    'TV / Cable',
    'Hot Water',
    'Furnished',
    'Near Public Transport',
    'Near Schools',
    'Near Shopping',
    'Near Hospitals',
    'Water Supply',
    'Electricity',
    'Internet Ready',
    '24/7 Security',
    'CCTV',
    'Fire Safety',
    'Generator'
  ]

  const furnishingOptions = ['Fully Furnished', 'Semi Furnished', 'Unfurnished']

  useEffect(() => {
    setImages(data.images)
    setVideoUrl(data.videoUrl)
    setAmenities(data.amenities)
    
    // Generate thumbnails
    const generateThumbnails = async () => {
      const thumbnailPromises = data.images.map(file => 
        createThumbnail(file, 200).catch(() => URL.createObjectURL(file))
      )
      const newThumbnails = await Promise.all(thumbnailPromises)
      setThumbnails(newThumbnails)
    }
    
    if (data.images.length > 0) {
      generateThumbnails()
    } else {
      setThumbnails([])
    }
  }, [data])
  
  // Cleanup object URLs
  useEffect(() => {
    return () => {
      thumbnails.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [thumbnails])

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setImages(prev => [...prev, ...imageFiles])
    
    const newThumbnails = await Promise.all(
      imageFiles.map(file => createThumbnail(file, 200).catch(() => URL.createObjectURL(file)))
    )
    setThumbnails(prev => [...prev, ...newThumbnails])
  }

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      setImages(prev => [...prev, ...imageFiles])
      
      const newThumbnails = await Promise.all(
        imageFiles.map(file => createThumbnail(file, 200).catch(() => URL.createObjectURL(file)))
      )
      setThumbnails(prev => [...prev, ...newThumbnails])
    }
  }

  const handleRemoveImage = (index: number) => {
    if (thumbnails[index] && thumbnails[index].startsWith('blob:')) {
      URL.revokeObjectURL(thumbnails[index])
    }
    setImages(prev => prev.filter((_, i) => i !== index))
    setThumbnails(prev => prev.filter((_, i) => i !== index))
  }

  const handleAmenityChange = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-outfit">
      <AppSidebar/>
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="Create Listing" 
          subtitle="Add visuals and features." 
        />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <span className="text-gray-900">Create Listing</span>
          <span className="text-gray-400 font-medium">&gt;</span>
          <span className="text-gray-400 font-semibold">Visuals & Features</span>
        </div>

        {/* Progress Stepper Card */}
        <div className="flex items-center gap-4 p-6 mb-6 bg-white rounded-xl shadow-sm border border-gray-100 md:flex-col md:items-start">
          <div className="flex items-center gap-3 min-w-[220px]">
            <ProgressRing percent={50} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div>
          </div>

          <div className="flex-1 grid grid-cols-3 items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start">
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 2
              const isDone = step < 2
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}>
                  <div className="w-full flex items-center relative">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {isDone ? <FiCheck className="text-lg" /> : step}
                    </div>
                    {step !== stepLabels.length && (
                      <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 ${step < 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
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
            <h2 className="text-2xl font-bold text-gray-900">Property Visuals & Features</h2>
            <p className="text-sm text-gray-600 mt-1">Upload images and select amenities for your property</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Images Section Card */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Property Images</h3>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <FiUploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-base font-semibold text-gray-900 mb-1">Drop files here or click to upload</p>
                <p className="text-sm text-gray-600">
                  Upload high-quality images of your property (max 10mb each)
                </p>
              </div>
              
              {images.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative inline-block group">
                      <img
                        src={thumbnails[index] || URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors shadow-md"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Video Section */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Video Link (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiPlayCircle className="w-5 h-5" />
                  </div>
                  <input
                    className="w-full h-11 pl-11 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter Youtube/video link"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Features & Amenities Section Card */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Features & Amenities</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Amenities</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {amenitiesList.map((amenity) => (
                      <label key={amenity} className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-lg hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          checked={amenities.includes(amenity)}
                          onChange={() => handleAmenityChange(amenity)}
                        />
                        <span className="text-sm font-medium text-gray-900">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold text-sm rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
              onClick={() => router.push('/agent/create-listing/basic-info')}
              type="button"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
              onClick={() => {
                updateData({ images, videoUrl, amenities })
                router.push('/agent/create-listing/owner-review')
              }}
              type="button"
            >
              <span>Next: Owner Info & Review</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

