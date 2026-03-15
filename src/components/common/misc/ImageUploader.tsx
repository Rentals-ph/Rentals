'use client'

import { useState, useRef } from 'react'
import { 
  uploadImage, 
  uploadImages, 
  uploadPropertyMainImage,
  uploadPropertyGallery,
  uploadUserAvatar,
  uploadAgentAvatar,
  type ImageUploadResult 
} from '@/shared/utils/image'
import { StoragePaths, getImageUrl } from '@/shared/utils/image'
import { ASSETS } from '@/utils/assets'

export interface ImageUploaderProps {
  entityType: 'users' | 'properties' | 'posts' | 'agents' | 'testimonials'
  entityId: number | string
  imageType?: 'main' | 'gallery' | 'avatar' | 'banner' | 'featured'
  multiple?: boolean
  maxFiles?: number
  apiEndpoint: string
  token?: string | null
  currentImage?: string | null
  onUploadComplete?: (result: ImageUploadResult | ImageUploadResult[]) => void
  onUploadError?: (error: Error) => void
  onProgress?: (percent: number) => void
  className?: string
  showPreview?: boolean
}

/**
 * ImageUploader Component
 * 
 * A reusable component for uploading images using the storage system.
 * Handles compression, progress tracking, and storage path generation.
 * 
 * @example
 * // Upload property main image
 * <ImageUploader
 *   entityType="properties"
 *   entityId={propertyId}
 *   imageType="main"
 *   apiEndpoint="/api/properties/upload-image"
 *   token={authToken}
 *   onUploadComplete={(result) => console.log('Uploaded:', result.path)}
 * />
 * 
 * @example
 * // Upload user avatar
 * <ImageUploader
 *   entityType="users"
 *   entityId={userId}
 *   imageType="avatar"
 *   apiEndpoint="/api/users/upload-avatar"
 *   token={authToken}
 *   currentImage={user.avatar}
 * />
 */
export default function ImageUploader({
  entityType,
  entityId,
  imageType = 'main',
  multiple = false,
  maxFiles = 10,
  apiEndpoint,
  token,
  currentImage,
  onUploadComplete,
  onUploadError,
  onProgress,
  className = '',
  showPreview = true,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      if (multiple && files.length > 1) {
        // Upload multiple images (e.g., gallery)
        const fileArray = Array.from(files).slice(0, maxFiles)
        const results = await uploadImages(
          fileArray,
          {
            entityType,
            entityId,
            compress: true,
            onProgress: (progress) => {
              setUploadProgress(progress.percent)
              onProgress?.(progress.percent)
            },
          },
          apiEndpoint,
          token
        )

        if (showPreview && results.length > 0) {
          setPreview(getImageUrl(results[0].path))
        }

        onUploadComplete?.(results)
      } else {
        // Upload single image
        const file = files[0]
        
        // Show preview immediately
        if (showPreview) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setPreview(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        }

        let result: ImageUploadResult

        // Use specialized upload functions for common cases
        if (entityType === 'properties' && imageType === 'main') {
          result = await uploadPropertyMainImage(
            file,
            entityId,
            apiEndpoint,
            token,
            (progress) => {
              setUploadProgress(progress.percent)
              onProgress?.(progress.percent)
            }
          )
        } else if (entityType === 'users' && imageType === 'avatar') {
          result = await uploadUserAvatar(
            file,
            entityId,
            apiEndpoint,
            token,
            (progress) => {
              setUploadProgress(progress.percent)
              onProgress?.(progress.percent)
            }
          )
        } else if (entityType === 'agents' && imageType === 'avatar') {
          result = await uploadAgentAvatar(
            file,
            entityId,
            apiEndpoint,
            token,
            (progress) => {
              setUploadProgress(progress.percent)
              onProgress?.(progress.percent)
            }
          )
        } else {
          // Generic upload
          result = await uploadImage(
            file,
            {
              entityType,
              entityId,
              compress: true,
              onProgress: (progress) => {
                setUploadProgress(progress.percent)
                onProgress?.(progress.percent)
              },
            },
            apiEndpoint,
            token
          )
        }

        if (showPreview) {
          setPreview(getImageUrl(result.path))
        }

        onUploadComplete?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed')
      setError(error.message)
      onUploadError?.(error)
      if (showPreview && currentImage) {
        setPreview(currentImage)
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getPlaceholderImage = () => {
    if (imageType === 'avatar') {
      return ASSETS.PLACEHOLDER_PROFILE
    }
    if (entityType === 'properties') {
      return ASSETS.PLACEHOLDER_PROPERTY_MAIN
    }
    return ASSETS.PLACEHOLDER_PROPERTY_MAIN
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
        aria-label="Upload image"
      />

      {showPreview && (
        <div className={`relative w-full max-w-md overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 ${imageType === 'avatar' ? 'aspect-square max-w-[200px] rounded-full' : 'aspect-video'}`}>
          <img
            src={preview || getPlaceholderImage()}
            alt="Preview"
            className={`h-full w-full object-cover ${imageType === 'avatar' ? 'rounded-full' : ''}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = getPlaceholderImage()
            }}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex w-4/5 max-w-xs flex-col gap-2 rounded-lg bg-white/90 p-4">
                <div 
                  className="h-2 rounded bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
                <span className="text-center text-sm font-semibold text-gray-800">
                  {uploadProgress}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="inline-flex items-center justify-center gap-2 rounded-md border-0 bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Uploading... {uploadProgress}%
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {preview ? 'Change Image' : 'Upload Image'}
          </>
        )}
      </button>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {multiple && (
        <p className="m-0 text-xs text-gray-500">
          You can upload up to {maxFiles} images
        </p>
      )}
    </div>
  )
}

