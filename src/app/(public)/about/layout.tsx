import type { Metadata } from 'next'
import { buildPageMetadata } from '@/config/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'About Us',
  description:
    'Learn about Rentals.ph – your trusted property rental platform in the Philippines. We provide full service at every step to help you find the perfect rental.',
  path: '/about',
})

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
