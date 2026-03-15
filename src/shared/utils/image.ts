/**
 * Image Utilities
 * 
 * Combined utilities for image handling:
 * - Storage path management
 * - Image compression
 * - Image upload with progress tracking
 * - Image URL resolution
 * 
 * This file consolidates all image-related utilities for better organization.
 */

import { ASSETS } from '@/shared/utils/assets'
import { getApiBaseUrl } from '../config/api'

// ============================================================================
// STORAGE PATH UTILITIES
// ============================================================================

export type StorageEntityType = 'users' | 'properties' | 'posts' | 'agents' | 'testimonials'

/**
 * Generate storage path for an image
 * @param entityType - Type of entity (users, properties, posts, etc.)
 * @param entityId - ID of the entity
 * @param filename - Name of the file (e.g., 'avatar.jpg', 'main.jpg', 'gallery-1.jpg')
 * @returns Full path relative to public directory (e.g., '/storage/images/users/1/avatar.jpg')
 */
export function getStoragePath(
  entityType: StorageEntityType,
  entityId: number | string,
  filename: string
): string {
  // Remove leading slash from filename if present
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename
  
  return `/storage/images/${entityType}/${entityId}/${cleanFilename}`
}

/**
 * Generate storage directory path for an entity
 * @param entityType - Type of entity
 * @param entityId - ID of the entity
 * @returns Directory path (e.g., '/storage/images/users/1')
 */
export function getStorageDir(
  entityType: StorageEntityType,
  entityId: number | string
): string {
  return `/storage/images/${entityType}/${entityId}`
}

/**
 * Extract entity information from a storage path
 * @param path - Full storage path (e.g., '/storage/images/users/1/avatar.jpg')
 * @returns Object with entityType, entityId, and filename, or null if invalid
 */
export function parseStoragePath(path: string): {
  entityType: StorageEntityType
  entityId: string
  filename: string
} | null {
  const match = path.match(/^\/storage\/images\/(users|properties|posts|agents|testimonials)\/(\d+)\/(.+)$/)
  
  if (!match) {
    return null
  }
  
  return {
    entityType: match[1] as StorageEntityType,
    entityId: match[2],
    filename: match[3]
  }
}

/**
 * Check if a path is a valid storage path
 * @param path - Path to check
 * @returns True if path follows storage structure
 */
export function isStoragePath(path: string): boolean {
  return parseStoragePath(path) !== null
}

/**
 * Generate common image filenames for different entity types
 */
export const StorageFilenames = {
  // User images
  USER_AVATAR: 'avatar.jpg',
  USER_BANNER: 'profile-banner.jpg',
  USER_COVER: 'cover.jpg',
  
  // Property images
  PROPERTY_MAIN: 'main.jpg',
  PROPERTY_GALLERY: (index: number) => `gallery-${index}.jpg`,
  PROPERTY_THUMBNAIL: 'thumbnail.jpg',
  PROPERTY_FEATURED: 'featured.jpg',
  
  // Post images
  POST_FEATURED: 'featured.jpg',
  POST_THUMBNAIL: 'thumbnail.jpg',
  POST_COVER: 'cover.jpg',
  
  // Agent images
  AGENT_AVATAR: 'avatar.jpg',
  AGENT_BANNER: 'banner.jpg',
  
  // Testimonial images
  TESTIMONIAL_AVATAR: 'avatar.jpg',
} as const

/**
 * Helper functions for common image paths
 */
