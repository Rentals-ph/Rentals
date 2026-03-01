import { useState } from 'react'
import { authApi } from '@/api'
import { ASSETS } from '@/utils/assets'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onRegisterClick: () => void
}

function LoginModal({ isOpen, onClose, onRegisterClick }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setLoginError(null)

    try {
      // Use unified login endpoint (handles both agents and admins)
      const response = await authApi.login({
        email,
        password,
        remember: rememberMe,
      })

      if (response.success && response.data?.token) {
        // Clear old localStorage data first to avoid stale data
        localStorage.removeItem('agent_name')
        localStorage.removeItem('user_name')
        localStorage.removeItem('agent_id')
        localStorage.removeItem('user_email')
        
        // Store token and proceed with login
        localStorage.setItem('auth_token', response.data.token)
        
        // Determine if user is admin or agent from response
        const isAdmin = !!response.data?.admin || response.data?.role === 'admin'
        const userData = isAdmin ? response.data?.admin : (response.data?.agent || response.data?.user)
        
        console.log('Login response userData:', userData) // Debug log
        
        // Store user name if available (construct from first_name and last_name)
        const userName = userData?.first_name && userData?.last_name 
          ? `${userData.first_name} ${userData.last_name}` 
          : (userData?.email ? userData.email.split('@')[0] : null)
        
        if (userName) {
          localStorage.setItem('agent_name', userName)
          localStorage.setItem('user_name', userName) // Also store as generic user_name
          console.log('Stored userName:', userName) // Debug log
        }
        
        // Store agent ID if available
        if (userData?.id && !isAdmin) {
          localStorage.setItem('agent_id', userData.id.toString())
          console.log('Stored agent_id:', userData.id) // Debug log
        }
        
        // Store email for reference
        if (userData?.email) {
          localStorage.setItem('user_email', userData.email)
          console.log('Stored user_email:', userData.email) // Debug log
        }
        
        // Store user role (admin or agent)
        const userRole = response.data?.role || (isAdmin ? 'admin' : 'agent')
        localStorage.setItem('agent_role', userRole)
        localStorage.setItem('user_role', userRole) // Also store as generic user_role
        
        // Check if account status is pending and store it (only for agents)
        if (userRole === 'agent' && !isAdmin) {
          // Access agent data directly since we know it's an agent
          const agentData = response.data?.agent
          const agentStatus = agentData?.status
          
          // Valid statuses are: 'pending' | 'approved' | 'rejected' | null
          if (agentStatus === 'pending') {
            localStorage.setItem('agent_registration_status', 'processing')
            localStorage.setItem('agent_registered_email', email)
            localStorage.setItem('agent_status', agentStatus)
          } else {
            // Clear processing status if account is approved or rejected
            localStorage.removeItem('agent_registration_status')
            localStorage.removeItem('agent_registered_email')
            localStorage.setItem('agent_status', agentStatus || 'active')
          }
        }
        
        onClose()
        // Redirect based on role
        if (userRole === 'admin') {
          window.location.href = '/admin'
        } else if (userRole === 'broker') {
          window.location.href = '/broker'
        } else {
          window.location.href = '/agent'
        }
      } else {
        setLoginError(response.message || 'Login failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error.response?.data?.message) {
        setLoginError(error.response.data.message)
      } else if (error.message) {
        setLoginError(error.message)
      } else {
        setLoginError('Invalid email or password. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 md:p-5" onClick={onClose}>
      <div className="relative w-full max-w-[860px] h-auto min-h-[320px] max-h-[90dvh] md:h-[540px] md:max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-[0px_10px_40px_rgba(0,0,0,0.2)] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-1 min-h-0 p-3 sm:p-4 md:p-5 flex-col md:flex-row">
          {/* Left Side - Branding with gradient/wavy background (hidden on small screens; mobile shows strip below) */}
          <div className="relative hidden h-full min-h-0 flex-1 overflow-hidden rounded-t-2xl min-w-0 md:block md:rounded-l-2xl md:rounded-tr-none">
            <img
              src={ASSETS.BG_LOGIN_MODAL_LEFT}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="relative z-10 flex h-full flex-col px-6 pt-6 md:px-8 md:pt-8 pb-0">
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={ASSETS.LOGO_FOOTER_WHITE}
                  alt="Rentals.ph"
                  className="h-auto w-[180px] max-w-full md:w-[220px]"
                />
              </div>
              <div className="w-full bg-gradient-to-t from-black/75 via-black/20 to-transparent  py-4 text-left  md:py-5">
                <h3 className="font-outfit text-base font-bold text-white md:text-lg">Rentals Assist</h3>
                <p className="mt-1 font-outfit text-xs leading-relaxed text-white md:text-sm">
                  Manage listings with AI-driven precision connecting property owners to the right tenants through smarter technology.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="relative flex h-full min-h-0 flex-1 flex-col justify-center overflow-y-auto rounded-b-2xl bg-white px-4 py-4 sm:px-6 sm:py-6 md:rounded-r-2xl md:rounded-bl-none md:px-8 md:py-6">
            {/* Close: desktop only (absolute); on mobile it sits in the branding row) */}
            <button
              type="button"
              className="absolute right-2 top-2 z-10 hidden h-8 w-8 items-center justify-center rounded border-0 bg-transparent text-lg text-black transition-colors hover:text-gray-600 md:right-4 md:top-4 md:flex md:h-9 md:w-9 md:text-xl touch-manipulation"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
            {/* Mobile: 2-column row — branding strip | close icon */}
            <div className="mb-3 flex md:hidden rounded-lg overflow-hidden bg-gradient-to-br from-[#2C2E53] to-[#FF7B25]">
              <div className="relative flex flex-1 min-w-0 py-3">
                <img
                  src={ASSETS.BG_LOGIN_MODAL_LEFT}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <img src={ASSETS.LOGO_FOOTER_WHITE} alt="Rentals.ph" className="h-7 w-auto" />
                </div>
              </div>
              <button
                type="button"
                 className="flex h-10 w-12 shrink-0 items-center text-lg justify-center border-0 bg-transparent text-rental-orange-500 transition-colors hover:bg-white/10 touch-manipulation"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <h2 className="text-center font-outfit text-xl font-bold uppercase tracking-wide text-rental-orange-500 sm:text-2xl md:text-3xl">
              Login
            </h2>
            <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-2 sm:gap-2.5">
              {/* Error Message */}
              {loginError && (
                <div className="rounded border border-red-300 bg-rental-orange-50 px-3 py-2 font-outfit text-xs text-rental-orange-500">
                  {loginError}
                </div>
              )}
              
              {/* Email Field */}
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-outfit text-xs font-medium text-gray-900">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-1 focus:ring-rental-blue-600/20"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="font-outfit text-xs font-medium text-gray-900">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 pr-9 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-1 focus:ring-rental-blue-600/20"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 cursor-pointer border-0 bg-transparent p-0.5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3L21 21M10.5 10.5C10.1872 10.8128 10 11.2403 10 11.7C10 12.7046 10.7954 13.5 11.8 13.5C12.2597 13.5 12.6872 13.3128 13 13M6.6 6.6C4.6146 8.0732 3 10.2727 3 12C3 15.314 6.9 19 12 19C13.7273 19 15.9268 18.3854 17.4 16.4M9 5.2C9.9585 4.9 11.0015 4.8 12 4.8C17.1 4.8 21 8.486 21 11.8C21 12.7985 20.1 14.841 19.2 16" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer accent-rental-orange-500"
                  />
                  <label htmlFor="remember" className="cursor-pointer select-none font-outfit text-xs font-normal text-gray-900">Remember me</label>
                </div>
                <a href="/forgot-password" className="font-outfit text-xs font-medium text-rental-orange-500 hover:text-rental-orange-600">Forgot Password</a>
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                className="mt-1 cursor-pointer rounded-md border-0 px-3 py-3 sm:py-2.5 font-outfit text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation" 
                style={{ background: 'linear-gradient(to right, #2563EB 0%, #FE8E0A 100%)' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Social Login */}
            <div className="mt-3 sm:mt-4 text-center">
              <p className="mb-2 font-outfit text-xs text-gray-600">or login using</p>
              <div className="flex justify-center gap-3">
                <button type="button" className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-rental-orange-500 flex items-center justify-center text-white hover:bg-rental-orange-600 transition-colors touch-manipulation" aria-label="Login with Facebook">
                  <span className="text-base font-bold">f</span>
                </button>
                <button type="button" className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-rental-orange-500 flex items-center justify-center text-white hover:bg-rental-orange-600 transition-colors touch-manipulation" aria-label="Login with Google">
                  <span className="text-base font-bold">G</span>
                </button>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-3 text-center pb-1 md:pb-0">
              <p className="font-outfit text-xs text-gray-700">
                Don&apos;t have an account?{' '}
                <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-outfit text-xs font-semibold text-rental-orange-500 hover:text-rental-orange-600" onClick={onRegisterClick}>
                  Register
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
