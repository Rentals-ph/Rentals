import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check auth token and role from cookies
  // Note: Login currently uses localStorage, but middleware can only access cookies
  // The client-side ProtectedRoute component will handle the main protection
  // This middleware serves as an additional layer if cookies are set

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    const authToken = request.cookies.get('auth_token')?.value
    const userRole = request.cookies.get('user_role')?.value || request.cookies.get('agent_role')?.value

    // If cookies exist and role doesn't match, redirect
    // If cookies don't exist, let client-side component handle it
    if (authToken && userRole && userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Agent routes protection
  if (pathname.startsWith('/agent')) {
    const authToken = request.cookies.get('auth_token')?.value
    const userRole = request.cookies.get('user_role')?.value || request.cookies.get('agent_role')?.value

    // If cookies exist and role doesn't match, redirect
    // If cookies don't exist, let client-side component handle it
    if (authToken && userRole && userRole !== 'agent') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Broker routes protection
  if (pathname.startsWith('/broker')) {
    const authToken = request.cookies.get('auth_token')?.value
    const userRole = request.cookies.get('user_role')?.value || request.cookies.get('agent_role')?.value

    // If cookies exist and role doesn't match, redirect
    // If cookies don't exist, let client-side component handle it
    if (authToken && userRole && userRole !== 'broker') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/agent/:path*',
    '/broker/:path*',
  ],
}

