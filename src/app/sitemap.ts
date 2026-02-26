import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/config/seo'
import { getApiBaseUrl } from '@/config/api'

const BASE = getSiteUrl()

const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  { url: `${BASE}/properties`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE}/news`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE}/rent-managers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
]

async function fetchDynamicIds(
  endpoint: string
): Promise<{ id: number }[]> {
  try {
    const apiBase = getApiBaseUrl()
    const res = await fetch(`${apiBase}${endpoint}`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    const list = Array.isArray(data) ? data : data?.data ?? []
    return list.map((item: { id: number }) => ({ id: item.id }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [propertyIds, blogIds, newsIds] = await Promise.all([
    fetchDynamicIds('/properties'),
    fetchDynamicIds('/blogs'),
    fetchDynamicIds('/news'),
  ])

  const propertyUrls: MetadataRoute.Sitemap = propertyIds.map(({ id }) => ({
    url: `${BASE}/property/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const blogUrls: MetadataRoute.Sitemap = blogIds.map(({ id }) => ({
    url: `${BASE}/blog/${id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const newsUrls: MetadataRoute.Sitemap = newsIds.map(({ id }) => ({
    url: `${BASE}/news/${id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...propertyUrls, ...blogUrls, ...newsUrls]
}
