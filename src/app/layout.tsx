import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import {
  SITE_NAME,
  SITE_DEFAULT_TITLE,
  SITE_DEFAULT_DESCRIPTION,
  SITE_KEYWORDS,
  getSiteUrl,
  getDefaultOgImage,
} from '@/config/seo'
import { PublicPageLoading } from '@/components/ui/PublicPageLoading'
import '../index.css'

const siteUrl = getSiteUrl()
const defaultOgImage = getDefaultOgImage()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: siteUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    siteName: SITE_NAME,
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    url: siteUrl,
    images: [{ url: defaultOgImage, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    images: [defaultOgImage],
  },
  alternates: { canonical: siteUrl },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Suspense fallback={<PublicPageLoading message="Loading..." />}>
          {children}
        </Suspense>
      </body>
    </html>
  )
}

