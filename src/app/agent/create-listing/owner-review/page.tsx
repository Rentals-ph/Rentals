'use client'

import AgentHeader from '../../../../components/agent/AgentHeader'
import {
  CreateListingStepLayout,
  OwnerReviewStepContent,
} from '../../../../components/create-listing'

const STEP_LABELS = [
  'Basic Information',
  'Visuals & Features',
  'Owner Info & Review',
]

const EDIT_STEP_MAP: Record<string, string> = {
  category: '/agent/create-listing/basic-info',
  title: '/agent/create-listing/basic-info',
  price: '/agent/create-listing/owner-review',
  location: '/agent/create-listing/basic-info',
  bedrooms: '/agent/create-listing/basic-info',
  bathrooms: '/agent/create-listing/basic-info',
  floorArea: '/agent/create-listing/basic-info',
  video: '/agent/create-listing/visuals-features',
  amenities: '/agent/create-listing/visuals-features',
}

export default function AgentCreateListingOwnerReview() {
  return (
    <CreateListingStepLayout
      header={
        <AgentHeader
          title="Create Listing"
          subtitle="Add owner information and review your listing."
        />
      }
      stepLabels={STEP_LABELS}
      currentStepIndex={2}
      breadcrumbStepName="Owner Info & Review"
      createListingPath="/agent/create-listing"
    >
      <OwnerReviewStepContent
        editStepMap={EDIT_STEP_MAP}
        successRedirectPath="/agent/listings"
        prevStepPath="/agent/create-listing/visuals-features"
        registrationStatusKey="agent_registration_status"
        statusKey="agent_status"
        showPricingFields
      />
    </CreateListingStepLayout>
  )
}
