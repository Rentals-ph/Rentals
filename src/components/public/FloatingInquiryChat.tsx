'use client'

import { useEffect, useState, useCallback } from 'react'
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi'
import { messagesApi } from '@/api'
import type { Property } from '@/types'

const STORAGE_PROFILE_KEY = 'temp_chat_profile_v1'
const STORAGE_THREADS_KEY = 'temp_chat_threads_v1'

interface TempChatProfile {
  name: string
  email: string
  phone: string
}

interface TempChatMessage {
  id: string
  direction: 'outgoing'
  message: string
  created_at: string
}

interface FloatingInquiryChatProps {
  property: Property
}

function loadProfile(): TempChatProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      name: String(parsed.name || ''),
      email: String(parsed.email || ''),
      phone: String(parsed.phone || ''),
    }
  } catch {
    return null
  }
}

function saveProfile(profile: TempChatProfile) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // ignore quota errors
  }
}

function getThreadKey(agentId: number | null | undefined, propertyId: number | null | undefined) {
  return `${agentId ?? 'unknown'}:${propertyId ?? 'unknown'}`
}

function loadThread(key: string): TempChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_THREADS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, TempChatMessage[]>
    const arr = parsed?.[key]
    if (!Array.isArray(arr)) return []
    return arr
  } catch {
    return []
  }
}

function saveThread(key: string, messages: TempChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_THREADS_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, TempChatMessage[]>) : {}
    parsed[key] = messages
    window.localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(parsed))
  } catch {
    // ignore
  }
}

export default function FloatingInquiryChat({ property }: FloatingInquiryChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<TempChatProfile>(() => ({
    name: '',
    email: '',
    phone: '',
  }))
  const [messages, setMessages] = useState<TempChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)

  const agentId = property.agent_id ?? property.agent?.id ?? property.rent_manager?.id ?? null
  const threadKey = getThreadKey(agentId, property.id)

  useEffect(() => {
    const existingProfile = loadProfile()
    if (existingProfile) {
      setProfile(existingProfile)
    }
    const existingMessages = loadThread(threadKey)
    if (existingMessages.length > 0) {
      setMessages(existingMessages)
    }
  }, [threadKey])

  const appendAndPersistMessage = useCallback(
    (msg: TempChatMessage) => {
      setMessages((prev) => {
        const next = [...prev, msg]
        saveThread(threadKey, next)
        return next
      })
    },
    [threadKey],
  )

  const handleSend = async () => {
    if (!draft.trim() || !agentId) return
    if (!profile.email || !profile.name) {
      alert('Please enter your name and email to start the chat.')
      return
    }

    const now = new Date().toISOString()
    const localMessage: TempChatMessage = {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      direction: 'outgoing',
      message: draft.trim(),
      created_at: now,
    }

    setIsSending(true)
    try {
      // Optimistically add to local thread first
      appendAndPersistMessage(localMessage)
      setDraft('')

      saveProfile(profile)

      await messagesApi.send({
        recipient_id: agentId,
        property_id: property.id,
        sender_name: profile.name,
        sender_email: profile.email,
        sender_phone: profile.phone,
        message: localMessage.message,
        type: 'property_inquiry',
        subject: `Inquiry about ${property.title}`,
      })
    } catch (error: any) {
      console.error('Error sending chat message:', error)
      alert(error?.response?.data?.message || 'Failed to send message. Please try again.')
      // On failure we still keep the message locally so the user sees what they tried to send
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const handleProfileChange = (field: keyof TempChatProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-lg shadow-blue-500/40 hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Chat about this property"
      >
        <FiMessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] w-[320px] max-w-[90vw] rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.35)] border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#2563eb] px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Chat about this property</p>
              <p className="text-xs text-blue-100 truncate">{property.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 focus:outline-none"
              aria-label="Close chat"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 px-4 py-3 text-xs text-gray-800 border-b border-gray-200">
            <p className="text-[11px] text-gray-500">
              Start a quick conversation with the agent about this listing. Your chat will stay on
              this browser until you clear your cache.
            </p>

            {/* Profile inputs */}
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                placeholder="Your name"
                value={profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="h-8 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
              <input
                type="email"
                placeholder="Your email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="h-8 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
              <input
                type="tel"
                placeholder="Your phone (optional)"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="h-8 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 max-h-64 space-y-2 overflow-y-auto px-4 py-3 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-[11px] text-gray-500 text-center mt-4">
                No messages yet. Say hi to the agent to get started.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-none bg-[#2563eb] px-3 py-2 text-[11px] text-white shadow-sm">
                    <p className="whitespace-pre-line">{m.message}</p>
                    <p className="mt-1 text-[10px] text-blue-100 text-right">{formatTime(m.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-gray-200 bg-white px-3 py-2">
            <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5">
              <input
                type="text"
                placeholder="Type your message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                className="flex-1 border-none bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !draft.trim() || !agentId}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563eb] text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FiSend className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

