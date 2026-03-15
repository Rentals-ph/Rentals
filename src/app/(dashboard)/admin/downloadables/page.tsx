'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardHeader } from '@/features/dashboard'
import { downloadablesApi } from '@/api'
import type { Downloadable } from '@/api'
import { toast, ToastContainer } from '@/shared/utils/toast'
import { FiPlus, FiEdit3, FiTrash2, FiDownload, FiX, FiFileText, FiUpload } from 'react-icons/fi'

export default function AdminDownloadablesPage() {
  const [downloadables, setDownloadables] = useState<Downloadable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    file: null as File | null,
    is_active: true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDownloadables()
  }, [])

  const loadDownloadables = async () => {
    try {
      setIsLoading(true)
      const data = await downloadablesApi.getAllAdmin()
      setDownloadables(data)
    } catch (error) {
      console.error('Error loading downloadables:', error)
      toast.error('Failed to load downloadables')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      category: '',
      file: null,
      is_active: true,
    })
    setShowModal(true)
  }

  const handleEdit = (downloadable: Downloadable) => {
    setEditingId(downloadable.id)
    setFormData({
      title: downloadable.title,
      description: downloadable.description || '',
      category: downloadable.category || '',
      file: null,
      is_active: downloadable.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this downloadable?')) return

    try {
      await downloadablesApi.delete(id)
      toast.success('Downloadable deleted successfully')
      loadDownloadables()
    } catch (error: any) {
      console.error('Error deleting downloadable:', error)
      toast.error(error.message || 'Failed to delete downloadable')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingId && !formData.file) {
      toast.error('Please select a file')
      return
    }

    try {
      if (editingId) {
        await downloadablesApi.update(editingId, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          file: formData.file || undefined,
          is_active: formData.is_active,
        })
        toast.success('Downloadable updated successfully')
      } else {
        if (!formData.file) {
          toast.error('Please select a file')
          return
        }
        await downloadablesApi.create({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          file: formData.file,
        })
        toast.success('Downloadable created successfully')
      }
      setShowModal(false)
      loadDownloadables()
    } catch (error: any) {
      console.error('Error saving downloadable:', error)
      toast.error(error.message || 'Failed to save downloadable')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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
      <DashboardHeader
        title="Downloadables Management"
        subtitle="Upload and manage files for agents and brokers to download"
        showNotifications={false}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Downloadables</h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Upload New File
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading downloadables...</div>
        ) : downloadables.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="mb-4">No downloadables yet</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Your First File
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">File</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Downloads</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {downloadables.map((downloadable) => (
                  <tr key={downloadable.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{downloadable.title}</div>
                      {downloadable.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">{downloadable.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {downloadable.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getFileIcon(downloadable.file_type)}
                        <span className="truncate max-w-[200px]">{downloadable.file_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatFileSize(downloadable.file_size)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{downloadable.download_count}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${downloadable.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                        {downloadable.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(downloadable)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(downloadable.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-lg max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Downloadable' : 'Upload New Downloadable'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
                    placeholder="Enter downloadable title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20 resize-y"
                    placeholder="Enter description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., lease-agreements, financial-reports"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    File {!editingId && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    required={!editingId}
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/20"
                  />
                  {editingId && formData.file && (
                    <p className="mt-2 text-sm text-gray-500">New file will replace existing file</p>
                  )}
                </div>

                {editingId && (
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span className="text-sm font-semibold text-gray-900">Active</span>
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    {editingId ? 'Update' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

