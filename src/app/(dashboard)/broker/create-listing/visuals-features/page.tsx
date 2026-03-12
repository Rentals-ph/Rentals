'use client'

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
