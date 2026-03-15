'use client'

import { useEffect, useState } from 'react'
import { brokerApi, propertiesApi } from '@/api'
import type { Company, CustomStat, Award } from '@/features/broker'
import type { Property } from '@/shared/types'
import {
  FiMail,
  FiPhone,
  FiGlobe,
  FiSend,
  FiStar,
  FiEdit,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { resolvePropertyImage } from '@/shared/utils/image'
import { ASSETS } from '@/shared/utils/assets'

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ fullname: '', email: '' })
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [brokerPicks, setBrokerPicks] = useState<Property[]>([])
  const [defaultStats, setDefaultStats] = useState({
    totalProperties: 0,
    yearsExperience: 0,
    happyClients: 0,
  })

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)
        // Fetch company
        const companies = await brokerApi.getCompanies()
        let primaryCompany = companies.length > 0 ? companies[0] : null
        
        // Initialize default custom_stats if not exists
        if (primaryCompany && !primaryCompany.custom_stats) {
          primaryCompany = {
            ...primaryCompany,
            custom_stats: [
              { label: 'Total Properties Managed', value: '0+ Listings' },
              { label: 'Years of Experience', value: '0+ Years' },
              { label: 'Happy Clients', value: '0+ Renters' },
            ]
          }
        }
        
        setCompany(primaryCompany)

        // Fetch team members (agents in broker's teams)
        const agents = await brokerApi.getAgents()
        setTeamMembers(agents.slice(0, 6))

        // Fetch broker's properties for "Broker's Picks"
        const propertiesResponse = await brokerApi.getProperties()
        const propertiesArray = Array.isArray(propertiesResponse) 
          ? propertiesResponse 
          : (propertiesResponse as any).data || []
        
        const featured = propertiesArray
          .filter((p: Property) => p.is_featured || p.published_at)
          .slice(0, 3)
        setBrokerPicks(featured)

        // Calculate default stats
        setDefaultStats({
          totalProperties: propertiesArray.length,
          yearsExperience: primaryCompany ? 5 : 0,
          happyClients: Math.floor(propertiesArray.length * 4),
        })
      } catch (error: any) {
        console.error('Error fetching company data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [])

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Inquiry sent!\nName: ${formData.fullname}\nEmail: ${formData.email}`)
    setFormData({ fullname: '', email: '' })
  }

  const handleSave = async () => {
    if (!company) return
    
    try {
      await brokerApi.updateCompany(company.id, company)
      setEditing(false)
      alert('Company profile updated successfully!')
    } catch (error: any) {
      console.error('Error updating company:', error)
      alert('Failed to update company profile. Please try again.')
    }
  }

  const addCustomStat = () => {
    if (!company) return
    const newStats = [...(company.custom_stats || []), { label: 'New Stat', value: '0' }]
    setCompany({ ...company, custom_stats: newStats })
  }

  const updateCustomStat = (index: number, field: 'label' | 'value', value: string) => {
    if (!company || !company.custom_stats) return
    const newStats = [...company.custom_stats]
    newStats[index] = { ...newStats[index], [field]: value }
    setCompany({ ...company, custom_stats: newStats })
  }

  const removeCustomStat = (index: number) => {
    if (!company || !company.custom_stats) return
    const newStats = company.custom_stats.filter((_, i) => i !== index)
    setCompany({ ...company, custom_stats: newStats })
  }

  const addAward = () => {
    if (!company) return
    const newAwards = [...(company.awards || []), { title: 'New Award', image: '', year: new Date().getFullYear().toString() }]
    setCompany({ ...company, awards: newAwards })
  }

  const updateAward = (index: number, field: keyof Award, value: string) => {
    if (!company || !company.awards) return
    const newAwards = [...company.awards]
    newAwards[index] = { ...newAwards[index], [field]: value }
    setCompany({ ...company, awards: newAwards })
  }

  const removeAward = (index: number) => {
    if (!company || !company.awards) return
    const newAwards = company.awards.filter((_, i) => i !== index)
    setCompany({ ...company, awards: newAwards })
  }

  // Use company data or placeholders
  const companyName = company?.name || 'Your Company Name'
  const companyTagline = company?.description || 'Your company tagline here'
  const heroImage = company?.hero_image || company?.logo || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=500&fit=crop'
  const contactEmail = company?.email || 'contact@yourcompany.com'
  const contactPhone = company?.phone || '+63 917 123 4567'
  const contactWebsite = company?.website || 'www.yourcompany.com'
  const whatsapp = company?.whatsapp || contactPhone.replace(/\D/g, '')
  const customStats = company?.custom_stats || [
    { label: 'Total Properties Managed', value: `${defaultStats.totalProperties}+ Listings` },
    { label: 'Years of Experience', value: `${defaultStats.yearsExperience}+ Years` },
    { label: 'Happy Clients', value: `${defaultStats.happyClients}+ Renters` },
  ]
  const joinTitle = company?.join_section_title || `Join the Future of ${companyName}!`
  const joinDescription = company?.join_section_description || 'We aren\'t just listing properties; we\'re building brands. Join a team of elite real estate professionals and leverage our high-performance lead-generation engine to scale your career. Submit your credentials below to start your journey with us.'
  const awards = company?.awards || []
  const showTeamSection = company?.show_team_section !== false
  const showBrokerPicksSection = company?.show_broker_picks_section !== false
  const showAwardsSection = company?.show_awards_section !== false
  const showJoinSection = company?.show_join_section !== false

  return (
    <>

          {loading ? (
            <div className="p-8 text-center">Loading company profile...</div>
          ) : (
            <div className="p-4">
              {/* Edit Button */}
              <div className="flex justify-end mb-4">
                {editing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700"
                    >
                      <FiSave />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="inline-flex items-center gap-2 py-2 px-4 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-gray-300"
                    >
                      <FiX />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700"
                  >
                    <FiEdit />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Hero Section */}
              <div className="relative rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center mb-6">
                {editing && company && (
                  <div className="absolute top-4 left-4 z-[10] bg-white/90 backdrop-blur-sm rounded-lg p-3 flex flex-col gap-2">
                    <label className="text-xs font-medium text-gray-700">Hero Background Image URL</label>
                    <input
                      type="text"
                      value={company.hero_image || ''}
                      onChange={(e) => setCompany({ ...company, hero_image: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-64"
                      placeholder="Image URL"
                    />
                  </div>
                )}
                <img
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  src={heroImage}
                  alt="Company background"
                />
                <div className="absolute inset-0 bg-slate-900/55 z-[1]" />
                <div className="relative z-[2] flex flex-col items-center text-center w-full py-10 px-6">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-10 h-10 bg-white/15 border-2 border-white/30 rounded-[10px] flex items-center justify-center text-white">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                    </div>
                    {editing && company ? (
                      <input
                        type="text"
                        value={company.name}
                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                        className="text-[30px] font-bold text-white bg-white/20 border border-white/30 rounded-lg px-3 py-1"
                        placeholder="Company Name"
                      />
                    ) : (
                      <h2 className="text-[30px] font-bold text-white tracking-tight">{companyName}</h2>
                    )}
                  </div>
                  {editing && company ? (
                    <textarea
                      value={company.description || ''}
                      onChange={(e) => setCompany({ ...company, description: e.target.value })}
                      className="text-sm text-white/80 mb-5 bg-white/20 border border-white/30 rounded-lg px-3 py-2 w-full max-w-md"
                      placeholder="Company tagline"
                    />
                  ) : (
                    <p className="text-sm text-white/80 mb-5">{companyTagline}</p>
                  )}

                  <div className="flex flex-col items-center gap-2 mb-7">
                    <span className="text-xs text-white/70 font-medium">Connect with us</span>
                    <div className="flex items-center gap-3">
                      {editing && company ? (
                        <>
                          <input
                            type="email"
                            value={company.email || ''}
                            onChange={(e) => setCompany({ ...company, email: e.target.value })}
                            className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white text-xs px-2"
                            placeholder="Email"
                          />
                          <input
                            type="tel"
                            value={company.phone || ''}
                            onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                            className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white text-xs px-2"
                            placeholder="Phone"
                          />
                          <input
                            type="text"
                            value={company.whatsapp || ''}
                            onChange={(e) => setCompany({ ...company, whatsapp: e.target.value })}
                            className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white text-xs px-2"
                            placeholder="WhatsApp"
                          />
                          <input
                            type="url"
                            value={company.website || ''}
                            onChange={(e) => setCompany({ ...company, website: e.target.value })}
                            className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white text-xs px-2"
                            placeholder="Website"
                          />
                        </>
                      ) : (
                        <>
                          <a href={`mailto:${contactEmail}`} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base bg-white/12 border border-white/20 transition-all duration-200 no-underline hover:bg-white/25 hover:-translate-y-0.5" title="Email">
                            <FiMail />
                          </a>
                          <a href={`tel:${contactPhone}`} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base bg-white/12 border border-white/20 transition-all duration-200 no-underline hover:bg-white/25 hover:-translate-y-0.5" title="Phone">
                            <FiPhone />
                          </a>
                          <a href={`https://wa.me/${whatsapp}`} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base bg-white/12 border border-white/20 transition-all duration-200 no-underline hover:bg-white/25 hover:-translate-y-0.5" title="WhatsApp">
                            <FaWhatsapp />
                          </a>
                          <a href={`https://${contactWebsite}`} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base bg-white/12 border border-white/20 transition-all duration-200 no-underline hover:bg-white/25 hover:-translate-y-0.5" title="Website">
                            <FiGlobe />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 w-full max-w-[660px] flex-wrap justify-center">
                    {editing && company ? (
                      <>
                        {customStats.map((stat, index) => (
                          <div key={index} className="flex-1 min-w-[150px] bg-white/12 backdrop-blur-xl border border-white/20 rounded-[14px] p-3 flex flex-col gap-2">
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => updateCustomStat(index, 'label', e.target.value)}
                              className="text-[11px] text-white/75 bg-white/20 border border-white/30 rounded px-2 py-1"
                              placeholder="Label"
                            />
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => updateCustomStat(index, 'value', e.target.value)}
                              className="text-xl font-bold text-white bg-white/20 border border-white/30 rounded px-2 py-1"
                              placeholder="Value"
                            />
                            <button
                              onClick={() => removeCustomStat(index)}
                              className="text-red-300 hover:text-red-100 text-xs"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addCustomStat}
                          className="flex-1 min-w-[150px] bg-white/12 backdrop-blur-xl border-2 border-dashed border-white/30 rounded-[14px] p-3 flex items-center justify-center text-white hover:bg-white/20"
                        >
                          <FiPlus /> Add Stat
                        </button>
                      </>
                    ) : (
                      customStats.map((stat, index) => (
                        <div className="flex-1 bg-white/12 backdrop-blur-xl border border-white/20 rounded-[14px] py-4.5 px-3.5 flex flex-col items-center gap-1.5 text-center min-w-[150px]" key={index}>
                          <span className="text-[11px] text-white/75 font-medium">{stat.label}</span>
                          <span className="text-xl font-bold text-white">{stat.value}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Our Team Section */}
              {showTeamSection && (
                <div className="py-6">
                  {editing && company && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-[#1a1a2e] flex-1">Our Team</h3>
                      <button
                        onClick={() => setCompany({ ...company, show_team_section: false })}
                        className="text-gray-500 hover:text-red-600"
                        title="Hide section"
                      >
                        <FiEyeOff />
                      </button>
                    </div>
                  )}
                  {!editing && <h3 className="text-2xl font-bold text-[#1a1a2e] mb-4">Our Team</h3>}
                  {teamMembers.length > 0 ? (
                    <div className="grid grid-cols-6 gap-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
                      {teamMembers.map((member, index) => {
                        const name = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Team Member'
                        const image = member.image_path 
                          ? resolvePropertyImage(member.image_path, member.id)
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400`
                        
                        return (
                          <div className="relative rounded-xl overflow-hidden aspect-square cursor-pointer shadow-md group" key={member.id || index}>
                            <img src={image} alt={name} className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-[1]" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 z-[2] flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-white leading-tight">{name}</span>
                              <span className="text-xs text-white/90">{member.role || 'Agent'}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No team members yet. Add agents to your teams to see them here.</p>
                  )}
                </div>
              )}
              {!showTeamSection && editing && company && (
                <div className="py-4 text-center">
                  <button
                    onClick={() => setCompany({ ...company, show_team_section: true })}
                    className="text-gray-400 hover:text-gray-600 flex items-center gap-2 mx-auto"
                  >
                    <FiEye /> Show Team Section
                  </button>
                </div>
              )}

              {/* Broker's Picks Section */}
              {showBrokerPicksSection && brokerPicks.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden min-h-[500px] my-6">
                  {editing && company && (
                    <div className="absolute top-4 right-4 z-[10] bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <button
                        onClick={() => setCompany({ ...company, show_broker_picks_section: false })}
                        className="text-gray-500 hover:text-red-600"
                        title="Hide section"
                      >
                        <FiEyeOff />
                      </button>
                    </div>
                  )}
                  <img
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=600&fit=crop"
                    alt="Broker picks background"
                  />
                  <div className="absolute inset-0 bg-black/60 z-[1]" />
                  <div className="relative z-[2] p-10 flex flex-col items-center md:p-6">
                    <div className="flex flex-col items-center text-center mb-10 max-w-2xl">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="w-12 h-0.5 bg-white/40" />
                        <div>
                          <h3 className="text-4xl font-bold text-white leading-tight md:text-3xl">
                            Broker&apos;s <span className="text-white/60">——</span>
                            <br />
                            <span className="text-white/60">—</span> Picks
                          </h3>
                        </div>
                      </div>
                      <p className="text-xl font-semibold text-white mb-3 md:text-lg">The Crown Jewels: This Week&apos;s Premier Listings</p>
                    </div>

                    <div className="flex gap-5 w-full max-w-4xl lg:flex-wrap lg:justify-center">
                      {brokerPicks.map((pick, index) => {
                        const imageUrl = pick.image_url || resolvePropertyImage(pick.image_path || pick.image, pick.id) || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                        return (
                          <div className={`relative flex-1 rounded-xl overflow-hidden aspect-[4/5] cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${index === 1 ? 'min-w-[280px] lg:min-w-0 lg:flex-[1.2]' : 'lg:flex-1'}`} key={pick.id}>
                            <img src={imageUrl} alt={pick.title} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3">
                              <span className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-md text-xs font-semibold ${
                                pick.is_featured ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' : 'bg-blue-600 text-white'
                              }`}>
                                {pick.is_featured && <FiStar size={10} />}
                                {pick.is_featured ? 'Featured' : 'Available'}
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col gap-1">
                              <span className="text-base font-bold text-white leading-tight">{pick.title}</span>
                              {pick.type && <span className="text-sm text-white/90">{pick.type}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              {!showBrokerPicksSection && editing && company && (
                <div className="py-4 text-center">
                  <button
                    onClick={() => setCompany({ ...company, show_broker_picks_section: true })}
                    className="text-gray-400 hover:text-gray-600 flex items-center gap-2 mx-auto"
                  >
                    <FiEye /> Show Broker&apos;s Picks Section
                  </button>
                </div>
              )}

              {/* Company Awards Section */}
              {showAwardsSection && (
                <div className="py-8 bg-gray-50 rounded-2xl my-6">
                  {editing && company && (
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 text-center flex-1">Company Awards</h3>
                      <button
                        onClick={() => setCompany({ ...company, show_awards_section: false })}
                        className="text-gray-500 hover:text-red-600"
                        title="Hide section"
                      >
                        <FiEyeOff />
                      </button>
                    </div>
                  )}
                  {!editing && <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Company Awards</h3>}
                  {editing && company ? (
                    <div className="space-y-4">
                      {awards.map((award, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-4">
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <input
                              type="text"
                              value={award.title}
                              onChange={(e) => updateAward(index, 'title', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Award Title"
                            />
                            <input
                              type="text"
                              value={award.image || ''}
                              onChange={(e) => updateAward(index, 'image', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Image URL"
                            />
                            <input
                              type="text"
                              value={award.year || ''}
                              onChange={(e) => updateAward(index, 'year', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Year"
                            />
                          </div>
                          <button
                            onClick={() => removeAward(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addAward}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2"
                      >
                        <FiPlus /> Add Award
                      </button>
                    </div>
                  ) : awards.length > 0 ? (
                    <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto lg:grid-cols-2 md:grid-cols-1">
                      {awards.map((award, index) => (
                        <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-sm" key={index}>
                          {award.image && (
                            <img src={award.image} alt={award.title} className="w-20 h-20 object-cover rounded-lg" />
                          )}
                          <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-xl font-bold text-[#c8a84e]">{award.title}</span>
                            {award.year && <span className="text-sm text-gray-600 font-medium">{award.year}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No awards yet. Add awards in edit mode.</p>
                  )}
                </div>
              )}
              {!showAwardsSection && editing && company && (
                <div className="py-4 text-center">
                  <button
                    onClick={() => setCompany({ ...company, show_awards_section: true })}
                    className="text-gray-400 hover:text-gray-600 flex items-center gap-2 mx-auto"
                  >
                    <FiEye /> Show Awards Section
                  </button>
                </div>
              )}

              {/* Join / Contact Section */}
              {showJoinSection && (
                <div className="grid grid-cols-[1.2fr_1fr] gap-10 bg-white rounded-2xl p-10 shadow-sm lg:grid-cols-1 md:p-6">
                  <div className="flex flex-col justify-center gap-4">
                    {editing && company ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">Section Title</label>
                          <button
                            onClick={() => setCompany({ ...company, show_join_section: false })}
                            className="text-gray-500 hover:text-red-600"
                            title="Hide section"
                          >
                            <FiEyeOff />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={company.join_section_title || ''}
                          onChange={(e) => setCompany({ ...company, join_section_title: e.target.value })}
                          className="text-3xl font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 md:text-2xl"
                          placeholder="Section Title"
                        />
                        <label className="text-sm font-medium text-gray-700">Section Description</label>
                        <textarea
                          value={company.join_section_description || ''}
                          onChange={(e) => setCompany({ ...company, join_section_description: e.target.value })}
                          className="text-base text-gray-600 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 leading-relaxed"
                          placeholder="Section description"
                          rows={4}
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="text-3xl font-bold text-gray-900 leading-tight md:text-2xl">
                          {joinTitle}
                        </h3>
                        <p className="text-base text-gray-600 leading-relaxed">
                          {joinDescription}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    <form className="w-full bg-gray-50 rounded-xl p-6 flex flex-col gap-5" onSubmit={handleInquiry}>
                      <h4 className="text-lg font-bold text-gray-900 m-0">Send us a message</h4>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Fullname</label>
                        <input
                          type="text"
                          className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          value={formData.fullname}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullname: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <button type="submit" className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white text-base font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]">
                        <FiSend />
                        Inquire now
                      </button>
                    </form>
                  </div>
                </div>
              )}
              {!showJoinSection && editing && company && (
                <div className="py-4 text-center">
                  <button
                    onClick={() => setCompany({ ...company, show_join_section: true })}
                    className="text-gray-400 hover:text-gray-600 flex items-center gap-2 mx-auto"
                  >
                    <FiEye /> Show Join/Contact Section
                  </button>
                </div>
              )}
            </div>
          )}
    </>
  )
}
