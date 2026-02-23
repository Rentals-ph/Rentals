/**
 * Image URL Resolver
 * 
 * Handles image URLs from various sources:
 * - New storage structure (/storage/images/...)
 * - Legacy paths
 * - External URLs (CDN, external services)
 * - Placeholder fallbacks
 */

import { getImageUrl, isStoragePath, StoragePaths } from './storage'
import { ASSETS } from './assets'
import { getApiBaseUrl } from '../config/api'

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

