import React, { useState, useEffect } from 'react'
import { authApi } from '@/api'
import { ASSETS } from '@/utils/assets'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick?: () => void
}

function RegisterModal({ isOpen, onClose, onLoginClick }: RegisterModalProps) {
  // Only brokers can self-register; agents are created by brokers
  const role = 'broker' as const
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

      const response = await authApi.register({
        email: email.trim(),
        password,
        name: name.trim(),
        role: 'broker',
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 md:p-5" onClick={onClose}>
      <div className="relative w-full max-w-[960px] h-auto min-h-[320px] max-h-[90dvh] md:h-[540px] md:max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-[0px_10px_40px_rgba(0,0,0,0.2)] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-1 min-h-0 p-3 sm:p-4 md:p-5 flex-col md:flex-row">
          {/* Left Side - Branding with gradient/wavy background */}
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
              <div className="w-full bg-gradient-to-t from-black/75 via-black/20 to-transparent py-4 text-left md:py-5">
                <h3 className="font-outfit text-base font-bold text-white md:text-lg">Rentals Assist</h3>
                <p className="mt-1 font-outfit text-xs leading-relaxed text-white md:text-sm">
                  Manage listings with AI-driven precision connecting property owners to the right tenants through smarter technology.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form (scrollable content only) */}
          <div className="relative flex h-full min-h-0 flex-1 flex-col rounded-b-2xl bg-white md:rounded-r-2xl md:rounded-bl-none">
            {/* Close: desktop only (absolute); on mobile it sits in the branding row) */}
            <button
              type="button"
              className="absolute right-2 top-2 z-10 hidden h-8 w-8 items-center justify-center rounded border-0 bg-transparent text-lg text-black transition-colors hover:text-gray-600 md:right-3 md:top-3 md:flex touch-manipulation"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-6">
            {/* Mobile: 2-column row — branding strip | close icon */}
            <div className="mb-3 flex md:hidden rounded-lg overflow-hidden bg-gradient-to-br from-[#2C2E53] to-[#FF7B25]">
              <div className="relative flex flex-1 min-w-0 py-3">
                <img src={ASSETS.BG_LOGIN_MODAL_LEFT} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
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
              Register
            </h2>

            <p className="my-2 text-center text-xs text-gray-600">Register as a broker to manage your team and listings.</p>

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-2 rounded border border-green-300 bg-green-100 px-3 py-2 font-outfit text-xs text-green-900">
                Registration successful! You can now login.
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-2 rounded border border-red-300 bg-rental-orange-50 px-3 py-2 font-outfit text-xs text-rental-orange-500">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              {/* Name Field */}
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="font-outfit text-xs font-medium text-gray-900">Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-1 focus:ring-rental-blue-600/20"
                />
              </div>

              {/* Email Field with Verify Button */}
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-outfit text-xs font-medium text-gray-900">Email</label>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-1.5">
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
                    className={`flex-1 min-w-0 rounded-md border py-2 px-3 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
                      isEmailVerified ? 'border-green-500 bg-green-50 focus:border-green-600 focus:ring-green-600/20' : 'border-gray-300 bg-white focus:border-rental-blue-600 focus:ring-rental-blue-600/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={isSendingVerification || isEmailVerified || isSubmitting || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                    className={`shrink-0 rounded-md px-3 py-2.5 sm:py-2 font-outfit text-xs font-medium transition-colors touch-manipulation ${
                      isEmailVerified ? 'bg-green-600 text-white cursor-default' : 'bg-rental-blue-600 text-white hover:bg-rental-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isEmailVerified ? (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Verified
                      </span>
                    ) : isSendingVerification ? 'Sending...' : 'Verify'}
                  </button>
                </div>
                {verificationSent && !isEmailVerified && <p className="text-[10px] text-gray-600 mt-0.5">Verification email sent. Check your inbox.</p>}
                {verificationError && <p className="text-[10px] text-red-600 mt-0.5">{verificationError}</p>}
                {isEmailVerified && <p className="text-[10px] text-green-600 mt-0.5">✓ Email verified.</p>}
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
                    minLength={8}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 pr-9 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-1 focus:ring-rental-blue-600/20"
                  />
                  <button type="button" className="absolute right-2 top-2 cursor-pointer border-0 bg-transparent p-0.5" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L21 21M10.5 10.5C10.1872 10.8128 10 11.2403 10 11.7C10 12.7046 10.7954 13.5 11.8 13.5C12.2597 13.5 12.6872 13.3128 13 13M6.6 6.6C4.6146 8.0732 3 10.2727 3 12C3 15.314 6.9 19 12 19C13.7273 19 15.9268 18.3854 17.4 16.4M9 5.2C9.9585 4.9 11.0015 4.8 12 4.8C17.1 4.8 21 8.486 21 11.8C21 12.7985 20.1 14.841 19.2 16" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-1">
                <label htmlFor="confirmPassword" className="font-outfit text-xs font-medium text-gray-900">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    minLength={8}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 pr-9 font-outfit text-sm text-gray-900 placeholder-gray-400 focus:border-rental-blue-600 focus:outline-none focus:ring-1 focus:ring-rental-blue-600/20"
                  />
                  <button type="button" className="absolute right-2 top-2 cursor-pointer border-0 bg-transparent p-0.5" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L21 21M10.5 10.5C10.1872 10.8128 10 11.2403 10 11.7C10 12.7046 10.7954 13.5 11.8 13.5C12.2597 13.5 12.6872 13.3128 13 13M6.6 6.6C4.6146 8.0732 3 10.2727 3 12C3 15.314 6.9 19 12 19C13.7273 19 15.9268 18.3854 17.4 16.4M9 5.2C9.9585 4.9 11.0015 4.8 12 4.8C17.1 4.8 21 8.486 21 11.8C21 12.7985 20.1 14.841 19.2 16" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="mt-1 cursor-pointer rounded-md border-0 px-3 py-3 sm:py-2.5 font-outfit text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation"
                style={{ background: 'linear-gradient(to right, #2563EB 0%, #FE8E0A 100%)' }}
                disabled={isSubmitting || !isEmailVerified}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
              {!isEmailVerified && <p className="text-[10px] text-gray-500 text-center mt-1">Verify your email to continue.</p>}
            </form>

            {/* Login Link */}
            <div className="mt-3 text-center pb-1 md:pb-0">
              <p className="font-outfit text-xs text-gray-700">
                Already have an account?{' '}
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 font-outfit text-xs font-semibold text-rental-orange-500 hover:text-rental-orange-600"
                  onClick={() => { onClose(); onLoginClick?.() }}
                >
                  Login
                </button>
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterModal
