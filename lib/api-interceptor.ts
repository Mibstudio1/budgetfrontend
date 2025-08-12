import { TokenManager } from './token-manager'

// API Interceptor for handling token expiration
export class ApiInterceptor {
  private static isRefreshing = false
  private static failedQueue: Array<{
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []

  static async handleApiCall<T>(
    apiCall: () => Promise<T>
  ): Promise<T> {
    try {
      // ตรวจสอบ session timeout ก่อนเรียก API
      if (TokenManager.checkSessionTimeout()) {
        TokenManager.clearToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Session expired, please login again')
      }

      return await apiCall()
    } catch (error: any) {
      // Handle 401 Unauthorized
      if (error.status === 401 || error.message?.includes('401')) {
        // Clear token and redirect to login
        TokenManager.clearToken()
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        throw new Error('Session expired, please login again')
      }
      
      throw error
    }
  }

  // Handle token refresh
  static async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject })
      })
    }

    this.isRefreshing = true

    try {
      const refreshed = await TokenManager.refreshToken()
      
      if (refreshed) {
        this.failedQueue.forEach(({ resolve }) => resolve(true))
        this.failedQueue = []
        return true
      } else {
        this.failedQueue.forEach(({ reject }) => reject(new Error('Token refresh failed')))
        this.failedQueue = []
        return false
      }
    } catch (error) {
      this.failedQueue.forEach(({ reject }) => reject(error))
      this.failedQueue = []
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return TokenManager.isAuthenticated()
  }

  // Get auth headers
  static getAuthHeaders(): Record<string, string> {
    return TokenManager.getAuthHeaders()
  }

  // Check session timeout
  static checkSessionTimeout(): boolean {
    return TokenManager.checkSessionTimeout()
  }
} 