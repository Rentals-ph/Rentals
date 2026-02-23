'use client'

import BrokerHeader from '../../../components/broker/BrokerHeader'
import { CreateListingChoice } from '../../../components/create-listing'

export default function BrokerCreateListing() {
  return (
    <CreateListingChoice
      header={
        <BrokerHeader
          title="Create New Listing"
          subtitle="Choose how you'd like to create your property listing"
        />
      }
      manualHref="/broker/create-listing/basic-info"
      aiAssistantHref="/broker/listing-assistant"
    />
  )
}
