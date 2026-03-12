'use client'

import {
  CreateListingStepLayout,
  VisualsFeaturesStepContent,
} from '@/components/create-listing'

const STEP_LABELS = [
  'Basic Information',
  'Visuals & Features',
  'Owner Info & Review',
]

export default function AgentCreateListingVisualsFeatures() {
  return (
    <CreateListingStepLayout
      stepLabels={STEP_LABELS}
      currentStepIndex={1}
      breadcrumbStepName="Visuals & Features"
      createListingPath="/agent/create-listing"
    >
      <VisualsFeaturesStepContent
        prevStepPath="/agent/create-listing/basic-info"
        nextStepPath="/agent/create-listing/owner-review"
        nextButtonLabel="Next: Owner Info & Review"
      />
    </CreateListingStepLayout>
  )
}
