"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, Loader2, Target, Edit } from "lucide-react"
import { projectService } from "@/lib/services/projectService"
import { dashboardService } from "@/lib/services/dashboardService"
import { revenueService } from "@/lib/services/revenueService"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

interface MonthlyProjectData {
  id: string
  projectName: string
  description: string
  startDate: string
  endDate: string
  monthlyExpense: number
  monthlyRevenue: number
  profitPercentage: number
  cashflow: number
  type: string
  status: string
}

interface MonthlyStats {
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  profitMargin: number
  budgetUsage: number
  projectCount: number
  activeProjects: number
  monthlyTarget: number
  targetAchievement: number
}

export default function MonthlyDashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'))
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<MonthlyProjectData[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<MonthlyProjectData | null>(null)
  const [editFormData, setEditFormData] = useState({
    status: ""
  })
  const [isTargetEditDialogOpen, setIsTargetEditDialogOpen] = useState(false)
  const [targetEditFormData, setTargetEditFormData] = useState({
    target: 0
  })
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    profitMargin: 0,
    budgetUsage: 0,
    projectCount: 0,
    activeProjects: 0,
    monthlyTarget: 0,
    targetAchievement: 0
  })

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
    { value: "12", label: "ธันวาคม" },
  ]

  const years = ["2023", "2024", "2025"]

  const projectStatuses = [
    { value: "กำลังทำ", label: "กำลังทำ" },
    { value: "เสร็จแล้ว", label: "เสร็จแล้ว" },
    { value: "ยกเลิก", label: "ยกเลิก" }
  ]

  useEffect(() => {
    fetchMonthlyData()
  }, [selectedMonth, selectedYear])

  // Refetch data when component becomes visible (to get latest data)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMonthlyData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [selectedMonth, selectedYear])

  const fetchMonthlyData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch revenue targets first
      const targetsResponse = await revenueService.getAllRevenueTargets()
      console.log('Targets response:', targetsResponse)
      console.log('All targets from backend:', targetsResponse?.result?.targets)
      
      // Debug: Log each target's structure
      if (targetsResponse?.result?.targets) {
        targetsResponse.result.targets.forEach((target: any, index: number) => {
          console.log(`Target ${index}:`, {
            id: target.id,
            month: target.month,
            target: target.target,
            createdAt: target.createdAt,
            updatedAt: target.updatedAt,
            createdBy: target.createdBy
          })
        })
      }
      
      // Get target for selected month/year
      let monthlyTarget = 0
      if (targetsResponse?.success && targetsResponse?.result?.targets) {
        const monthNames = [
          "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
          "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
        ]
        const selectedMonthName = monthNames[parseInt(selectedMonth) - 1]
        const targetKey = `${selectedMonthName} ${selectedYear}`
        const standardKey = `${selectedYear}-${selectedMonth}` // 2025-08 format
        
        console.log('Looking for target with keys:', { targetKey, standardKey })
        console.log('Selected month name:', selectedMonthName)
        console.log('Selected year:', selectedYear)
        
        // Find target by EXACT match only - no fallback to other months
        const target = targetsResponse.result.targets.find((t: any) => {
          console.log('Checking target:', t.month, 'against:', targetKey, 'or', standardKey)
          return t.month === targetKey || t.month === standardKey
        })
        
        if (target) {
          monthlyTarget = Number(target.target) || 0
          console.log('Found target for specific month:', target.month, 'value:', monthlyTarget)
        } else {
          console.log('No target found for specific month:', targetKey, 'or', standardKey)
          monthlyTarget = 0 // No target for this specific month
        }
      }
      
      // Fetch monthly dashboard data from backend
      const monthlyResponse = await dashboardService.getMonthlyDashboard(selectedMonth, selectedYear)
      console.log('Monthly dashboard response:', monthlyResponse)
      console.log('Selected month/year:', selectedMonth, selectedYear)
      
      // Fetch additional project data for better information
      const projectResponse = await projectService.getAllProjects({
        projectName: "",
        type: "",
        status: ""
      })
      console.log('Project response:', projectResponse)
      
      if (monthlyResponse.success && monthlyResponse.result) {
        const monthlyResult = monthlyResponse.result
        
        // Create monthly data from projects with enhanced project information
        const monthlyDataFromProjects = monthlyResult.projects?.map((project: any) => {
          // Calculate profit percentage
          const income = project.income || 0
          const expense = project.expense || 0
          const profitPercentage = income > 0 ? ((income - expense) / income) * 100 : 0
          const cashflow = income - expense
          
          // Find additional project info from project service
          let projectInfo: any = null
          if (projectResponse?.success && projectResponse?.result?.projects) {
            projectInfo = projectResponse.result.projects.find((p: any) => p.id === project.id)
          }
          
          return {
            id: project.id || `project-${Date.now()}`,
            projectName: project.projectName || projectInfo?.projectName || 'ไม่ระบุชื่อโปรเจค',
            description: projectInfo?.description || 'ไม่มีคำอธิบาย',
            startDate: projectInfo?.startDate || "ไม่ระบุ",
            endDate: projectInfo?.endDate || "ไม่ระบุ",
            monthlyExpense: expense,
            monthlyRevenue: income,
            profitPercentage: profitPercentage,
            cashflow: cashflow,
            type: projectInfo?.type || 'ไม่ระบุ',
            status: projectInfo?.status || 'ไม่ระบุ'
          }
        }) || []
        
        // Sort projects: กำลังทำ first, then เสร็จแล้ว last
        const sortedMonthlyData = monthlyDataFromProjects.sort((a, b) => {
          // Define priority order: กำลังทำ = 1, ยกเลิก = 2, เสร็จแล้ว = 3
          const getPriority = (status: string) => {
            switch (status) {
              case 'กำลังทำ':
              case 'IN_PROGRESS':
                return 1
              case 'ยกเลิก':
              case 'CANCELLED':
                return 2
              case 'เสร็จแล้ว':
              case 'COMPLETED':
                return 3
              default:
                return 2 // Unknown status goes in middle
            }
          }
          
          const priorityA = getPriority(a.status)
          const priorityB = getPriority(b.status)
          
          // If same priority, sort by project name
          if (priorityA === priorityB) {
            return a.projectName.localeCompare(b.projectName, 'th')
          }
          
          return priorityA - priorityB
        })
        
        setMonthlyData(sortedMonthlyData)

        // Calculate monthly stats from backend data
        const totalRevenue = Number(monthlyResult.monthlyIncome) || 0
        const totalExpenses = Number(monthlyResult.monthlyExpense) || 0
        const totalProfit = Number(monthlyResult.monthlyProfit) || 0
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
        const budgetUsage = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0
        const projectCount = monthlyDataFromProjects.length
        // Calculate active projects from project service data
        let activeProjects = 0
        if (projectResponse?.success && projectResponse?.result?.projects) {
          activeProjects = projectResponse.result.projects.filter((p: any) => 
            p.status === 'กำลังทำ' || p.status === 'IN_PROGRESS'
          ).length
        }
        const targetAchievement = monthlyTarget > 0 ? (totalRevenue / monthlyTarget) * 100 : 0

        setMonthlyStats({
          totalRevenue,
          totalExpenses,
          totalProfit,
          profitMargin,
          budgetUsage,
          projectCount,
          activeProjects,
          monthlyTarget,
          targetAchievement
        })
      } else {
        // Fallback to empty data if backend fails
        setMonthlyData([])
        setMonthlyStats({
          totalRevenue: 0,
          totalExpenses: 0,
          totalProfit: 0,
          profitMargin: 0,
          budgetUsage: 0,
          projectCount: 0,
          activeProjects: 0,
          monthlyTarget,
          targetAchievement: 0
        })
      }
      
    } catch (error) {
      console.error('Error fetching monthly data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายเดือนได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProject = (project: MonthlyProjectData) => {
    setEditingProject(project)
    setEditFormData({ status: project.status })
    setIsEditDialogOpen(true)
  }

  const handleSaveProjectStatus = async () => {
    if (!editingProject) return

    try {
      // Update project status in backend
      const response = await projectService.updateProject({
        projectId: editingProject.id,
        projectName: editingProject.projectName,
        description: editingProject.description,
        projectStatus: editFormData.status,
        createdBy: 'system'
      })

      if (response.success) {
        // Update the project in the local state
        setMonthlyData(prev => 
          prev.map(p => 
            p.id === editingProject.id 
              ? { ...p, status: editFormData.status }
              : p
          )
        )

        // Update active projects count
        setMonthlyStats(prev => ({
          ...prev,
          activeProjects: monthlyData.filter(p => p.status === "กำลังทำ").length
        }))

        setIsEditDialogOpen(false)
        setEditingProject(null)
        
        toast({
          title: "อัพเดทสำเร็จ",
          description: "อัพเดทสถานะโครงการเรียบร้อยแล้ว",
        })
      } else {
        throw new Error("Failed to update project status")
      }
    } catch (error) {
      console.error('Error updating project status:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทสถานะได้",
        variant: "destructive"
      })
    }
  }

  const handleEditTarget = () => {
    setTargetEditFormData({ target: monthlyStats.monthlyTarget })
    setIsTargetEditDialogOpen(true)
  }

  const handleSaveTarget = async () => {
    try {
      const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ]
      const selectedMonthName = monthNames[parseInt(selectedMonth) - 1]
      const targetKey = `${selectedMonthName} ${selectedYear}`
      
      const response = await revenueService.updateRevenueTarget({
        id: `month-${selectedMonth}`,
        month: targetKey,
        target: targetEditFormData.target
      })

      if (response.success) {
        setMonthlyStats(prev => ({
          ...prev,
          monthlyTarget: targetEditFormData.target,
          targetAchievement: targetEditFormData.target > 0 ? (prev.totalRevenue / targetEditFormData.target) * 100 : 0
        }))
        
        setIsTargetEditDialogOpen(false)
        
        toast({
          title: "อัพเดทสำเร็จ",
          description: "อัพเดทเป้าหมายรายได้เรียบร้อยแล้ว",
        })
      } else {
        throw new Error("Failed to update target")
      }
    } catch (error) {
      console.error('Error updating target:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทเป้าหมายได้",
        variant: "destructive"
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "กำลังทำ":
        return "bg-orange-100 text-orange-800"
      case "เสร็จแล้ว":
        return "bg-green-100 text-green-800"
      case "ยกเลิก":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? "text-green-600" : "text-red-600"
  }

  const getProfitBadgeColor = (profit: number) => {
    return profit >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getTargetAchievementColor = (achievement: number) => {
    if (achievement >= 100) return "text-green-600"
    if (achievement >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const formatDate = (dateString: string) => {
    if (dateString === "ไม่ระบุ") return dateString
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

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Monthly Dashboard</h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-2">ภาพรวมรายเดือน</h2>
          <p className="text-sm sm:text-base text-gray-600">Monthly overview and project performance analysis</p>
          <p className="text-xs sm:text-sm text-gray-500">ภาพรวมและวิเคราะห์ประสิทธิภาพโปรเจครายเดือน</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">เดือน:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-24 sm:w-28 lg:w-32 text-xs sm:text-sm">
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
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">ปี:</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-20 sm:w-24 lg:w-28 text-xs sm:text-sm">
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
      </div>

      {/* Monthly Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-700 mb-1">รายได้รวม</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">
                  {monthlyStats.totalRevenue.toLocaleString('th-TH')} บาท
                </p>
              </div>
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-700 mb-1">ค่าใช้จ่าย</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-900">
                  {monthlyStats.totalExpenses.toLocaleString('th-TH')} บาท
                </p>
              </div>
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">กำไร/ขาดทุน</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${getProfitColor(monthlyStats.totalProfit)}`}>
                  {monthlyStats.totalProfit >= 0 ? "+" : ""}{monthlyStats.totalProfit.toLocaleString('th-TH')} บาท
                </p>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1">โครงการที่ดำเนินการ</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">
                  {monthlyStats.activeProjects}/{monthlyStats.projectCount}
                </p>
              </div>
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Target Achievement - Show for all months, but empty if no target */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg font-medium text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            เป้าหมายรายเดือน
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {monthlyStats.monthlyTarget > 0 ? (
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {monthlyStats.monthlyTarget.toLocaleString('th-TH')} บาท
                </p>
              ) : (
                <p className="text-sm sm:text-base text-gray-500">ยังไม่กำหนดเป้าหมาย</p>
              )}
            </div>
            {monthlyStats.monthlyTarget > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">การบรรลุเป้าหมาย</span>
                  <span className={`font-semibold ${getTargetAchievementColor(monthlyStats.targetAchievement)}`}>
                    {monthlyStats.targetAchievement.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(monthlyStats.targetAchievement, 100)} 
                  className="h-2"
                />
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">ไม่มีเป้าหมายสำหรับเดือนนี้</p>
                <p className="text-xs text-gray-400 mt-1">ไปที่หน้า Monthly Revenue Targets เพื่อตั้งค่า</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Project Performance */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
            <div className="flex items-center justify-between">
              <span>Project Performance</span>
              <span className="text-xs sm:text-sm font-normal text-gray-600">{monthlyData.length} โครงการ</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {monthlyData.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <PieChart className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-600">ไม่มีข้อมูลโครงการในเดือนที่เลือก</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">ลองเปลี่ยนเดือนหรือปีที่ต้องการดู</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {monthlyData.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3 hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {project.projectName}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {project.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadgeColor(project.status)}>
                            {project.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProject(project)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-600">Responsible</p>
                          <p className="font-medium">{project.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Start Date</p>
                          <p className="font-medium">{formatDate(project.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">End Date</p>
                          <p className="font-medium">{formatDate(project.endDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Profit Margin</p>
                          <p className={`font-medium ${getProfitColor(project.profitPercentage)}`}>
                            {project.profitPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Expenses (ค่าใช้จ่าย)</p>
                      <p className="text-sm font-semibold text-red-600">
                        {project.monthlyExpense.toLocaleString('th-TH')} บาท
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Revenue (รายได้)</p>
                      <p className="text-sm font-semibold text-green-600">
                        {project.monthlyRevenue.toLocaleString('th-TH')} บาท
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Profit/Loss (กำไร/ขาดทุน)</p>
                      <p className={`text-sm font-semibold ${getProfitColor(project.cashflow)}`}>
                        {project.cashflow >= 0 ? "+" : ""}{project.cashflow.toLocaleString('th-TH')} บาท
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Project Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">แก้ไขสถานะโครงการ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-sm font-medium">สถานะ</Label>
              <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ status: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-sm">
                ยกเลิก
              </Button>
              <Button onClick={handleSaveProjectStatus} className="text-sm">
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Target Dialog */}
      <Dialog open={isTargetEditDialogOpen} onOpenChange={setIsTargetEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขเป้าหมายรายได้</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target">เป้าหมายรายได้ (บาท)</Label>
              <Input
                id="target"
                type="number"
                value={targetEditFormData.target}
                onChange={(e) => setTargetEditFormData({ target: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกเป้าหมายรายได้"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>เดือน: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
              <p>เป้าหมายปัจจุบัน: {monthlyStats.monthlyTarget.toLocaleString()} บาท</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsTargetEditDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveTarget}>
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
