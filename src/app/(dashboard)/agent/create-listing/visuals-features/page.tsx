'use client'

import AgentHeader from '@/components/agent/AgentHeader'
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
      header={
        <AgentHeader
          title="Create Listing"
          subtitle="Add visuals and features."
        />
      }
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
