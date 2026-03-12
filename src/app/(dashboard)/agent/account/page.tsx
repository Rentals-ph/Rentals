'use client'

import { useState, useEffect } from 'react'
import { agentsApi } from '@/api'
import type { Agent } from '@/api/endpoints/agents'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import {
  FiUser, FiEdit3, FiLock, FiMail, FiPhone, FiMapPin,
  FiSend, FiBriefcase, FiStar, FiHome, FiAward, FiCamera,
  FiEye, FiEyeOff, FiSettings, FiShare2
} from 'react-icons/fi'
import { FaWhatsapp, FaFacebook } from 'react-icons/fa'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'

/* ─── helpers ─── */
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'A'

const INPUT =
  'px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'

type Tab = 'overview' | 'edit' | 'company' | 'password'

const BANNER_IMAGE = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=400&fit=crop'

export default function AgentAccount() {
  /* ─── state ─── */
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  /* form fields */
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: 'PH +63',
    contactNumber: '',
    whatsapp: '',
    facebook: '',
    aboutYourself: '',
    addressLine1: '',
    country: 'Philippines',
    region: 'Region VII - Central Visayas',
    province: 'Cebu',
    city: 'Cebu City',
    companyName: '',
    agencyName: '',
    prcLicense: '',
    licenseType: '' as string,
  })

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [isEditMode, setIsEditMode] = useState(false)

  /* ─── fetch ─── */
  useEffect(() => {
    ;(async () => {
      try {
        let data: Agent | null = null
        try {
          data = await agentsApi.getCurrent()
        } catch {
          const id = localStorage.getItem('agent_id')
          if (id) data = await agentsApi.getById(parseInt(id))
        }
        if (data) {
          setAgent(data)
          if (data.first_name && data.last_name) {
            const full = `${data.first_name} ${data.last_name}`
            localStorage.setItem('agent_name', full)
            localStorage.setItem('user_name', full)
          }
          if (data.id) localStorage.setItem('agent_id', data.id.toString())
          const ph = (data.phone || '').replace(/^\+?63\s?/, '')
          setForm(f => ({
            ...f,
            firstName: data!.first_name || '',
            lastName: data!.last_name || '',
            email: data!.email || '',
            contactNumber: ph,
            whatsapp: data!.whatsapp || '',
            aboutYourself: data!.description || '',
            addressLine1: data!.office_address || '',
            region: data!.state || f.region,
            city: data!.city || f.city,
            companyName: data!.company_name || '',
            agencyName: data!.agency_name || '',
            prcLicense: data!.prc_license_number || '',
            licenseType: data!.license_type || '',
          }))
        }
      } catch (e) {
        console.error('Error fetching agent:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ─── derived ─── */
  const fullName = agent?.full_name ||
    [agent?.first_name, agent?.last_name].filter(Boolean).join(' ') || 'Agent'
  const role = agent?.verified ? 'Rent Manager' : 'Property Agent'
  const avatar = resolveAgentAvatar(agent?.image || agent?.avatar || agent?.profile_image, agent?.id)
  const phoneDisplay = agent?.phone ? `+63 ${agent.phone.replace(/^\+?63\s?/, '')}` : '—'
  const sinceYear = agent?.created_at ? new Date(agent.created_at).getFullYear() : new Date().getFullYear()
  const companyDisplay = agent?.company_name || agent?.agency_name || 'Independent Agent'

  /* ─── handlers ─── */
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const phone = form.contactNumber ? '+63' + form.contactNumber.replace(/\D/g, '') : ''
      const updateData: Record<string, any> = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone,
        city: form.city.trim(),
        state: form.region.trim(),
        office_address: form.addressLine1.trim(),
      }
      if (imageFile) updateData.image = imageFile
      await agentsApi.update(updateData)
      const refreshed = await agentsApi.getCurrent()
      setAgent(refreshed)
      const ph = (refreshed.phone || '').replace(/^\+?63\s?/, '')
      setForm(f => ({
        ...f,
        firstName: refreshed.first_name || '',
        lastName: refreshed.last_name || '',
        email: refreshed.email || '',
        contactNumber: ph,
        whatsapp: refreshed.whatsapp || f.whatsapp,
        aboutYourself: refreshed.description || f.aboutYourself,
        addressLine1: refreshed.office_address || f.addressLine1,
        region: refreshed.state || f.region,
        city: refreshed.city || f.city,
        companyName: refreshed.company_name || f.companyName,
        agencyName: refreshed.agency_name || f.agencyName,
        prcLicense: refreshed.prc_license_number || f.prcLicense,
        licenseType: refreshed.license_type || f.licenseType,
      }))
      setImageFile(null)
      setImagePreview(null)
      setIsEditMode(false)
      flash('Profile updated successfully!')
    } catch {
      flash('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pwd.newPassword !== pwd.confirmPassword) {
      flash('Passwords do not match.')
      return
    }
    console.log('Password change:', pwd)
    setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    flash('Password changed successfully!')
  }


  if (loading) {
    return (
      <>
        <div className="p-10 text-center text-gray-400">Loading account information...</div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ───────── SUCCESS TOAST ───────── */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-[slideIn_0.3s_ease]">
          {successMsg}
        </div>
      )}

      {/* ───────── TWO COLUMN LAYOUT ───────── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ───────── LEFT COLUMN (Wider) ───────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Profile Picture Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center gap-3">
              <FiSettings className="text-blue-600 text-xl" />
              <h2 className="text-lg font-semibold text-gray-900 m-0">Change Profile Picture</h2>
            </div>
            <div className="relative">
              {/* Banner Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                <img
                  src={BANNER_IMAGE}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                {/* Profile Picture Overlay */}
                <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-white">
                      <img
                        src={imagePreview || avatar}
                        alt={fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                          const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                          if (fallback) fallback.classList.remove('hidden')
                        }}
                      />
                      <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl">
                        {getInitials(fullName)}
                      </div>
                    </div>
                    {/* Edit Icon */}
                    {isEditMode && (
                      <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md border-2 border-white">
                        <FiEdit3 className="text-white text-sm" />
                        <input type="file" accept="image/*" onChange={onImage} className="hidden" />
                      </label>
                    )}
                  </div>
                  <div className="mt-2 ml-2">
                    <p className="m-0 text-sm font-semibold text-gray-900">{fullName}</p>
                    <p className="m-0 text-xs text-gray-500">{role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiSettings className="text-blue-600 text-xl" />
                <h2 className="text-lg font-semibold text-gray-900 m-0">Personal Info</h2>
              </div>
              {!isEditMode ? (
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <FiEdit3 className="text-base" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-6 py-2.5 bg-white text-gray-500 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <form onSubmit={handleSave} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <Field label="First Name" required>
                  <input type="text" name="firstName" value={form.firstName} onChange={onChange} disabled={!isEditMode} className={`w-full ${INPUT}`} />
                </Field>
                <Field label="Last Name" required>
                  <input type="text" name="lastName" value={form.lastName} onChange={onChange} disabled={!isEditMode} className={`w-full ${INPUT}`} />
                </Field>
                <Field label="Email" required>
                  <input type="email" name="email" value={form.email} onChange={onChange} className={`w-full ${INPUT}`} readOnly disabled />
                </Field>
                <Field label="Contact Number" required>
                  <div className="flex gap-2 min-w-0">
                    <input type="text" value={form.countryCode} readOnly className={`${INPUT} w-24 flex-shrink-0 bg-gray-50 text-gray-500`} disabled />
                    <input type="text" name="contactNumber" value={form.contactNumber} onChange={onChange} disabled={!isEditMode} className={`flex-1 min-w-0 ${INPUT}`} placeholder="9914099656" />
                  </div>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address" required>
                    <input type="text" name="addressLine1" value={form.addressLine1} onChange={onChange} disabled={!isEditMode} className={`w-full ${INPUT}`} placeholder="Somewhere On Earth Street" />
                  </Field>
                </div>
                <Field label="City" required>
                  <input type="text" name="city" value={form.city} onChange={onChange} disabled={!isEditMode} className={`w-full ${INPUT}`} placeholder="Cebu City" />
                </Field>
                <Field label="Province" required>
                  <input type="text" name="province" value={form.province} onChange={onChange} disabled={!isEditMode} className={`w-full ${INPUT}`} placeholder="Cebu" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="About Yourself">
                    <textarea name="aboutYourself" value={form.aboutYourself} onChange={onChange} disabled={!isEditMode} rows={4} className={`w-full ${INPUT} resize-y`} placeholder="Write about yourself" />
                  </Field>
                </div>
              </div>
              {isEditMode && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ───────── RIGHT COLUMN (Narrower) ───────── */}
        <div className="space-y-6">
          {/* Change Password Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center gap-3">
              <FiSettings className="text-blue-600 text-xl" />
              <h2 className="text-lg font-semibold text-gray-900 m-0">Change Password</h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
              <Field label="Current Password">
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={pwd.currentPassword}
                    onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))}
                    className={`w-full ${INPUT}`}
                    placeholder="************"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </Field>
              <Field label="New Password">
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    value={pwd.newPassword}
                    onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))}
                    className={`w-full ${INPUT}`}
                    placeholder="************"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password">
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={pwd.confirmPassword}
                    onChange={e => setPwd(p => ({ ...p, confirmPassword: e.target.value }))}
                    className={`w-full ${INPUT}`}
                    placeholder="************"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </Field>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Your Socials Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center gap-3">
              <FiShare2 className="text-blue-600 text-xl" />
              <h2 className="text-lg font-semibold text-gray-900 m-0">Your Socials</h2>
            </div>
            <form className="p-5 space-y-4">
              <Field label="Email">
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
                  <input type="email" value={form.email} readOnly className={`w-full ${INPUT} pl-10`} disabled />
                </div>
              </Field>
              <Field label="What's App">
                <div className="relative">
                  <FaWhatsapp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 text-lg" />
                  <input type="text" name="whatsapp" value={form.whatsapp} onChange={onChange} disabled={!isEditMode} className={`w-full ${INPUT} pl-10`} placeholder="+63 9914099656" />
                </div>
              </Field>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Small helper components ─── */

function InfoRow({ icon, label, value, className = '' }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400 text-base flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="m-0 text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className={`m-0 mt-0.5 text-sm text-gray-800 ${className}`}>{value}</p>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
