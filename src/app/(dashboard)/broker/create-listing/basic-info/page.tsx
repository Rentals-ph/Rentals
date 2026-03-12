'use client'

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
