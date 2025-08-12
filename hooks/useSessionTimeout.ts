import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TokenManager } from '@/lib/token-manager'

export function useSessionTimeout() {
  const router = useRouter()

  const checkSessionTimeout = useCallback(() => {
    if (TokenManager.checkSessionTimeout()) {
      TokenManager.clearToken()
      router.push('/login')
      return true
    }
    return false
  }, [router])

  // ตรวจสอบ session timeout ทุก 1 นาที
  useEffect(() => {
    const sessionCheckInterval = setInterval(() => {
      checkSessionTimeout()
    }, 60000) // ตรวจสอบทุก 1 นาที

    return () => clearInterval(sessionCheckInterval)
  }, [checkSessionTimeout])

  // ตรวจสอบเมื่อ window focus (เมื่อกลับมาที่แท็บ)
  useEffect(() => {
    const handleFocus = () => {
      checkSessionTimeout()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSessionTimeout()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkSessionTimeout])

  // ตรวจสอบเมื่อมีการเปลี่ยนแปลง URL
  useEffect(() => {
    checkSessionTimeout()
  }, [checkSessionTimeout])

  return { checkSessionTimeout }
}
