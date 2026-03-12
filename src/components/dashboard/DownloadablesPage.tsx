'use client'

import { useState } from 'react'
import Image from 'next/image'
import AppSidebar from '@/components/common/AppSidebar'
import { FiFileText } from 'react-icons/fi'
import { SiMicrosoftword } from 'react-icons/si'
import { TbFileSpreadsheet } from 'react-icons/tb'

const RESOURCES = [
  {
    id: 'rental-application',
    title: 'Rental Application Form',
    description: 'Standard form for tenants to apply for rental property.',
    type: 'pdf',
    size: '1.2 MB',
    category: 'forms',
  },
  {
    id: 'lease-agreement',
    title: 'Lease Agreement Template',
    description: 'Standard lease agreement template for rental properties.',
    type: 'word',
    size: '256 KB',
    category: 'forms',
  },
  {
    id: 'price-comparison',
    title: 'Rental Price Comparison Worksheet',
    description: 'Compare rental prices across properties and markets.',
    type: 'spreadsheet',
    size: '128 KB',
    category: 'marketing',
  },
] as const

type TabId = 'all' | 'forms' | 'marketing'

type DownloadablesPageProps = {
  role: 'agent' | 'broker'
}

export default function DownloadablesPage({ role }: DownloadablesPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('all')

  const handleDownload = (id: string) => {
    // TODO: wire up real download links
    console.log(`Downloading ${id} for ${role}`)
  }

  const filteredResources =
    activeTab === 'all'
      ? RESOURCES
      : activeTab === 'forms'
        ? RESOURCES.filter((r) => r.category === 'forms')
        : RESOURCES.filter((r) => r.category === 'marketing')

  const heading =
    role === 'broker' ? 'Broker Resources & Downloads' : 'Agent Resources & Downloads'

  const subheading =
    role === 'broker'
      ? 'Access helpful templates, forms, and guides to support your brokers and clients.'
      : 'Access helpful templates, forms, and guides for your rental business.'

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar />

      <main className="main-with-sidebar flex-1 min-h-screen flex flex-col pt-6">
        {/* Banner */}
        <div className="relative w-full overflow-hidden rounded-xl mx-8 mb-6 lg:mx-6 md:mx-4 min-h-[240px] sm:min-h-[260px] md:min-h-[280px]">
          <div className="absolute inset-0">
            <Image
              src="/assets/images/agents/downloadables-banner.png"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,253,0.9)_0%,rgba(255,255,255,0.9)_35%,rgba(255,255,255,0.9)_65%,rgba(240,247,253,0.9)_100%)]"
              aria-hidden
            />
          </div>
          <div className="relative flex items-center justify-between gap-6 pl-8 pr-0 py-10 lg:pl-6 md:pl-4 md:py-8 min-h-[240px] sm:min-h-[260px] md:min-h-[280px]">
            <div className="flex-1 min-w-0">
              <div className="text-left max-w-xl px-6 py-6 md:px-8 md:py-8">
                <h2 className="m-0 mb-3 text-[32px] md:text-3xl font-bold text-black tracking-tight leading-tight">
                  {heading}
                </h2>
                <p className="m-0 text-[17px] md:text-base text-gray-600 leading-relaxed font-normal">
                  {subheading}
                </p>
              </div>
            </div>
            <div className="relative flex-shrink-0 w-[320px] h-[260px] md:w-[400px] md:h-[320px] lg:w-[440px] lg:h-[360px] hidden xs:block overflow-visible">
              <Image
                src="/assets/images/agents/downloadables-person.png"
                alt="Resources"
                fill
                className="object-contain object-right object-bottom drop-shadow-md"
                sizes="(max-width: 768px) 320px, (max-width: 1024px) 400px, 440px"
              />
            </div>
          </div>
        </div>

        {/* Tabs + Content */}
        <div className="flex-1 px-8 lg:px-6 md:px-4 pb-8">
          <div className="flex gap-6 mb-4 border-b border-gray-200">
            {[
              { id: 'all' as TabId, label: 'All Resources' },
              { id: 'forms' as TabId, label: 'Forms & Contracts' },
              { id: 'marketing' as TabId, label: 'Marketing Materials' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-rental-blue-600 border-rental-blue-600'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)] md:p-5">
            <h3 className="m-0 mb-4 text-base font-bold text-gray-900">
              {activeTab === 'all' && 'All Resources'}
              {activeTab === 'forms' && 'Forms & Contracts'}
              {activeTab === 'marketing' && 'Marketing Materials'}
            </h3>

            <div className="flex flex-col gap-3">
              {filteredResources.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg transition-all hover:bg-gray-100 md:gap-3 md:flex-wrap"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === 'pdf'
                        ? 'bg-[#2e7d32]'
                        : item.type === 'word'
                          ? 'bg-[#2b579a]'
                          : 'bg-[#1b5e20]'
                    }`}
                  >
                    {item.type === 'pdf' && <FiFileText className="text-xl text-white" />}
                    {item.type === 'word' && <SiMicrosoftword className="text-xl text-white" />}
                    {item.type === 'spreadsheet' && (
                      <TbFileSpreadsheet className="text-xl text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="m-0 text-sm font-semibold text-gray-900">{item.title}</h4>
                    <p className="m-0 mt-0.5 text-xs text-gray-500">{item.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {item.type === 'pdf' && 'PDF'}
                    {item.type === 'word' && 'Word'}
                    {item.type === 'spreadsheet' && 'Spreadsheet'} ({item.size})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownload(item.id)}
                    className="px-4 py-2 bg-rental-blue-500 text-white text-sm font-medium rounded-lg hover:bg-rental-blue-600 transition-colors flex-shrink-0"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="w-full py-3 bg-rental-blue-500 text-white text-sm font-medium rounded-lg hover:bg-rental-blue-600 transition-colors"
              >
                Download All
              </button>
              <p className="m-0 mt-1.5 text-xs text-gray-500 text-center">
                Download all resources as a ZIP file.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-xs text-gray-500">
                Need a specific document? Let us know.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

