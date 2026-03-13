'use client'

import InboxPage from '@/components/dashboard/InboxPage'

export default function BrokerInbox() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <InboxPage
        registrationStatusKey="broker_registration_status"
        statusKey="broker_status"
        ownerIdStorageKey="broker_id"
        variant="broker"
      />
    </div>
  )
}
