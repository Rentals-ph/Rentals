import type { Metadata } from 'next'
import { buildPageMetadata } from '@/config/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'News',
  description:
    'Latest news and updates from Rentals.ph and the Philippine rental and real estate industry.',
  path: '/news',
})

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children
}
