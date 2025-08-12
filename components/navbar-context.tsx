"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface NavbarContextType {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (value: boolean) => void
  isEmployeeView: boolean
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined)

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true) // เปลี่ยนเป็น true เพื่อให้เริ่มต้นในสถานะหุบ
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isEmployeeView, setIsEmployeeView] = useState(false)

  return (
    <NavbarContext.Provider value={{
      isCollapsed,
      setIsCollapsed,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isEmployeeView
    }}>
      {children}
    </NavbarContext.Provider>
  )
}

export function useNavbar() {
  const context = useContext(NavbarContext)
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider')
  }
  return context
} 