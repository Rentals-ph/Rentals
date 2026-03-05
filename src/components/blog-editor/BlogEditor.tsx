'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { blogsApi } from '@/api'
import type { Blog } from '@/types'
import type { CreateBlogData } from '@/api'
import { toast, ToastContainer } from '@/utils/toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  FiArrowLeft,
  FiBold,
  FiItalic,
  FiUnderline,
  FiLink,
  FiImage,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiList,
  FiSave,
  FiEye,
  FiType,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiEdit3,
  FiTrash2,
  FiMove,
  FiPlus,
  FiMinus,
  FiCalendar,
  FiClock,
  FiGlobe,
  FiCheck,
  FiChevronDown
} from 'react-icons/fi'

interface ContentBlock {
  id: string
  type: 'text' | 'image' | 'centered' | 'grid' | 'left-image' | 'right-image' | 'split-left' | 'split-right' | 'stack'
  content: any
}

interface BlogEditorProps {
  blogId?: number
  onClose?: () => void
}

const TARGET_PLATFORMS = [
  'Apply Na',
  'Bayanihan',
  'Faceofmind',
  'fhiglobal',
  'FilipinoHomes',
  'HomesPH',
  'RentalsPH',
  'PropertyPH',
  'RealEstatePH',
  'ManilaHomes'
]

const CATEGORIES = [
  'Real Estate',
  'Lifestyle',
  'Investment',
  'Tips & Advice',
  'Market News',
  'Community',
  'Culture'
]

const COUNTRIES = [
  'Philippines',
  'Australia',
  'USA',
  'Canada',
  'UK',
  'UAE',
  'Singapore'
]

