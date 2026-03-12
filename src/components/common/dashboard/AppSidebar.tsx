'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  FiUser,
} from 'react-icons/fi'

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed'
const SIDEBAR_WIDTH_EXPANDED = 240
const SIDEBAR_WIDTH_COLLAPSED = 72

function AppSidebar() {
  const pathname = usePathname()
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  })
  const sidebarRef = useRef<HTMLElement>(null)

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
    `relative flex items-center gap-3 px-4 py-3 no-underline text-sm font-medium transition-all flex-shrink-0 ${
      active
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
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
      {active && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l" />
      )}
      <div className="relative inline-flex items-center justify-center flex-shrink-0">
        <Icon className={`text-lg ${active ? 'text-blue-600' : 'text-gray-600'}`} />
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
      <NavLink href="/agent/account" icon={FiUser} label="Edit Profile" active={isActive('/agent/account')} />
      <NavLink href="/agent/inbox" icon={FiMail} label="Inbox" active={isActive('/agent/inbox')} badge />
      <NavLink href="/agent/listings" icon={FiList} label="My Listings" active={isActive('/agent/listings')} />
      <NavLink href="/agent/downloadables" icon={FiDownload} label="Downloadables" active={isActive('/agent/downloadables')} />
      <NavLink href="/agent/digital-card" icon={FiCreditCard} label="Digital Card" active={isActive('/agent/digital-card')} />
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
      <NavLink href="/admin" icon={FiHome} label="Dashboard" active={isActive('/admin') && pathname === '/admin'} />
      <NavLink href="/admin/agents" icon={FiUsers} label="Agents" active={isActive('/admin/agents')} />
      <NavLink href="/admin/properties" icon={FiLayers} label="Properties" active={isActive('/admin/properties')} />
      <NavLink href="/admin/blogs" icon={FiBookOpen} label="Blogs" active={isActive('/admin/blogs')} />
      <NavLink href="/admin/downloadables" icon={FiDownload} label="Downloadables" active={isActive('/admin/downloadables')} />
    </>
  )

  // Old admin sidebar - keeping for reference
  const renderAdminSidebarOld = () => (
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
        className={`w-[280px] max-[480px]:w-[260px] fixed left-0 overflow-visible z-[1000] md:-translate-x-full md:transition-transform md:duration-300 md:ease-in-out transition-[width] duration-200 ${
          isCollapsed ? 'md:w-[72px]' : 'lg:w-60'
        } ${isMobileMenuOpen ? 'md:translate-x-0' : ''}`}
        style={{ 
          top: 'var(--header-height, 80px)',
          height: 'calc(100vh - var(--header-height, 80px))',
          maxHeight: 'calc(100vh - var(--header-height, 80px))'
        }}
      >
        {/* White background */}
        <div className="absolute inset-0 bg-white border-r border-gray-200" aria-hidden />

        {/* Collapse toggle - circular button that overflows sidebar on the right (desktop only) */}
        <button
          type="button"
          onClick={() => setIsCollapsed((c) => !c)}
          className="hidden md:flex absolute -right-3 top-4 w-9 h-9 items-center justify-center rounded-full text-gray-600 hover:text-gray-900 bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors z-20"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FiChevronRight className="text-lg" /> : <FiChevronLeft className="text-lg" />}
        </button>

        {/* Content wrapper */}
        <div className="relative flex flex-col h-full text-gray-900 overflow-hidden">
          <div className="relative flex-shrink-0 p-4">
            {/* Spacer for button positioning */}
          </div>

          <nav
            className={`pl-3 mt-10 py-2 flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 ${
              isCollapsed ? 'md:px-2 md:gap-1' : ''
            }`}
            onClick={handleNavClick}
          >
            {isAdminRoute ? renderAdminSidebar() : isBrokerRoute ? renderBrokerSidebar() : renderAgentSidebar()}
          </nav>

        </div>
      </aside>
    </>
  )
}

export default AppSidebar

