import { TokenManager } from './token-manager'

export class AuthUtils {
  // ตรวจสอบว่า user มีสิทธิ์เข้าถึงหรือไม่
  static hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'admin': 3,
      'manager': 2,
      'user': 1
    }

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
  }

  // ตรวจสอบ session validity
  static isSessionValid(): boolean {
    return TokenManager.isAuthenticated() && !TokenManager.checkSessionTimeout()
  }

  // ตรวจสอบ token expiration time
  static getTokenExpirationTime(): number | null {
    const expiry = sessionStorage.getItem('token-expiry')
    if (!expiry) return null

    const expiryTime = parseInt(expiry)
    return expiryTime
  }

  // ตรวจสอบเวลาที่เหลือก่อน token หมดอายุ
  static getTimeUntilExpiration(): number {
    const expiryTime = this.getTokenExpirationTime()
    if (!expiryTime) return 0

    const timeUntilExpiry = expiryTime - Date.now()
    return Math.max(0, timeUntilExpiry)
  }

  // ตรวจสอบว่าใกล้หมดเวลาหรือไม่
  static isNearExpiration(warningMinutes: number = 10): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiration()
    return timeUntilExpiry < warningMinutes * 60 * 1000 && timeUntilExpiry > 0
  }

  // ตรวจสอบว่า token หมดอายุแล้วหรือไม่
  static isExpired(): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiration()
    return timeUntilExpiry <= 0
  }

  // สร้าง session info object
  static getSessionInfo() {
    const userData = TokenManager.getUserData()
    const expiryTime = this.getTokenExpirationTime()
    const timeUntilExpiry = this.getTimeUntilExpiration()

    return {
      isAuthenticated: TokenManager.isAuthenticated(),
      isSessionValid: this.isSessionValid(),
      isExpired: this.isExpired(),
      isNearExpiration: this.isNearExpiration(),
      user: userData,
      expiryTime,
      timeUntilExpiry,
      timeUntilExpiryMinutes: Math.ceil(timeUntilExpiry / 1000 / 60)
    }
  }

  // Force logout
  static forceLogout(): void {
    TokenManager.clearToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // ตรวจสอบและ refresh token ถ้าจำเป็น
  static async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isNearExpiration(5)) { // ถ้าเหลือเวลาน้อยกว่า 5 นาที
      return await TokenManager.refreshToken()
    }
    return true
  }
}