export default function BlogEditor({ blogId, onClose }: BlogEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState('just now')
  const [activeSidebarTab, setActiveSidebarTab] = useState<'settings' | 'library'>('settings')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [zoom, setZoom] = useState(100)
  
  // Meta data
  const [internalTitle, setInternalTitle] = useState('')
  const [summaryAbstract, setSummaryAbstract] = useState('')
  const [urlSlug, setUrlSlug] = useState('')
  const [category, setCategory] = useState('')
  const [country, setCountry] = useState('Philippines')
  const [author, setAuthor] = useState('HOMESPH NEWS')
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0])
  const [publishTime, setPublishTime] = useState('14:30')
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([])
  const [showAllPlatforms, setShowAllPlatforms] = useState(false)
  
  // Content blocks
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<ContentBlock | null>(null)
  
  // Text formatting
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState(18)
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left')
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load existing blog if editing
  useEffect(() => {
    if (blogId) {
      loadBlog()
    }
  }, [blogId])

  const loadBlog = async () => {
    try {
      setIsLoading(true)
      const blog = await blogsApi.getById(blogId!)
      setInternalTitle(blog.title)
      setSummaryAbstract(blog.excerpt || '')
      setCategory(blog.category || '')
      setAuthor(blog.author || 'HOMESPH NEWS')
      if (blog.published_at) {
        const date = new Date(blog.published_at)
        setPublishDate(date.toISOString().split('T')[0])
        setPublishTime(date.toTimeString().slice(0, 5))
      }
      
      // Parse content blocks if stored as JSON
      try {
        if (blog.content && typeof blog.content === 'string') {
          const parsed = JSON.parse(blog.content)
          if (Array.isArray(parsed)) {
            setContentBlocks(parsed)
          } else {
            // Legacy: single text block
            setContentBlocks([{
              id: '1',
              type: 'text',
              content: { text: blog.content }
            }])
          }
        }
      } catch {
        // If not JSON, treat as plain text
        setContentBlocks([{
          id: '1',
          type: 'text',
          content: { text: blog.content }
        }])
      }
    } catch (error) {
      console.error('Error loading blog:', error)
      toast.error('Failed to load blog')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true)
      const blogData: CreateBlogData = {
        title: internalTitle || 'Untitled',
        content: JSON.stringify(contentBlocks),
        excerpt: summaryAbstract,
        category: category,
        author: author,
        published_at: null, // Draft
        url_slug: urlSlug,
        country: country,
        publish_date: publishDate,
        publish_time: publishTime,
        target_platforms: targetPlatforms,
        content_blocks: contentBlocks
      }

      if (blogId) {
        await blogsApi.update(blogId, blogData)
        toast.success('Draft saved successfully')
      } else {
        await blogsApi.create(blogData)
        toast.success('Draft created successfully')
      }
      
      setLastSaved('just now')
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      setTimeout(() => setLastSaved(timeStr), 1000)
    } catch (error: any) {
      console.error('Error saving draft:', error)
      toast.error(error.response?.data?.message || 'Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!internalTitle.trim()) {
      toast.error('Please enter a title')
      return
    }

    try {
      setIsSaving(true)
      const publishDateTime = new Date(`${publishDate}T${publishTime}`)
      
      const blogData: CreateBlogData = {
        title: internalTitle,
        content: JSON.stringify(contentBlocks),
        excerpt: summaryAbstract,
        category: category,
        author: author,
        published_at: publishDateTime.toISOString(),
        url_slug: urlSlug,
        country: country,
        publish_date: publishDate,
        publish_time: publishTime,
        target_platforms: targetPlatforms,
        content_blocks: contentBlocks
      }

      if (blogId) {
        await blogsApi.update(blogId, blogData)
        toast.success('Blog published successfully')
      } else {
        await blogsApi.create(blogData)
        toast.success('Blog published successfully')
      }
      
      if (onClose) {
        onClose()
      } else {
        router.push('/admin/blogs')
      }
    } catch (error: any) {
      console.error('Error publishing blog:', error)
      toast.error(error.response?.data?.message || 'Failed to publish blog')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const block = contentBlocks.find(b => b.id === active.id)
    if (block) {
      setDraggedBlock(block)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedBlock(null)

    if (!over) return

    if (active.id !== over.id) {
      setContentBlocks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: getDefaultBlockContent(type)
    }
    setContentBlocks([...contentBlocks, newBlock])
    setActiveBlockId(newBlock.id)
  }

  const getDefaultBlockContent = (type: ContentBlock['type']): any => {
    switch (type) {
      case 'text':
        return { text: '' }
      case 'image':
        return { url: '', alt: '', caption: '' }
      case 'centered':
        return { text: '' }
      case 'grid':
        return { columns: 2, items: [] }
      case 'left-image':
      case 'right-image':
        return { image: '', text: '' }
      case 'split-left':
      case 'split-right':
        return { left: '', right: '' }
      case 'stack':
        return { items: [] }
      default:
        return {}
    }
  }

  const removeBlock = (id: string) => {
    setContentBlocks(contentBlocks.filter(b => b.id !== id))
    if (activeBlockId === id) {
      setActiveBlockId(null)
    }
  }

  const updateBlockContent = (id: string, content: any) => {
    setContentBlocks(contentBlocks.map(b => 
      b.id === id ? { ...b, content } : b
    ))
  }

  const togglePlatform = (platform: string) => {
    setTargetPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const SortableBlock = ({ block }: { block: ContentBlock }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: block.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1
    }

    return (
      <div ref={setNodeRef} style={style} className="relative group">
        <div className="flex items-start gap-2 p-4 border border-gray-200 rounded-lg hover:border-blue-300 bg-white">
          <button
            {...attributes}
            {...listeners}
            className="mt-2 p-1 text-gray-400 hover:text-gray-600 cursor-move"
          >
            <FiMove className="w-4 h-4" />
          </button>
          <div className="flex-1">
            {renderBlockContent(block)}
          </div>
          <button
            onClick={() => removeBlock(block.id)}
            className="mt-2 p-1 text-gray-400 hover:text-red-500"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const renderBlockContent = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateBlockContent(block.id, { ...block.content, text: e.target.value })}
            placeholder="Enter text..."
            className="w-full min-h-[100px] p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontFamily, fontSize: `${fontSize}px`, textAlign }}
          />
        )
      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.content.url || ''}
              onChange={(e) => updateBlockContent(block.id, { ...block.content, url: e.target.value })}
              placeholder="Image URL"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={block.content.alt || ''}
              onChange={(e) => updateBlockContent(block.id, { ...block.content, alt: e.target.value })}
              placeholder="Alt text"
              className="w-full p-2 border border-gray-300 rounded"
            />
            {block.content.url && (
              <img src={block.content.url} alt={block.content.alt} className="w-full rounded" />
            )}
          </div>
        )
      default:
        return <div className="p-4 bg-gray-50 rounded">{block.type} block</div>
    }
  }

  const visiblePlatforms = showAllPlatforms ? TARGET_PLATFORMS : TARGET_PLATFORMS.slice(0, 5)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ToastContainer />
      
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onClose ? onClose() : router.back()}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Create New Blog</h1>
            <p className="text-sm text-gray-500">Draft - Last saved {lastSaved}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Font Controls */}
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option>Inter</option>
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Georgia</option>
          </select>

          <div className="flex items-center gap-2 border border-gray-300 rounded">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="p-1.5 hover:bg-gray-100"
            >
              <FiMinus className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(72, fontSize + 1))}
              className="p-1.5 hover:bg-gray-100"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center gap-1 border border-gray-300 rounded p-1">
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <FiBold className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <FiItalic className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <FiUnderline className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <FiLink className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <FiImage className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border border-gray-300 rounded p-1">
            <button
              onClick={() => setTextAlign('left')}
              className={`p-1.5 rounded ${textAlign === 'left' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <FiAlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTextAlign('center')}
              className={`p-1.5 rounded ${textAlign === 'center' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <FiAlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTextAlign('right')}
              className={`p-1.5 rounded ${textAlign === 'right' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <FiAlignRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTextAlign('justify')}
              className={`p-1.5 rounded ${textAlign === 'justify' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <FiAlignJustify className="w-4 h-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border border-gray-300 rounded p-1">
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            <FiEye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <FiSave className="w-4 h-4 inline mr-2" />
            Save as Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Publish
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm">{zoom}%</span>
            <button className="p-1 hover:bg-gray-100 rounded">
              <FiChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-200 ${sidebarCollapsed ? 'w-0' : 'w-80'} flex flex-col overflow-hidden`}>
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveSidebarTab('settings')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeSidebarTab === 'settings'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              SETTINGS
            </button>
            <button
              onClick={() => setActiveSidebarTab('library')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeSidebarTab === 'library'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              LIBRARY
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeSidebarTab === 'settings' ? (
              <div className="space-y-6">
                {/* Meta Details */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">META DETAILS</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">INTERNAL TITLE</label>
                      <input
                        type="text"
                        value={internalTitle}
                        onChange={(e) => setInternalTitle(e.target.value)}
                        placeholder="Enter title"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SUMMARY / ABSTRACT</label>
                      <textarea
                        value={summaryAbstract}
                        onChange={(e) => setSummaryAbstract(e.target.value)}
                        placeholder="Enter summary..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL SLUG</label>
                      <input
                        type="text"
                        value={urlSlug}
                        onChange={(e) => setUrlSlug(e.target.value)}
                        placeholder="url-slug"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Publishing Config */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">PUBLISHING CONFIG</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CATEGORY</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">COUNTRY</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">AUTHOR</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PUBLISH DATE</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PUBLISH TIME</label>
                      <div className="relative">
                        <input
                          type="time"
                          value={publishTime}
                          onChange={(e) => setPublishTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <FiClock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Platforms */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">TARGET PLATFORMS</h3>
                  <div className="space-y-2">
                    {visiblePlatforms.map(platform => (
                      <label key={platform} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetPlatforms.includes(platform)}
                          onChange={() => togglePlatform(platform)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{platform}</span>
                      </label>
                    ))}
                    {TARGET_PLATFORMS.length > 5 && (
                      <button
                        onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {showAllPlatforms ? 'SHOW LESS' : `SHOW ALL (${TARGET_PLATFORMS.length})`}
                        <FiChevronDown className={`w-4 h-4 transition-transform ${showAllPlatforms ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Standard Blocks */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">STANDARD BLOCKS</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => addBlock('text')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiType className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Text Block</span>
                    </button>
                    <button
                      onClick={() => addBlock('image')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiImage className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Full Image</span>
                    </button>
                    <button
                      onClick={() => addBlock('centered')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiAlignCenter className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Centered</span>
                    </button>
                  </div>
                </div>

                {/* Layout Blocks */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">LAYOUT BLOCKS</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => addBlock('grid')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiType className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Grid</span>
                    </button>
                    <button
                      onClick={() => addBlock('left-image')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiImage className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Left Image</span>
                    </button>
                    <button
                      onClick={() => addBlock('right-image')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiImage className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Right Image</span>
                    </button>
                  </div>
                </div>

                {/* Special Layouts */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">SPECIAL LAYOUTS</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => addBlock('split-left')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiType className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Split Left</span>
                    </button>
                    <button
                      onClick={() => addBlock('split-right')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiType className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Split Right</span>
                    </button>
                    <button
                      onClick={() => addBlock('stack')}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
                    >
                      <FiType className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">Stack</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse/Expand Sidebar Button */}
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="absolute left-80 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white border border-gray-200 rounded-r hover:bg-gray-50 transition-all"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white border border-gray-200 rounded-r hover:bg-gray-50 transition-all"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white p-8">
          <div className="max-w-4xl mx-auto">
            {/* Blog Preview Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <span className="cursor-pointer hover:text-gray-700">All</span>
                <span>|</span>
                <span className="cursor-pointer hover:text-gray-700">{country.toUpperCase()}</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {internalTitle || 'From Manila to Mackay: How Nigerians Keep Their Culture Alive Down Under'}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {summaryAbstract || 'The community in Mackay, Australia, maintains strong cultural connections despite geographic distance...'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>By {author}</span>
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  {new Date(publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span>0 views</span>
                <div className="flex items-center gap-2 ml-auto">
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <FiGlobe className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <FiGlobe className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <FiGlobe className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            {contentBlocks.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <p className="text-gray-500 mb-2">START WRITING BELOW</p>
                <p className="text-sm text-gray-400">Drag content blocks from the library</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={contentBlocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {contentBlocks.map(block => (
                      <SortableBlock key={block.id} block={block} />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {draggedBlock ? (
                    <div className="opacity-50">
                      {renderBlockContent(draggedBlock)}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

