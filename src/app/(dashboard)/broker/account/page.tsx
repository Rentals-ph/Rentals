'use client'

import { useState, useEffect } from 'react'
import AccountSettings, { 
  ProfileData, 
  EditFormData, 
  PasswordFormData 
} from '@/components/common/AccountSettings'
import { ASSETS } from '@/utils/assets'

export default function BrokerAccount() {
  const [loading, setLoading] = useState(true)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    role: 'Property Broker',
    avatar: ASSETS.PLACEHOLDER_PROFILE
  })

  const [editFormData, setEditFormData] = useState<EditFormData>({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: 'PH+63',
    contactNumber: '',
    aboutYourself: '',
    addressLine1: '',
    country: 'Philippines',
    region: 'Region VII - Central Visayas',
    province: 'Cebu',
    city: 'Cebu City'
  })

  useEffect(() => {
    const loadBrokerData = () => {
      try {
        const userName = localStorage.getItem('user_name') || 
                         localStorage.getItem('agent_name') || 
                         'John Anderson'
        const userEmail = localStorage.getItem('user_email') || 'john.anderson@skylinerealty.ph'
        const userPhone = localStorage.getItem('user_phone') || '+63 917 123 4567'
        const userAvatar = localStorage.getItem('user_avatar') || ASSETS.PLACEHOLDER_PROFILE

        setProfileData({
          name: userName,
          email: userEmail,
          phone: userPhone,
          role: 'Property Broker',
          avatar: userAvatar
        })

        const nameParts = userName.split(' ')
        setEditFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: userEmail,
          contactNumber: userPhone.replace(/^\+?63\s?/, '')
        }))
      } catch (error) {
        console.error('Error loading broker data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBrokerData()
  }, [])

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Edit profile submitted:', editFormData)
    const fullName = (editFormData.firstName + ' ' + editFormData.lastName).trim()
    localStorage.setItem('user_name', fullName)
    localStorage.setItem('user_email', editFormData.email)
    localStorage.setItem('user_phone', '+63 ' + editFormData.contactNumber)
    
    setProfileData(prev => ({
      ...prev,
      name: fullName,
      email: editFormData.email,
      phone: '+63 ' + editFormData.contactNumber
    }))
    
    alert('Profile updated successfully!')
  }

  const handlePasswordSubmit = (passwordData: PasswordFormData) => {
    console.log('Password change submitted:', passwordData)
    alert('Password changed successfully!')
  }

  return (
    // Render inside broker dashboard layout (sidebar + main offset already applied).
    <div className="-m-6 md:-m-4 bg-gray-100 font-outfit px-4 sm:px-6 md:px-10 lg:px-[150px] py-8 lg:py-6 md:py-4 md:pt-15 min-h-[calc(100vh-var(--header-height,80px))]">
      <header className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1 md:text-xl">Account Settings</h1>
        <p className="text-sm text-gray-400 m-0">Manage your account information and preferences.</p>
      </header>

      <AccountSettings
        userType="broker"
        profileData={profileData}
        editFormData={editFormData}
        loading={loading}
        onEditFormChange={handleEditChange}
        onEditSubmit={handleEditSubmit}
        onPasswordSubmit={handlePasswordSubmit}
        cancelRoute="/broker"
      />
    </div>
  )
}

