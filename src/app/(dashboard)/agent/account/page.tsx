'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import AgentHeader from '@/components/agent/AgentHeader'
import AccountSettings, { 
  ProfileData, 
  EditFormData, 
  PasswordFormData 
} from '@/components/common/AccountSettings'
import { agentsApi } from '@/api'
import type { Agent } from '@/api/endpoints/agents'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'

export default function AgentAccount() {
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    role: 'Property Agent',
    avatar: resolveAgentAvatar(null, undefined)
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
    const fetchAgentData = async () => {
      try {
        const agentData = await agentsApi.getCurrent()
        setAgent(agentData)
        
        if (agentData.first_name && agentData.last_name) {
          const fullName = agentData.first_name + ' ' + agentData.last_name
          localStorage.setItem('agent_name', fullName)
          localStorage.setItem('user_name', fullName)
        }
        if (agentData.id) {
          localStorage.setItem('agent_id', agentData.id.toString())
        }
        
        const agentName = agentData.full_name || 
          (agentData.first_name && agentData.last_name 
            ? agentData.first_name + ' ' + agentData.last_name
            : agentData.first_name || agentData.last_name ||
            localStorage.getItem('user_name') || 
            localStorage.getItem('agent_name') ||
            (agentData.email ? agentData.email.split('@')[0] : 'Agent'))
        
        const phoneClean = agentData.phone ? agentData.phone.replace(/^\+?63\s?/, '') : ''
        
        setProfileData({
          name: agentName,
          email: agentData.email || '',
          phone: agentData.phone ? '+63 ' + phoneClean : '',
          role: agentData.verified ? 'Rent Manager' : 'Property Agent',
          avatar: resolveAgentAvatar(agentData.image || agentData.avatar || agentData.profile_image, agentData.id)
        })

        const phoneNumber = agentData.phone || ''
        const phoneWithoutCode = phoneNumber.replace(/^\+?63\s?/, '')
        
        setEditFormData({
          firstName: agentData.first_name || '',
          lastName: agentData.last_name || '',
          email: agentData.email || '',
          countryCode: 'PH+63',
          contactNumber: phoneWithoutCode,
          aboutYourself: '',
          addressLine1: agentData.office_address || '',
          country: 'Philippines',
          region: agentData.state || 'Region VII - Central Visayas',
          province: 'Cebu', // Province is not stored in backend, keep default
          city: agentData.city || 'Cebu City'
        })
      } catch (error) {
        console.error('Error fetching agent data:', error)
        try {
          const agentId = localStorage.getItem('agent_id')
          if (agentId) {
            const agentData = await agentsApi.getById(parseInt(agentId))
            setAgent(agentData)
            
            if (agentData.first_name && agentData.last_name) {
              const fullName = agentData.first_name + ' ' + agentData.last_name
              localStorage.setItem('agent_name', fullName)
              localStorage.setItem('user_name', fullName)
            }
            
            const agentName = agentData.full_name || 
              (agentData.first_name && agentData.last_name 
                ? agentData.first_name + ' ' + agentData.last_name
                : agentData.first_name || agentData.last_name ||
                localStorage.getItem('user_name') || 
                localStorage.getItem('agent_name') ||
                (agentData.email ? agentData.email.split('@')[0] : 'Agent'))
            
            const phoneClean = agentData.phone ? agentData.phone.replace(/^\+?63\s?/, '') : ''
            
            setProfileData({
              name: agentName,
              email: agentData.email || '',
              phone: agentData.phone ? '+63 ' + phoneClean : '',
              role: agentData.verified ? 'Rent Manager' : 'Property Agent',
              avatar: resolveAgentAvatar(agentData.image || agentData.avatar || agentData.profile_image, agentData.id)
            })

            const phoneNumber = agentData.phone || ''
            const phoneWithoutCode = phoneNumber.replace(/^\+?63\s?/, '')
            
            setEditFormData({
              firstName: agentData.first_name || '',
              lastName: agentData.last_name || '',
              email: agentData.email || '',
              countryCode: 'PH+63',
              contactNumber: phoneWithoutCode,
              aboutYourself: '',
              addressLine1: agentData.office_address || '',
              country: 'Philippines',
              region: agentData.state || 'Region VII - Central Visayas',
              province: 'Cebu', // Province is not stored in backend, keep default
              city: agentData.city || 'Cebu City'
            })
          }
        } catch (fallbackError) {
          console.error('Error fetching agent by ID:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
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
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    
    try {
      // Prepare phone number
      const phoneNumber = editFormData.contactNumber 
        ? '+63' + editFormData.contactNumber.replace(/\D/g, '') 
        : ''
      
      const updateData: {
        first_name?: string
        last_name?: string
        phone?: string
        city?: string
        state?: string
        office_address?: string
        image?: File
      } = {
        first_name: editFormData.firstName?.trim() || '',
        last_name: editFormData.lastName?.trim() || '',
        phone: phoneNumber,
        city: editFormData.city?.trim() || '',
        state: editFormData.region?.trim() || '',
        office_address: editFormData.addressLine1?.trim() || '',
      }
      
      // Always include image if selected
      if (imageFile) {
        updateData.image = imageFile
      }
      
      console.log('Sending update data:', {
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        phone: updateData.phone,
        city: updateData.city,
        state: updateData.state,
        office_address: updateData.office_address,
        hasImage: !!updateData.image,
        imageName: updateData.image?.name
      })
      
      const updatedAgent = await agentsApi.update(updateData)
      
      // Refresh agent data from server to get latest values
      const refreshedAgent = await agentsApi.getCurrent()
      setAgent(refreshedAgent)
      
      const updatedPhoneClean = refreshedAgent.phone ? refreshedAgent.phone.replace(/^\+?63\s?/, '') : ''
      const agentName = refreshedAgent.full_name || 
        (refreshedAgent.first_name && refreshedAgent.last_name 
          ? refreshedAgent.first_name + ' ' + refreshedAgent.last_name
          : refreshedAgent.first_name || refreshedAgent.last_name || 'Agent')
      
      setProfileData({
        name: agentName,
        email: refreshedAgent.email || '',
        phone: refreshedAgent.phone ? '+63 ' + updatedPhoneClean : '',
        role: refreshedAgent.verified ? 'Rent Manager' : 'Property Agent',
        avatar: resolveAgentAvatar(refreshedAgent.image || refreshedAgent.avatar || refreshedAgent.profile_image, refreshedAgent.id)
      })
      
      // Update edit form data with refreshed values
      const refreshedPhoneNumber = refreshedAgent.phone || ''
      const phoneWithoutCode = refreshedPhoneNumber.replace(/^\+?63\s?/, '')
      
      setEditFormData(prev => ({
        ...prev,
        firstName: refreshedAgent.first_name || '',
        lastName: refreshedAgent.last_name || '',
        email: refreshedAgent.email || '',
        contactNumber: phoneWithoutCode,
        addressLine1: refreshedAgent.office_address || prev.addressLine1,
        region: refreshedAgent.state || prev.region,
        province: prev.province, // Keep province as it's not stored in backend
        city: refreshedAgent.city || prev.city,
      }))
      
      setImageFile(null)
      setImagePreview(null)
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handlePasswordSubmit = (passwordData: PasswordFormData) => {
    console.log('Password change submitted:', passwordData)
    alert('Password changed successfully!')
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar/>

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="Account Settings" 
          subtitle="Manage your account information and preferences." 
        />

        <AccountSettings
          userType="agent"
          profileData={profileData}
          editFormData={editFormData}
          loading={loading}
          uploading={uploading}
          imagePreview={imagePreview}
          onEditFormChange={handleEditChange}
          onEditSubmit={handleEditSubmit}
          onPasswordSubmit={handlePasswordSubmit}
          onImageChange={handleImageChange}
          cancelRoute="/agent"
        />
      </main>
    </div>
  )
}
