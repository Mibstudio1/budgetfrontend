"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNavbar } from "./navbar-context"
import { useAuth } from "./auth-context"
import { LogOut, User, Menu, X, ChevronLeft, ChevronRight, Home, BarChart3, Settings, FileText, Calculator, TrendingUp, DollarSign } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen } = useNavbar()
  const { user, logout } = useAuth()

  const navItems = [
    // Main Dashboard
    { 
      id: "overview", 
      label: "Project Overview", 
      labelTh: "ภาพรวม", 
      icon: <Home className="w-5 h-5" />,
      href: "/", 
      roles: ["admin", "employee", "user"],
      group: "main"
    },
    { 
      id: "monthly", 
      label: "Monthly Dashboard", 
      labelTh: "Dashboard รายเดือน", 
      icon: <BarChart3 className="w-5 h-5" />,
      href: "/monthly-dashboard", 
      roles: ["admin", "employee", "user"],
      group: "main"
    },
    
    // Data Entry
    { 
      id: "expenses", 
      label: "Expense Entry", 
      labelTh: "บันทึกค่าใช้จ่าย", 
      icon: <Calculator className="w-5 h-5" />,
      href: "/expense-entry", 
      roles: ["admin", "employee", "user"],
      group: "data"
    },
    { 
      id: "sales", 
      label: "Sales Entry",
      labelTh: "บันทึกยอดขาย", 
      icon: <TrendingUp className="w-5 h-5" />,
      href: "/sales-entry", 
      roles: ["admin"],
      group: "data"
    },
    
    // Management
    { 
      id: "projects", 
      label: "Project Management", 
      labelTh: "จัดการโครงการ", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: "/projects", 
      roles: ["admin", "employee", "user"],
      group: "management"
    },
    { 
      id: "budget-management", 
      label: "Budget Management", 
      labelTh: "จัดการงบประมาณ", 
      icon: <DollarSign className="w-5 h-5" />,
      href: "/budget-management", 
      roles: ["admin"],
      group: "management"
    },
    { 
      id: "category-management", 
      label: "Category Management", 
      labelTh: "จัดการหมวดหมู่", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      href: "/category-management", 
      roles: ["admin"],
      group: "management"
    },
    { 
      id: "monthly-targets", 
      label: "Monthly Revenue Targets", 
      labelTh: "เป้าหมายรายได้รายเดือน", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: "/monthly-targets", 
      roles: ["admin"],
      group: "management"
    },
    
    // Reports
    { 
      id: "profit", 
      label: "Cost & Profit", 
      labelTh: "ต้นทุนและกำไร", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      href: "/cost-profit-report", 
      roles: ["admin"],
      group: "reports"
    },
    {
      id: "outstanding",
      label: "Outstanding Expenses",
      labelTh: "ค่าใช้จ่ายค้างจ่าย",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: "/outstanding-expenses",
      roles: ["admin", "employee", "user"],
      group: "reports"
    },
    
    // Admin
    {
      id: "admin",
      label: "Admin Management",
      labelTh: "จัดการระบบ",
      icon: <Settings className="w-5 h-5" />,
      href: "/admin",
      roles: ["admin"],
      group: "admin"
    },
  ]

  const filteredNavItems = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  )

  const groupedItems = {
    main: filteredNavItems.filter(item => item.group === "main"),
    data: filteredNavItems.filter(item => item.group === "data"),
    management: filteredNavItems.filter(item => item.group === "management"),
    reports: filteredNavItems.filter(item => item.group === "reports"),
    admin: filteredNavItems.filter(item => item.group === "admin")
  }

  const groupLabels = {
    main: "หน้าหลัก",
    data: "บันทึกข้อมูล",
    management: "จัดการ",
    reports: "รายงาน",
    admin: "ระบบ"
  }

  // Mobile menu component
  const MobileMenu = () => (
    <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Menu */}
      <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl flex-navbar">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-navbar-header">
          <h1 className="text-base sm:text-lg font-bold text-gray-900">เมนู</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
        
        <nav className="flex-navbar-content p-3 sm:p-4 mobile-navbar-scrollable">
          <div className="space-y-4 sm:space-y-6 pb-4">
            {Object.entries(groupedItems).map(([groupKey, items]) => {
              if (items.length === 0) return null
              return (
                <div key={groupKey}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {groupLabels[groupKey as keyof typeof groupLabels]}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span className="text-sm font-medium">
                            {item.labelTh}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>
        
        {/* User Profile & Logout */}
        <div className="p-3 sm:p-4 border-t bg-gray-50 flex-navbar-footer">
          {user && (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <div className="text-xs text-gray-500">ผู้ใช้ปัจจุบัน</div>
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {user.name}
              </div>
              <div className="text-xs text-gray-500">
                {user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'employee' ? 'พนักงาน' : 'ผู้ใช้ทั่วไป'}
              </div>
            </div>
          )}
          <Button
            onClick={() => {
              logout()
              setIsMobileMenuOpen(false)
            }}
            variant="outline"
            size="sm"
            className="w-full bg-red-600 border-red-500 text-white hover:bg-red-700 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu */}
      <MobileMenu />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white border-b border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-white hover:bg-gray-700"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-white truncate">Project Budget</h1>
              <h2 className="text-xs text-gray-300 truncate">Management System</h2>
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-white truncate max-w-24">{user.name}</div>
                <div className="text-xs text-gray-300 truncate">
                  {user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'employee' ? 'พนักงาน' : 'ผู้ใช้ทั่วไป'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block fixed left-0 top-0 h-full bg-gray-900 text-white shadow-lg border-r border-gray-700 transition-all duration-300 z-30 flex-navbar ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-700 flex-navbar-header">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-sm lg:text-base font-bold text-white truncate">Project Budget</h1>
                <h2 className="text-xs lg:text-sm text-gray-300 truncate">Management System</h2>
              </div>
            )}
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700 p-2 flex-shrink-0 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-navbar-content p-2 lg:p-4 navbar-scrollable">
          <div className="space-y-4 sm:space-y-6 pb-4">
            {Object.entries(groupedItems).map(([groupKey, items]) => {
              if (items.length === 0) return null
              return (
                <div key={groupKey}>
                  {!isCollapsed && (
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                      {groupLabels[groupKey as keyof typeof groupLabels]}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <span className="flex-shrink-0">{item.icon}</span>
                          {!isCollapsed && (
                            <span className="text-sm font-medium truncate">
                              {item.labelTh}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-2 lg:p-4 border-t border-gray-700 flex-navbar-footer">
          {!isCollapsed && user && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="text-xs text-gray-400">ผู้ใช้ปัจจุบัน</div>
              </div>
              <div className="text-sm font-medium text-white mb-1 truncate">
                {user.name}
              </div>
              <div className="text-xs text-gray-400 mb-3 truncate">
                {user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'employee' ? 'พนักงาน' : 'ผู้ใช้ทั่วไป'}
              </div>
            </div>
          )}
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="w-full bg-red-600 border-red-500 text-white hover:bg-red-700 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                ออกจากระบบ
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
