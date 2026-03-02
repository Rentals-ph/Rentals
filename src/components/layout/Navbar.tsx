'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FiUser, FiLogOut, FiChevronDown, FiHome, FiMenu, FiX, FiInfo, FiLayers, FiUsers, FiBook, FiRss, FiMail } from 'react-icons/fi'
import { ASSETS } from '@/utils/assets'
import { agentsApi } from '@/api'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import LoginModal from '@/components/common/LoginModal'
import RegisterModal from '@/components/common/RegisterModal'

export const SIDEBAR_WIDTH = 240
export const SIDEBAR_WIDTH_SM = 264

type NavbarProps = {
  /** When provided, mobile menu is controlled by the parent (e.g. for content push). */
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: (open: boolean) => void
}

const Navbar = ({ mobileMenuOpen, onMobileMenuToggle }: NavbarProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [internalMobileOpen, setInternalMobileOpen] = useState(false)
  const isMobileMenuOpen = mobileMenuOpen !== undefined ? mobileMenuOpen : internalMobileOpen
  const setMobileMenuOpen = (open: boolean) => {
    if (onMobileMenuToggle) onMobileMenuToggle(open)
    else setInternalMobileOpen(open)
  }
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  const [userName, setUserName] = useState('User')
  const [userRole, setUserRole] = useState<'agent' | 'admin' | 'broker'>('agent')
  const [userImage, setUserImage] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, right: 0 })

  const checkAuthStatus = () => {
    // Check if user is logged in (agent or admin)
    const authToken = localStorage.getItem('auth_token')
    const role = localStorage.getItem('user_role') || localStorage.getItem('agent_role')
    const agentStatus = localStorage.getItem('agent_status')
    
    // For agents, check if they have agent_status
    // For admins, just check if they have auth_token and role is admin
    // For brokers, check if they have auth_token and role is broker
    if (authToken && (role === 'admin' || role === 'broker' || (role === 'agent' && agentStatus))) {
      setIsUserLoggedIn(true)
      // Try to get user name from localStorage - prioritize user_name, then agent_name
      const storedName = localStorage.getItem('user_name') || 
        localStorage.getItem('agent_name') || 
        (role === 'admin' ? 'Admin' : role === 'broker' ? 'Broker' : 'Agent')
      setUserName(storedName)
      setUserRole(role === 'admin' ? 'admin' : role === 'broker' ? 'broker' : 'agent')
    } else {
      setIsUserLoggedIn(false)
      setUserName('User')
      setUserRole('agent')
    }
  }

  useEffect(() => {
    checkAuthStatus()
    
    // If user is logged in, try to fetch user data including image
    const authToken = localStorage.getItem('auth_token')
    const role = localStorage.getItem('user_role') || localStorage.getItem('agent_role')
    const storedName = localStorage.getItem('user_name') || localStorage.getItem('agent_name')
    const storedUserId = localStorage.getItem('user_id') || localStorage.getItem('agent_id')
    
    if (authToken && role === 'agent') {
      // Fetch agent data to get the name and image
      agentsApi.getCurrent()
        .then((agent) => {
          if (agent.first_name && agent.last_name) {
            const fullName = `${agent.first_name} ${agent.last_name}`
            localStorage.setItem('agent_name', fullName)
            localStorage.setItem('user_name', fullName)
            setUserName(fullName)
          }
          if (agent.id) {
            setUserId(agent.id)
            localStorage.setItem('agent_id', agent.id.toString())
            localStorage.setItem('user_id', agent.id.toString())
          }
          // Resolve avatar image
          const avatarImage = resolveAgentAvatar(
            agent.image || agent.avatar || agent.profile_image,
            agent.id
          )
          setUserImage(avatarImage)
        })
        .catch((error) => {
          console.error('Error fetching agent data in Navbar:', error)
          // If fetch fails but we have stored user ID, try to use it for image resolution
          if (storedUserId) {
            const avatarImage = resolveAgentAvatar(null, parseInt(storedUserId))
            setUserImage(avatarImage)
          }
        })
    } else if (authToken && (role === 'admin' || role === 'broker')) {
      // For admin/broker, try to get user ID from localStorage
      if (storedUserId) {
        setUserId(parseInt(storedUserId))
        // For now, use placeholder for admin/broker until we have their image endpoints
        setUserImage(null)
      }
    }
    
    // Listen for storage changes (in case logout happens in another tab/window)
    const handleStorageChange = () => {
      checkAuthStatus()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Also check on location change (in case navigating from agent pages)
  useEffect(() => {
    checkAuthStatus()
  }, [pathname])

  // Position profile dropdown for portal (so it appears above hero/other content)
  useLayoutEffect(() => {
    if (!showUserMenu || !userMenuRef.current || typeof window === 'undefined') return
    const rect = userMenuRef.current.getBoundingClientRect()
    setUserMenuPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }, [showUserMenu])

  // Close profile dropdown when clicking outside (attach after open so open-click doesn't close)
  useEffect(() => {
    if (!showUserMenu) return
    let cleanup: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const handler = (e: MouseEvent) => {
        const el = e.target as Node
        if (userMenuRef.current?.contains(el) || userDropdownRef.current?.contains(el)) return
        setShowUserMenu(false)
      }
      document.addEventListener('mousedown', handler)
      cleanup = () => document.removeEventListener('mousedown', handler)
    })
    return () => {
      cancelAnimationFrame(rafId)
      cleanup?.()
    }
  }, [showUserMenu])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Render mobile overlay/sidebar portal only after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const handleLoginClick = () => {
    setIsLoginOpen(true)
  }

  const handleRegisterClick = () => {
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('agent_registration_status')
    localStorage.removeItem('agent_registered_email')
    localStorage.removeItem('agent_status')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('agent_name')
    localStorage.removeItem('agent_role')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_role')
    
    // Update state immediately
    setIsUserLoggedIn(false)
    setUserName('User')
    setUserRole('agent')
    setShowUserMenu(false)
    
    // If currently on agent, admin, or broker pages, redirect to home and reload
    if (pathname?.startsWith('/agent') || pathname?.startsWith('/admin') || pathname?.startsWith('/broker')) {
      router.push('/')
      // Small delay to ensure navigation happens before reload
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
    // On public pages, the state update will automatically trigger a re-render
    // showing the login button instead of the profile
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <header className="relative z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 sm:py-4 md:px-10 lg:px-[150px] max-w-full min-w-0 overflow-x-hidden overflow-y-hidden">
          {/* Mobile: toggle + logo side by side. Desktop: logo only in this group */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              className="lg:hidden flex items-center justify-center bg-transparent border-none cursor-pointer text-rental-blue-600 p-2 flex-shrink-0"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <Link
              href="/"
              className={`flex items-center flex-shrink-0 ${isMobileMenuOpen ? 'hidden lg:flex' : ''}`}
            >
              <img
                src={ASSETS.LOGO_HERO_MAIN}
                alt="Rentals.ph logo"
                className="h-10 sm:h-12 md:h-[60px] w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation Centered - lg breakpoint so nav fits without overflow */}
          <div className="hidden lg:flex flex-1 justify-center items-center min-w-0 overflow-hidden">
            <nav className="flex items-center gap-1 xl:gap-2 2xl:gap-6 justify-center w-full min-w-0 px-3 py-1.5 rounded-full bg-white/70 border border-gray-100 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <Link
                href="/"
                className={`font-outfit text-xs lg:text-sm px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  pathname === '/'
                    ? 'text-rental-blue-700 font-semibold'
                    : 'text-rental-blue-700 hover:text-rental-orange-500'
                }`}
                style={{
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: pathname === '/' ? '#205ED7' : 'transparent',
                }}
              >
                HOME
              </Link>
              <Link
                href="/about"
                className={`font-outfit text-xs lg:text-sm px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  pathname === '/about'
                    ? 'text-rental-blue-700 font-semibold'
                    : 'text-rental-blue-700 hover:text-rental-orange-500'
                }`}
                style={{
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: pathname === '/about' ? '#205ED7' : 'transparent',
                }}
              >
                ABOUT US
              </Link>
              <Link
                href="/properties"
                className={`font-outfit text-xs lg:text-sm px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  pathname === '/properties'
                    ? 'text-rental-blue-700 font-semibold'
                    : 'text-rental-blue-700 hover:text-rental-orange-500'
                }`}
                style={{
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: pathname === '/properties' ? '#205ED7' : 'transparent',
                }}
              >
                PROPERTIES
              </Link>
              <Link
                href="/agents"
                className={`font-outfit text-xs lg:text-sm px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  pathname === '/agents'
                    ? 'text-rental-blue-700 font-semibold'
                    : 'text-rental-blue-700 hover:text-rental-orange-500'
                }`}
                style={{
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: pathname === '/agents' ? '#205ED7' : 'transparent',
                }}
              >
                AGENTS
              </Link>
              <Link
                href="/blog"
                className={`font-outfit text-xs lg:text-sm px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  pathname === '/blog'
                    ? 'text-rental-blue-700 font-semibold'
                    : 'text-rental-blue-700 hover:text-rental-orange-500'
                }`}
                style={{
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: pathname === '/blog' ? '#205ED7' : 'transparent',
                }}
              >
                BLOG
              </Link>
              <Link
                href="/news"
                className={`font-outfit text-xs lg:text-sm px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  pathname === '/news'
                    ? 'text-rental-blue-700 font-semibold'
                    : 'text-rental-blue-700 hover:text-rental-orange-500'
                }`}
                style={{
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: pathname === '/news' ? '#205ED7' : 'transparent',
                }}
              >
                NEWS
              </Link>
              <Link
                href="/contact"
                className={`font-outfit text-xs lg:text-sm px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  pathname === '/contact'
                    ? 'text-rental-blue-700 font-semibold'
                    : 'text-rental-blue-700 hover:text-rental-orange-500'
                }`}
                style={{
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: pathname === '/contact' ? '#205ED7' : 'transparent',
                }}
              >
                CONTACT US
              </Link>
            </nav>
          </div>
          {/* User/Profile section */}
          <div className="hidden lg:flex items-center justify-end flex-shrink-0 min-w-0">
            {isUserLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/80 border border-gray-200 hover:bg-gray-100 transition-colors outline-none focus:ring-2 focus:ring-rental-blue-500/30 focus:ring-offset-1"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="Open user menu"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-white shadow-sm">
                    <img
                      src={userImage || ASSETS.PLACEHOLDER_PROFILE}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.style.display = 'none'
                        t.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <span className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                      {getInitials(userName)}
                    </span>
                  </span>
                  <span className="text-sm font-outfit font-medium text-gray-900 max-w-[120px] truncate">
                    {userName}
                  </span>
                  <FiChevronDown
                    className={`flex-shrink-0 text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                    size={18}
                  />
                </button>

                {/* Dropdown in portal so it appears above hero and other content */}
                {showUserMenu && typeof document !== 'undefined' && createPortal(
                  <div
                    ref={userDropdownRef}
                    role="menu"
                    className="fixed min-w-[180px] py-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[10000]"
                    style={{ top: userMenuPosition.top, right: userMenuPosition.right }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] text-gray-800 font-outfit hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push(userRole === 'admin' ? '/admin' : userRole === 'broker' ? '/broker' : '/agent')
                      }}
                    >
                      <FiHome className="text-lg flex-shrink-0 text-gray-600" />
                      <span>Dashboard</span>
                    </button>
                    {userRole === 'agent' && (
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] text-gray-800 font-outfit hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/agent/account')
                        }}
                      >
                        <FiUser className="text-lg flex-shrink-0 text-gray-600" />
                        <span>Account</span>
                      </button>
                    )}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] text-red-600 font-outfit hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <FiLogOut className="text-lg flex-shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            ) : (
              <button
                className="rounded-full border border-rental-blue-600 bg-white/80 text-rental-blue-700 px-3 sm:px-4 h-8 font-outfit text-xs sm:text-sm font-medium cursor-pointer inline-flex items-center justify-center hover:bg-rental-blue-600 hover:text-white transition-all duration-200"
                onClick={handleLoginClick}
              >
                Login / Register
              </button>
            )}
          </div>
        </div>

        {/* Mobile sidebar portaled to body after mount (avoids hydration mismatch) */}
        {isMounted && createPortal(
          <>
            <nav
              ref={mobileMenuRef}
              className={`lg:hidden fixed top-0 left-0 h-screen h-[100dvh] w-[240px] sm:w-[264px] shadow-2xl z-[70] overflow-y-auto transition-transform duration-300 ease-in-out flex flex-col ${
                !isMobileMenuOpen ? 'pointer-events-none' : ''
              }`}
              style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}
              onClick={(e) => e.stopPropagation()}
              aria-hidden={!isMobileMenuOpen}
            >
              {/* Sidebar background: gradient + subtle pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-rental-blue-50 via-white to-rental-orange-50/30" aria-hidden />
              {/* Decorative shapes */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-rental-blue-500/10 blur-2xl" />
                <div className="absolute top-1/3 -left-8 w-24 h-24 rounded-full bg-rental-orange-500/15 blur-xl" />
                <div className="absolute bottom-20 -right-6 w-32 h-32 rounded-full bg-rental-blue-400/10 blur-2xl" />
                {/* Soft diagonal stripe */}
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
                {/* Bottom wave accent */}
                <svg className="absolute bottom-0 left-0 w-full h-24 text-rental-blue-500/20" viewBox="0 0 320 96" fill="currentColor" preserveAspectRatio="none">
                  <path d="M0 96V48c40 24 80 24 120 24s80 0 120-24 80-24 120-24 80 24 120 24v48H0z" />
                </svg>
              </div>

              {/* Content wrapper (relative for stacking) - explicit text color so sidebar doesn't inherit body's text-white */}
              <div className="relative flex flex-col flex-1 min-h-0 text-gray-900">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-rental-blue-200/50">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <img src={ASSETS.LOGO_HERO_MAIN} alt="Rentals.ph" className="h-9 sm:h-10 w-auto" />
                  </Link>
                  <span className="text-xs font-outfit font-semibold uppercase tracking-widest text-rental-blue-600/80">Menu</span>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col flex-1 py-2 px-3 sm:px-4">
                  {[
                    { href: '/', label: 'HOME', icon: FiHome },
                    { href: '/about', label: 'ABOUT US', icon: FiInfo },
                    { href: '/properties', label: 'PROPERTIES', icon: FiLayers },
                    { href: '/agents', label: 'AGENTS', icon: FiUsers },
                    { href: '/blog', label: 'BLOG', icon: FiBook },
                    { href: '/news', label: 'NEWS', icon: FiRss },
                    { href: '/contact', label: 'CONTACT US', icon: FiMail },
                  ].map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`font-outfit text-[14px] sm:text-[15px] px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                          isActive
                            ? 'bg-rental-blue-600 text-white font-bold shadow-md shadow-rental-blue-600/25'
                            : 'text-rental-blue-700 font-medium hover:bg-white/80 hover:text-rental-orange-500 hover:shadow-sm'
                        }`}
                      >
                        <Icon className={`flex-shrink-0 text-lg ${isActive ? 'text-white' : 'text-rental-orange-500/80'}`} aria-hidden />
                        {label}
                      </Link>
                    )
                  })}
                </div>

                {/* User Section */}
                <div className="relative border-t border-rental-blue-200/50 p-4 sm:p-5 bg-white/50 backdrop-blur-sm text-gray-900">
                  {isUserLoggedIn ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 shadow-sm border border-rental-blue-100/50">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rental-blue-500 to-rental-blue-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white shadow-md">
                          <img
                            src={userImage || ASSETS.PLACEHOLDER_PROFILE}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(userName)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-semibold text-gray-900 font-outfit truncate">{userName}</span>
                          <span className="text-xs text-rental-blue-600 font-outfit">
                            {userRole === 'admin' ? 'Admin' : userRole === 'broker' ? 'Broker' : 'Agent'}
                          </span>
                        </div>
                      </div>
                      <button
                        className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm text-gray-800 font-outfit transition-all hover:bg-rental-blue-600 hover:text-white hover:shadow-md"
                        onClick={() => {
                          router.push(userRole === 'admin' ? '/admin' : userRole === 'broker' ? '/broker' : '/agent')
                          setMobileMenuOpen(false)
                        }}
                      >
                        <FiHome className="text-lg flex-shrink-0" />
                        <span>Dashboard</span>
                      </button>
                      {userRole === 'agent' && (
                        <button
                          className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm text-gray-800 font-outfit transition-all hover:bg-rental-blue-600 hover:text-white hover:shadow-md"
                          onClick={() => {
                            router.push('/agent/account')
                            setMobileMenuOpen(false)
                          }}
                        >
                          <FiUser className="text-lg flex-shrink-0" />
                          <span>Account</span>
                        </button>
                      )}
                      <button
                        className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm text-red-600 font-outfit transition-all hover:bg-red-500 hover:text-white hover:shadow-md"
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <FiLogOut className="text-lg flex-shrink-0" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <button
                        className="w-full rounded-xl py-3.5 font-outfit text-sm font-semibold cursor-pointer inline-flex items-center justify-center bg-gradient-to-r from-rental-blue-600 to-rental-blue-500 text-gray-900 shadow-lg shadow-rental-blue-600/30 hover:shadow-xl hover:from-rental-blue-500 hover:to-rental-blue-600 active:scale-[0.98] transition-all duration-200"
                        onClick={() => {
                          handleLoginClick()
                          setMobileMenuOpen(false)
                        }}
                      >
                        Login / Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </nav>
          </>,
          document.body
        )}
      </header>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onRegisterClick={handleRegisterClick}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onLoginClick={handleLoginClick}
      />
    </>
  )
}

export default Navbar

