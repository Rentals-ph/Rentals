/**
 * Image Upload Utility
 * 
 * Handles image uploads with the new storage structure
 * Integrates with storage paths and compression utilities
 */

import { 
  StoragePaths, 
  getStoragePath, 
  generateUniqueFilename, 
  isValidImageFilename,
  type StorageEntityType 
} from './storage'
import { compressImage, compressImages } from './imageCompression'
import { uploadWithProgress, type ProgressCallback } from './uploadProgress'

export interface ImageUploadOptions {
  entityType: StorageEntityType
  entityId: number | string
  filename?: string
  compress?: boolean
  compressionOptions?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    maxSizeMB?: number
  }
  onProgress?: ProgressCallback
}

export interface ImageUploadResult {
  path: string
  url: string
  filename: string
}

/**
 * Upload a single image with storage path structure
 */
export async function uploadImage(
  file: File,
  options: ImageUploadOptions,
  apiEndpoint: string,
  token?: string | null
): Promise<ImageUploadResult> {
  // Validate file type
  if (!isValidImageFilename(file.name)) {
    throw new Error(`Invalid image file type: ${file.name}`)
  }

  // Generate filename if not provided
  const filename = options.filename || generateUniqueFilename(file.name)
  
  // Get storage path
  const storagePath = getStoragePath(options.entityType, options.entityId, filename)

  // Compress image if requested
  let fileToUpload = file
  if (options.compress !== false) {
    try {
      fileToUpload = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        maxSizeMB: 2,
        ...options.compressionOptions,
      })
    } catch (error) {
      console.warn('Image compression failed, using original:', error)
      // Continue with original file
    }
  }

  // Create FormData
  const formData = new FormData()
  formData.append('file', fileToUpload)
  formData.append('path', storagePath)
  formData.append('entity_type', options.entityType)
  formData.append('entity_id', options.entityId.toString())

  // Upload with progress tracking
  const response = await uploadWithProgress(
    apiEndpoint,
    formData,
    token || null,
    options.onProgress
  )

  const responseData = await response.json()

  if (!response.ok) {
    throw new Error(responseData.message || 'Image upload failed')
  }

  // Return the storage path (API may return a different path, but we prefer our structure)
  const returnedPath = responseData.path || responseData.image || storagePath

  return {
    path: returnedPath,
    url: returnedPath.startsWith('http') ? returnedPath : returnedPath,
    filename,
  }
}

/**
 * Upload multiple images (e.g., property gallery)
 */
export async function uploadImages(
  files: File[],
  options: ImageUploadOptions,
  apiEndpoint: string,
  token?: string | null
): Promise<ImageUploadResult[]> {
  // Validate all files
  files.forEach(file => {
    if (!isValidImageFilename(file.name)) {
      throw new Error(`Invalid image file type: ${file.name}`)
    }
  })

  // Compress all images if requested
  let filesToUpload = files
  if (options.compress !== false) {
    try {
      filesToUpload = await compressImages(files, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        maxSizeMB: 2,
        ...options.compressionOptions,
      })
    } catch (error) {
      console.warn('Image compression failed, using originals:', error)
      // Continue with original files
    }
  }

  // Upload all images
  const uploadPromises = filesToUpload.map(async (file, index) => {
    const filename = options.filename 
      ? `${index + 1}-${options.filename}`
      : generateUniqueFilename(file.name, `gallery-${index + 1}`)
    
    const storagePath = getStoragePath(options.entityType, options.entityId, filename)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', storagePath)
    formData.append('entity_type', options.entityType)
    formData.append('entity_id', options.entityId.toString())
    formData.append('index', index.toString())

    const response = await uploadWithProgress(
      apiEndpoint,
      formData,
      token || null,
      // Calculate progress for individual uploads
      options.onProgress ? (progress) => {
        const totalProgress = ((index / files.length) * 100) + (progress.percent / files.length)
        options.onProgress!({
          loaded: progress.loaded,
          total: progress.total,
          percent: Math.round(totalProgress),
        })
      } : undefined
    )

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.message || `Failed to upload image ${index + 1}`)
    }

    const returnedPath = responseData.path || responseData.image || storagePath

    return {
      path: returnedPath,
      url: returnedPath.startsWith('http') ? returnedPath : returnedPath,
      filename,
    }
  })

  return Promise.all(uploadPromises)
}

/**
 * Upload property main image
 */
export async function uploadPropertyMainImage(
  file: File,
  propertyId: number | string,
  apiEndpoint: string,
  token?: string | null,
  onProgress?: ProgressCallback
): Promise<ImageUploadResult> {
  return uploadImage(
    file,
    {
      entityType: 'properties',
      entityId: propertyId,
      filename: 'main.jpg',
      compress: true,
      onProgress,
    },
    apiEndpoint,
    token
  )
}

/**
 * Upload property gallery images
 */
export async function uploadPropertyGallery(
  files: File[],
  propertyId: number | string,
  apiEndpoint: string,
  token?: string | null,
  onProgress?: ProgressCallback
): Promise<ImageUploadResult[]> {
  return uploadImages(
    files,
    {
      entityType: 'properties',
      entityId: propertyId,
      compress: true,
      onProgress,
    },
    apiEndpoint,
    token
  )
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  file: File,
  userId: number | string,
  apiEndpoint: string,
  token?: string | null,
  onProgress?: ProgressCallback
): Promise<ImageUploadResult> {
  return uploadImage(
    file,
    {
      entityType: 'users',
      entityId: userId,
      filename: 'avatar.jpg',
      compress: true,
      onProgress,
    },
    apiEndpoint,
    token
  )
}

/**
 * Upload agent avatar
 */
export async function uploadAgentAvatar(
  file: File,
  agentId: number | string,
  apiEndpoint: string,
  token?: string | null,
  onProgress?: ProgressCallback
): Promise<ImageUploadResult> {
  return uploadImage(
    file,
    {
      entityType: 'agents',
      entityId: agentId,
      filename: 'avatar.jpg',
      compress: true,
      onProgress,
    },
    apiEndpoint,
    token
  )
}