export const StoragePaths = {
  /**
   * Get user avatar path
   */
  userAvatar: (userId: number | string, filename?: string) =>
    getStoragePath('users', userId, filename || StorageFilenames.USER_AVATAR),
  
  /**
   * Get user banner path
   */
  userBanner: (userId: number | string, filename?: string) =>
    getStoragePath('users', userId, filename || StorageFilenames.USER_BANNER),
  
  /**
   * Get property main image path
   */
  propertyMain: (propertyId: number | string, filename?: string) =>
    getStoragePath('properties', propertyId, filename || StorageFilenames.PROPERTY_MAIN),
  
  /**
   * Get property gallery image path
   */
  propertyGallery: (propertyId: number | string, index: number, filename?: string) =>
    getStoragePath('properties', propertyId, filename || StorageFilenames.PROPERTY_GALLERY(index)),
  
  /**
   * Get post featured image path
   */
  postFeatured: (postId: number | string, filename?: string) =>
    getStoragePath('posts', postId, filename || StorageFilenames.POST_FEATURED),
  
  /**
   * Get agent avatar path
   */
  agentAvatar: (agentId: number | string, filename?: string) =>
    getStoragePath('agents', agentId, filename || StorageFilenames.AGENT_AVATAR),
  
  /**
   * Get testimonial avatar path
   */
  testimonialAvatar: (testimonialId: number | string, filename?: string) =>
    getStoragePath('testimonials', testimonialId, filename || StorageFilenames.TESTIMONIAL_AVATAR),
} as const

/**
 * Get image URL (for use in img src attributes)
 * In production, this might prepend a CDN URL or base URL
 * @param path - Storage path (from getStoragePath or StoragePaths)
 * @param baseUrl - Optional base URL (e.g., CDN URL)
 * @returns Full URL to the image
 */
export function getImageUrl(path: string, baseUrl?: string): string {
  if (!path) return ''
  
  // If path is already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // If path starts with /storage/, use backend URL for storage images
  if (path.startsWith('/storage/')) {
    // Import getApiBaseUrl dynamically to avoid circular dependency issues
    let backendBaseUrl = baseUrl
    if (!backendBaseUrl && typeof window !== 'undefined') {
      try {
        backendBaseUrl = getApiBaseUrl().replace('/api', '')
      } catch (e) {
        // Fallback if import fails
        backendBaseUrl = 'http://localhost:8000'
      }
    } else if (!backendBaseUrl) {
      backendBaseUrl = 'http://localhost:8000'
    }
    return `${backendBaseUrl}${path}`
  }
  
  // If path starts with /, it's already a public path (not storage)
  if (path.startsWith('/')) {
    return baseUrl ? `${baseUrl}${path}` : path
  }
  
  // Otherwise, assume it's a storage path and prepend /storage/images
  const fullPath = `/storage/images/${path}`
  let backendBaseUrl = baseUrl
  if (!backendBaseUrl && typeof window !== 'undefined') {
    try {
      backendBaseUrl = getApiBaseUrl().replace('/api', '')
    } catch (e) {
      backendBaseUrl = 'http://localhost:8000'
    }
  } else if (!backendBaseUrl) {
    backendBaseUrl = 'http://localhost:8000'
  }
  return `${backendBaseUrl}${fullPath}`
}

/**
 * Validate image filename
 * @param filename - Filename to validate
 * @returns True if filename is valid
 */
export function isValidImageFilename(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const lowerFilename = filename.toLowerCase()
  return validExtensions.some(ext => lowerFilename.endsWith(ext))
}

/**
 * Generate unique filename with timestamp
 * @param originalFilename - Original filename
 * @param prefix - Optional prefix (e.g., 'avatar', 'main')
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string, prefix?: string): string {
  const ext = originalFilename.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  if (prefix) {
    return `${prefix}-${timestamp}-${random}.${ext}`
  }
  
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '')
  return `${nameWithoutExt}-${timestamp}-${random}.${ext}`
}

// ============================================================================
// IMAGE COMPRESSION
// ============================================================================

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

const DEFAULT_COMPRESSION_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeMB: 2,
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            // Check if compressed size is acceptable
            const sizeMB = blob.size / (1024 * 1024)
            if (sizeMB > opts.maxSizeMB) {
              // Try again with lower quality
              canvas.toBlob(
                (lowerQualityBlob) => {
                  if (!lowerQualityBlob) {
                    reject(new Error('Failed to compress image'))
                    return
                  }
                  // Ensure filename has .jpg extension to match JPEG MIME type
                  const filename = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
                  const compressedFile = new File(
                    [lowerQualityBlob],
                    filename,
                    { type: 'image/jpeg' }
                  )
                  resolve(compressedFile)
                },
                'image/jpeg',
                Math.max(0.5, opts.quality - 0.2)
              )
            } else {
              // Ensure filename has .jpg extension to match JPEG MIME type
              const filename = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
              const compressedFile = new File(
                [blob],
                filename,
                { type: 'image/jpeg' }
              )
              resolve(compressedFile)
            }
          },
          'image/jpeg', // Always compress to JPEG for consistency
          opts.quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressionPromises = files.map(file => compressImage(file, options))
  return Promise.all(compressionPromises)
}

/**
 * Create a thumbnail for preview (much smaller than original)
 */
