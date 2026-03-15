import type { Metadata } from 'next'
import { buildPageMetadata } from '@/shared/config/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Blog',
  description:
    'Rentals.ph blog – tips for renters and landlords, market insights, and news about the Philippine rental property market.',
  path: '/blog',
})

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
