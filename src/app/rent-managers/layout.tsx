import type { Metadata } from 'next'
import { buildPageMetadata } from '@/config/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Rent Managers',
  description:
    'Meet our verified rent managers and property specialists. Connect with trusted agents to find or list rental properties in the Philippines.',
  path: '/rent-managers',
})

export default function RentManagersLayout({ children }: { children: React.ReactNode }) {
  return children
}
