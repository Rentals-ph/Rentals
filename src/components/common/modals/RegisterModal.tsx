import React, { useState, useEffect } from 'react'
import { authApi } from '@/api'
import { ASSETS } from '@/utils/assets'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick?: () => void
}

function RegisterModal({ isOpen, onClose, onLoginClick }: RegisterModalProps) {
  const [role, setRole] = useState<'user' | 'agent' | 'broker'>('agent')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)

  // Check verification status when email changes
  useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setIsEmailVerified(false)
      setVerificationSent(false)
      return
    }

    // Normalize email for consistent lookup
    const normalizedEmail = email.toLowerCase().trim()

    // Check localStorage first (set by verify-email page)
    const localVerified = localStorage.getItem(`verified_email_${normalizedEmail}`)
    if (localVerified === 'true') {
      setIsEmailVerified(true)
      return
    }

    // Poll server for verification status
    const checkVerification = async () => {
      try {
        const response = await authApi.checkVerificationStatus(normalizedEmail)
        if (response.success && response.verified) {
          setIsEmailVerified(true)
          localStorage.setItem(`verified_email_${normalizedEmail}`, 'true')
        } else {
          setIsEmailVerified(false)
        }
      } catch (error) {
        // Silently fail - user can still try to verify
        setIsEmailVerified(false)
      }
    }

    checkVerification()
    
    // Poll every 2 seconds if not verified (faster polling)
    const interval = setInterval(() => {
      if (!isEmailVerified) {
        checkVerification()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [email, isEmailVerified])

  // Listen for email verification events (from verify-email page)
  useEffect(() => {
    const handleEmailVerified = (event: CustomEvent) => {
      const verifiedEmail = event.detail?.email
      if (verifiedEmail && email.toLowerCase().trim() === verifiedEmail) {
        setIsEmailVerified(true)
        localStorage.setItem(`verified_email_${verifiedEmail}`, 'true')
      }
    }

    window.addEventListener('emailVerified', handleEmailVerified as EventListener)
    return () => {
      window.removeEventListener('emailVerified', handleEmailVerified as EventListener)
    }
  }, [email])

  if (!isOpen) return null

  const handleSendVerification = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setVerificationError('Please enter a valid email address first')
      return
    }

    setIsSendingVerification(true)
    setVerificationError(null)

    try {
      const response = await authApi.sendVerificationEmail(email)
      if (response.success) {
        setVerificationSent(true)
        setVerificationError(null)
      } else {
        setVerificationError(response.message || 'Failed to send verification email')
      }
    } catch (error: any) {
      console.error('Send verification error:', error)
      if (error.response?.data?.message) {
        setVerificationError(error.response.data.message)
      } else {
        setVerificationError('Failed to send verification email. Please try again.')
      }
    } finally {
      setIsSendingVerification(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      // Validate fields
      if (!name.trim()) {
        setSubmitError('Please enter your name')
        setIsSubmitting(false)
        return
      }

      if (!email.trim()) {
        setSubmitError('Please enter your Email Account')
        setIsSubmitting(false)
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setSubmitError('Please enter a valid email address')
        setIsSubmitting(false)
        return
      }

      if (!password || password.length < 8) {
        setSubmitError('Password must be at least 8 characters')
        setIsSubmitting(false)
        return
      }

      if (password !== confirmPassword) {
        setSubmitError('Passwords do not match')
        setIsSubmitting(false)
        return
      }

      // Check if email is verified
      if (!isEmailVerified) {
        setSubmitError('Please verify your email address before registering')
        setIsSubmitting(false)
        return
      }

      // Map 'user' role to 'agent' for backend compatibility
      const backendRole = role === 'user' ? 'agent' : role

      const response = await authApi.register({
        email: email.trim(),
        password,
        name: name.trim(),
        role: backendRole,
      })

      if (response.success) {
        setSubmitSuccess(true)
        // Close register modal and open login modal after a short delay
        setTimeout(() => {
          onClose()
          if (onLoginClick) {
            onLoginClick()
          }
        }, 1500)
      } else {
        setSubmitError(response.message || 'Registration failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      console.error('Error response:', error.response?.data)
      
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat().join(', ')
        setSubmitError(errorMessages)
      } else if (error.response?.data?.message) {
        setSubmitError(error.response.data.message)
      } else if (error.message) {
        setSubmitError(error.message)
      } else {
        setSubmitError('Registration failed. Please try again.')
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
              alt="Register Background"
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
              Register
            </h2>

            {/* Role Selection Tabs */}
            <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  role === 'user'
                    ? 'bg-rental-orange-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-700'
                }`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setRole('agent')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  role === 'agent'
                    ? 'bg-rental-orange-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-700'
                }`}
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => setRole('broker')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  role === 'broker'
                    ? 'bg-rental-orange-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-700'
                }`}
              >
                Broker
              </button>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-5 rounded border border-green-300 bg-green-100 px-4 py-3 font-outfit text-sm text-green-900">
                Registration successful! You can now login.
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-5  rounded border border-red-300 bg-rental-orange-50 px-4 py-5 font-outfit text-sm text-rental-orange-500">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name Field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="font-outfit text-sm font-medium text-gray-900">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-2 focus:ring-rental-blue-600/20"
                />
              </div>

              {/* Email Field with Verify Button */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-outfit text-sm font-medium text-gray-900">
                  Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setVerificationSent(false)
                      setIsEmailVerified(false)
                      setVerificationError(null)
                    }}
                    required
                    disabled={isSubmitting}
                    className={`flex-1 rounded-lg border py-3 px-4 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      isEmailVerified
                        ? 'border-green-500 bg-green-50 focus:border-green-600 focus:ring-green-600/20'
                        : 'border-gray-300 bg-white focus:border-rental-blue-600 focus:ring-rental-blue-600/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={isSendingVerification || isEmailVerified || isSubmitting || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                    className={`rounded-lg px-6 py-3 font-outfit text-sm font-medium transition-colors ${
                      isEmailVerified
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-rental-blue-600 text-white hover:bg-rental-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isEmailVerified ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    ) : isSendingVerification ? (
                      'Sending...'
                    ) : (
                      'Verify email'
                    )}
                  </button>
                </div>
                {verificationSent && !isEmailVerified && (
                  <p className="text-xs text-gray-600 mt-1">
                    Verification email sent! Please check your inbox and click the verification link.
                  </p>
                )}
                {verificationError && (
                  <p className="text-xs text-red-600 mt-1">{verificationError}</p>
                )}
                {isEmailVerified && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Email verified! You can now proceed with registration.
                  </p>
                )}
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
                    minLength={8}
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

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="font-outfit text-sm font-medium text-gray-900">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="Enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    minLength={8}
                    className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 pr-12 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-2 focus:ring-rental-blue-600/20"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 cursor-pointer border-0 bg-transparent p-1"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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

              {/* Register Button with Gradient */}
              <button 
                type="submit" 
                className="mt-2 cursor-pointer rounded-lg border-0 px-4 py-3.5 font-outfit text-base font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60" 
                style={{
                  background: 'linear-gradient(to right, #2563EB 0%, #FE8E0A 100%)'
                }}
                disabled={isSubmitting || !isEmailVerified}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
              {!isEmailVerified && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Please verify your email address to continue with registration.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterModal
