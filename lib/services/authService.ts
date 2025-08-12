import { backendApi } from '@/lib/backend-api'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  name: string
  username: string
  password: string
  role: string
}

export interface UserProfile {
  name: string
  role: string
  token: string
}

export interface AuthResponse {
  success?: boolean
  message?: string
  result?: {
    profile?: UserProfile | UserProfile[]
  }
}

export const authService = {
  // Login - ไม่ต้องแนบ token
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10358'
    
    const response = await fetch(`${BACKEND_URL}/api/authen/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Login failed')
    }

    return result
  },

  // Register - ไม่ต้องแนบ token
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10358'
    
    const response = await fetch(`${BACKEND_URL}/api/authen/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed')
    }

    return result
  }
} 