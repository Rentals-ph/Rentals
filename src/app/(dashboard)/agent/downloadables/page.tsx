'use client'

import { useState, useEffect } from 'react'
import { downloadablesApi } from '@/api'
import type { Downloadable } from '@/api'
import { FiDownload, FiFileText, FiLoader } from 'react-icons/fi'
import { toast, ToastContainer } from '@/utils/toast'

export default function AgentDownloadables() {
  const [downloadables, setDownloadables] = useState<Downloadable[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadDownloadables()
  }, [])

  const loadDownloadables = async () => {
    try {
      setLoading(true)
      const data = await downloadablesApi.getAll()
      setDownloadables(data)
    } catch (error) {
      console.error('Error loading downloadables:', error)
      toast.error('Failed to load downloadables')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (downloadable: Downloadable) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(downloadable.id))
      await downloadablesApi.download(downloadable.id)
      toast.success(`Downloaded ${downloadable.title}`)
    } catch (error: any) {
      console.error('Error downloading file:', error)
      toast.error(error.message || 'Failed to download file')
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(downloadable.id)
        return newSet
      })
    }
  }

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FiFileText />
    if (fileType.includes('pdf')) return <FiFileText className="text-red-500" />
    if (fileType.includes('image')) return <FiFileText className="text-blue-500" />
    if (fileType.includes('word') || fileType.includes('document')) return <FiFileText className="text-blue-600" />
    return <FiFileText />
  }

  return (
    <>
      <ToastContainer />
      <div className="bg-white rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.1)] md:p-6">
        <h2 className="m-0 mb-8 text-2xl font-bold text-gray-900">Downloadables</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading downloadables...</span>
          </div>
        ) : downloadables.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No downloadables available at the moment.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {downloadables.map((downloadable) => (
              <div
                key={downloadable.id}
                className="flex items-center gap-5 p-6 bg-gray-50 rounded-xl transition-all hover:bg-gray-100 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] md:p-5 md:gap-4"
              >
                <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 md:w-14 md:h-14">
                  {getFileIcon(downloadable.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="m-0 text-lg font-semibold text-gray-900">{downloadable.title}</h3>
                  {downloadable.description && (
                    <p className="m-0 mt-1 text-sm text-gray-600 line-clamp-1">{downloadable.description}</p>
                  )}
                  {downloadable.category && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                      {downloadable.category}
                    </span>
                  )}
                </div>
                <button
                  className="w-12 h-12 bg-transparent border-none rounded-lg flex items-center justify-center cursor-pointer transition-all text-blue-500 hover:bg-blue-50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleDownload(downloadable)}
                  disabled={downloadingIds.has(downloadable.id)}
                  aria-label={`Download ${downloadable.title}`}
                >
                  {downloadingIds.has(downloadable.id) ? (
                    <FiLoader className="text-2xl animate-spin" />
                  ) : (
                    <FiDownload className="text-2xl" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
