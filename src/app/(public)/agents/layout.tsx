import type { Metadata } from 'next'
import { buildPageMetadata } from '@/config/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Agents',
  description:
    'Meet our verified agents and property specialists. Connect with trusted agents to find or list rental properties in the Philippines.',
  path: '/agents',
})

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return children
}
