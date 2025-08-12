"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon, TrendingUpIcon, UsersIcon, CalendarIcon } from "lucide-react"
import { dashboardService } from "@/lib/services/dashboardService"

interface Project {
  id: string
  projectName: string
  description: string
  type: string
  status: string
  startDate?: string
  endDate?: string
  monthlyExpense?: number
  monthlySales?: number
  cashflow?: number
  profitPercentage?: number
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editFormData, setEditFormData] = useState({ status: '' })
  const [dashboardData, setDashboardData] = useState<any>(null)

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())
  const months = [
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" }
  ]

  const statusOptions = [
    { value: "กำลังทำ", label: "กำลังทำ" },
    { value: "เสร็จแล้ว", label: "เสร็จแล้ว" },
    { value: "ยกเลิก", label: "ยกเลิก" }
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [selectedYear, selectedMonth])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await dashboardService.getMonthlyDashboard(`${selectedYear}-${selectedMonth}`, selectedYear)
      if (response.success) {
        setDashboardData(response.result)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "ไม่ระบุ") return "ไม่ระบุ"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setEditFormData({ status: project.status })
  }

  const handleSaveProjectStatus = async () => {
    if (!editingProject) return

    try {
      // TODO: Call API to update project status
      // await projectService.updateProject({
      //   id: editingProject.id,
      //   status: editFormData.status,
      //   // ... other fields
      // })
      
      // Refresh dashboard data
      await fetchDashboardData()
      setEditingProject(null)
    } catch (error) {
      console.error('Error updating project status:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'กำลังทำ':
        return 'bg-blue-100 text-blue-800'
      case 'เสร็จแล้ว':
        return 'bg-green-100 text-green-800'
      case 'ยกเลิก':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4 mb-4 sm:mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">ภาพรวมการทำงานและผลการดำเนินงาน</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.monthlyData?.actualSales?.toLocaleString() || '0'} บาท
            </div>
            <p className="text-xs text-muted-foreground">
              เป้าหมาย {dashboardData?.monthlyData?.target?.toLocaleString() || '0'} บาท
            </p>
            <Progress 
              value={dashboardData?.monthlyData?.achievement || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค่าใช้จ่าย</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.monthlyData?.totalExpenses?.toLocaleString() || '0'} บาท
            </div>
            <p className="text-xs text-muted-foreground">
              จ่ายแล้ว {dashboardData?.monthlyData?.paidPercentage || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไร</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.monthlyData?.profit?.toLocaleString() || '0'} บาท
            </div>
            <p className="text-xs text-muted-foreground">
              กำไรสุทธิ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">โครงการ</CardTitle>
            <UsersIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.totalProjects || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              กำลังทำ {dashboardData?.activeProjects || 0} | เสร็จแล้ว {dashboardData?.completedProjects || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>โครงการล่าสุด</CardTitle>
          <CardDescription>
            รายการโครงการและสถานะการดำเนินงาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">โครงการ</th>
                  <th className="text-left p-2">ประเภท</th>
                  <th className="text-left p-2">สถานะ</th>
                  <th className="text-left p-2">ค่าใช้จ่าย</th>
                  <th className="text-left p-2">รายได้</th>
                  <th className="text-left p-2">กำไร</th>
                  <th className="text-left p-2">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.monthlyData?.projects?.map((project: Project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{project.projectName}</div>
                        <div className="text-sm text-gray-500">{project.description}</div>
                      </div>
                    </td>
                    <td className="p-2">{project.type}</td>
                    <td className="p-2">
                      <Badge className={getStatusBadgeColor(project.status)}>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="p-2">{project.monthlyExpense?.toLocaleString() || '0'} บาท</td>
                    <td className="p-2">{project.monthlySales?.toLocaleString() || '0'} บาท</td>
                    <td className="p-2">
                      <span className={project.cashflow && project.cashflow >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {project.cashflow?.toLocaleString() || '0'} บาท
                      </span>
                    </td>
                    <td className="p-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditProject(project)}
                          >
                            แก้ไข
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>แก้ไขสถานะโครงการ</DialogTitle>
                            <DialogDescription>
                              อัปเดตสถานะของโครงการ {project.projectName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">สถานะ</label>
                              <Select 
                                value={editFormData.status} 
                                onValueChange={(value) => setEditFormData({ status: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingProject(null)}>
                              ยกเลิก
                            </Button>
                            <Button onClick={handleSaveProjectStatus}>
                              บันทึก
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
