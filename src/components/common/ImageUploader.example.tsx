/**
 * ImageUploader Usage Examples
 * 
 * This file demonstrates various ways to use the ImageUploader component
 * with the storage system.
 */

'use client'

import { useState } from 'react'
import ImageUploader from './ImageUploader'
import { StoragePaths, getImageUrl } from '@/utils/storage'
import { resolvePropertyImage, resolveAvatarImage } from '@/utils/imageResolver'
import { type ImageUploadResult } from '@/utils/imageUpload'

// Example 1: Upload Property Main Image
export function PropertyImageUploadExample({ propertyId }: { propertyId: number }) {
  const handleUploadComplete = (result: ImageUploadResult | ImageUploadResult[]) => {
    // Since multiple is not set, result will be a single ImageUploadResult
    const uploadResult = Array.isArray(result) ? result[0] : result
    console.log('Property image uploaded:', uploadResult.path)
    // The path will be: /storage/images/properties/{propertyId}/main.jpg
    // You can now save this path to your database
  }

  return (
    <ImageUploader
      entityType="properties"
      entityId={propertyId}
      imageType="main"
      apiEndpoint="/api/properties/upload-image"
      token={localStorage.getItem('token')}
      onUploadComplete={handleUploadComplete}
      showPreview={true}
    />
  )
}

// Example 2: Upload Property Gallery Images
export function PropertyGalleryUploadExample({ propertyId }: { propertyId: number }) {
  const handleUploadComplete = (result: ImageUploadResult | ImageUploadResult[]) => {
    // Since multiple={true}, result will always be an array
    const results = Array.isArray(result) ? result : [result]
    console.log('Gallery images uploaded:', results.map(r => r.path))
    // Results will be:
    // /storage/images/properties/{propertyId}/gallery-1-{timestamp}-{random}.jpg
    // /storage/images/properties/{propertyId}/gallery-2-{timestamp}-{random}.jpg
    // etc.
  }

  return (
    <ImageUploader
      entityType="properties"
      entityId={propertyId}
      imageType="gallery"
      multiple={true}
      maxFiles={10}
      apiEndpoint="/api/properties/upload-gallery"
      token={localStorage.getItem('token')}
      onUploadComplete={handleUploadComplete}
      showPreview={true}
    />
  )
}

// Example 3: Upload User Avatar
export function UserAvatarUploadExample({ userId, currentAvatar }: { userId: number, currentAvatar?: string }) {
  const handleUploadComplete = (result: ImageUploadResult | ImageUploadResult[]) => {
    // Since multiple is not set, result will be a single ImageUploadResult
    const uploadResult = Array.isArray(result) ? result[0] : result
    console.log('Avatar uploaded:', uploadResult.path)
    // The path will be: /storage/images/users/{userId}/avatar.jpg
  }

  return (
    <div className="avatar-upload-container">
      <ImageUploader
        entityType="users"
        entityId={userId}
        imageType="avatar"
        apiEndpoint="/api/users/upload-avatar"
        token={localStorage.getItem('token')}
        currentImage={currentAvatar}
        onUploadComplete={handleUploadComplete}
        className="avatar-uploader"
        showPreview={true}
      />
    </div>
  )
}

// Example 4: Upload Agent Avatar
export function AgentAvatarUploadExample({ agentId }: { agentId: number }) {
  return (
    <ImageUploader
      entityType="agents"
      entityId={agentId}
      imageType="avatar"
      apiEndpoint="/api/agents/upload-avatar"
      token={localStorage.getItem('token')}
      onUploadComplete={(result: ImageUploadResult | ImageUploadResult[]) => {
        // Since multiple is not set, result will be a single ImageUploadResult
        const uploadResult = Array.isArray(result) ? result[0] : result
        console.log('Agent avatar uploaded:', uploadResult.path)
      }}
      className="avatar-uploader"
    />
  )
}

// Example 5: Display Image Using Storage Path
export function DisplayPropertyImage({ property }: { property: { id: number, image: string | null } }) {
  // Use the image resolver to handle storage paths and fallbacks
  const imageUrl = resolvePropertyImage(property.image, property.id)

  return (
    <img
      src={imageUrl}
      alt="Property"
      onError={(e) => {
        // Fallback handled by resolvePropertyImage
        console.error('Image failed to load')
      }}
    />
  )
}

// Example 6: Display User Avatar Using Storage Path
export function DisplayUserAvatar({ user }: { user: { id: number, avatar: string | null } }) {
  const avatarUrl = resolveAvatarImage(user.avatar, user.id)

  return (
    <img
      src={avatarUrl}
      alt="User avatar"
      className="rounded-full w-12 h-12"
    />
  )
}

// Example 7: Manual Upload with Progress Tracking
export function ManualUploadExample() {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)

    try {
      const { uploadPropertyMainImage } = await import('@/utils/imageUpload')
      
      const result = await uploadPropertyMainImage(
        file,
        123, // propertyId
        '/api/properties/upload-image',
        localStorage.getItem('token'),
        (progress) => {
          setProgress(progress.percent)
        }
      )

      console.log('Upload complete:', result.path)
      // Path: /storage/images/properties/123/main.jpg
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {uploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  )
}

// Example 8: Using Storage Paths Directly
export function StoragePathExamples() {
  // Generate paths without uploading
  const userAvatarPath = StoragePaths.userAvatar(1)
  // Returns: '/storage/images/users/1/avatar.jpg'

  const propertyMainPath = StoragePaths.propertyMain(101)
  // Returns: '/storage/images/properties/101/main.jpg'

  const galleryPath = StoragePaths.propertyGallery(101, 1)
  // Returns: '/storage/images/properties/101/gallery-1.jpg'

  // Get full URL (useful for CDN)
  const cdnUrl = getImageUrl(userAvatarPath, 'https://cdn.example.com')
  // Returns: 'https://cdn.example.com/storage/images/users/1/avatar.jpg'

  return (
    <div>
      <p>User Avatar Path: {userAvatarPath}</p>
      <p>Property Main Path: {propertyMainPath}</p>
      <p>Gallery Path: {galleryPath}</p>
      <p>CDN URL: {cdnUrl}</p>
    </div>
  )
}

