'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateListing } from '@/contexts/CreateListingContext'
import { createThumbnail } from '@/shared/utils/image'

import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiUploadCloud,
  FiPlayCircle
} from 'react-icons/fi'
import { ProgressRing } from '@/shared/components/ui'
// import '../AgentCreateListingCategory.css' // Converted to Tailwind

export default function AgentCreateListingPropertyImages() {
  const router = useRouter()
  const { data, updateData } = useCreateListing()
  const [videoUrl, setVideoUrl] = useState(data.videoUrl)
  const [images, setImages] = useState<File[]>(data.images)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setVideoUrl(data.videoUrl)
    setImages(data.images)
    
    // Generate thumbnails for preview (reduces memory usage)
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
  
  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      thumbnails.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [thumbnails])

  const stepLabels = [
    'Category',
    'Details',
    'Location',
    'Property Images',
    'Pricing',
    'Attributes',
    'Owner Info',
    'Publish'
  ]

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setImages(prev => [...prev, ...imageFiles])
    
    // Generate thumbnails for dropped images
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
      
      // Generate thumbnails for new images
      const newThumbnails = await Promise.all(
        imageFiles.map(file => createThumbnail(file, 200).catch(() => URL.createObjectURL(file)))
      )
      setThumbnails(prev => [...prev, ...newThumbnails])
    }
  }

  const handleRemoveImage = (index: number) => {
    // Cleanup thumbnail URL
    if (thumbnails[index] && thumbnails[index].startsWith('blob:')) {
      URL.revokeObjectURL(thumbnails[index])
    }
    setImages(prev => prev.filter((_, i) => i !== index))
    setThumbnails(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <>

        <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 my-1.5 mx-0 mb-4"> {/* aclc-breadcrumb */}
          <span className="text-gray-900">Create Listing</span> {/* aclc-breadcrumb-strong */}
          <span className="text-gray-400 font-medium">&gt;</span> {/* aclc-breadcrumb-sep */}
          <span className="text-gray-400 font-semibold">Property Images</span> {/* aclc-breadcrumb-muted */}
        </div>

        <div className="flex items-center gap-4 p-5 mb-6 bg-white rounded-xl shadow-sm md:flex-col md:items-start"> {/* section-card aclc-stepper-card */}
          <div className="flex items-center gap-3 min-w-[220px]"> {/* aclc-stepper-left */}
            <ProgressRing percent={40} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div> {/* aclc-stepper-left-title */}
          </div>

          <div className="flex-1 grid grid-cols-4 items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start"> {/* aclc-steps */}
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 4
              const isDone = step < 4
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}> {/* aclc-step */}
                  <div className="w-full flex items-center relative"> {/* aclc-step-top */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}> {/* aclc-step-circle */}
                      {isDone ? <FiCheck className="text-lg" /> : step}
                    </div>
                    {step !== stepLabels.length && (
                      <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 ${step < 4 ? 'bg-blue-600' : 'bg-gray-200'}`} /> // aclc-step-line
                    )}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div> {/* aclc-step-label */}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-7 pb-6 bg-white rounded-xl shadow-sm max-w-full"> {/* section-card aclc-form-card */}
          <h2 className="m-0 mb-4 text-3xl font-bold text-gray-900">Property Gallery</h2> {/* aclc-form-title */}

          <div className="mt-1 mb-4.5 text-base font-semibold text-gray-900">Property Images</div> {/* acpi-subtitle */}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />
          <div
            className="mb-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-10 px-6 flex flex-col items-center text-center cursor-pointer transition-all duration-150 ease-in-out hover:bg-sky-100 hover:border-blue-400 hover:shadow-[0_10px_20px_rgba(37,99,235,0.09)] hover:-translate-y-px md:p-7 md:px-4.5" // acpi-dropzone
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <FiUploadCloud className="text-[40px] text-blue-600 mb-2.5" /> {/* acpi-dropzone-icon */}
            <p className="m-0 mb-1 text-lg font-semibold text-gray-900">Drop files here or click to upload</p> {/* acpi-dropzone-title */}
            <p className="m-0 mb-2.5 text-sm text-gray-600">
              Upload high-quality images of your property. For best results, add at least 5 photos.
            </p> {/* acpi-dropzone-text */}
            <p className="m-0 max-w-[540px] text-xs text-gray-500">
              You can drag and drop multiple files at once. The first image will be set as the default
              image. Drag images to reorder them.
            </p> {/* acpi-dropzone-helper */}
          </div>
          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative inline-block">
                  <img
                    src={thumbnails[index] || URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-[100px] h-[100px] object-cover rounded-lg"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white border-none rounded-full w-6 h-6 cursor-pointer flex items-center justify-center text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5"> {/* acpi-video-section */}
            <div className="flex items-center justify-between mb-2"> {/* acpi-video-label-row */}
              <span className="text-sm font-semibold text-gray-900">Video Link (Optional)</span> {/* acpi-video-label */}
            </div>
            <div className="flex items-stretch gap-0 md:flex-col md:items-stretch"> {/* acpi-video-input-row */}
              <div className="flex items-center justify-center px-3.5 bg-blue-50 border border-gray-300 border-r-0 rounded-l-lg md:rounded-t-lg md:rounded-b-none md:border-r md:border-b-0"> {/* acpi-video-icon-wrap */}
                <FiPlayCircle className="text-xl text-blue-600" /> {/* acpi-video-icon */}
              </div>
              <input
                className="flex-1 border border-gray-300 border-l-0 border-r-0 p-2.5 px-3 text-sm rounded-none outline-none placeholder:text-gray-400 md:rounded-none md:border-l md:border-t-0" // acpi-video-input
                placeholder="Enter Youtube/video link"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <button className="py-0 px-4.5 rounded-r-lg border border-blue-600 bg-blue-600 text-white text-sm font-semibold cursor-pointer transition-all duration-150 ease-in-out hover:bg-blue-700 hover:shadow-[0_8px_16px_rgba(37,99,235,0.18)] hover:-translate-y-px md:mt-1.5 md:rounded-lg md:w-full" type="button"> {/* acpi-video-preview-btn */}
                Preview
              </button>
            </div>
            <p className="mt-2 mb-0 text-xs text-gray-500">
              Paste a YouTube, YouTube Shorts, Vimeo, Facebook Reel, TikTok, or Google Drive link to your
              property video tour.
            </p> {/* acpi-video-helper */}
          </div>

          <div className="mt-6 flex justify-between gap-3 md:flex-col md:items-stretch"> {/* acpi-footer-actions */}
            <button
              className="acld-prev-btn"
              onClick={() => router.push('/agent/create-listing/location')}
              type="button"
            >
              <FiArrowLeft />
              <span>Previous</span>
            </button>
            <button
              className="aclc-next-btn"
              onClick={() => {
                if (images.length < 5) {
                  alert('Please upload at least 5 photos of the property before continuing.')
                  return
                }
                updateData({ images, videoUrl })
                router.push('/agent/create-listing/pricing')
              }}
              type="button"
            >
              <span>Next</span>
              <FiArrowRight />
            </button>
          </div>
        </div>
    </>
  )
}

