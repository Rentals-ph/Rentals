'use client'

import BrokerHeader from '@/components/broker/BrokerHeader'
import {
  CreateListingStepLayout,
  VisualsFeaturesStepContent,
} from '@/components/create-listing'

const STEP_LABELS = [
  'Basic Information',
  'Visuals & Features',
  'Pricing',
  'Owner Info & Review',
]

export default function BrokerCreateListingVisualsFeatures() {
  return (
    <CreateListingStepLayout
      header={
        <BrokerHeader
          title="Create Listing"
          subtitle="Add visuals and features."
          showAddListing
        />
      }
      stepLabels={STEP_LABELS}
      currentStepIndex={1}
      breadcrumbStepName="Visuals & Features"
      createListingPath="/broker/create-listing"
    >
      <VisualsFeaturesStepContent
        prevStepPath="/broker/create-listing/basic-info"
        nextStepPath="/broker/create-listing/pricing"
        nextButtonLabel="Next: Pricing"
        showFurnishing
      />
    </CreateListingStepLayout>
  )
}
