'use client'

import AgentHeader from '@/components/agent/AgentHeader'
import { CreateListingStepLayout, BasicInfoStepContent } from '@/components/create-listing'

const STEP_LABELS = [
  'Basic Information',
  'Visuals & Features',
  'Owner Info & Review',
]

export default function AgentCreateListingBasicInfo() {
  return (
    <CreateListingStepLayout
      header={
        <AgentHeader
          title="Create Listing"
          subtitle="Add basic property information."
        />
      }
      stepLabels={STEP_LABELS}
      currentStepIndex={0}
      breadcrumbStepName="Basic Information"
      createListingPath="/agent/create-listing"
    >
      <BasicInfoStepContent nextStepPath="/agent/create-listing/visuals-features" />
    </CreateListingStepLayout>
  )
}
