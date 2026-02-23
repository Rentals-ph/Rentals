'use client'

import AppSidebar from '../../../components/common/AppSidebar'
import AgentHeader from '../../../components/agent/AgentHeader'
import { 
  FiDownload,
  FiFileText,
  FiBarChart2,
  FiImage
} from 'react-icons/fi'

export default function AgentDownloadables() {
  const handleDownload = (type: string) => {
    console.log(`Downloading ${type}`)
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <AppSidebar/>

      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="Downloadables" 
          subtitle="Download resources and documents." 
        />

        <div className="bg-white rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.1)] md:p-6">
          <h2 className="m-0 mb-8 text-2xl font-bold text-gray-900">Downloadables</h2>
          
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-xl transition-all hover:bg-gray-100 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] md:p-5 md:gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 md:w-14 md:h-14">
                <FiFileText className="text-[32px] text-white md:text-[28px]" />
              </div>
              <div className="flex-1">
                <h3 className="m-0 text-lg font-semibold text-gray-900">Lease Agreements</h3>
              </div>
              <button 
                className="w-12 h-12 bg-transparent border-none rounded-lg flex items-center justify-center cursor-pointer transition-all text-blue-500 hover:bg-blue-50 hover:scale-105"
                onClick={() => handleDownload('lease-agreements')}
                aria-label="Download Lease Agreements"
              >
                <FiDownload className="text-2xl" />
              </button>
            </div>

            <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-xl transition-all hover:bg-gray-100 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] md:p-5 md:gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 md:w-14 md:h-14">
                <FiBarChart2 className="text-[32px] text-white md:text-[28px]" />
              </div>
              <div className="flex-1">
                <h3 className="m-0 text-lg font-semibold text-gray-900">Financial Report</h3>
              </div>
              <button 
                className="w-12 h-12 bg-transparent border-none rounded-lg flex items-center justify-center cursor-pointer transition-all text-blue-500 hover:bg-blue-50 hover:scale-105"
                onClick={() => handleDownload('financial-report')}
                aria-label="Download Financial Report"
              >
                <FiDownload className="text-2xl" />
              </button>
            </div>

            <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-xl transition-all hover:bg-gray-100 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] md:p-5 md:gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 md:w-14 md:h-14">
                <FiImage className="text-[32px] text-white md:text-[28px]" />
              </div>
              <div className="flex-1">
                <h3 className="m-0 text-lg font-semibold text-gray-900">Property Photos</h3>
              </div>
              <button 
                className="w-12 h-12 bg-transparent border-none rounded-lg flex items-center justify-center cursor-pointer transition-all text-blue-500 hover:bg-blue-50 hover:scale-105"
                onClick={() => handleDownload('property-photos')}
                aria-label="Download Property Photos"
              >
                <FiDownload className="text-2xl" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
