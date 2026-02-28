import type { Metadata } from 'next'
import { buildPageMetadata } from '@/config/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with Rentals.ph. Send us your questions about rental properties, partnerships, or support. We’re here to help.',
  path: '/contact',
})

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
