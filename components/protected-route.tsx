"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './auth-context'
import { Loader2 } from 'lucide-react'
import { TokenManager } from '@/lib/token-manager'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register']

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, checkSessionTimeout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return

    // Allow access to public routes without authentication
    if (PUBLIC_ROUTES.includes(pathname)) {
      return
    }

    // ตรวจสอบ session timeout ก่อน
    if (TokenManager.checkSessionTimeout()) {
      router.push('/login')
      return
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Check role-based access
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/')
      return
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, pathname, checkSessionTimeout])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600">กำลังโหลด...</span>
        </div>
      </div>
    )
  }

  // Allow access to public routes without authentication
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  // Show loading while redirecting if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</span>
        </div>
      </div>
    )
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 