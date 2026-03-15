'use client'

import { useState, useEffect } from 'react'
import AccountSettings, { 
  ProfileData, 
  EditFormData, 
  PasswordFormData 
} from '@/shared/components/dashboard/AccountSettings'
import { brokerApi } from '@/api'
import type { Broker } from '@/api/endpoints/broker'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/shared/utils/image'
import { toast, ToastContainer } from '@/utils/toast'

export default function BrokerAccount() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [broker, setBroker] = useState<Broker | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [companyImageFile, setCompanyImageFile] = useState<File | null>(null)
  const [companyImagePreview, setCompanyImagePreview] = useState<string | null>(null)
  
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
    city: 'Cebu City',
    companyName: ''
  })

  useEffect(() => {
    const loadBrokerData = async () => {
      try {
        setLoading(true)
        const data = await brokerApi.getCurrent()
        setBroker(data)
        
        const fullName = data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Broker'
        const avatar = resolveAgentAvatar(data.image || data.avatar || data.profile_image, data.id)
        const phone = data.phone || ''
        const ph = phone.replace(/^\+?63\s?/, '')
        
        setProfileData({
          name: fullName,
          email: data.email,
          phone: phone ? `+63 ${ph}` : '',
          role: 'Property Broker',
          avatar: avatar
        })

        setEditFormData(prev => ({
          ...prev,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email,
          contactNumber: ph,
          aboutYourself: data.description || '',
          addressLine1: data.office_address || '',
          region: data.state || prev.region,
          city: data.city || prev.city,
          companyName: data.company_name || ''
        }))

        if (data.company_image) {
          setCompanyImagePreview(data.company_image)
        }

        // Update localStorage for compatibility
        localStorage.setItem('user_name', fullName)
        localStorage.setItem('user_email', data.email)
        localStorage.setItem('user_phone', phone)
        if (data.id) localStorage.setItem('agent_id', data.id.toString())
      } catch (error) {
        console.error('Error loading broker data:', error)
        toast.error('Failed to load broker profile')
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCompanyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCompanyImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setCompanyImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const phone = editFormData.contactNumber ? '+63' + editFormData.contactNumber.replace(/\D/g, '') : ''
      
      await brokerApi.update({
        first_name: editFormData.firstName.trim(),
        last_name: editFormData.lastName.trim(),
        phone,
        city: editFormData.city.trim(),
        state: editFormData.region.trim(),
        office_address: editFormData.addressLine1.trim(),
        company_name: editFormData.companyName?.trim() || '',
        image: imageFile || undefined,
        company_image: companyImageFile || undefined,
      })

      // Reload broker data
      const refreshed = await brokerApi.getCurrent()
      setBroker(refreshed)
      
      const fullName = refreshed.full_name || `${refreshed.first_name || ''} ${refreshed.last_name || ''}`.trim() || 'Broker'
      const avatar = resolveAgentAvatar(refreshed.image || refreshed.avatar || refreshed.profile_image, refreshed.id)
      const refreshedPhone = refreshed.phone || ''
      const ph = refreshedPhone.replace(/^\+?63\s?/, '')
      
      setProfileData(prev => ({
        ...prev,
        name: fullName,
        email: refreshed.email,
        phone: refreshedPhone ? `+63 ${ph}` : '',
        avatar: avatar
      }))

      setEditFormData(prev => ({
        ...prev,
        firstName: refreshed.first_name || '',
        lastName: refreshed.last_name || '',
        email: refreshed.email,
        contactNumber: ph,
        aboutYourself: refreshed.description || prev.aboutYourself,
        addressLine1: refreshed.office_address || prev.addressLine1,
        region: refreshed.state || prev.region,
        city: refreshed.city || prev.city,
        companyName: refreshed.company_name || ''
      }))

      if (refreshed.company_image) {
        setCompanyImagePreview(refreshed.company_image)
      }

      setImageFile(null)
      setImagePreview(null)
      setCompanyImageFile(null)
      
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Error updating broker profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = (passwordData: PasswordFormData) => {
    console.log('Password change submitted:', passwordData)
    toast.info('Password change feature coming soon')
  }

  return (
    <>
      <ToastContainer />
      {/* Render inside broker dashboard layout (sidebar + main offset already applied). */}
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
          uploading={saving}
          imagePreview={imagePreview || profileData.avatar}
          companyImagePreview={companyImagePreview}
          onEditFormChange={handleEditChange}
          onEditSubmit={handleEditSubmit}
          onPasswordSubmit={handlePasswordSubmit}
          onImageChange={handleImageChange}
          onCompanyImageChange={handleCompanyImageChange}
          cancelRoute="/broker"
        />
      </div>
    </>
  )
}
