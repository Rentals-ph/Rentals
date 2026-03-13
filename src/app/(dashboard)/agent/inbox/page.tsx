'use client'

import InboxPage from '@/shared/components/dashboard/InboxPage'

export default function AgentInbox() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <InboxPage
        registrationStatusKey="agent_registration_status"
        statusKey="agent_status"
        ownerIdStorageKey="agent_id"
        variant="agent"
      />
    </div>
  )
}
