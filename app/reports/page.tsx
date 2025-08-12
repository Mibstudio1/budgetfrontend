"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText, BarChart3, PieChart, TrendingDown, AlertTriangle, Loader2 } from "lucide-react"
import { reportService } from "@/lib/services/reportService"
import { projectService } from "@/lib/services/projectService"
import { expenseService } from "@/lib/services/expenseService"

interface ReportStats {
  budget: {
    projects: number
    overBudget: number
  }
  profitLoss: {
    totalProfit: number
    profitableProjects: number
  }
  outstanding: {
    amount: number
    items: number
  }
  analytics: {
    efficiency: number
    trend: string
  }
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<ReportStats>({
    budget: { projects: 0, overBudget: 0 },
    profitLoss: { totalProfit: 0, profitableProjects: 0 },
    outstanding: { amount: 0, items: 0 },
    analytics: { efficiency: 0, trend: "คงที่" }
  })

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)

      // Fetch projects for budget stats
      const projectsResponse = await projectService.getAllProjects({
        projectName: "",
        type: "",
        status: ""
      })
      const projects = projectsResponse.result?.projects || []
      
      // Calculate budget stats
      const overBudgetProjects = projects.filter(p => 
        p.status === "ยกเลิก"
      ).length

      // Calculate profit/loss stats
      const profitableProjects = projects.filter(p => 
        p.status === "เสร็จแล้ว" && p.profit > 0
      ).length
      const totalProfit = projects.reduce((sum, p) => sum + (p.profit || 0), 0)

      // Fetch outstanding expenses
      const expensesResponse = await expenseService.getRecentlyExpenses({
        search: "",
        startDate: "",
        endDate: "",
        category: "",
        status: "ยังไม่ชำระ"
      })
      const unpaidExpenses = expensesResponse.result?.records || []
      const outstandingAmount = unpaidExpenses.reduce((sum, exp) => sum + exp.amount, 0)

      // Calculate analytics
      const completedProjects = projects.filter(p => p.status === "เสร็จแล้ว").length
      const efficiency = projects.length > 0 ? Math.round((completedProjects / projects.length) * 100) : 0
      const trend = totalProfit > 0 ? "เพิ่มขึ้น" : totalProfit < 0 ? "ลดลง" : "คงที่"

      setStats({
        budget: {
          projects: projects.length,
          overBudget: overBudgetProjects
        },
        profitLoss: {
          totalProfit,
          profitableProjects
        },
        outstanding: {
          amount: outstandingAmount,
          items: unpaidExpenses.length
        },
        analytics: {
          efficiency,
          trend
        }
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const reportModules = [
    {
      id: "budget",
      title: "รายงานงบประมาณ",
      description: "เปรียบเทียบงบประมาณกับการใช้จริงในแต่ละโปรเจกต์",
      icon: BarChart3,
      color: "blue",
      href: "/budget-report",
      stats: stats.budget,
    },
    {
      id: "profit-loss",
      title: "รายงานกำไรขาดทุน",
      description: "วิเคราะห์ผลกำไรและขาดทุนของแต่ละโปรเจกต์",
      icon: TrendingDown,
      color: "green",
      href: "/cost-profit-report",
      stats: stats.profitLoss,
    },
    {
      id: "outstanding",
      title: "รายงานค่าใช้จ่ายค้างจ่าย",
      description: "รายการค่าใช้จ่ายที่ยังไม่ได้ชำระเงิน",
      icon: AlertTriangle,
      color: "red",
      href: "/outstanding-expenses",
      stats: stats.outstanding,
    },
    {
      id: "analytics",
      title: "รายงานวิเคราะห์",
      description: "วิเคราะห์แนวโน้มและประสิทธิภาพการดำเนินงาน",
      icon: PieChart,
      color: "purple",
      href: "/dashboard",
      stats: stats.analytics,
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      red: "bg-red-100 text-red-600",
      purple: "bg-purple-100 text-purple-600",
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับหน้าหลัก
                </Button>
              </Link>
              <FileText className="h-8 w-8 text-gray-900 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">เลือกประเภทรายงาน</h2>
          <p className="text-gray-600">เลือกรายงานที่ต้องการดูข้อมูลและวิเคราะห์</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportModules.map((module) => {
            const IconComponent = module.icon
            return (
              <Card key={module.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg mr-4 ${getColorClasses(module.color)}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {module.id === "budget" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">โปรเจกต์ทั้งหมด</span>
                          <span className="font-medium">{module.stats.projects} โปรเจกต์</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">เกินงบประมาณ</span>
                          <span className="font-medium text-red-600">{module.stats.overBudget} โปรเจกต์</span>
                        </div>
                      </>
                    )}

                    {module.id === "profit-loss" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">กำไรรวม</span>
                          <span className={`font-medium ${module.stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {module.stats.totalProfit.toLocaleString("th-TH")} บาท
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">โปรเจกต์ทำกำไร</span>
                          <span className="font-medium">{module.stats.profitableProjects} โปรเจกต์</span>
                        </div>
                      </>
                    )}

                    {module.id === "outstanding" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ยอดค้างจ่าย</span>
                          <span className="font-medium text-red-600">
                            {module.stats.amount.toLocaleString("th-TH")} บาท
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">รายการค้างจ่าย</span>
                          <span className="font-medium">{module.stats.items} รายการ</span>
                        </div>
                      </>
                    )}

                    {module.id === "analytics" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ประสิทธิภาพ</span>
                          <span className="font-medium text-green-600">{module.stats.efficiency}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">แนวโน้ม</span>
                          <span className={`font-medium ${
                            module.stats.trend === "เพิ่มขึ้น" ? "text-green-600" : 
                            module.stats.trend === "ลดลง" ? "text-red-600" : "text-gray-600"
                          }`}>
                            {module.stats.trend}
                          </span>
                        </div>
                      </>
                    )}

                    <Link href={module.href} className="block">
                      <Button className="w-full mt-4 bg-transparent" variant="outline">
                        ดูรายงาน
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>สรุปรายงานด่วน</CardTitle>
            <CardDescription>ข้อมูลสำคัญที่ควรทราบ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold text-red-900">ต้องดูด่วน</h3>
                <p className="text-sm text-red-700">{stats.budget.overBudget} โปรเจกต์เกินงบประมาณ</p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <FileText className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold text-yellow-900">ค้างจ่าย</h3>
                <p className="text-sm text-yellow-700">{stats.outstanding.amount.toLocaleString("th-TH")} บาท ค้างชำระ</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900">ผลประกอบการ</h3>
                <p className={`text-sm ${stats.profitLoss.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  กำไรรวม {stats.profitLoss.totalProfit.toLocaleString("th-TH")} บาท
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
