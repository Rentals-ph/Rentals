'use client'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import BrokerHeader from '@/components/broker/BrokerHeader'
import { brokerApi } from '@/api'
import type { Company } from '@/api/endpoints/broker'
import { FiUser, FiMail, FiPhone, FiLock, FiBriefcase } from 'react-icons/fi'

export default function CreateAgentPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    company_id: '' as string | number,
  })

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await brokerApi.getCompanies()
        setCompanies(data)
      } catch (err) {
        console.error('Failed to fetch companies:', err)
      }
    }
    fetchCompanies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await brokerApi.createAgent({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        phone: formData.phone || undefined,
        company_id: formData.company_id ? Number(formData.company_id) : undefined,
      })
      setSuccess(true)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        company_id: '',
      })
    } catch (err: any) {
      const data = err?.response?.data
      let msg = data?.message || err?.message || 'Failed to create agent account'
      if (data?.errors && typeof data.errors === 'object') {
        msg = Object.values(data.errors).flat().join(', ')
      }
      setError(typeof msg === 'string' ? msg : 'Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4 md:pt-15">
        <BrokerHeader
          title="Create Agent Account"
          subtitle="Create a new agent account for your team. Agents can manage listings and will be able to log in with the credentials you provide."
        />

        <div className="max-w-xl">
          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-emerald-800 mb-2">Agent created successfully</h3>
              <p className="text-emerald-700 mb-4">
                The agent can now log in with the email and password you provided. You can assign them to a team from the Team Management page.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Create another agent
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-[14px] p-6 shadow-sm border border-gray-100 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="agent@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="+63 912 345 6789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company (optional)</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  >
                    <option value="">No company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">Assign the agent to one of your companies</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-blue-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Agent Account'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
