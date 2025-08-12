"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  DollarSign, 
  Building2, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  ArrowRight,
  AlertTriangle,
  FileText,
  BarChart3,
  Edit,
  TrendingDown,
  Users,
  Target,
  Calculator
} from "lucide-react"
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart
} from 'recharts'
import { projectService } from "@/lib/services/projectService"
import { dashboardService } from "@/lib/services/dashboardService"
import { budgetService } from "@/lib/services/budgetService"
import { revenueService } from "@/lib/services/revenueService"

interface Project {
  id: string
  name: string
  description: string
  type: string
  status: string
  budget: number
  totalCost: number
  totalRevenue: number
  profit: number
  budgetUsagePercentage: number
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

export default function ProjectOverviewDashboard() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editFormData, setEditFormData] = useState({
    status: ""
  })
  const [monthlyTarget, setMonthlyTarget] = useState(0)
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'))
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())

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

  const years = ["2020", "2021", "2022", "2023", "2024", "2025"]

  const projectStatuses = [
    { value: "กำลังทำ", label: "กำลังทำ" },
    { value: "เสร็จแล้ว", label: "เสร็จแล้ว" },
    { value: "ยกเลิก", label: "ยกเลิก" }
  ]

  useEffect(() => {
    fetchProjects()
    fetchDailyData()
  }, [selectedMonth, selectedYear])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      
      // Fetch projects with financial data from dashboard service
      const dashboardResponse = await dashboardService.getDashboardData()
      console.log('Dashboard response:', dashboardResponse)
      
      if (dashboardResponse.success && dashboardResponse.result?.projects) {
        // Use dashboard data which includes financial calculations
        const dashboardProjects = dashboardResponse.result.projects
        
        // Filter projects by date range
        const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1)
        const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0)
        
        const filteredProjects = dashboardProjects.filter((project: any) => {
          // For now, show all projects since dashboard data is already aggregated
          return true
        })
        
        // Map dashboard data to our interface
        const mappedProjects = filteredProjects.map((project: any) => ({
          id: project.id || `project-${Date.now()}`,
          name: project.projectName,
          description: project.description || '',
          type: project.type || 'ไม่ระบุ',
          status: project.status || 'ไม่ระบุ',
          budget: 0, // Will be fetched from budget service
          totalCost: project.totalCost || 0,
          totalRevenue: project.totalSales || 0,
          profit: project.profitLoss || 0,
          budgetUsagePercentage: project.totalCost && project.totalSales ? 
            (project.totalCost / project.totalSales) * 100 : 0
        }))
        
        // Fetch budget data to complete the financial information
        try {
          const budgetResponse = await budgetService.getAllBudgets()
          console.log('Budget response:', budgetResponse)
          
          if (budgetResponse.success && (budgetResponse as any).result?.budget) {
            const budgetData = (budgetResponse as any).result.budget
            
            // Merge budget data with project data
            const projectsWithBudget = mappedProjects.map((project: Project) => {
              const projectBudget = budgetData.find((budget: any) => 
                budget.projectName === project.name
              )
              return {
                ...project,
                budget: projectBudget ? Number(projectBudget.budget) : 0,
                budgetUsagePercentage: projectBudget && project.totalCost ? 
                  (project.totalCost / Number(projectBudget.budget)) * 100 : 0
              }
            })
            
            setProjects(projectsWithBudget)
            console.log('Projects with budget:', projectsWithBudget)
          } else {
            setProjects(mappedProjects)
          }
        } catch (budgetError) {
          console.error('Error fetching budget data:', budgetError)
          setProjects(mappedProjects)
        }
      } else {
        // Fallback to project service if dashboard fails
        console.log('Dashboard service failed, falling back to project service')
        const response = await projectService.getAllProjects({
          projectName: "",
          type: "",
          status: ""
        })
        
        if (response.success && response.result?.projects) {
          // กรองข้อมูลตามเดือนและปีที่เลือก
          const filteredProjects = response.result.projects.filter((project: any) => {
            if (!project.startDate) return true // ถ้าไม่มีวันที่เริ่มต้น ให้แสดงทั้งหมด
            
            const projectDate = new Date(project.startDate)
            const projectMonth = (projectDate.getMonth() + 1).toString().padStart(2, '0')
            const projectYear = projectDate.getFullYear().toString()
            
            return projectMonth === selectedMonth && projectYear === selectedYear
          })
          
          // แปลงข้อมูลให้ตรงกับ interface
          const mappedProjects = filteredProjects.map((project: any) => ({
            id: project.id,
            name: project.projectName,
            description: project.description,
            type: project.type,
            status: project.status,
            budget: project.budget || 0,
            totalCost: project.totalCost || 0,
            totalRevenue: project.totalSales || 0,
            profit: project.profit || 0,
            budgetUsagePercentage: project.budgetPercentage || 0
          }))
          
          setProjects(mappedProjects)
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลโครงการได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setEditFormData({ status: project.status })
    setIsEditDialogOpen(true)
  }

  const handleSaveProjectStatus = async () => {
    if (!editingProject) return

    try {
      // Update the project in the local state
      setProjects(prev => 
        prev.map(p => 
          p.id === editingProject.id 
            ? { ...p, status: editFormData.status }
            : p
        )
      )

      setIsEditDialogOpen(false)
      setEditingProject(null)
      
      toast({
        title: "อัพเดทสำเร็จ",
        description: "อัพเดทสถานะโครงการเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error('Error updating project status:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทสถานะได้",
        variant: "destructive"
      })
    }
  }

  // คำนวณข้อมูลสรุปจาก projects
  const dashboardData = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "กำลังทำ").length,
    completedProjects: projects.filter(p => p.status === "เสร็จแล้ว").length,
    totalRevenue: projects.reduce((sum, p) => sum + p.totalRevenue, 0),
    totalCost: projects.reduce((sum, p) => sum + p.totalCost, 0),
    totalProfit: projects.reduce((sum, p) => sum + p.profit, 0),
    outstandingExpenses: 0 // จะอัพเดทเมื่อมีการเชื่อมต่อกับ expense API
  }
  console.log('Dashboard data:', dashboardData)
  console.log('Projects array:', projects)

  // ข้อมูลสำหรับ Monthly Revenue Chart
  const monthlyRevenueData = projects.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    revenue: project.totalRevenue,
    expense: project.totalCost,
    profit: project.profit
  }))
  console.log('Monthly revenue data:', monthlyRevenueData)

  // ข้อมูลสำหรับ Revenue Donut Chart
  const revenueDonutData = projects.map((project, index) => ({
    name: project.name.length > 12 ? project.name.substring(0, 12) + '...' : project.name,
    value: project.totalRevenue,
    color: COLORS[index % COLORS.length]
  }))
  console.log('Revenue donut data:', revenueDonutData)

  // ข้อมูลสำหรับ Expense Donut Chart
  const expenseDonutData = projects.map((project, index) => ({
    name: project.name.length > 12 ? project.name.substring(0, 12) + '...' : project.name,
    value: project.totalCost,
    color: COLORS[index % COLORS.length]
  }))
  console.log('Expense donut data:', expenseDonutData)

  // ข้อมูลสำหรับ Budget vs Actual Chart
  const budgetVsActualData = projects.filter(p => p.status === "กำลังทำ").map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    budget: project.budget,
    actual: project.totalCost
  }))
  console.log('Budget vs actual data:', budgetVsActualData)

  // ข้อมูลสำหรับ Daily Income/Expense Chart
  const [dailyData, setDailyData] = useState<Array<{date: string, income: number, expense: number}>>([])
  const [monthlyData, setMonthlyData] = useState<{
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyProfit: number;
    projects: any[];
  } | null>(null)
  
  // Fetch daily data and revenue targets
  const fetchDailyData = async () => {
    try {
      console.log('Fetching daily data for:', selectedMonth, selectedYear)
      const response = await dashboardService.getDailyData(selectedMonth, selectedYear)
      console.log('Daily data response:', response)
      
      // Extract monthly target from response
      let monthlyTarget = 0
      if (response?.success && response?.result?.monthlyTarget) {
        monthlyTarget = Number(response.result.monthlyTarget) || 0
        console.log('Monthly target from dashboard:', monthlyTarget)
      }
      
      // If no target from dashboard, try to fetch from revenue service
      if (monthlyTarget === 0) {
        try {
          const targetsResponse = await revenueService.getAllRevenueTargets()
          console.log('Revenue targets response:', targetsResponse)
          
          if (targetsResponse?.success && targetsResponse?.result?.targets) {
            const monthNames = [
              "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
              "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
            ]
            const selectedMonthName = monthNames[parseInt(selectedMonth) - 1]
            const targetKey = `${selectedMonthName} ${selectedYear}`
            
            const target = targetsResponse.result.targets.find((t: any) => {
              const standardKey = `${selectedYear}-${selectedMonth}`
              return t.month === targetKey || t.month === standardKey
            })
            monthlyTarget = (target as any)?.target || 0
            console.log('Monthly target from revenue service:', monthlyTarget, 'for keys:', targetKey, 'or', `${selectedYear}-${selectedMonth}`)
          }
        } catch (targetError) {
          console.error('Error fetching revenue targets:', targetError)
        }
      }
      
      // สร้างข้อมูลรายวันจริงจาก salesEntry และ expenseEntries
      let dailyDataArray: Array<{date: string, income: number, expense: number}> = []
      
      if (response?.success && response?.result) {
        console.log('Dashboard response result:', response.result)
        
        // เก็บข้อมูลรายเดือนแยกต่างหาก
        const monthlyDataObj = {
          monthlyIncome: response.result.monthlyIncome || 0,
          monthlyExpense: response.result.monthlyExpense || 0,
          monthlyProfit: response.result.monthlyProfit || 0,
          projects: response.result.projects || []
        }
        
        setMonthlyData(monthlyDataObj)
        console.log('Set monthly data:', monthlyDataObj)
        
        // ใช้ข้อมูลรายวันที่ส่งมาจาก backend
        if (response.result.dailyData && Array.isArray(response.result.dailyData)) {
          console.log('Using daily data from backend:', response.result.dailyData)
          
          dailyDataArray = response.result.dailyData.map((item: any) => ({
            date: new Date(item.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }),
            income: Math.round(item.income),
            expense: Math.round(item.expense)
          }))
          
          console.log('Processed daily data:', dailyDataArray)
        } else {
          console.log('No daily data from backend, trying to generate from projects')
          // สร้างข้อมูลรายวันจาก projects (fallback)
          if (response.result.projects && Array.isArray(response.result.projects)) {
            const dailyMap = new Map<string, {income: number, expense: number}>()
            
            // รวบรวมข้อมูลรายวันจากทุก projects
            response.result.projects.forEach((project: any) => {
              // รวบรวมข้อมูลรายได้รายวัน
              if (project.salesEntry && Array.isArray(project.salesEntry)) {
                project.salesEntry.forEach((sale: any) => {
                  const saleDate = sale.date
                  const saleAmount = Number(sale.totalPrice) || 0
                  
                  if (dailyMap.has(saleDate)) {
                    const existing = dailyMap.get(saleDate)!
                    existing.income += saleAmount
                  } else {
                    dailyMap.set(saleDate, { income: saleAmount, expense: 0 })
                  }
                })
              }
              
              // รวบรวมข้อมูลรายจ่ายรายวัน
              if (project.expenseEntries && Array.isArray(project.expenseEntries)) {
                project.expenseEntries.forEach((expense: any) => {
                  const expenseDate = expense.date
                  const expenseAmount = Number(expense.cost) || 0
                  
                  if (dailyMap.has(expenseDate)) {
                    const existing = dailyMap.get(expenseDate)!
                    existing.expense += expenseAmount
                  } else {
                    dailyMap.set(expenseDate, { income: 0, expense: expenseAmount })
                  }
                })
              }
            })
            
            // แปลงเป็น array และเรียงตามวันที่
            dailyDataArray = Array.from(dailyMap.entries())
              .map(([date, data]) => ({
                date: new Date(date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }),
                income: Math.round(data.income),
                expense: Math.round(data.expense),
                originalDate: date // เก็บวันที่เดิมไว้สำหรับการเรียงลำดับ
              }))
              .sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime())
              .map(({ originalDate, ...rest }) => rest) // ลบ originalDate ออก
            
            console.log('Generated daily data from projects:', dailyDataArray)
          }
        }
        
        // ถ้าไม่มีข้อมูลรายวันจริง ให้สร้างข้อมูลจากข้อมูลรวม
        if (dailyDataArray.length === 0) {
          console.log('No real daily data, generating from monthly totals')
          const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate()
          const totalIncome = monthlyDataObj.monthlyIncome
          const totalExpense = monthlyDataObj.monthlyExpense
          
          if (totalIncome > 0 || totalExpense > 0) {
            const avgDailyIncome = totalIncome / daysInMonth
            const avgDailyExpense = totalExpense / daysInMonth
            
            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${selectedYear}-${selectedMonth}-${day.toString().padStart(2, '0')}`
              dailyDataArray.push({
                date: new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }),
                income: Math.round(avgDailyIncome),
                expense: Math.round(avgDailyExpense)
              })
            }
          }
        }
        
        setDailyData(dailyDataArray)
        console.log('Final daily data:', dailyDataArray)
      } else {
        console.log('No daily data available, generating from projects')
        // สร้างข้อมูลจาก projects ที่มีอยู่
        const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate()
        const totalIncome = projects.reduce((sum, p) => sum + p.totalRevenue, 0)
        const totalExpense = projects.reduce((sum, p) => sum + p.totalCost, 0)
        
        const avgDailyIncome = totalIncome / daysInMonth
        const avgDailyExpense = totalExpense / daysInMonth
        
        const generatedDailyData = []
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${selectedYear}-${selectedMonth}-${day.toString().padStart(2, '0')}`
          generatedDailyData.push({
            date: new Date(dateStr).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }),
            income: Math.round(avgDailyIncome),
            expense: Math.round(avgDailyExpense)
          })
        }
        
        setDailyData(generatedDailyData)
        console.log('Generated daily data from projects:', generatedDailyData)
      }
      
      // Store monthly target for use in calculations
      setMonthlyTarget(monthlyTarget)
    } catch (error) {
      console.error('Error fetching daily data:', error)
      // Fallback to empty array if API fails
      setDailyData([])
    }
  }

        // คำนวณข้อมูลสรุปจากข้อมูลจริง
      const totalIncome = Array.isArray(dailyData) ? dailyData.reduce((sum, day) => sum + (day.income || 0), 0) : 0
      const totalExpense = Array.isArray(dailyData) ? dailyData.reduce((sum, day) => sum + (day.expense || 0), 0) : 0
      const netIncome = totalIncome - totalExpense
      
      // ใช้ข้อมูลจาก backend ถ้ามี
      const backendIncome = monthlyData?.monthlyIncome || 0
      const backendExpense = monthlyData?.monthlyExpense || 0
      const backendProfit = monthlyData?.monthlyProfit || 0
      
      // ใช้ข้อมูลจาก projects แทน dailyData เพราะข้อมูลถูกต้องกว่า
      const projectIncome = projects.reduce((sum, p) => sum + p.totalRevenue, 0)
      const projectExpense = projects.reduce((sum, p) => sum + p.totalCost, 0)
      const projectProfit = projects.reduce((sum, p) => sum + p.profit, 0)
      
      // ใช้ข้อมูลจาก backend ถ้ามี มิฉะนั้นใช้ข้อมูลจาก projects
      const finalIncome = backendIncome > 0 ? backendIncome : projectIncome
      const finalExpense = backendExpense > 0 ? backendExpense : projectExpense
      const finalNetIncome = backendProfit !== 0 ? backendProfit : projectProfit
      
      console.log('Data sources:', {
        monthlyData: monthlyData,
        backendIncome,
        backendExpense,
        backendProfit,
        projectIncome,
        projectExpense,
        projectProfit,
        finalIncome,
        finalExpense,
        finalNetIncome
      })

  // ข้อมูลสรุปโครงการ
  const activeProjects = projects.filter(p => p.status === "กำลังทำ")
  const completedProjects = projects.filter(p => p.status === "เสร็จแล้ว")
  const cancelledProjects = projects.filter(p => p.status === "ยกเลิก")
  
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
  const totalCost = projects.reduce((sum, p) => sum + p.totalCost, 0)
  const totalRevenue = projects.reduce((sum, p) => sum + p.totalRevenue, 0)
  const totalProfit = projects.reduce((sum, p) => sum + p.profit, 0)

  const getStatusColor = (status: string) => {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Software Dev":
        return "bg-purple-100 text-purple-800"
      case "Outsource Service":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? "text-green-600" : "text-red-600"
  }

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-orange-600"
    return "text-green-600"
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm lg:text-base text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">ภาพรวมโครงการ</h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          ติดตามสถานะและผลการดำเนินงานของโครงการทั้งหมด - เดือน {months.find(m => m.value === selectedMonth)?.label} ปี {selectedYear}
        </p>
      </div>

      {/* Month/Year Selector */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">เลือกเดือน:</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-24 sm:w-28 lg:w-32 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">เลือกปี:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-20 sm:w-24 lg:w-28 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Link href="/projects">
            <Button variant="outline" className="w-full h-auto p-2 sm:p-3 lg:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 hover:shadow-md">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-600" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">เพิ่มโครงการ</span>
            </Button>
          </Link>
          <Link href="/budget-management">
            <Button variant="outline" className="w-full h-auto p-2 sm:p-3 lg:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 hover:shadow-md">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">จัดการงบประมาณ</span>
            </Button>
          </Link>
          <Link href="/sales-entry">
            <Button variant="outline" className="w-full h-auto p-2 sm:p-3 lg:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200 hover:shadow-md">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">จ่ายรับ</span>
            </Button>
          </Link>
          <Link href="/expense-entry">
            <Button variant="outline" className="w-full h-auto p-2 sm:p-3 lg:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">รายจ่าย</span>
            </Button>
          </Link>
          <Link href="/outstanding-expenses">
            <Button variant="outline" className="w-full h-auto p-2 sm:p-3 lg:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-red-50 hover:border-red-300 transition-all duration-200 hover:shadow-md">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-600" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">ค่าใช้จ่ายค้างจ่าย</span>
            </Button>
          </Link>
          <Link href="/cost-profit-report">
            <Button variant="outline" className="w-full h-auto p-2 sm:p-3 lg:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 hover:shadow-md">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-600" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">รายงานกำไร-ขาดทุน</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Monthly Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-green-700 mb-1">รายรับประจำเดือน</p>
                <p className="text-lg lg:text-xl xl:text-2xl font-bold text-green-900">
                  {Math.round(finalIncome).toLocaleString('th-TH')}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-orange-700 mb-1">รายจ่ายประจำเดือน</p>
                <p className="text-lg lg:text-xl xl:text-2xl font-bold text-orange-900">
                  {Math.round(finalExpense).toLocaleString('th-TH')}
                </p>
              </div>
              <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-blue-700 mb-1">รายรับ-รายจ่าย</p>
                <p className={`text-lg lg:text-xl xl:text-2xl font-bold ${finalNetIncome >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                  {Math.round(finalNetIncome).toLocaleString('th-TH')}
                </p>
              </div>
              <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-purple-700 mb-1">เป้าหมายรายได้</p>
                <p className="text-lg lg:text-xl xl:text-2xl font-bold text-purple-900">
                  {monthlyTarget > 0 ? Math.round(monthlyTarget).toLocaleString('th-TH') : 'ยังไม่กำหนด'}
                </p>
                {monthlyTarget > 0 && (
                  <p className="text-xs text-purple-600 mt-1">
                    ความก้าวหน้า: {((finalIncome / monthlyTarget) * 100).toFixed(1)}%
                  </p>
                )}
                {monthlyTarget === 0 && (
                  <Link href="/monthly-targets">
                    <Button size="sm" variant="outline" className="mt-2 text-xs">
                      ตั้งเป้าหมาย
                    </Button>
                  </Link>
                )}
              </div>
              <Target className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Overview Report */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-blue-700 mb-1">โครงการทั้งหมด</p>
                <p className="text-lg lg:text-xl xl:text-2xl font-bold text-blue-900">{projects.length}</p>
              </div>
              <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-orange-700 mb-1">กำลังดำเนินการ</p>
                <p className="text-lg lg:text-xl xl:text-2xl font-bold text-orange-900">{activeProjects.length}</p>
              </div>
              <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-green-700 mb-1">เสร็จสิ้น</p>
                <p className="text-lg lg:text-xl xl:text-2xl font-bold text-green-900">{completedProjects.length}</p>
              </div>
              <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-red-700 mb-1">ยกเลิก</p>
                <p className="text-lg lg:text-xl xl:text-2xl font-bold text-red-900">{cancelledProjects.length}</p>
              </div>
              <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        {/* Monthly Project Breakdown Donut Charts */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg font-medium text-gray-700">รายรับแยกตามโครงการ</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="w-full h-40 sm:h-48 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value.toLocaleString('th-TH')} บาท`, 'รายรับ']} />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm lg:text-base font-medium text-gray-700">รายจ่ายแยกตามโครงการ</CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4">
            <div className="w-full h-48 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value.toLocaleString('th-TH')} บาท`, 'รายจ่าย']} />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Income and Expense for Each Project */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm lg:text-base font-medium text-gray-700">รายรับรายจ่ายของแต่ละโครงการ</CardTitle>
        </CardHeader>
        <CardContent className="p-3 lg:p-4">
          <div className="w-full h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ left: 10, right: 10, bottom: 100, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value.toLocaleString('th-TH')} บาท`, '']} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="revenue" fill="#4CAF50" name="รายรับ" />
                <Bar dataKey="expense" fill="#FF9800" name="รายจ่าย" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Actual for Unfinished Projects */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm lg:text-base font-medium text-gray-700">Budget vs Actual ของโครงการที่ยังไม่จบ</CardTitle>
        </CardHeader>
        <CardContent className="p-3 lg:p-4">
          <div className="w-full h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} margin={{ left: 10, right: 10, bottom: 100, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${value.toLocaleString('th-TH')} บาท`, '']} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="budget" fill="#4CAF50" name="งบประมาณ" />
                <Bar dataKey="actual" fill="#FFC107" name="ค่าใช้จ่ายจริง" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Income/Expense Chart */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm lg:text-base font-medium text-gray-700">
            กราฟยอดรายรับ รายจ่ายรายวัน
            <span className="text-xs text-gray-500 ml-2">
              (ข้อมูลจริงจาก Sales & Expenses)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 lg:p-4">
          {dailyData.length === 0 ? (
            <div className="w-full h-64 lg:h-80 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">ไม่มีข้อมูลรายวันในเดือนที่เลือก</p>
                <p className="text-xs text-gray-500">
                  ข้อมูลจะแสดงเมื่อมีการบันทึก Sales หรือ Expenses ในเดือนนี้
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyData} margin={{ left: 10, right: 10, bottom: 60, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${value.toLocaleString('th-TH')} บาท`, '']}
                    labelFormatter={(label) => `วันที่ ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="income" fill="#4CAF50" name="รายรับ" />
                  <Bar dataKey="expense" fill="#FF9800" name="รายจ่าย" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 text-xs text-gray-500">
            <p>ข้อมูลจาก: Sales Entries และ Expense Entries ในเดือน {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
            <p>จำนวนวันที่มีข้อมูล: {dailyData.length} วัน</p>
          </div>
        </CardContent>
      </Card>





      {/* Edit Project Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขสถานะโครงการ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingProject && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-700">ชื่อโครงการ</Label>
                  <p className="text-sm text-gray-900 mt-1">{editingProject.name}</p>
                </div>
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">สถานะ</Label>
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
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleSaveProjectStatus}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    บันทึก
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
