/**
 * SEO configuration for Rentals.ph
 * Used by root layout and route-specific metadata.
 */

import type { Metadata } from 'next'

export const SITE_NAME = 'Rentals.ph'
export const SITE_DEFAULT_TITLE = 'Rentals.ph - Your Trusted Property Rental Platform'
export const SITE_DEFAULT_DESCRIPTION =
  'Find the perfect rental property in the Philippines. Browse apartments, houses, and condos for rent. Connect with verified rent managers and property specialists.'

export const SITE_KEYWORDS = [
  'rental properties Philippines',
  'apartment for rent',
  'house for rent',
  'condo rental',
  'Philippines real estate',
  'rent manager',
  'property for rent',
].join(', ')

/** Base URL for canonical and Open Graph. Set NEXT_PUBLIC_SITE_URL in production. */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://rentals.ph'
}

/** Default OG image (absolute URL). Use 1200x630 for best results. */
export function getDefaultOgImage(): string {
  const base = getSiteUrl()
  const path = process.env.NEXT_PUBLIC_OG_IMAGE_PATH || '/assets/logos/rentals-logo-footer-tagline.png'
  return path.startsWith('http') ? path : `${base}${path}`
}

export interface PageSeoOptions {
  title: string
  description?: string
  /** Path (e.g. /about). Used for canonical and openGraph.url */
  path?: string
  /** Override OG image URL */
  image?: string
  /** No index (e.g. for thank-you or duplicate content) */
  noIndex?: boolean
}

/**
 * Build metadata for a page. Merges with defaults; use in layout.tsx or page.tsx.
 */
export function buildPageMetadata(options: PageSeoOptions): Metadata {
  const { title, description, path, image, noIndex } = options
  const siteUrl = getSiteUrl()
  const canonical = path ? `${siteUrl}${path}` : undefined
  const ogImage = image || getDefaultOgImage()

  return {
    title: path ? `${title} | ${SITE_NAME}` : title,
    description: description || SITE_DEFAULT_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    ...(noIndex && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      type: 'website',
      locale: 'en_PH',
      siteName: SITE_NAME,
      title: title,
      description: description || SITE_DEFAULT_DESCRIPTION,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description || SITE_DEFAULT_DESCRIPTION,
      images: [ogImage],
    },
    ...(canonical && { alternates: { canonical } }),
  }
}
