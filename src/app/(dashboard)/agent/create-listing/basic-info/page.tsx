'use client'

import { CreateListingStepLayout, BasicInfoStepContent } from '@/features/listings'

const STEP_LABELS = [
  'Basic Information',
  'Visuals & Features',
  'Owner Info & Review',
]

export default function AgentCreateListingBasicInfo() {
  return (
    <CreateListingStepLayout
      stepLabels={STEP_LABELS}
      currentStepIndex={0}
      breadcrumbStepName="Basic Information"
      createListingPath="/agent/create-listing"
    >
      <BasicInfoStepContent nextStepPath="/agent/create-listing/visuals-features" />
    </CreateListingStepLayout>
  )
}
