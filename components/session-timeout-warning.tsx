"use client"

import { useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { TokenManager } from '@/lib/token-manager'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const { logout } = useAuth()

  useEffect(() => {
    const checkSessionTimeout = () => {
      const token = TokenManager.getToken()
      if (!token) return

      const expiry = sessionStorage.getItem('token-expiry')
      if (expiry) {
        const expiryTime = parseInt(expiry)
        const timeUntilExpiry = expiryTime - Date.now()
        
        // แสดง warning เมื่อเหลือเวลาน้อยกว่า 10 นาที
        if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
          setShowWarning(true)
          setTimeLeft(Math.ceil(timeUntilExpiry / 1000 / 60))
        } else if (timeUntilExpiry <= 0) {
          logout()
        }
      }
    }

    // ตรวจสอบทุก 30 วินาที
    const interval = setInterval(checkSessionTimeout, 30000)
    checkSessionTimeout() // ตรวจสอบครั้งแรก

    return () => clearInterval(interval)
  }, [logout])

  const handleExtendSession = () => {
    // เรียก API เพื่อ extend session (ถ้ามี)
    setShowWarning(false)
  }

  const handleLogout = () => {
    logout()
    setShowWarning(false)
  }

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>เซสชันใกล้หมดเวลา</AlertDialogTitle>
          <AlertDialogDescription>
            เซสชันของคุณจะหมดเวลาในอีก {timeLeft} นาที เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่หรือขยายเซสชัน
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>
            ออกจากระบบ
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtendSession}>
            ขยายเซสชัน
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
