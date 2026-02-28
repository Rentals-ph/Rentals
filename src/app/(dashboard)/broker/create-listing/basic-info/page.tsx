'use client'

import BrokerHeader from '@/components/broker/BrokerHeader'
import { CreateListingStepLayout, BasicInfoStepContent } from '@/components/create-listing'

const STEP_LABELS = [
  'Basic Information',
  'Visuals & Features',
  'Pricing',
  'Owner Info & Review',
]

export default function BrokerCreateListingBasicInfo() {
  return (
    <CreateListingStepLayout
      header={
        <BrokerHeader
          title="Create Listing"
          subtitle="Add basic property information."
          showAddListing
        />
      }
      stepLabels={STEP_LABELS}
      currentStepIndex={0}
      breadcrumbStepName="Basic Information"
      createListingPath="/broker/create-listing"
    >
      <BasicInfoStepContent
        nextStepPath="/broker/create-listing/visuals-features"
        showZoom
      />
    </CreateListingStepLayout>
  )
}
