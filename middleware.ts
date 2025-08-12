import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register']

// Define auth-only routes that should redirect to home if already logged in
const AUTH_ONLY_ROUTES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to public routes without authentication
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // If no token and trying to access protected route, redirect to login
  if (!token && !PUBLIC_ROUTES.includes(pathname)) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If has token and trying to access auth-only routes, redirect to home
  if (token && AUTH_ONLY_ROUTES.includes(pathname)) {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  // For all other cases, continue
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - _rsc (React Server Components)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|_rsc).*)',
  ],
} 