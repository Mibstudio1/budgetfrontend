// Token Management Service
export class TokenManager {
  private static readonly TOKEN_KEY = 'auth-token'
  private static readonly USER_DATA_KEY = 'user-data'
  private static readonly TOKEN_EXPIRY_KEY = 'token-expiry'

  // เก็บ token ใน cookie และ sessionStorage
  static setToken(token: string, expiresIn?: number): void {
    const expiryDate = expiresIn ? new Date(Date.now() + (expiresIn * 1000)) : new Date(Date.now() + (24 * 60 * 60 * 1000)) // Default 24 hours
    
    if (typeof window !== 'undefined') {
      // เก็บใน sessionStorage
      sessionStorage.setItem(this.TOKEN_KEY, token)
      sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryDate.getTime().toString())
      
      // เก็บใน cookie สำหรับ middleware
      document.cookie = `${this.TOKEN_KEY}=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Strict`
    }
  }

  // ดึง token จาก sessionStorage หรือ cookie
  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    
    // ลองดึงจาก sessionStorage ก่อน
    let token = sessionStorage.getItem(this.TOKEN_KEY)
    
    // ถ้าไม่มีใน sessionStorage ให้ดึงจาก cookie
    if (!token) {
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${this.TOKEN_KEY}=`))
      if (tokenCookie) {
        token = tokenCookie.split('=')[1]
        // เก็บกลับไปใน sessionStorage
        if (token) {
          sessionStorage.setItem(this.TOKEN_KEY, token)
        }
      }
    }
    
    if (!token) return null

    // ตรวจสอบ token expiry
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY)
    if (expiry) {
      const expiryTime = parseInt(expiry)
      if (Date.now() > expiryTime) {
        this.clearToken()
        return null
      }
    }

    return token
  }

  // เก็บ user data ใน sessionStorage
  static setUserData(userData: any): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData))
    }
  }

  // ดึง user data จาก sessionStorage
  static getUserData(): any | null {
    if (typeof window === 'undefined') return null
    
    try {
      const userData = sessionStorage.getItem(this.USER_DATA_KEY)
      if (!userData) return null
      
      return JSON.parse(userData)
    } catch (error) {
      this.clearToken()
      return null
    }
  }

  // ตรวจสอบว่า login อยู่หรือไม่
  static isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false

    // ตรวจสอบ token validity
    return this.isTokenValid()
  }

  // ลบ token และ user data
  static clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY)
      sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY)
      sessionStorage.removeItem(this.USER_DATA_KEY)
      
      // ลบ cookie
      document.cookie = `${this.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  }

  // สร้าง Authorization header
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  // ตรวจสอบ token validity
  static isTokenValid(): boolean {
    const token = this.getToken()
    if (!token) return false

    // ตรวจสอบ token format (basic validation)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      this.clearToken()
      return false
    }

    // ตรวจสอบ JWT payload (ถ้าเป็น JWT)
    try {
      const payload = JSON.parse(atob(tokenParts[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      // ตรวจสอบ expiration
      if (payload.exp && payload.exp < currentTime) {
        this.clearToken()
        return false
      }
    } catch (error) {
      // ถ้าไม่ใช่ JWT format ให้ถือว่า valid
      return true
    }

    return true
  }

  // Refresh token (ถ้ามี)
  static async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10358'}/api/authen/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.result?.token) {
          this.setToken(data.result.token, data.result.expiresIn)
          return true
        }
      }
    } catch (error) {
      // Token refresh failed silently
    }

    return false
  }

  // ตรวจสอบ session timeout
  static checkSessionTimeout(): boolean {
    const token = this.getToken()
    if (!token) return true // Session expired

    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY)
    if (expiry) {
      const expiryTime = parseInt(expiry)
      const timeUntilExpiry = expiryTime - Date.now()
      
      // ถ้าเหลือเวลาน้อยกว่า 5 นาที ให้ถือว่าใกล้หมดเวลา
      if (timeUntilExpiry < 5 * 60 * 1000) {
        return true
      }
    }

    return false
  }
} 