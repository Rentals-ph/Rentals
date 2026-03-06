'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ASSETS } from '@/utils/assets'
import { agentsApi } from '@/api'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import {
  FiMail,
  FiDownload,
  FiCreditCard,
  FiHome,
  FiList,
  FiBarChart2,
  FiFileText,
  FiBookOpen,
  FiPlus,
  FiChevronRight, 
  FiChevronLeft,
  FiLayout,
  FiUsers,
  FiDollarSign,
  FiLayers,
  FiMessageCircle,
  FiSettings,
  FiCheckSquare,
  FiGrid,
  FiLogOut,
  FiUser,
} from 'react-icons/fi'

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed'
const SIDEBAR_WIDTH_EXPANDED = 280
const SIDEBAR_WIDTH_COLLAPSED = 72

function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [userAvatar, setUserAvatar] = useState<string>(ASSETS.PLACEHOLDER_PROFILE)
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  })
  const sidebarRef = useRef<HTMLElement>(null)
  const logoutRef = useRef<HTMLDivElement>(null)

  // Sync collapsed state to CSS variable and localStorage (desktop only; mobile uses overlay)
  useEffect(() => {
    const width = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
    document.documentElement.style.setProperty('--app-sidebar-width', `${width}px`)
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed))
    } catch (_) {}
  }, [isCollapsed])
  
  // Determine if we're on admin or agent routes
  const isAdminRoute = pathname?.startsWith('/admin')
  const isAgentRoute = pathname?.startsWith('/agent')
  const isBrokerRoute = pathname?.startsWith('/broker')

  // Fetch user data for agent/broker (only /agents/me for agents; brokers use localStorage)
  useEffect(() => {
    if (!isAgentRoute && !isBrokerRoute) return

    const role = typeof window !== 'undefined' ? (localStorage.getItem('user_role') || localStorage.getItem('agent_role')) : null
    const isAgent = role === 'agent'

    const fetchUserData = async () => {
      try {
        // Get stored data first
        const storedName = localStorage.getItem('user_name') || localStorage.getItem('agent_name') || ''
        const storedAgentId = localStorage.getItem('agent_id')
        
        // Set name from localStorage immediately
        if (storedName) {
          setUserName(storedName)
        }

        // /agents/me is only for users with role 'agent'; brokers/admins get 403
        if (isAgent && (isAgentRoute || isBrokerRoute)) {
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
            console.error('Error fetching agent data in AppSidebar:', error)
            // Fallback to stored agent ID for avatar
            if (storedAgentId) {
              const avatarImage = resolveAgentAvatar(null, parseInt(storedAgentId))
              setUserAvatar(avatarImage)
            }
          }
        }
        // For brokers/admins we rely on localStorage only (no /agents/me call)
      } catch (error) {
        console.error('Error in fetchUserData:', error)
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

    fetchUserData()
  }, [isAgentRoute, isBrokerRoute])

  useEffect(() => {
    // Check unread messages for agent and broker routes
    if (!isAgentRoute && !isBrokerRoute) return

    const checkUnreadMessages = () => {
      let hasUnread = false
      
      if (isAgentRoute) {
        // Check if account is processing (this would show as a notification in inbox)
        const registrationStatus = localStorage.getItem('agent_registration_status')
        const agentStatus = localStorage.getItem('agent_status')
        
        if (registrationStatus === 'processing' || 
            agentStatus === 'processing' || 
            agentStatus === 'pending' || 
            agentStatus === 'under_review') {
          hasUnread = true
        }
      }

      // Check for unread messages count
      const unreadCount = localStorage.getItem('unread_messages_count')
      if (unreadCount && parseInt(unreadCount) > 0) {
        hasUnread = true
      }

      setHasUnreadMessages(hasUnread)
    }

    // Check initially
    checkUnreadMessages()

    // Listen for storage changes (when inbox updates unread count)
    window.addEventListener('storage', checkUnreadMessages)
    
    // Also check periodically in case localStorage is updated in the same window
    const interval = setInterval(checkUnreadMessages, 1000)

    return () => {
      window.removeEventListener('storage', checkUnreadMessages)
      clearInterval(interval)
    }
  }, [isAgentRoute, isBrokerRoute])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Close logout dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideLogout = (event: MouseEvent) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) {
        setShowLogoutDropdown(false)
      }
    }

    if (showLogoutDropdown) {
      document.addEventListener('mousedown', handleClickOutsideLogout)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideLogout)
    }
  }, [showLogoutDropdown])

  const handleLogout = () => {
    // Clear all auth data from localStorage
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
    localStorage.removeItem('broker_status')
    localStorage.removeItem('broker_registration_status')
    localStorage.removeItem('unread_messages_count')
    setShowLogoutDropdown(false)
    router.push('/')
  }

  const isActive = (path: string) => {
    if (!pathname) return false
    if (path === '/agent') {
      // For create listing pages, check if we're on any create-listing route
      return pathname === '/agent' ||
        pathname === '/agent/' ||
        pathname.startsWith('/agent/create-listing')
    }
    if (path === '/admin') {
      return pathname === '/admin' || pathname === '/admin/'
    }
    if (path === '/broker') {
      return pathname === '/broker' || pathname === '/broker/'
    }
    return pathname === path || pathname.startsWith(path + '/')
  }

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl no-underline text-[13px] font-medium transition-all flex-shrink-0 ${
      active
        ? 'bg-rental-blue-600 text-white shadow-md shadow-rental-blue-600/25'
        : 'text-rental-blue-800 hover:bg-white/80 hover:text-rental-orange-500 hover:shadow-sm'
    } ${isCollapsed ? 'md:justify-center md:px-2' : ''}`

  const NavLink = ({
    href,
    icon: Icon,
    label,
    active,
    badge,
  }: {
    href: string
    icon: React.ElementType
    label: string
    active: boolean
    badge?: boolean
  }) => (
    <Link
      href={href}
      className={navLinkClass(active)}
      title={isCollapsed ? label : undefined}
    >
      <div className="relative inline-flex items-center justify-center flex-shrink-0">
        <Icon className="text-lg" />
        {badge && hasUnreadMessages && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]" />
        )}
      </div>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  )

  // Agent sidebar content
  const renderAgentSidebar = () => (
    <>
      <NavLink href="/agent" icon={FiHome} label="Dashboard" active={isActive('/agent') && !pathname?.includes('/agent/')} />
      <NavLink href="/agent/create-listing" icon={FiPlus} label="Create Listing" active={isActive('/agent/create-listing')} />
      <NavLink href="/agent/listings" icon={FiList} label="My Listings" active={isActive('/agent/listings')} />
      <NavLink href="/agent/inbox" icon={FiMail} label="Inbox" active={isActive('/agent/inbox')} badge />
      <NavLink href="/agent/downloadables" icon={FiDownload} label="Downloadables" active={isActive('/agent/downloadables')} />
      <NavLink href="/agent/digital-card" icon={FiCreditCard} label="Digital Business Card" active={isActive('/agent/digital-card')} />
      <NavLink href="/agent/page-builder" icon={FiSettings} label="Page Builder" active={isActive('/agent/page-builder')} />
      
    </>
  )

  // Broker sidebar content
  const renderBrokerSidebar = () => (
    <>
      <NavLink href="/broker" icon={FiGrid} label="Dashboard" active={isActive('/broker') && !pathname?.includes('/broker/')} />
      <NavLink href="/broker/create-listing" icon={FiPlus} label="Create Listing" active={isActive('/broker/create-listing')} />
      <NavLink href="/broker/listings" icon={FiHome} label="Listings" active={isActive('/broker/listings')} />
      <NavLink href="/broker/inbox" icon={FiMail} label="Inbox" active={isActive('/broker/inbox')} badge />
      <NavLink href="/broker/company-profile" icon={FiLayout} label="Company Profile" active={isActive('/broker/company-profile')} />
      <NavLink href="/broker/team" icon={FiUsers} label="Team Management" active={isActive('/broker/team')} />
      <NavLink href="/broker/agents/create" icon={FiUser} label="Create Agent" active={isActive('/broker/agents/create')} />
      <NavLink href="/broker/page-builder" icon={FiFileText} label="Page Builder" active={isActive('/broker/page-builder')} />
      <NavLink href="/broker/reports" icon={FiBarChart2} label="Reports" active={isActive('/broker/reports')} />
      
      <NavLink href="/broker/downloadables" icon={FiDownload} label="Downloadables" active={isActive('/broker/downloadables')} />
      <NavLink href="/broker/digital-card" icon={FiCreditCard} label="Digital Business Card" active={isActive('/broker/digital-card')} />
    </>
  )

  // Admin sidebar content
  const renderAdminSidebar = () => (
    <>
      <NavLink href="/admin" icon={FiHome} label="Dashboard" active={isActive('/admin')} />
      <NavLink href="/admin/agents" icon={FiUsers} label="User Management" active={isActive('/admin/agents')} />
      <NavLink href="/admin/properties" icon={FiLayers} label="Property Management" active={isActive('/admin/properties')} />
      <NavLink href="/admin/blogs" icon={FiBookOpen} label="Blog Management" active={isActive('/admin/blogs')} />
    </>
  )

  const handleNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="hidden fixed inset-0 bg-black/50 z-[999] md:block"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`w-[280px] max-[480px]:w-[260px] fixed h-screen overflow-visible z-[1000] md:-translate-x-full md:transition-transform md:duration-300 md:ease-in-out transition-[width] duration-200 ${
          isCollapsed ? 'md:w-[72px]' : 'lg:w-60'
        } ${isMobileMenuOpen ? 'md:translate-x-0' : ''}`}
      >
        {/* Background layer to match public mobile sidebar aesthetics */}
        <div className="absolute inset-0 bg-gradient-to-br from-rental-blue-50 via-white to-rental-orange-50/40 border-r border-rental-blue-100" aria-hidden />
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-rental-blue-500/10 blur-2xl" />
          <div className="absolute top-1/3 -left-8 w-24 h-24 rounded-full bg-rental-orange-500/15 blur-xl" />
          <div className="absolute bottom-16 -right-6 w-28 h-28 rounded-full bg-rental-blue-400/10 blur-2xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 20px,
                #205ED7 20px,
                #205ED7 21px
              )`,
            }}
          />
        </div>

        {/* Content wrapper */}
        <div className="relative flex flex-col h-full text-gray-900">
          <div
            className={`relative p-2.5 border-b border-white/60 flex-shrink-0 backdrop-blur-sm ${
              isCollapsed ? 'md:px-2 md:overflow-visible' : ''
            }`}
          >
            <div
              className={`flex items-center justify-center w-full mb-1 ${
                isCollapsed ? 'md:mb-0' : ''
              }`}
            >
              <Link href="/" className={isCollapsed ? 'md:flex md:justify-center' : ''}>
                <img
                  src={ASSETS.LOGO_HERO_MAIN}
                  alt="Rentals.ph logo"
                  className={`h-[60px] md:h-[50px] w-auto max-w-full object-contain ${
                    isCollapsed
                      ? 'md:!h-[60px] md:!w-[60px] md:!min-w-[60px] md:max-w-none'
                      : ''
                  }`}
                />
              </Link>
            </div>
            {/* Collapse toggle - circular button that overflows sidebar on the right (desktop only) */}
            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full text-gray-600 hover:text-gray-900 bg-white shadow-md shadow-rental-blue-500/20 border border-white/80 hover:bg-rental-blue-50 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <FiChevronRight className="text-lg" /> : <FiChevronLeft className="text-lg" />}
            </button>
          </div>

          <nav
            className={`p-3 lg:py-2.5 lg:px-2 md:p-3 flex flex-col gap-4 lg:gap-3 md:gap-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-rental-blue-300 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-rental-blue-400 ${
              isCollapsed ? 'md:py-2.5 md:px-2 md:gap-3' : ''
            }`}
            onClick={handleNavClick}
          >
            {isAdminRoute ? renderAdminSidebar() : isBrokerRoute ? renderBrokerSidebar() : renderAgentSidebar()}
          </nav>

          {(isBrokerRoute || isAgentRoute) && (
            <div className="relative flex-shrink-0" ref={logoutRef}>
              {showLogoutDropdown && (
                <div
                  className={`absolute bottom-full left-3 right-3 bg-white/95 border border-gray-200 rounded-[12px] shadow-[0_-6px_20px_rgba(15,23,42,0.18)] p-1.5 mb-2 z-[100] animate-[slideUpFade_0.15s_ease-out] ${
                    isCollapsed ? 'left-2 right-2 flex flex-col gap-0.5' : ''
                  }`}
                >
                  <button
                    className={`flex items-center w-full bg-transparent border-none rounded-lg text-sm font-medium text-gray-900 cursor-pointer transition-colors hover:bg-gray-50 ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3.5 py-2.5'
                    }`}
                    onClick={() => {
                      router.push(isBrokerRoute ? '/broker/account' : '/agent/account')
                      setShowLogoutDropdown(false)
                    }}
                    title="Account"
                  >
                    <FiUser className="text-lg flex-shrink-0" />
                    {!isCollapsed && <span>Account</span>}
                  </button>
                  <button
                    className={`flex items-center w-full bg-transparent border-none rounded-lg text-sm font-medium text-red-500 cursor-pointer transition-colors hover:bg-red-50 ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3.5 py-2.5'
                    }`}
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <FiLogOut className="text-lg flex-shrink-0" />
                    {!isCollapsed && <span>Logout</span>}
                  </button>
                </div>
              )}
              <div
                className={`flex items-center gap-2.5 px-5 py-4 border-t border-white/60 bg-white/60 backdrop-blur-sm flex-shrink-0 transition-colors cursor-pointer hover:bg-white ${
                  isCollapsed ? 'md:justify-center md:px-2 md:py-3' : ''
                }`}
                onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}
                title={isCollapsed ? userName || 'Account / Logout' : undefined}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-rental-blue-500 to-rental-blue-700 ring-2 ring-white shadow-md">
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
                  <div className="w-full h-full hidden items-center justify-center text-white font-semibold text-[13px]">
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
                {!isCollapsed && (
                  <div className="flex flex-col gap-px flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                      {userName || (isBrokerRoute ? 'Broker' : 'Agent')}
                    </span>
                    <span className="text-[11px] text-rental-blue-700/80">
                      {isBrokerRoute
                        ? 'Broker'
                        : isVerified
                          ? 'Rent Manager'
                          : 'Property Agent'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default AppSidebar

