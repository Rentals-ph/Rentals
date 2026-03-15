import type { Metadata } from 'next'
import { getApiBaseUrl } from '@/shared/config/api'
import { getSiteUrl, getDefaultOgImage, SITE_NAME } from '@/shared/config/seo'

async function fetchBlog(id: string) {
  const base = getApiBaseUrl()
  try {
    const res = await fetch(`${base}/blogs/${id}`, {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const blog = await fetchBlog(id)
  if (!blog?.title) {
    return {
      title: 'Blog',
      description: 'Read articles and tips from Rentals.ph',
    }
  }

  const title = blog.title
  const description =
    typeof blog.excerpt === 'string' && blog.excerpt
      ? blog.excerpt.slice(0, 160).trim()
      : 'Read this article on Rentals.ph.'
  const image = absoluteImageUrl(blog.image) ?? getDefaultOgImage()
  const path = `/blog/${id}`
  const canonical = `${getSiteUrl()}${path}`

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      locale: 'en_PH',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(blog.published_at && {
        publishedTime: blog.published_at,
      }),
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

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
