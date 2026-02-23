'use client'

import { useState } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import {
  FiBell,
  FiPlus,
  FiChevronDown,
  FiCheck,
  FiSettings,
  FiX,
  FiEye,
  FiUser,
  FiPhone,
  FiGlobe,
  FiSend,
  FiAlertCircle,
  FiCreditCard,
} from 'react-icons/fi'
// import './page.css' // Removed - converted to Tailwind

interface Applicant {
  id: number
  name: string
  requestedRole: 'Agent' | 'Unit Manager'
  assignedManager: string | null
  profileCompletion: string
  designTheme: string
  photo?: string
}

const applicantsData: Applicant[] = [
  {
    id: 1,
    name: 'Beatriz Luna',
    requestedRole: 'Agent',
    assignedManager: 'Gabo Dela Cruz',
    profileCompletion: '85%',
    designTheme: 'Royal Blue',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
  },
  {
    id: 2,
    name: 'Kevin Chua',
    requestedRole: 'Unit Manager',
    assignedManager: 'Camille Santos',
    profileCompletion: '100%',
    designTheme: 'Action Orange',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  },
  {
    id: 3,
    name: 'Rina Lopez',
    requestedRole: 'Agent',
    assignedManager: null,
    profileCompletion: '95%',
    designTheme: 'Dark Mode',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  },
  {
    id: 4,
    name: 'Sam Rivera',
    requestedRole: 'Agent',
    assignedManager: 'Gabo Dela Cruz',
    profileCompletion: '75%',
    designTheme: 'Light Mode',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  },
]

