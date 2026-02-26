import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/config/seo'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/agent/', '/broker/', '/verify-email'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/agent/', '/broker/', '/verify-email'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
