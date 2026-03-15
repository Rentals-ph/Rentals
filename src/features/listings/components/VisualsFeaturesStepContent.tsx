'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateListing } from '../CreateListingContext'
import { createThumbnail } from '@/shared/utils/image'
import {
  FiArrowLeft,
  FiArrowRight,
  FiUploadCloud,
  FiPlayCircle,
} from 'react-icons/fi'

export interface VisualsFeaturesStepContentProps {
  /** Path to navigate to on Previous (e.g. /agent/create-listing/basic-info) */
  prevStepPath: string
  /** Path to navigate to on Next (e.g. /agent/create-listing/owner-review or /broker/create-listing/pricing) */
  nextStepPath: string
  /** Label for the Next button (e.g. "Next: Owner Info & Review" or "Next: Pricing") */
  nextButtonLabel: string
  /** Show furnishing radio options (broker flow) */
  showFurnishing?: boolean
}

const AMENITIES_LIST = [
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
  'Generator',
]

const FURNISHING_OPTIONS = ['Fully Furnished', 'Semi Furnished', 'Unfurnished']

export function VisualsFeaturesStepContent({
  prevStepPath,
  nextStepPath,
  nextButtonLabel,
  showFurnishing = false,
}: VisualsFeaturesStepContentProps) {
  const router = useRouter()
  const { data, updateData } = useCreateListing()

  const [images, setImages] = useState<File[]>(data.images)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState(data.videoUrl)
  const [amenities, setAmenities] = useState<string[]>(data.amenities)
  const [furnishing, setFurnishing] = useState<string>(data.furnishing || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImages(data.images)
    setVideoUrl(data.videoUrl)
    setAmenities(data.amenities)
    setFurnishing(data.furnishing || '')

    const generateThumbnails = async () => {
      const thumbnailPromises = data.images.map((file) =>
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

  useEffect(() => {
    return () => {
      thumbnails.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [thumbnails])

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const files = Array.from(event.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    )
    setImages((prev) => [...prev, ...files])
    const newThumbs = await Promise.all(
      files.map((f) =>
        createThumbnail(f, 200).catch(() => URL.createObjectURL(f))
      )
    )
    setThumbnails((prev) => [...prev, ...newThumbs])
  }

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return
    const files = Array.from(event.target.files).filter((f) =>
      f.type.startsWith('image/')
    )
    setImages((prev) => [...prev, ...files])
    const newThumbs = await Promise.all(
      files.map((f) =>
        createThumbnail(f, 200).catch(() => URL.createObjectURL(f))
      )
    )
    setThumbnails((prev) => [...prev, ...newThumbs])
  }

  const handleRemoveImage = (index: number) => {
    if (thumbnails[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnails[index])
    }
    setImages((prev) => prev.filter((_, i) => i !== index))
    setThumbnails((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAmenityChange = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    )
  }

  const handleNext = () => {
    if (images.length < 5) {
      alert('Please upload at least 5 photos of the property before continuing.')
      return
    }
    updateData({
      images,
      videoUrl,
      amenities,
      ...(showFurnishing && { furnishing: furnishing || undefined }),
    })
    router.push(nextStepPath)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900">
          Property Visuals & Features
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload images and select amenities for your property
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Property Images
          </h3>
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
            <p className="text-base font-semibold text-gray-900 mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-600">
              Upload high-quality images of your property. For best results, add at least 5 photos.
            </p>
          </div>
          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative inline-block group">
                  <img
                    src={
                      thumbnails[index] || URL.createObjectURL(image)
                    }
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

        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Features & Amenities
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Amenities
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {AMENITIES_LIST.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-lg hover:bg-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      checked={amenities.includes(amenity)}
                      onChange={() => handleAmenityChange(amenity)}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {amenity}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {showFurnishing && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Furnishing
                </h4>
                <div className="flex flex-wrap gap-4">
                  {FURNISHING_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="furnishing"
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                        value={option}
                        checked={furnishing === option}
                        onChange={(e) => setFurnishing(e.target.value)}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
        <button
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold text-sm rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
          onClick={() => router.push(prevStepPath)}
          type="button"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>
        <button
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
          onClick={handleNext}
          type="button"
        >
          <span>{nextButtonLabel}</span>
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
