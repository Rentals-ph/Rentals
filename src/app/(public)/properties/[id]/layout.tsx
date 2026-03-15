import type { Metadata } from 'next'
import { getApiBaseUrl } from '@/shared/config/api'
import { getSiteUrl, getDefaultOgImage, SITE_NAME } from '@/shared/config/seo'

type Props = { params: Promise<{ id: string }>; children: React.ReactNode }

async function fetchProperty(id: string) {
  const base = getApiBaseUrl()
  try {
    const res = await fetch(`${base}/properties/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.data ?? data
  } catch {
    return null
  }
}

function absoluteImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const siteUrl = getSiteUrl()
  if (url.startsWith('/')) return `${siteUrl}${url}`
  return `${siteUrl}/${url}`
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const property = await fetchProperty(id)
  if (!property?.title) {
    return {
      title: 'Property',
      description: 'View rental property details on Rentals.ph',
    }
  }

  const title = property.title
  const description =
    typeof property.description === 'string'
      ? property.description.slice(0, 160).trim()
      : 'Rental property in the Philippines. View details on Rentals.ph.'
  const image =
    absoluteImageUrl(property.image_url ?? property.image) ?? getDefaultOgImage()
  const path = `/property/${id}`
  const canonical = `${getSiteUrl()}${path}`

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'en_PH',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
    alternates: { canonical },
  }
}

export default function PropertyLayout({ children }: Props) {
  return children
}
