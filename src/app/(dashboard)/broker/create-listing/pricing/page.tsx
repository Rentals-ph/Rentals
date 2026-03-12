'use client'

import {
  CreateListingStepLayout,
  PricingStepContent,
} from '@/components/create-listing'

const STEP_LABELS = [
  'Basic Information',
  'Visuals & Features',
  'Pricing',
  'Owner Info & Review',
]

export default function BrokerCreateListingPricing() {
  return (
    <CreateListingStepLayout
      stepLabels={STEP_LABELS}
      currentStepIndex={2}
      breadcrumbStepName="Pricing"
      createListingPath="/broker/create-listing"
    >
      <PricingStepContent
        prevStepPath="/broker/create-listing/visuals-features"
        nextStepPath="/broker/create-listing/owner-review"
        nextButtonLabel="Next: Owner Info & Review"
      />
    </CreateListingStepLayout>
  )
}
