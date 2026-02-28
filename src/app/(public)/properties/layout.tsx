import type { Metadata } from 'next'
import { buildPageMetadata } from '@/config/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Properties for Rent',
  description:
    'Browse rental properties in the Philippines. Apartments, houses, condos, and more. Filter by location, price, and type. Find your next home.',
  path: '/properties',
})

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
