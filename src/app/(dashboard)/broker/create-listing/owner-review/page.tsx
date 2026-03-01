'use client'

import BrokerHeader from '@/components/broker/BrokerHeader'
import {
  CreateListingStepLayout,
  OwnerReviewStepContent,
} from '@/components/create-listing'
import { useCreateListing } from '@/contexts/CreateListingContext'

const STEP_LABELS = [
  'Basic Information',
  'Visuals & Features',
  'Pricing',
  'Review & Publish',
]

const EDIT_STEP_MAP: Record<string, string> = {
  category: '/broker/create-listing/basic-info',
  title: '/broker/create-listing/basic-info',
  price: '/broker/create-listing/pricing',
  location: '/broker/create-listing/basic-info',
  bedrooms: '/broker/create-listing/basic-info',
  bathrooms: '/broker/create-listing/basic-info',
  floorArea: '/broker/create-listing/basic-info',
  video: '/broker/create-listing/visuals-features',
  amenities: '/broker/create-listing/visuals-features',
}

function useAppendBrokerFormData() {
  const { data } = useCreateListing()
  return (formData: FormData) => {
    if (data.zoom) formData.append('zoom_level', data.zoom)
    if (data.furnishing) formData.append('furnishing', data.furnishing)
  }
}

export default function BrokerCreateListingOwnerReview() {
  const appendExtraFormData = useAppendBrokerFormData()

  return (
    <CreateListingStepLayout
      header={
        <BrokerHeader
          title="Create Listing"
          subtitle="Review your listing and publish."
          showAddListing
        />
      }
      stepLabels={STEP_LABELS}
      currentStepIndex={3}
      breadcrumbStepName="Review & Publish"
      createListingPath="/broker/create-listing"
    >
      <OwnerReviewStepContent
        editStepMap={EDIT_STEP_MAP}
        successRedirectPath="/broker/listings"
        prevStepPath="/broker/create-listing/pricing"
        registrationStatusKey="broker_registration_status"
        statusKey="broker_status"
        appendExtraFormData={appendExtraFormData}
      />
    </CreateListingStepLayout>
  )
}
