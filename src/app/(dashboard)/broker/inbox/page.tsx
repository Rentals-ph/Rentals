'use client'

import {
  FiBell,
  FiPlus,
} from 'react-icons/fi'
import InboxPage from '@/components/dashboard/InboxPage'

export default function BrokerInbox() {
  return (
    <div className="-m-6 md:-m-4 p-8 min-h-[calc(100vh-var(--header-height,80px))] lg:p-6 md:p-4 md:pt-15 bg-gray-100 font-outfit">
      {/* Broker Header */}
      <header className="flex items-center justify-between mb-7 md:flex-col md:items-start md:gap-3.5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1 md:text-xl">Inbox</h1>
          <p className="text-sm text-gray-400 m-0">Manage your messages and inquiries.</p>
        </div>
        <div className="flex items-center gap-3.5 md:w-full md:justify-between md:gap-2.5">
          <button className="w-11 h-11 rounded-xl border-0 bg-white flex items-center justify-center text-gray-600 text-xl cursor-pointer transition-all duration-200 shadow-sm hover:bg-gray-50 hover:text-blue-600">
            <FiBell />
          </button>
          <a
            href="/broker/create-listing"
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 text-white text-sm font-semibold rounded-xl border-0 no-underline cursor-pointer transition-all duration-200 shadow-sm hover:bg-blue-700 active:scale-[0.98]"
          >
            <FiPlus />
            Add Listing
          </a>
        </div>
      </header>
      <InboxPage
        registrationStatusKey="broker_registration_status"
        statusKey="broker_status"
        ownerIdStorageKey="broker_id"
        variant="broker"
      />
    </div>
  )
}
