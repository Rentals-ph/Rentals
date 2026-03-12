'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { agentsApi } from '../../api'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import { FiBell, FiHome, FiLogOut, FiUser } from 'react-icons/fi'

interface AgentHeaderProps {
  title?: string
  subtitle?: string
  showAddListing?: boolean
}

function AgentHeader({ title, subtitle, showAddListing = true }: AgentHeaderProps) {
  const router = useRouter()
  const [userName, setUserName] = useState<string>('')
  const [userAvatar, setUserAvatar] = useState<string>(ASSETS.PLACEHOLDER_PROFILE)
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        // Get stored data first
        const storedName = localStorage.getItem('user_name') || localStorage.getItem('agent_name') || ''
        const storedAgentId = localStorage.getItem('agent_id')
        
        // Set name from localStorage immediately
        if (storedName) {
          setUserName(storedName)
        }

        try {
          const agentData = await agentsApi.getCurrent()
          
          // Update name
          if (agentData.first_name && agentData.last_name) {
            const fullName = `${agentData.first_name} ${agentData.last_name}`
            setUserName(fullName)
            localStorage.setItem('agent_name', fullName)
            localStorage.setItem('user_name', fullName)
          } else if (agentData.full_name) {
            setUserName(agentData.full_name)
            localStorage.setItem('agent_name', agentData.full_name)
            localStorage.setItem('user_name', agentData.full_name)
          }
          
          // Update avatar and verification status
          if (agentData.id) {
            const avatarImage = resolveAgentAvatar(
              agentData.image || agentData.avatar || agentData.profile_image,
              agentData.id
            )
            setUserAvatar(avatarImage)
            setIsVerified(agentData.verified || false)
            localStorage.setItem('agent_id', agentData.id.toString())
          }
        } catch (error) {
          console.error('Error fetching agent data in AgentHeader:', error)
          // Fallback to stored agent ID for avatar
          if (storedAgentId) {
            const avatarImage = resolveAgentAvatar(null, parseInt(storedAgentId))
            setUserAvatar(avatarImage)
          }
        }
      } catch (error) {
        console.error('Error in fetchAgentData:', error)
        // Fallback to localStorage values
        const storedName = localStorage.getItem('user_name') || localStorage.getItem('agent_name') || ''
        const storedAgentId = localStorage.getItem('agent_id')
        if (storedName) setUserName(storedName)
        if (storedAgentId) {
          const avatarImage = resolveAgentAvatar(null, parseInt(storedAgentId))
          setUserAvatar(avatarImage)
        }
      }
    }
    fetchAgentData()
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_phone')
    localStorage.removeItem('user_avatar')
    localStorage.removeItem('user_role')
    localStorage.removeItem('agent_id')
    localStorage.removeItem('agent_name')
    localStorage.removeItem('agent_status')
    localStorage.removeItem('agent_registration_status')
    localStorage.removeItem('unread_messages_count')
    setShowProfileDropdown(false)
    router.push('/')
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4 md:px-8 md:py-4">
        {/* Logo on the left */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <img
            src={ASSETS.LOGO_HERO_MAIN}
            alt="Rentals.ph logo"
            className="h-10 md:h-12 w-auto"
          />
        </Link>

        {/* Right side: Add Listing button, Bell icon, Divider, Profile */}
        <div className="flex items-center gap-4">
          {/* Add Listing Button */}
          {showAddListing && (
            <Link
              href="/agent/create-listing"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-md hover:bg-blue-700 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ width: '20px', height: '20px' }}
              >
                {/* Roof — V/caret shape stroked */}
                <path
                  d="M2 12 L12 2 L22 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* House body — pentagon with peaked top matching the caret angle */}
                <path d="M3.5 22 L3.5 15 L12 6 L20.5 15 L20.5 22 Z" />

                {/* Door cutout */}
                <rect x="9.5" y="16.5" width="5" height="5.5" fill="#3B82F6" />
              </svg>
              <span>Add Listing</span>
            </Link>
          )}

          {/* Bell Icon */}
          <Link
            href="/agent/inbox"
            className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-600 transition-colors"
            aria-label="Notifications"
          >
            <FiBell className="text-xl" />
          </Link>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300" />

          {/* Profile Section */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 ring-2 ring-white shadow-md">
                <img
                  src={userAvatar}
                  alt={userName || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    if (target.nextElementSibling) {
                      ;(target.nextElementSibling as HTMLElement).style.display = 'flex'
                    }
                  }}
                />
                <div className="w-full h-full hidden items-center justify-center text-white font-semibold text-sm">
                  {userName
                    ? userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'U'}
                </div>
              </div>
              <div className="flex flex-col items-start hidden md:flex">
                <span className="text-sm font-semibold text-gray-900">
                  {userName || 'Agent'}
                </span>
                <span className="text-xs text-gray-500">
                  {isVerified ? 'Rent Manager' : 'Property Agent'}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 min-w-[160px] z-50">
                <button
                  className="flex items-center w-full gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    router.push('/agent/account')
                    setShowProfileDropdown(false)
                  }}
                >
                  <FiUser className="text-lg flex-shrink-0" />
                  <span>Account</span>
                </button>
                <button
                  className="flex items-center w-full gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                  onClick={handleLogout}
                >
                  <FiLogOut className="text-lg flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AgentHeader
