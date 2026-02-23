'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '../../../components/common/AppSidebar'
import AccountSettings, { 
  ProfileData, 
  EditFormData, 
  PasswordFormData 
} from '../../../components/common/AccountSettings'
import { ASSETS } from '@/utils/assets'
import { 
  FiBell,
  FiPlus
} from 'react-icons/fi'
// import '../broker-shared.css' // Removed - converted to Tailwind

export default function BrokerSettings() {
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
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* broker-dashboard */}
      <AppSidebar />

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15"> {/* broker-main */}
        <header className="broker-header">
          <div className="broker-header-left">
            <h1>Settings</h1>
            <p>Manage your account information and preferences.</p>
          </div>
          <div className="broker-header-right">
            <button className="broker-notification-btn">
              <FiBell />
            </button>
            <a href="/broker/create-listing" className="broker-add-listing-btn">
              <FiPlus />
              Add Listing
            </a>
          </div>
        </header>

        <div className="account-content">
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
      </main>
    </div>
  )
}
