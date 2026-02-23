'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authApi } from '@/api'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      const email = searchParams.get('email')

      if (!token || !email) {
        setStatus('error')
        setMessage('Invalid verification link. Missing token or email parameter.')
        return
      }

      // Decode email if it's URL encoded
      const decodedEmail = decodeURIComponent(email)

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(decodedEmail)) {
        setStatus('error')
        setMessage('Invalid email format in verification link.')
        return
      }

      try {
        const response = await authApi.verifyEmail(decodedEmail, token)
        if (response.success) {
          // Store verification status in localStorage for the RegisterModal (normalized)
          const normalizedEmail = decodedEmail.toLowerCase().trim()
          localStorage.setItem(`verified_email_${normalizedEmail}`, 'true')
          
          // Trigger a custom event to notify RegisterModal immediately
          window.dispatchEvent(new CustomEvent('emailVerified', { 
            detail: { email: normalizedEmail } 
          }))
          
          // Try to close the window/tab if possible (works for popups)
          // Otherwise, redirect immediately to home page
          const tryClose = () => {
            try {
              // Try to close if it's a popup or new window
              if (window.opener) {
                window.close()
                return true
              }
              // Try to go back in history if possible
              if (window.history.length > 1) {
                window.history.back()
                return true
              }
            } catch (e) {
              // Ignore errors
            }
            return false
          }
          
          // Try to close/go back, if it fails, redirect to home
          if (!tryClose()) {
            // Redirect immediately to home page
            window.location.href = '/'
          }
        } else {
          setStatus('error')
          setMessage(response.message || 'Verification failed. Please try again.')
        }
      } catch (error: any) {
        console.error('Verification error:', error)
        setStatus('error')
        
        // Get detailed error message
        if (error.response?.data?.message) {
          setMessage(error.response.data.message)
        } else if (error.response?.data?.errors) {
          // Handle validation errors
          const errors = error.response.data.errors
          const errorMessages = Object.values(errors).flat().join(', ')
          setMessage(errorMessages || 'Validation failed. Please check your verification link.')
        } else if (error.message) {
          setMessage(error.message)
        } else {
          setMessage('Verification failed. Please try again.')
        }
      }
    }

    verifyEmail()
  }, [searchParams, router])

  // Show minimal loading state - verification happens automatically
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rental-orange-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    )
  }

  // Show error state if verification failed
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-4">{message}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-rental-orange-500 text-white rounded-lg hover:bg-rental-orange-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Success - redirect immediately (this shouldn't show, but just in case)
  return null
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rental-orange-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

