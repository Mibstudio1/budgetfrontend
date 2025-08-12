"use client"

import { usePathname } from 'next/navigation'
import { NavbarProvider } from './navbar-context'
import Navbar from './navbar'
import ProtectedRoute from './protected-route'
import { useAuth } from './auth-context'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SessionTimeoutWarning } from './session-timeout-warning'

interface LayoutWrapperProps {
  children: React.ReactNode
}

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register']

// Define auth-only routes that should redirect to home if already logged in
const AUTH_ONLY_ROUTES = ['/login', '/register']

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const { isAuthenticated, isLoading, checkSessionTimeout } = useAuth()
  const router = useRouter()

  // Handle authentication redirects
  useEffect(() => {
    if (isLoading) return // Wait for auth to load

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
    const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname)

    // ตรวจสอบ session timeout ก่อน
    checkSessionTimeout()

    // If user is authenticated and trying to access auth-only routes, redirect to home
    if (isAuthenticated && isAuthOnlyRoute) {
      router.push('/')
      return
    }

    // If user is not authenticated and trying to access protected routes, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, isLoading, pathname, router, checkSessionTimeout])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-gray-600 font-medium">กำลังโหลดระบบ...</p>
            <p className="text-sm text-gray-500 mt-1">กรุณารอสักครู่</p>
          </div>
        </div>
      </div>
    )
  }

  // Public routes (login, register) - no navbar, no protection
  if (PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {children}
      </div>
    )
  }

  // Protected routes - with navbar and protection
  return (
    <NavbarProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="transition-all duration-300 ease-in-out pt-16 lg:pt-6 lg:ml-16 xl:ml-16">
            <div className="w-full animate-fade-in">
              <div className="min-h-[calc(100vh-4rem)]">
                {children}
              </div>
            </div>
          </main>
          <SessionTimeoutWarning />
        </div>
      </ProtectedRoute>
    </NavbarProvider>
  )
} 