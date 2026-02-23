/**
 * Storage Path Utility
 * 
 * Provides a professional and scalable way to manage image storage paths
 * following the structure: storage/images/{entity-type}/{id}/{filename}
 * 
 * This structure is inspired by Laravel's storage system and provides:
 * - Better organization by entity type and ID
 * - Easier cleanup when entities are deleted
 * - Scalable structure for large applications
 * - Clear separation between static assets and user-uploaded content
 */

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
        const { getApiBaseUrl } = require('../config/api')
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
      const { getApiBaseUrl } = require('../config/api')
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

