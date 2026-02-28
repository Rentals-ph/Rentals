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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-[90%] max-w-[1000px] max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-[0px_10px_40px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
        <button 
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center border-0 bg-transparent text-2xl leading-none text-black transition-colors hover:text-gray-700" 
          onClick={onClose}
        >
          ✕
        </button>
        <div className="flex min-h-[580px]">
          {/* Left Side - Background and Branding */}
          <div className="relative flex flex-1 items-center justify-center bg-gradient-to-b from-[#B8D4F1] to-[#89B5E3] p-10 px-7.5 md:p-10 md:px-5" style={{ padding: 0, position: 'relative' }}>
            <img
              src={ASSETS.BG_LOGIN}
              alt="Login Background"
              className="absolute inset-0 z-0 h-full w-full rounded-l-2xl object-cover"
            />
            <div className="relative z-10 max-w-[450px] text-center">
              <img
                src={ASSETS.LOGO_FOOTER_WHITE}
                alt="Rentals.ph Logo White"
                className="mx-auto mb-6 h-auto w-full max-w-[420px]"
                style={{ marginBottom: '24px', width: '320px', height: 'auto' }}
              />
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="relative flex max-w-[500px] flex-1 flex-col justify-center rounded-r-2xl border-l-[1.5px] border-gray-200 bg-white/95 px-12 py-15 shadow-[0_4px_32px_rgba(32,94,215,0.08)] md:px-7.5 md:py-10">
            <h2 className="text-center font-outfit text-4xl font-bold text-rental-orange-500 mb-8 md:text-4xl">
              LOGIN
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Error Message */}
              {loginError && (
                <div className="rounded border border-red-300 bg-rental-orange-50 px-4 py-5 font-outfit text-sm text-rental-orange-500">
                  {loginError}
                </div>
              )}
              
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-outfit text-sm font-medium text-gray-900">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-2 focus:ring-rental-blue-600/20"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="font-outfit text-sm font-medium text-gray-900">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 pr-12 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-2 focus:ring-rental-blue-600/20"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 cursor-pointer border-0 bg-transparent p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3L21 21M10.5 10.5C10.1872 10.8128 10 11.2403 10 11.7C10 12.7046 10.7954 13.5 11.8 13.5C12.2597 13.5 12.6872 13.3128 13 13M6.6 6.6C4.6146 8.0732 3 10.2727 3 12C3 15.314 6.9 19 12 19C13.7273 19 15.9268 18.3854 17.4 16.4M9 5.2C9.9585 4.9 11.0015 4.8 12 4.8C17.1 4.8 21 8.486 21 11.8C21 12.7985 20.1 14.841 19.2 16" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-rental-blue-600"
                />
                <label htmlFor="remember" className="cursor-pointer select-none font-outfit text-sm font-normal text-gray-900">
                  Remember me
                </label>
              </div>

              {/* Login Button with Gradient */}
              <button 
                type="submit" 
                className="mt-2 cursor-pointer rounded-lg border-0 px-4 py-3.5 font-outfit text-base font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60" 
                style={{
                  background: 'linear-gradient(to right, #2563EB 0%, #FE8E0A 100%)'
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Social Login */}
            <div className="mt-8 text-center">
              <p className="mb-4 font-outfit text-sm text-gray-700">or login using</p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  className="w-12 h-12 rounded-full bg-rental-orange-500 flex items-center justify-center text-white hover:bg-rental-orange-600 transition-colors"
                  aria-label="Login with Facebook"
                >
                  <span className="text-xl font-bold">f</span>
                </button>
                <button
                  type="button"
                  className="w-12 h-12 rounded-full bg-rental-orange-500 flex items-center justify-center text-white hover:bg-rental-orange-600 transition-colors"
                  aria-label="Login with Google"
                >
                  <span className="text-xl font-bold">G</span>
                </button>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="mb-2 font-outfit text-sm text-gray-700">
                Don't have an account?
              </p>
              <button 
                className="cursor-pointer border-0 bg-transparent p-0 font-outfit text-sm font-semibold text-rental-orange-500 hover:text-rental-orange-600" 
                onClick={onRegisterClick}
              >
                Register as Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
