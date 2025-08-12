"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/lib/services/authService'
import { TokenManager } from '@/lib/token-manager'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'

interface UserProfile {
  name: string
  role: string
  token: string
}

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  getAuthHeaders: () => Record<string, string>
  checkSessionTimeout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { checkSessionTimeout } = useSessionTimeout()

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (TokenManager.isAuthenticated()) {
          const userData = TokenManager.getUserData()
          if (userData) {
            setUser(userData)
          } else {
            TokenManager.clearToken()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        TokenManager.clearToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const data = await authService.login({ username, password })
      
      // Check response structure
      if (data.success && data.result?.profile) {
        const userProfile = data.result.profile as UserProfile
        setUser(userProfile)
        
        // Store token and user data using TokenManager
        TokenManager.setToken(userProfile.token)
        TokenManager.setUserData(userProfile)
        
        return true
      } else if (data.result?.profile) {
        // Case where no success field but has profile
        const userProfile = data.result.profile as UserProfile
        
        setUser(userProfile)
        
        // Store token and user data using TokenManager
        TokenManager.setToken(userProfile.token)
        TokenManager.setUserData(userProfile)
        
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    TokenManager.clearToken()
  }

  const getAuthHeaders = (): Record<string, string> => {
    return TokenManager.getAuthHeaders()
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      getAuthHeaders,
      checkSessionTimeout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 