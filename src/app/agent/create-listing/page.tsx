'use client'

import AgentHeader from '../../../components/agent/AgentHeader'
import { CreateListingChoice } from '../../../components/create-listing'

export default function AgentCreateListing() {
  return (
    <CreateListingChoice
      header={
        <AgentHeader
          title="Create New Listing"
          subtitle="Choose how you'd like to create your property listing"
        />
      }
      manualHref="/agent/create-listing/basic-info"
      aiAssistantHref="/agent/listing-assistant"
    />
  )
}