export async function createThumbnail(file: File, size: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate thumbnail dimensions
        const ratio = Math.min(size / width, size / height)
        width = width * ratio
        height = height * ratio

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ============================================================================
// UPLOAD PROGRESS TRACKING
// ============================================================================

export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

export type ProgressCallback = (progress: UploadProgress) => void

/**
 * Create FormData with progress tracking support
 */
export function createFormDataWithProgress(
  formData: FormData,
  onProgress?: ProgressCallback
): FormData {
  // Note: Native fetch doesn't support progress, but we can track FormData size
  // For real progress tracking, we'd need XMLHttpRequest or a library
  return formData
}

/**
 * Upload with progress using XMLHttpRequest (for better progress tracking)
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  token: string | null,
  onProgress?: ProgressCallback
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        }
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Create a Response-like object that works with response.json()
        const response = {
          ok: true,
          status: xhr.status,
          statusText: xhr.statusText,
          json: async () => {
            try {
              return JSON.parse(xhr.responseText)
            } catch {
              return {}
            }
          },
          text: async () => xhr.responseText,
        } as Response
        
        resolve(response as Response)
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText)
          reject(new Error(errorData.message || `Upload failed with status ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'))
    })

    xhr.open('POST', url)
    
    // Set authorization header if token exists
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.send(formData)
  })
}

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

export interface ImageUploadOptions {
  entityType: StorageEntityType
  entityId: number | string
  filename?: string
  compress?: boolean
  compressionOptions?: CompressionOptions
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

// ============================================================================
// IMAGE URL RESOLUTION
// ============================================================================

export interface ImageResolverOptions {
  baseUrl?: string
  fallbackToPlaceholder?: boolean
  placeholder?: string
}

/**
 * Resolve image URL from various sources
 * Handles both new storage paths and legacy/external URLs
 */
export function resolveImageUrl(
  imagePath: string | null | undefined,
  options: ImageResolverOptions = {}
): string {
  const {
    baseUrl,
    fallbackToPlaceholder = true,
    placeholder,
  } = options

  // Return placeholder if no image path
  if (!imagePath) {
    if (fallbackToPlaceholder) {
      return placeholder || ASSETS.PLACEHOLDER_PROPERTY_MAIN
    }
    return ''
  }

  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // If it's a storage path, use getImageUrl (which will use backend URL)
  if (isStoragePath(imagePath)) {
    return getImageUrl(imagePath, baseUrl)
  }

  // If it starts with /, it's a public path
  if (imagePath.startsWith('/')) {
    return baseUrl ? `${baseUrl}${imagePath}` : imagePath
  }

  // If it looks like a Laravel storage path (images/products/..., images/posts/..., etc.)
  // but doesn't start with /storage/, prepend /storage/ and use backend URL
  if (imagePath.match(/^images\/(products|posts|users|properties|agents|testimonials)\//)) {
    const storagePath = `/storage/${imagePath}`
    // For storage images, use backend URL (remove /api suffix if present)
    const backendBaseUrl = typeof window !== 'undefined' 
      ? getApiBaseUrl().replace('/api', '') 
      : (baseUrl || 'http://localhost:8000')
    return `${backendBaseUrl}${storagePath}`
  }
  
  // If it's a /storage/ path, also use backend URL
  if (imagePath.startsWith('/storage/')) {
    const backendBaseUrl = typeof window !== 'undefined' 
      ? getApiBaseUrl().replace('/api', '') 
      : (baseUrl || 'http://localhost:8000')
    return `${backendBaseUrl}${imagePath}`
  }

  // Otherwise, assume it's a relative path and prepend /
  return baseUrl ? `${baseUrl}/${imagePath}` : `/${imagePath}`
}

/**
 * Resolve property image URL
 */
export function resolvePropertyImage(
  propertyImage: string | null | undefined,
  propertyId?: number | string,
  options: ImageResolverOptions = {}
): string {
  if (propertyImage) {
    return resolveImageUrl(propertyImage, {
      ...options,
      placeholder: options.placeholder || ASSETS.PLACEHOLDER_PROPERTY_MAIN,
    })
  }

  // If no image but we have propertyId, try to construct storage path
  if (propertyId) {
    const storagePath = StoragePaths.propertyMain(propertyId)
    return resolveImageUrl(storagePath, {
      ...options,
      fallbackToPlaceholder: true,
      placeholder: ASSETS.PLACEHOLDER_PROPERTY_MAIN,
    })
  }

  return options.placeholder || ASSETS.PLACEHOLDER_PROPERTY_MAIN
}

/**
 * Resolve user/agent avatar URL
 */
export function resolveAvatarImage(
  avatarImage: string | null | undefined,
  userId?: number | string,
  options: ImageResolverOptions = {}
): string {
  if (avatarImage) {
    return resolveImageUrl(avatarImage, {
      ...options,
      placeholder: options.placeholder || ASSETS.PLACEHOLDER_PROFILE,
    })
  }

  // If no image but we have userId, try to construct storage path
  if (userId) {
    const storagePath = StoragePaths.userAvatar(userId)
    return resolveImageUrl(storagePath, {
      ...options,
      fallbackToPlaceholder: true,
      placeholder: ASSETS.PLACEHOLDER_PROFILE,
    })
  }

  return options.placeholder || ASSETS.PLACEHOLDER_PROFILE
}

/**
 * Resolve agent avatar URL
 */
export function resolveAgentAvatar(
  avatarImage: string | null | undefined,
  agentId?: number | string,
  options: ImageResolverOptions = {}
): string {
  if (avatarImage) {
    return resolveImageUrl(avatarImage, {
      ...options,
      placeholder: options.placeholder || ASSETS.PLACEHOLDER_PROFILE,
    })
  }

  // If no image but we have agentId, try to construct storage path
  if (agentId) {
    const storagePath = StoragePaths.agentAvatar(agentId)
    return resolveImageUrl(storagePath, {
      ...options,
      fallbackToPlaceholder: true,
      placeholder: ASSETS.PLACEHOLDER_PROFILE,
    })
  }

  return options.placeholder || ASSETS.PLACEHOLDER_PROFILE
}

/**
 * Resolve testimonial avatar URL
 */
export function resolveTestimonialAvatar(
  avatarImage: string | null | undefined,
  testimonialId?: number | string,
  options: ImageResolverOptions = {}
): string {
  if (avatarImage) {
    return resolveImageUrl(avatarImage, {
      ...options,
      placeholder: options.placeholder || ASSETS.PLACEHOLDER_TESTIMONIAL_PERSON,
    })
  }

  // If no image but we have testimonialId, try to construct storage path
  if (testimonialId) {
    const storagePath = StoragePaths.testimonialAvatar(testimonialId)
    return resolveImageUrl(storagePath, {
      ...options,
      fallbackToPlaceholder: true,
      placeholder: ASSETS.PLACEHOLDER_TESTIMONIAL_PERSON,
    })
  }

  return options.placeholder || ASSETS.PLACEHOLDER_TESTIMONIAL_PERSON
}


