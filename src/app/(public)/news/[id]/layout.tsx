import type { Metadata } from 'next'
import { getApiBaseUrl } from '@/config/api'
import { getSiteUrl, getDefaultOgImage, SITE_NAME } from '@/config/seo'

async function fetchNews(id: string) {
  const base = getApiBaseUrl()
  try {
    const res = await fetch(`${base}/news/${id}`, {
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
  const news = await fetchNews(id)
  if (!news?.title) {
    return {
      title: 'News',
      description: 'Read the latest from Rentals.ph',
    }
  }

  const title = news.title
  const description =
    typeof news.excerpt === 'string' && news.excerpt
      ? news.excerpt.slice(0, 160).trim()
      : 'Read the latest news from Rentals.ph.'
  const image = absoluteImageUrl(news.image) ?? getDefaultOgImage()
  const path = `/news/${id}`
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
      ...(news.published_at && {
        publishedTime: news.published_at,
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

export default function NewsArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
