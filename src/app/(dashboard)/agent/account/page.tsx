'use client'

import { useState, useEffect } from 'react'
import { agentsApi } from '@/api'
import type { Agent } from '@/api/endpoints/agents'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import {
  FiUser, FiEdit3, FiLock, FiMail, FiPhone, FiMapPin,
  FiSend, FiBriefcase, FiStar, FiHome, FiAward, FiCamera,
} from 'react-icons/fi'
import { FaWhatsapp, FaFacebook } from 'react-icons/fa'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'

/* ─── helpers ─── */
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'A'

const INPUT =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'

type Tab = 'overview' | 'edit' | 'company' | 'password'

export default function AgentAccount() {
  /* ─── state ─── */
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
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

  /* ─── tab config ─── */
  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'overview', icon: <FiUser />, label: 'Overview' },
    { key: 'edit', icon: <FiEdit3 />, label: 'Edit Profile' },
    { key: 'company', icon: <HiOutlineOfficeBuilding />, label: 'Company' },
    { key: 'password', icon: <FiLock />, label: 'Security' },
  ]

  if (loading) {
    return (
      <>
        <div className="p-10 text-center text-gray-400">Loading account information...</div>
      </>
    )
  }

  return (
    <>

        {/* ───────── SUCCESS TOAST ───────── */}
        {successMsg && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-[slideIn_0.3s_ease]">
            {successMsg}
          </div>
        )}

        {/* ───────── PROFILE HERO ───────── */}
        <section className="relative mb-6 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 40%, #f97316 100%)' }}>
          <div className="px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0 self-center lg:self-auto">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-4 ring-white/40 shadow-xl bg-white">
                  <img
                    src={imagePreview || avatar}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-3xl">
                    {getInitials(fullName)}
                  </div>
                </div>
                <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <FiCamera className="text-gray-600 text-sm" />
                  <input type="file" accept="image/*" onChange={onImage} className="hidden" />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 text-center lg:text-left min-w-0">
                <h1 className="m-0 text-2xl sm:text-3xl font-bold text-white truncate">{fullName}</h1>
                <p className="m-0 mt-1 text-blue-100 text-sm sm:text-base font-medium">{role}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 justify-center lg:justify-start text-sm text-white/90">
                  {agent?.email && (
                    <span className="inline-flex items-center gap-1.5"><FiMail className="text-amber-300" />{agent.email}</span>
                  )}
                  {agent?.phone && (
                    <span className="inline-flex items-center gap-1.5"><FiPhone className="text-amber-300" />{phoneDisplay}</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                  {agent?.verified && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/30">
                      <FiAward className="text-emerald-300" /> Verified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full">
                    <FiStar className="text-amber-300" /> Since {sinceYear}
                  </span>
                  {agent?.license_type && (
                    <span className="inline-flex items-center gap-1 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                      <FiBriefcase className="text-blue-200" /> {agent.license_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Company badge */}
              <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20 text-center self-center lg:self-auto min-w-[140px]">
                {agent?.company_image ? (
                  <img src={agent.company_image} alt={companyDisplay} className="h-10 w-auto mx-auto object-contain mb-2" />
                ) : (
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
                    <HiOutlineOfficeBuilding className="text-white text-xl" />
                  </div>
                )}
                <p className="m-0 text-sm font-semibold text-white">{companyDisplay}</p>
                {agent?.city && <p className="m-0 text-xs text-blue-100/80 mt-0.5">{agent.city}</p>}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <p className="m-0 text-[10px] sm:text-xs uppercase tracking-wide text-blue-100/70">Active Listings</p>
                <p className="m-0 mt-1 text-xl sm:text-2xl font-extrabold text-white">{agent?.properties_count ?? 0}</p>
              </div>
              <div>
                <p className="m-0 text-[10px] sm:text-xs uppercase tracking-wide text-blue-100/70">License #</p>
                <p className="m-0 mt-1 text-lg sm:text-xl font-bold text-white truncate">{agent?.prc_license_number || '—'}</p>
              </div>
              <div>
                <p className="m-0 text-[10px] sm:text-xs uppercase tracking-wide text-blue-100/70">Status</p>
                <p className="m-0 mt-1 text-lg sm:text-xl font-bold text-white capitalize">{agent?.status || 'pending'}</p>
              </div>
              <div>
                <p className="m-0 text-[10px] sm:text-xs uppercase tracking-wide text-blue-100/70">Member Since</p>
                <p className="m-0 mt-1 text-lg sm:text-xl font-bold text-white">{sinceYear}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── TABS ───────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50/80 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className="text-base">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            {/* ───── OVERVIEW TAB ───── */}
            {activeTab === 'overview' && (
              <div className="max-w-4xl space-y-8">
                {/* Personal details */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    <InfoRow icon={<FiUser />} label="Full Name" value={fullName} />
                    <InfoRow icon={<FiMail />} label="Email" value={agent?.email || '—'} />
                    <InfoRow icon={<FiPhone />} label="Phone" value={phoneDisplay} />
                    <InfoRow icon={<FaWhatsapp />} label="WhatsApp" value={agent?.whatsapp || phoneDisplay} />
                    <InfoRow icon={<FiBriefcase />} label="License Type" value={agent?.license_type || '—'} className="capitalize" />
                    <InfoRow icon={<FiAward />} label="PRC License #" value={agent?.prc_license_number || '—'} />
                  </div>
                </section>

                {/* About */}
                {agent?.description && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About</h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{agent.description}</p>
                  </section>
                )}

                {/* Location */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    <InfoRow icon={<FiMapPin />} label="Office Address" value={agent?.office_address || '—'} />
                    <InfoRow icon={<FiMapPin />} label="City" value={agent?.city || '—'} />
                    <InfoRow icon={<FiMapPin />} label="Region" value={agent?.state || '—'} />
                  </div>
                </section>

                {/* Company */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Company / Agency</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    <InfoRow icon={<HiOutlineOfficeBuilding />} label="Company Name" value={agent?.company_name || '—'} />
                    <InfoRow icon={<FiBriefcase />} label="Agency Name" value={agent?.agency_name || '—'} />
                  </div>
                </section>

                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                  onClick={() => setActiveTab('edit')}
                >
                  <FiEdit3 /> Edit Profile
                </button>
              </div>
            )}

            {/* ───── EDIT PROFILE TAB ───── */}
            {activeTab === 'edit' && (
              <form id="edit-form" onSubmit={handleSave} className="max-w-4xl space-y-8">
                {/* Photo strip */}
                <div className="flex items-center gap-5 pb-6 border-b border-gray-200">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative ring-2 ring-blue-100">
                    <img
                      src={imagePreview || avatar}
                      alt={fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl">
                      {getInitials(fullName)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="m-0 text-lg font-bold text-gray-900 truncate">{fullName}</h3>
                    <p className="m-0 text-sm text-gray-500">{role}</p>
                  </div>
                  <label className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors">
                    <FiCamera /> Change Photo
                    <input type="file" accept="image/*" onChange={onImage} className="hidden" />
                  </label>
                </div>

                {/* Personal Information */}
                <fieldset className="border-0 p-0 m-0">
                  <legend className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Personal Information</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="First Name" required>
                      <input type="text" name="firstName" value={form.firstName} onChange={onChange} className={INPUT} />
                    </Field>
                    <Field label="Last Name" required>
                      <input type="text" name="lastName" value={form.lastName} onChange={onChange} className={INPUT} />
                    </Field>
                    <Field label="Email" required>
                      <input type="email" name="email" value={form.email} onChange={onChange} className={INPUT} readOnly />
                    </Field>
                    <Field label="Contact Number" required>
                      <div className="flex gap-2">
                        <input type="text" value={form.countryCode} readOnly className={`${INPUT} w-24 flex-shrink-0 bg-gray-50 text-gray-500`} />
                        <input type="text" name="contactNumber" value={form.contactNumber} onChange={onChange} className={`${INPUT} flex-1`} placeholder="9XX XXX XXXX" />
                      </div>
                    </Field>
                    <Field label="WhatsApp Number">
                      <div className="relative">
                        <FaWhatsapp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500" />
                        <input type="text" name="whatsapp" value={form.whatsapp} onChange={onChange} className={`${INPUT} pl-10`} placeholder="+63 912 345 6789" />
                      </div>
                    </Field>
                    <Field label="Facebook Profile">
                      <div className="relative">
                        <FaFacebook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
                        <input type="text" name="facebook" value={form.facebook} onChange={onChange} className={`${INPUT} pl-10`} placeholder="https://facebook.com/yourprofile" />
                      </div>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="About Yourself">
                        <textarea name="aboutYourself" value={form.aboutYourself} onChange={onChange} rows={4} className={`${INPUT} resize-y min-h-[100px]`} placeholder="Tell clients about yourself, your experience, and specializations..." />
                      </Field>
                    </div>
                  </div>
                </fieldset>

                {/* Location */}
                <fieldset className="border-0 p-0 m-0">
                  <legend className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Location &amp; Address</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Field label="Office Address" required>
                        <div className="relative">
                          <FiSend className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" name="addressLine1" value={form.addressLine1} onChange={onChange} className={`${INPUT} pl-10`} placeholder="Street address, building, unit" />
                        </div>
                      </Field>
                    </div>
                    <Field label="Country" required>
                      <select name="country" value={form.country} onChange={onChange} className={INPUT}>
                        <option value="Philippines">Philippines</option>
                      </select>
                    </Field>
                    <Field label="Region" required>
                      <select name="region" value={form.region} onChange={onChange} className={INPUT}>
                        <option value="Region VII - Central Visayas">Region VII - Central Visayas</option>
                        <option value="Region I - Ilocos Region">Region I - Ilocos Region</option>
                        <option value="Region II - Cagayan Valley">Region II - Cagayan Valley</option>
                        <option value="Region III - Central Luzon">Region III - Central Luzon</option>
                        <option value="Region IV-A - CALABARZON">Region IV-A - CALABARZON</option>
                        <option value="NCR - National Capital Region">NCR - National Capital Region</option>
                      </select>
                    </Field>
                    <Field label="Province" required>
                      <select name="province" value={form.province} onChange={onChange} className={INPUT}>
                        <option value="Cebu">Cebu</option>
                        <option value="Bohol">Bohol</option>
                        <option value="Negros Oriental">Negros Oriental</option>
                        <option value="Siquijor">Siquijor</option>
                      </select>
                    </Field>
                    <Field label="City" required>
                      <select name="city" value={form.city} onChange={onChange} className={INPUT}>
                        <option value="Cebu City">Cebu City</option>
                        <option value="Lapu-Lapu City">Lapu-Lapu City</option>
                        <option value="Mandaue City">Mandaue City</option>
                        <option value="Talisay City">Talisay City</option>
                      </select>
                    </Field>
                  </div>
                </fieldset>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-6 py-3 bg-white text-gray-600 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ───── COMPANY TAB ───── */}
            {activeTab === 'company' && (
              <div className="max-w-4xl space-y-8">
                {/* Company hero card */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    {agent?.company_image ? (
                      <img src={agent.company_image} alt={companyDisplay} className="w-20 h-20 rounded-2xl object-contain bg-white shadow-sm border border-gray-100 p-2" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <HiOutlineOfficeBuilding className="text-3xl text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="m-0 text-xl font-bold text-gray-900">{companyDisplay}</h2>
                      {agent?.agency_name && agent.agency_name !== agent.company_name && (
                        <p className="m-0 mt-0.5 text-sm text-gray-500">Agency: {agent.agency_name}</p>
                      )}
                      {agent?.office_address && (
                        <p className="m-0 mt-1 text-sm text-gray-500 flex items-center gap-1.5">
                          <FiMapPin className="text-gray-400 flex-shrink-0" /> {agent.office_address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editable company fields */}
                <fieldset className="border-0 p-0 m-0">
                  <legend className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Company Details</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Company Name">
                      <input type="text" name="companyName" value={form.companyName} onChange={onChange} className={INPUT} placeholder="Your company or brokerage name" />
                    </Field>
                    <Field label="Agency Name">
                      <input type="text" name="agencyName" value={form.agencyName} onChange={onChange} className={INPUT} placeholder="Your agency name" />
                    </Field>
                  </div>
                </fieldset>

                <fieldset className="border-0 p-0 m-0">
                  <legend className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">License Information</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="PRC License Number">
                      <div className="relative">
                        <FiAward className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" name="prcLicense" value={form.prcLicense} onChange={onChange} className={`${INPUT} pl-10`} placeholder="e.g., 0012345" readOnly />
                      </div>
                    </Field>
                    <Field label="License Type">
                      <select name="licenseType" value={form.licenseType} onChange={onChange} className={INPUT} disabled>
                        <option value="">—</option>
                        <option value="broker">Broker</option>
                        <option value="salesperson">Salesperson</option>
                      </select>
                    </Field>
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    License details are set during registration and cannot be modified here. Contact support for changes.
                  </p>
                </fieldset>
              </div>
            )}

            {/* ───── SECURITY / PASSWORD TAB ───── */}
            {activeTab === 'password' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="m-0 text-xl font-bold text-gray-900">Change Password</h2>
                  <p className="m-0 mt-1 text-sm text-gray-500">Keep your account secure with a strong password.</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <Field label="Current Password">
                    <input
                      type="password"
                      name="currentPassword"
                      value={pwd.currentPassword}
                      onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))}
                      className={INPUT}
                      placeholder="Enter current password"
                      required
                    />
                  </Field>
                  <Field label="New Password">
                    <input
                      type="password"
                      name="newPassword"
                      value={pwd.newPassword}
                      onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))}
                      className={INPUT}
                      placeholder="Enter new password"
                      required
                    />
                  </Field>
                  <Field label="Confirm New Password">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={pwd.confirmPassword}
                      onChange={e => setPwd(p => ({ ...p, confirmPassword: e.target.value }))}
                      className={INPUT}
                      placeholder="Re-enter new password"
                      required
                    />
                  </Field>
                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                      Change Password
                    </button>
                    <button type="button" onClick={() => setActiveTab('overview')} className="px-6 py-3 bg-white text-gray-600 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
    </>
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
