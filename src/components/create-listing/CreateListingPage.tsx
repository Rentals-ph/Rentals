'use client'

import type { ReactNode } from 'react'
import { CreateListingChoice } from './CreateListingChoice'

export type CreateListingRole = 'agent' | 'broker'

export interface CreateListingPageProps {
  /** Which flow: agent or broker. Determines routes. */
  role: CreateListingRole
  /** Optional custom header. Header is now in layout, but can be overridden here if needed. */
  header?: ReactNode
}

const AGENT_MANUAL_HREF = '/agent/create-listing/manual'
const AGENT_AI_HREF = '/agent/listing-assistant'
// Broker's manual path now points to the unified form (AI co-pilot + manual form in one page).
// The old multi-step flow (/broker/create-listing/basic-info) is kept intact and still reachable
// directly, but the choice-screen "Manual Input" button now takes brokers to the unified experience.
const BROKER_MANUAL_HREF = '/broker/create-listing/unified'
const BROKER_AI_HREF = '/broker/listing-assistant'

export function CreateListingPage({ role, header }: CreateListingPageProps) {
  const manualHref = role === 'agent' ? AGENT_MANUAL_HREF : BROKER_MANUAL_HREF
  const aiAssistantHref = role === 'agent' ? AGENT_AI_HREF : BROKER_AI_HREF

  // Header is now in layout, but allow custom header override if needed
  return (
    <CreateListingChoice
      header={header}
      manualHref={manualHref}
      aiAssistantHref={aiAssistantHref}
    />
  )
}
