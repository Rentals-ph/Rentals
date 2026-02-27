'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FiUser, FiLogOut, FiChevronDown, FiHome, FiMenu, FiX } from 'react-icons/fi'
import { ASSETS } from '@/utils/assets'
import { agentsApi } from '@/api'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import LoginModal from '../common/LoginModal'
import RegisterModal from '../common/RegisterModal'

const Navbar = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
    setIsMobileMenuOpen(false)
  }, [pathname])

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
      <header className="relative z-50 bg-white shadow-md overflow-x-hidden overflow-y-hidden">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 sm:py-5 md:px-10 lg:px-[150px] max-w-full min-w-0 overflow-x-hidden overflow-y-hidden">
          {/* Mobile: toggle + logo side by side. Desktop: logo only in this group */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              className="lg:hidden flex items-center justify-center bg-transparent border-none cursor-pointer text-rental-blue-600 p-2 flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <Link href="/" className="flex items-center flex-shrink-0">
              <img
                src={ASSETS.LOGO_HERO_MAIN}
                alt="Rentals.ph logo"
                className="h-10 sm:h-12 md:h-[60px] w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation Centered - lg breakpoint so nav fits without overflow */}
          <div className="hidden lg:flex flex-1 justify-center items-center min-w-0 overflow-hidden">
            <nav className="flex items-center gap-0 xl:gap-2 2xl:gap-8 justify-center w-full min-w-0">
              <Link href="/" className={`text-rental-blue-600 font-outfit text-sm lg:text-sm md:px-1 xl:px-0.5 whitespace-nowrap transition-colors hover:text-rental-orange-500 ${pathname === '/' ? 'font-extrabold tracking-[0.15em]' : 'font-normal'}`}>
                HOME
              </Link>
              <Link href="/about" className={`text-rental-blue-600 font-outfit text-sm lg:text-sm md:px-1 xl:px-0.5 whitespace-nowrap transition-colors hover:text-rental-orange-500 ${pathname === '/about' ? 'font-extrabold tracking-[0.15em]' : 'font-normal'}`}>
                ABOUT US
              </Link>
              <Link href="/properties" className={`text-rental-blue-600 font-outfit text-sm lg:text-sm md:px-1 xl:px-0.5 whitespace-nowrap transition-colors hover:text-rental-orange-500 ${pathname === '/properties' ? 'font-extrabold tracking-[0.15em]' : 'font-normal'}`}>
                PROPERTIES
              </Link>
              <Link href="/rent-managers" className={`text-rental-blue-600 font-outfit text-sm lg:text-sm md:px-1 xl:px-0.5 whitespace-nowrap transition-colors hover:text-rental-orange-500 ${pathname === '/rent-managers' ? 'font-extrabold tracking-[0.15em]' : 'font-normal'}`}>
                BROKERS/AGENTS
              </Link>
              <Link href="/blog" className={`text-rental-blue-600 font-outfit text-sm lg:text-sm md:px-1 xl:px-0.5 whitespace-nowrap transition-colors hover:text-rental-orange-500 ${pathname === '/blog' ? 'font-extrabold tracking-[0.15em]' : 'font-normal'}`}>
                BLOG  
              </Link>
              <Link href="/news" className={`text-rental-blue-600 font-outfit text-sm lg:text-sm md:px-1 xl:px-0.5 whitespace-nowrap transition-colors hover:text-rental-orange-500 ${pathname === '/news' ? 'font-extrabold tracking-[0.15em]' : 'font-normal'}`}>
                NEWS
              </Link>
              <Link href="/contact" className={`text-rental-blue-600 font-outfit text-sm lg:text-sm md:px-1 xl:px-0.5 whitespace-nowrap transition-colors hover:text-rental-orange-500 ${pathname === '/contact' ? 'font-extrabold tracking-[0.15em]' : 'font-normal'}`}>
                CONTACT US
              </Link>
            </nav>
          </div>
          {/* User/Profile section */}
          <div className="hidden lg:flex items-center justify-end flex-shrink-0 min-w-0 rounded-full"
            style={{
              border: '2px solid #205ED7',
          }}
          >
            {isUserLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-full border border-transparent hover:bg-gray-100 hover:border-gray-200 transition-colors outline-none focus:ring-2 focus:ring-rental-blue-500/30 focus:ring-offset-1"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="Open user menu"
                >
                  <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
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
                  <span className="flex flex-col items-start justify-center text-left min-w-0 max-w-[140px]">
                    <span className="text-[15px] font-semibold text-gray-900 font-outfit truncate w-full">{userName}</span>
                    <span className="text-[13px] text-gray-500 font-outfit truncate w-full">
                      {userRole === 'admin' ? 'Admin' : userRole === 'broker' ? 'Broker' : 'Agent'}
                    </span>
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
              <button className="rounded-full !border-2 !border-rental-orange-500 bg-transparent text-rental-orange-500 px-3 sm:px-5 h-8 sm:h-10 font-outfit text-xs sm:text-sm md:text-sm font-medium cursor-pointer inline-flex items-center justify-center hover:bg-rental-orange-500 hover:text-white active:scale-95 transition-all duration-200" onClick={handleLoginClick}>
                <span className="hidden sm:inline">Login / Register</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar - Left Positioned */}
        <nav 
          ref={mobileMenuRef}
          className={`lg:hidden fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-white shadow-2xl z-[70] overflow-y-auto ${
            isMobileMenuOpen ? '' : 'hidden'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-rental-blue-600 font-outfit">Menu</h2>
            <button 
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer relative z-10"
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileMenuOpen(false)
              }}
              aria-label="Close menu"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col">
            <Link 
              href="/" 
              className={`text-rental-blue-600 font-outfit text-[15px] px-6 py-4 border-b border-gray-100 block transition-colors hover:text-rental-orange-500 hover:bg-gray-50 ${pathname === '/' ? 'font-extrabold tracking-[0.15em] bg-gray-50' : 'font-normal'}`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              HOME
            </Link>
            <Link 
              href="/about" 
              className={`text-rental-blue-600 font-outfit text-[15px] px-6 py-4 border-b border-gray-100 block transition-colors hover:text-rental-orange-500 hover:bg-gray-50 ${pathname === '/about' ? 'font-extrabold tracking-[0.15em] bg-gray-50' : 'font-normal'}`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ABOUT US
            </Link>
            <Link 
              href="/properties" 
              className={`text-rental-blue-600 font-outfit text-[15px] px-6 py-4 border-b border-gray-100 block transition-colors hover:text-rental-orange-500 hover:bg-gray-50 ${pathname === '/properties' ? 'font-extrabold tracking-[0.15em] bg-gray-50' : 'font-normal'}`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              PROPERTIES
            </Link>
            <Link 
              href="/rent-managers" 
              className={`text-rental-blue-600 font-outfit text-[15px] px-6 py-4 border-b border-gray-100 block transition-colors hover:text-rental-orange-500 hover:bg-gray-50 ${pathname === '/rent-managers' ? 'font-extrabold tracking-[0.15em] bg-gray-50' : 'font-normal'}`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              RENT MANAGERS
            </Link>
            <Link 
              href="/blog" 
              className={`text-rental-blue-600 font-outfit text-[15px] px-6 py-4 border-b border-gray-100 block transition-colors hover:text-rental-orange-500 hover:bg-gray-50 ${pathname === '/blog' ? 'font-extrabold tracking-[0.15em] bg-gray-50' : 'font-normal'}`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              BLOG
            </Link>
            <Link 
              href="/news" 
              className={`text-rental-blue-600 font-outfit text-[15px] px-6 py-4 border-b border-gray-100 block transition-colors hover:text-rental-orange-500 hover:bg-gray-50 ${pathname === '/news' ? 'font-extrabold tracking-[0.15em] bg-gray-50' : 'font-normal'}`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              NEWS
            </Link>
            <Link 
              href="/contact" 
              className={`text-rental-blue-600 font-outfit text-[15px] px-6 py-4 border-b border-gray-100 block transition-colors hover:text-rental-orange-500 hover:bg-gray-50 ${pathname === '/contact' ? 'font-extrabold tracking-[0.15em] bg-gray-50' : 'font-normal'}`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              CONTACT US
            </Link>
          </div>

          {/* User Section */}
          {isUserLoggedIn ? (
            <div className="px-6 py-5 border-t border-gray-200 flex flex-col gap-3 mt-auto">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img 
                    src={userImage || ASSETS.PLACEHOLDER_PROFILE} 
                    alt={userName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }} 
                  />
                  <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-[15px]">
                    {getInitials(userName)}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[13px] sm:text-[15px] font-semibold text-gray-900 font-outfit truncate">{userName}</span>
                  <span className="text-[11px] sm:text-[15px] text-gray-500 font-outfit">
                    {userRole === 'admin' ? 'Admin' : userRole === 'broker' ? 'Broker' : 'Agent'}
                  </span>
                </div>
              </div>
              <button 
                className="flex items-center gap-3 py-3 bg-transparent border-none text-left cursor-pointer text-[13px] sm:text-[15px] text-gray-900 font-outfit transition-colors hover:text-rental-blue-600 hover:bg-gray-50 rounded-lg px-2" 
                onClick={() => {
                  router.push(userRole === 'admin' ? '/admin' : userRole === 'broker' ? '/broker' : '/agent')
                  setIsMobileMenuOpen(false)
                }}
              >
                <FiHome className="text-lg flex-shrink-0" />
                <span>Dashboard</span>
              </button>
              {userRole === 'agent' && (
                <button 
                  className="flex items-center gap-3 py-3 bg-transparent border-none text-left cursor-pointer text-[13px] sm:text-[15px] text-gray-900 font-outfit transition-colors hover:text-rental-blue-600 hover:bg-gray-50 rounded-lg px-2" 
                  onClick={() => {
                    router.push('/agent/account')
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <FiUser className="text-lg flex-shrink-0" />
                  <span>Account</span>
                </button>
              )}
              <button 
                className="flex items-center gap-3 py-3 bg-transparent border-none text-left cursor-pointer text-[13px] sm:text-[15px] text-red-600 font-outfit transition-colors hover:text-red-700 hover:bg-red-50 rounded-lg px-2" 
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
              >
                <FiLogOut className="text-lg flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="px-6 py-5 border-t border-gray-200 mt-auto">
              <button 
                className="w-full rounded-full !border-2 !border-rental-orange-500 bg-transparent text-rental-orange-500 px-5 h-12 font-outfit text-[13px] sm:text-[15px] font-medium cursor-pointer inline-flex items-center justify-center hover:bg-rental-orange-500 hover:text-white active:scale-95 transition-all duration-200" 
                onClick={() => {
                  handleLoginClick()
                  setIsMobileMenuOpen(false)
                }}
              >
                Login/Register
              </button>
            </div>
          )}
        </nav>
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

