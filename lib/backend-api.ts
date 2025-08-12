import { TokenManager } from './token-manager'
import { ApiInterceptor } from './api-interceptor'
import { AuthUtils } from './auth-utils'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10358'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  result?: T
}

export class BackendApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message)
    this.name = 'BackendApiError'
  }
}

export async function backendApiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return ApiInterceptor.handleApiCall(async () => {
    // ตรวจสอบ session validity
    if (!AuthUtils.isSessionValid()) {
      AuthUtils.forceLogout()
      throw new BackendApiError('Session is invalid or expired', 401)
    }

    // ตรวจสอบและ refresh token ถ้าจำเป็น
    await AuthUtils.refreshTokenIfNeeded()

    const headers = TokenManager.getAuthHeaders()
    
    // Merge with custom headers
    Object.assign(headers, options.headers as Record<string, string>)

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers
    })

    const data = await response.json()

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      AuthUtils.forceLogout()
      throw new BackendApiError('Token expired, please login again', 401, data)
    }

    if (!response.ok) {
      throw new BackendApiError(
        data.message || 'API request failed',
        response.status,
        data
      )
    }

    return data
  })
}

// Helper functions for common HTTP methods
export const backendApi = {
  get: <T = any>(endpoint: string) => 
    backendApiCall<T>(endpoint, { method: 'GET' }),
  
  post: <T = any>(endpoint: string, body: any) => 
    backendApiCall<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  put: <T = any>(endpoint: string, body: any) => 
    backendApiCall<T>(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
  
  delete: <T = any>(endpoint: string) => 
    backendApiCall<T>(endpoint, { method: 'DELETE' }),
  
  patch: <T = any>(endpoint: string, body: any) => 
    backendApiCall<T>(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    })
} 