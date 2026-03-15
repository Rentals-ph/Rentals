'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ASSETS } from '@/shared/utils/assets'
import { 
  FiSend,
  FiUser,
  FiLock,
  FiEdit3
} from 'react-icons/fi'

// Types
import type { ProfileData, EditFormData, PasswordFormData } from '@/shared/forms/types/account'

// Re-export for backward compatibility
export type { ProfileData, EditFormData, PasswordFormData } from '@/shared/forms/types/account'

export interface AccountSettingsProps {
  userType: 'agent' | 'broker'
  profileData: ProfileData
  editFormData: EditFormData
  loading?: boolean
  uploading?: boolean
  imagePreview?: string | null
  companyImagePreview?: string | null
  onEditFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onEditSubmit: (e: React.FormEvent) => void
  onPasswordSubmit: (passwordData: PasswordFormData) => void
  onImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCompanyImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  cancelRoute?: string
}

export default function AccountSettings({
  userType,
  profileData,
  editFormData,
  loading = false,
  uploading = false,
  imagePreview,
  onEditFormChange,
  onEditSubmit,
  onPasswordSubmit,
  onImageChange,
  onCompanyImageChange,
  companyImagePreview,
  cancelRoute
}: AccountSettingsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'password'>('profile')
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Change password form data (local state since it's not persisted)
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Standard input style used across the application
  const INPUT_STYLE = 'px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      alert('New password and confirm password do not match')
      return
    }
    onPasswordSubmit(passwordFormData)
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onEditSubmit(e)
    // Reset edit mode after successful submission
    setIsEditMode(false)
  }

  const getInitials = (name: string, email?: string) => {
    if (name && name !== 'Agent' && name !== 'Broker' && name !== 'Unknown Agent') {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || userType[0].toUpperCase()
    }
    if (email) {
      return email.split('@')[0].slice(0, 2).toUpperCase()
    }
    return userType[0].toUpperCase()
  }

  const defaultCancelRoute = userType === 'agent' ? '/agent' : '/broker'

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        <p>Loading account information...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 md:flex-wrap">
        <button 
          className={`flex items-center gap-2 px-6 py-4 border-none bg-transparent text-sm font-medium text-gray-500 cursor-pointer transition-all border-b-2 border-transparent relative md:flex-1 md:min-w-[120px] md:px-4 md:py-3 md:text-xs ${activeTab === 'profile' ? 'text-blue-500 border-b-blue-500 bg-white' : 'hover:text-blue-500 hover:bg-gray-100'}`}
          onClick={() => {
            setActiveTab('profile')
            setIsEditMode(false)
          }}
        >
          <FiUser className="text-lg" />
          <span>Profile</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-8 lg:p-6 md:p-5">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-[800px]">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200 md:flex-col md:items-start">
              <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img 
                  src={profileData.avatar || ASSETS.PLACEHOLDER_PROFILE} 
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-5xl">
                  {getInitials(profileData.name, profileData.email)}
                </div>
              </div>
              <div>
                <h2 className="m-0 mb-2 text-[28px] font-bold text-gray-900">{profileData.name}</h2>
                <p className="m-0 text-base text-gray-500">{profileData.role}</p>
              </div>
            </div>

            <div className="flex flex-col gap-6 mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <p className="m-0 text-base text-gray-900">{profileData.email}</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <p className="m-0 text-base text-gray-900">{profileData.phone}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                className="px-6 py-3 bg-blue-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-blue-600 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
                onClick={() => {
                  setActiveTab('edit')
                  setIsEditMode(false)
                }}
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* Edit Profile Tab */}
        {activeTab === 'edit' && (
          <div className="max-w-[1000px]">
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200 md:flex-col md:gap-5">
              <div className="flex items-center gap-5">
                <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative">
                  <img 
                    src={imagePreview || profileData.avatar || ASSETS.PLACEHOLDER_PROFILE} 
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }} 
                  />
                  <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-5xl">
                    {getInitials(profileData.name)}
                  </div>
                  {onImageChange && isEditMode && (
                    <label htmlFor="profile-image-upload" className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-center cursor-pointer">
                      <input
                        type="file"
                        id="profile-image-upload"
                        accept="image/*"
                        onChange={onImageChange}
                        style={{ display: 'none' }}
                      />
                      <span className="absolute bottom-2.5 -right-2.5 bg-rental-orange-500 text-white px-3 py-2 rounded cursor-pointer text-xs whitespace-nowrap">
                        Change Photo
                      </span>
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="m-0 mb-1 text-2xl font-bold text-gray-900">{profileData.name}</h3>
                  <p className="m-0 text-sm text-gray-500">{profileData.role}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {!isEditMode ? (
                  <button 
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="px-6 py-3 bg-blue-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-blue-600 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)] flex items-center gap-2"
                  >
                    <FiEdit3 className="text-base" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button 
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-6 py-3 bg-white text-gray-500 border border-gray-300 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      form="edit-profile-form" 
                      className="px-6 py-3 bg-blue-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-blue-600 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={uploading}
                    >
                      {uploading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <form id="edit-profile-form" onSubmit={handleEditSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <h3 className="m-0 text-xs font-bold text-gray-500 uppercase tracking-widest">PERSONAL INFORMATION</h3>
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      Firstname <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Lastname <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={editFormData.lastName}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editFormData.email}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                    />
                  </div>

                  <div className="flex flex-col gap-2 col-span-2 lg:col-span-1">
                    <label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 min-w-0">
                      <input
                        type="text"
                        id="countryCode"
                        name="countryCode"
                        value={editFormData.countryCode}
                        onChange={onEditFormChange}
                        className={`w-[100px] flex-shrink-0 ${INPUT_STYLE} bg-gray-50`}
                        readOnly
                        disabled
                      />
                      <input
                        type="text"
                        id="contactNumber"
                        name="contactNumber"
                        value={editFormData.contactNumber}
                        onChange={onEditFormChange}
                        disabled={!isEditMode}
                        className={`flex-1 min-w-0 ${INPUT_STYLE}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="whatsapp" className="text-sm font-medium text-gray-700">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      id="whatsapp"
                      name="whatsapp"
                      value={editFormData.whatsapp || ''}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                      placeholder="e.g., +63 912 345 6789"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="facebook" className="text-sm font-medium text-gray-700">
                      Facebook Profile URL
                    </label>
                    <input
                      type="text"
                      id="facebook"
                      name="facebook"
                      value={editFormData.facebook || ''}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                      placeholder="e.g., https://facebook.com/yourprofile"
                    />
                  </div>

                  <div className="flex flex-col gap-2 col-span-2 lg:col-span-1">
                    <label htmlFor="aboutYourself" className="text-sm font-medium text-gray-700">About Yourself</label>
                    <textarea
                      id="aboutYourself"
                      name="aboutYourself"
                      value={editFormData.aboutYourself}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE} resize-y min-h-[100px]`}
                      placeholder="About yourself..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="m-0 text-xs font-bold text-gray-500 uppercase tracking-widest">LOCAL INFORMATION</h3>
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
                  <div className="flex flex-col gap-2 col-span-2 lg:col-span-1">
                    <label htmlFor="addressLine1" className="text-sm font-medium text-gray-700">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiSend className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
                      <input
                        type="text"
                        id="addressLine1"
                        name="addressLine1"
                        value={editFormData.addressLine1}
                        onChange={onEditFormChange}
                        disabled={!isEditMode}
                        className={`w-full ${INPUT_STYLE} pl-12`}
                        placeholder="Sample Address Street (Near Somewhere on Earth)."
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={editFormData.country}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                    >
                      <option value="Philippines">Philippines</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="region" className="text-sm font-medium text-gray-700">
                      Regions <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="region"
                      name="region"
                      value={editFormData.region}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                    >
                      <option value="Region VII - Central Visayas">Region VII - Central Visayas</option>
                      <option value="Region I - Ilocos Region">Region I - Ilocos Region</option>
                      <option value="Region II - Cagayan Valley">Region II - Cagayan Valley</option>
                      <option value="Region III - Central Luzon">Region III - Central Luzon</option>
                      <option value="Region IV-A - CALABARZON">Region IV-A - CALABARZON</option>
                      <option value="NCR - National Capital Region">NCR - National Capital Region</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="province" className="text-sm font-medium text-gray-700">
                      Provinces <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="province"
                      name="province"
                      value={editFormData.province}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                    >
                      <option value="Cebu">Cebu</option>
                      <option value="Bohol">Bohol</option>
                      <option value="Negros Oriental">Negros Oriental</option>
                      <option value="Siquijor">Siquijor</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="city" className="text-sm font-medium text-gray-700">
                      Cities <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={editFormData.city}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                    >
                      <option value="Cebu City">Cebu City</option>
                      <option value="Lapu-Lapu City">Lapu-Lapu City</option>
                      <option value="Mandaue City">Mandaue City</option>
                      <option value="Talisay City">Talisay City</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div className="flex flex-col gap-5">
                <h3 className="m-0 text-xs font-bold text-gray-500 uppercase tracking-widest">COMPANY INFORMATION</h3>
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
                  <div className="flex flex-col gap-2 col-span-2 lg:col-span-1">
                    <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={editFormData.companyName || ''}
                      onChange={onEditFormChange}
                      disabled={!isEditMode}
                      className={`w-full ${INPUT_STYLE}`}
                      placeholder="Enter your company name"
                    />
                  </div>
                  {onCompanyImageChange && (
                    <div className="flex flex-col gap-2 col-span-2 lg:col-span-1">
                      <label htmlFor="company-image-upload" className="text-sm font-medium text-gray-700">
                        Company Logo
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <label
                            htmlFor="company-image-upload"
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upload Logo
                          </label>
                          <input
                            type="file"
                            id="company-image-upload"
                            accept="image/*"
                            onChange={onCompanyImageChange}
                            disabled={!isEditMode}
                            className="hidden"
                          />
                        </div>
                        {companyImagePreview && (
                          <div className="mt-2">
                            <img
                              src={companyImagePreview}
                              alt="Company logo"
                              className="max-w-[200px] h-auto rounded-lg border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="max-w-[600px]">
            <div className="mb-8">
              <h2 className="m-0 mb-2 text-2xl font-bold text-gray-900">Change Password</h2>
              <p className="m-0 text-sm text-gray-500">Update your account password to keep your account secure.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full ${INPUT_STYLE}`}
                  placeholder="Current password"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordChange}
                  className={`w-full ${INPUT_STYLE}`}
                  placeholder="New password"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full ${INPUT_STYLE}`}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="flex gap-3 mt-2 md:flex-col">
                <button type="submit" className="px-6 py-3 bg-blue-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-blue-600 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)] md:w-full">
                  Change Password
                </button>
                <button 
                  type="button" 
                  onClick={() => router.push(cancelRoute || defaultCancelRoute)} 
                  className="px-6 py-3 bg-white text-gray-500 border border-gray-300 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 md:w-full"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