export default function AgentApprovalsPage() {
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [message, setMessage] = useState('')

  const allSelected =
    selectedApplicants.length === applicantsData.length && applicantsData.length > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedApplicants([])
    } else {
      setSelectedApplicants(applicantsData.map((a) => a.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedApplicants((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSettingsClick = (applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedApplicant(null)
    setMessage('')
  }

  const handleSendMessage = () => {
    // Handle send message logic
    console.log('Sending message:', message)
    setMessage('')
  }

  const handleApprove = () => {
    // Handle approve logic
    console.log('Approving:', selectedApplicant?.name)
    handleCloseModal()
  }

  const handleReject = () => {
    // Handle reject logic
    console.log('Rejecting:', selectedApplicant?.name)
    handleCloseModal()
  }

  const handleRequestCompletion = () => {
    // Handle request completion logic
    console.log('Requesting completion for:', selectedApplicant?.name)
  }

  // Calculate verification percentage (remove % and convert to number)
  const getVerificationPercentage = (completion: string) => {
    return parseInt(completion.replace('%', ''))
  }

  const isVerified = (percentage: number) => percentage >= 100

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* broker-dashboard */}
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15"> {/* broker-main */}
        {/* Header */}
        <header className="flex items-center justify-between mb-7 md:flex-col md:items-start md:gap-3.5"> {/* broker-header */}
          <div className="flex flex-col gap-1"> {/* broker-header-left */}
            <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1 md:text-xl">Agent Approvals</h1>
            <p className="text-sm text-gray-400 m-0">A dedicated space to review agent&apos;s professional profiles.</p>
          </div>
          <div className="flex items-center gap-3.5 md:w-full md:justify-between md:gap-2.5"> {/* broker-header-right */}
            <button className="w-11 h-11 rounded-xl border-0 bg-white flex items-center justify-center text-gray-600 text-xl cursor-pointer transition-all duration-200 shadow-sm hover:bg-gray-50 hover:text-blue-600"> {/* broker-notification-btn */}
              <FiBell />
            </button>
            <a href="/broker/create-listing" className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 text-white text-sm font-semibold rounded-xl border-0 no-underline cursor-pointer transition-all duration-200 shadow-sm hover:bg-blue-700 active:scale-[0.98]"> {/* broker-add-listing-btn */}
              <FiPlus />
              Add Listing
            </a>
          </div>
        </header>

        {/* Approvals Table */}
        <div className="bg-white rounded-[14px] p-6 shadow-sm mb-6 md:p-4"> {/* ba-table-card */}
          <div className="flex items-center justify-between mb-5 md:flex-col md:items-start md:gap-3"> {/* ba-table-header */}
            <h3 className="text-base font-bold text-gray-900 m-0">Agent Approvals Table</h3> {/* ba-table-title */}
            <button className="inline-flex items-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-gray-200 active:scale-[0.98]"> {/* ba-filter-btn */}
              Filter <FiChevronDown />
            </button>
          </div>

          {/* Desktop Table */}
          <div className="overflow-x-auto md:hidden"> {/* ba-table-wrapper */}
            <table className="w-full border-collapse min-w-[900px]"> {/* ba-table */}
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-12"> {/* ba-th-check */}
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 md:w-5 md:h-5" /* ba-checkbox */
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Applicant Name</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Requested Role</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Assigned Manager</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Profile Completion</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Design Theme</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicantsData.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b border-gray-100 w-12"> {/* ba-td-check */}
                      <input
                        type="checkbox"
                        checked={selectedApplicants.includes(applicant.id)}
                        onChange={() => toggleSelect(applicant.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 md:w-5 md:h-5" /* ba-checkbox */
                      />
                    </td>
                    <td className="py-3 px-4 border-b border-gray-100 font-semibold text-gray-900">{applicant.name}</td> {/* ba-td-name */}
                    <td className="py-3 px-4 border-b border-gray-100 text-gray-700">{applicant.requestedRole}</td> {/* ba-td-role */}
                    <td className="py-3 px-4 border-b border-gray-100 text-gray-600"> {/* ba-td-manager */}
                      {applicant.assignedManager || (
                        <span className="text-gray-400">&mdash;</span> /* ba-dash */
                      )}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-100 text-gray-700">{applicant.profileCompletion}</td> {/* ba-td-completion */}
                    <td className="py-3 px-4 border-b border-gray-100 text-gray-700">{applicant.designTheme}</td> {/* ba-td-theme */}
                    <td className="py-3 px-4 border-b border-gray-100"> {/* ba-td-actions */}
                      <div className="flex items-center gap-2"> {/* ba-actions-row */}
                        <button className="w-8 h-8 rounded-lg border-0 flex items-center justify-center text-emerald-600 bg-emerald-50 cursor-pointer transition-all duration-200 hover:bg-emerald-100 active:scale-95" title="Approve"> {/* ba-action-btn approve */}
                          <FiCheck />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg border-0 flex items-center justify-center text-gray-600 bg-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-200 active:scale-95" /* ba-action-btn settings */
                          title="Settings"
                          onClick={() => handleSettingsClick(applicant)}
                        >
                          <FiSettings />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="hidden md:flex flex-col gap-3"> {/* ba-mobile-cards */}
            {applicantsData.map((applicant) => (
              <div key={applicant.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 transition-all duration-200 active:bg-gray-100"> {/* ba-mobile-card */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200"> {/* ba-mobile-card-header */}
                  <div className="flex items-center gap-3"> {/* ba-mobile-card-name */}
                    <input
                      type="checkbox"
                      checked={selectedApplicants.includes(applicant.id)}
                      onChange={() => toggleSelect(applicant.id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500" /* ba-mobile-card-checkbox */
                    />
                    <span className="text-base font-bold text-gray-900">{applicant.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2"> {/* ba-mobile-card-row */}
                  <span className="text-xs font-medium text-gray-500 uppercase">Requested Role</span> {/* ba-mobile-card-label */}
                  <span className="text-sm font-semibold text-gray-900">{applicant.requestedRole}</span> {/* ba-mobile-card-value */}
                </div>
                <div className="flex items-center justify-between mb-2"> {/* ba-mobile-card-row */}
                  <span className="text-xs font-medium text-gray-500 uppercase">Assigned Manager</span> {/* ba-mobile-card-label */}
                  <span className="text-sm font-semibold text-gray-900"> {/* ba-mobile-card-value */}
                    {applicant.assignedManager || <span className="text-gray-400">&mdash;</span>} {/* ba-dash */}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2"> {/* ba-mobile-card-row */}
                  <span className="text-xs font-medium text-gray-500 uppercase">Profile Completion</span> {/* ba-mobile-card-label */}
                  <span className="text-sm font-semibold text-gray-900">{applicant.profileCompletion}</span> {/* ba-mobile-card-value */}
                </div>
                <div className="flex items-center justify-between mb-2"> {/* ba-mobile-card-row */}
                  <span className="text-xs font-medium text-gray-500 uppercase">Design Theme</span> {/* ba-mobile-card-label */}
                  <span className="text-sm font-semibold text-gray-900">{applicant.designTheme}</span> {/* ba-mobile-card-value */}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200 mt-3"> {/* ba-mobile-card-actions */}
                  <button 
                    className="w-8 h-8 rounded-lg border-0 flex items-center justify-center text-emerald-600 bg-emerald-50 cursor-pointer transition-all duration-200 hover:bg-emerald-100 active:scale-95" /* ba-action-btn approve */
                    title="Approve"
                    onClick={() => {
                      // Handle approve for mobile
                      console.log('Approve:', applicant.name)
                    }}
                  >
                    <FiCheck />
                  </button>
                  <button 
                    className="w-8 h-8 rounded-lg border-0 flex items-center justify-center text-gray-600 bg-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-200 active:scale-95" /* ba-action-btn settings */
                    title="Settings"
                    onClick={() => handleSettingsClick(applicant)}
                  >
                    <FiSettings />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Agent Details Modal */}
      {showModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}> {/* ba-modal-overlay */}
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}> {/* ba-modal-content */}
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 p-4 flex justify-end border-b border-gray-200"> {/* ba-modal-header */}
              <button className="w-10 h-10 rounded-full border-0 bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-200" onClick={handleCloseModal}> {/* ba-modal-close */}
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6"> {/* ba-modal-body */}
              {/* Profile Section */}
              <div className="flex flex-col items-center"> {/* ba-modal-profile */}
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden mb-4 border-4 border-blue-100"> {/* ba-profile-image */}
                  <img 
                    src={selectedApplicant.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApplicant.name)}&size=120&background=3b82f6&color=fff&bold=true`}
                    alt={selectedApplicant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApplicant.name)}&size=120&background=3b82f6&color=fff&bold=true`
                    }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedApplicant.name}</h2> {/* ba-profile-name */}
                <p className="text-sm text-gray-500 mb-5">{selectedApplicant.requestedRole}</p> {/* ba-profile-role */}

                {/* Verification Status */}
                <div className="w-full flex flex-col gap-2 mb-5"> {/* ba-verification-status */}
                  <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700"> {/* ba-verification-item verified */}
                    <FiUser className="text-base" /> {/* ba-verification-icon */}
                    <span className="text-sm font-medium">Profile Verification is at {selectedApplicant.profileCompletion}</span>
                  </div>
                  <div className={`flex items-center gap-2 py-2 px-3 rounded-lg ${isVerified(getVerificationPercentage(selectedApplicant.profileCompletion)) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}> {/* ba-verification-item verified/not-verified */}
                    {isVerified(getVerificationPercentage(selectedApplicant.profileCompletion)) ? (
                      <FiCheck className="text-base" /> /* ba-verification-icon */
                    ) : (
                      <FiX className="text-base" /> /* ba-verification-icon */
                    )}
                    <span className="text-sm font-medium">{isVerified(getVerificationPercentage(selectedApplicant.profileCompletion)) ? 'Verified' : 'Not Verified'}</span>
                  </div>
                </div>

                {/* Profile Details Links */}
                <div className="w-full flex flex-col gap-2 mb-5"> {/* ba-profile-details */}
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"> {/* ba-detail-item */}
                    <div className="flex items-center gap-2"> {/* ba-detail-left */}
                      <FiCreditCard className="text-gray-600" /> {/* ba-detail-icon */}
                      <span className="text-sm font-medium text-gray-900">PRC ID</span>
                    </div>
                    <button className="inline-flex items-center gap-1 py-1.5 px-3 bg-blue-600 text-white text-xs font-medium rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700"> {/* ba-view-btn */}
                      <FiEye />
                      View
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"> {/* ba-detail-item */}
                    <div className="flex items-center gap-2"> {/* ba-detail-left */}
                      <FiPhone className="text-gray-600" /> {/* ba-detail-icon */}
                      <span className="text-sm font-medium text-gray-900">Contact</span>
                    </div>
                    <button className="inline-flex items-center gap-1 py-1.5 px-3 bg-blue-600 text-white text-xs font-medium rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700"> {/* ba-view-btn */}
                      <FiEye />
                      View
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"> {/* ba-detail-item */}
                    <div className="flex items-center gap-2"> {/* ba-detail-left */}
                      <FiUser className="text-gray-600" /> {/* ba-detail-icon */}
                      <span className="text-sm font-medium text-gray-900">Profile Photo</span>
                    </div>
                    <button className="inline-flex items-center gap-1 py-1.5 px-3 bg-blue-600 text-white text-xs font-medium rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700"> {/* ba-view-btn */}
                      <FiEye />
                      View
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"> {/* ba-detail-item */}
                    <div className="flex items-center gap-2"> {/* ba-detail-left */}
                      <FiGlobe className="text-gray-600" /> {/* ba-detail-icon */}
                      <span className="text-sm font-medium text-gray-900">View Page</span>
                    </div>
                    <button className="inline-flex items-center gap-1 py-1.5 px-3 bg-blue-600 text-white text-xs font-medium rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700"> {/* ba-view-btn */}
                      <FiEye />
                      View
                    </button>
                  </div>
                </div>

                {/* Send Message Section */}
                <div className="w-full mb-5"> {/* ba-message-section */}
                  <h3 className="text-base font-bold text-gray-900 mb-3">Send a message</h3> {/* ba-message-title */}
                  <textarea
                    className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /* ba-message-textarea */
                    placeholder="Send a message to this agent..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2 mt-3"> {/* ba-message-buttons */}
                    <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700" onClick={handleSendMessage}> {/* ba-send-message-btn */}
                      <FiSend />
                      Send Message
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-amber-700" onClick={handleRequestCompletion}> {/* ba-request-completion-btn */}
                      <FiAlertCircle />
                      Send request
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full flex gap-3"> {/* ba-action-buttons */}
                  <button className="flex-1 py-3 px-4 bg-emerald-600 text-white text-base font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-emerald-700" onClick={handleApprove}> {/* ba-approve-btn */}
                    Approve
                  </button>
                  <button className="flex-1 py-3 px-4 bg-red-600 text-white text-base font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-red-700" onClick={handleReject}> {/* ba-reject-btn */}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
