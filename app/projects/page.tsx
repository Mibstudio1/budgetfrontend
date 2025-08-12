"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Edit, Trash2, Search, BarChart3, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"
import { projectService, Project as ServiceProject } from "@/lib/services/projectService"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-context"
import { dashboardService, categoryService } from "@/lib/services"

type Project = ServiceProject & {
  startDate?: string
  endDate?: string
}

export default function ProjectsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [projectTypes, setProjectTypes] = useState<Array<{value: string, label: string}>>([])

  // ฟอร์มสำหรับเพิ่ม/แก้ไขโปรเจค
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    projectGroup: "",
    customProjectGroup: "",
    projectStatus: "กำลังทำ",
    startDate: "",
    endDate: ""
  })

  // ฟังก์ชัน reset ฟอร์ม
  const resetForm = () => {
    setFormData({
      projectName: "",
      description: "",
      projectGroup: "",
      customProjectGroup: "",
      projectStatus: "กำลังทำ",
      startDate: "",
      endDate: ""
    })
    setEditingProject(null)
  }

  // ฟังก์ชันจัดการการเปิด/ปิด dialog
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      // เมื่อปิด dialog ให้ reset ฟอร์ม
      resetForm()
    }
  }



  const projectStatuses = [
    { value: "กำลังทำ", label: "กำลังทำ" },
    { value: "เสร็จแล้ว", label: "เสร็จแล้ว" },
    { value: "ยกเลิก", label: "ยกเลิก" }
  ]

  useEffect(() => {
    fetchProjects()
    fetchProjectTypes()
  }, [])

  const fetchProjectTypes = async () => {
    try {
      const response = await categoryService.getSalesCategories()
      if (response.success && response.result && response.result.result && Array.isArray(response.result.result)) {
        const types = response.result.result.map((category: any) => ({
          value: category.name,
          label: category.name
        }))
        // เพิ่ม "อื่นๆ" option
        types.push({ value: "อื่นๆ", label: "อื่นๆ" })
        setProjectTypes(types)
        console.log('Project types loaded:', types)
      } else {
        // Fallback to default types
        setProjectTypes([
          { value: "Software Dev", label: "Software Dev" },
          { value: "Outsource Service", label: "Outsource Service" },
          { value: "อื่นๆ", label: "อื่นๆ" }
        ])
      }
    } catch (error) {
      console.error('Error fetching project types:', error)
      // Fallback to default types
      setProjectTypes([
        { value: "Software Dev", label: "Software Dev" },
        { value: "Outsource Service", label: "Outsource Service" },
        { value: "อื่นๆ", label: "อื่นๆ" }
      ])
    }
  }

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const result = await projectService.getAllProjects({
        projectName: "",
        type: "",
        status: ""
      })
      console.log('Projects API result:', result)
      
      // Handle different response structures
      let rawProjects = []
      if (result?.result?.projects) {
        rawProjects = result.result.projects
      } else if ((result as any)?.projects) {
        rawProjects = (result as any).projects
      } else if (Array.isArray(result)) {
        rawProjects = result
      } else {
        console.warn('Unexpected projects response structure:', result)
        rawProjects = []
      }

      console.log('Raw projects sample:', rawProjects[0])

      // ดึงข้อมูลทางการเงินจาก dashboard API
      let dashboardData = null
      try {
        const dashResult = await dashboardService.getDashboardData()
        dashboardData = (dashResult as any)?.result?.projects || []
        console.log('Dashboard data:', dashboardData)
      } catch (error) {
        console.warn('Cannot fetch dashboard data:', error)
      }

      // Process projects with financial calculations
      const processedProjects = rawProjects.map((project: any) => {
        console.log('Processing project:', project.projectName || project.name, {
          BG_Budget: project.BG_Budget,
          expenseEntries: project.expenseEntries,
          salesEntry: project.salesEntry,
          rawProject: project
        })
        
        // ใช้ข้อมูลจาก relations ที่ส่งมาจาก backend
        // คำนวณ budget จาก BG_Budget relations
        const budget = project.BG_Budget?.reduce((sum: number, b: any) => sum + (Number(b.budget) || 0), 0) || 0
        
        // คำนวณ totalCost จาก expenseEntries relations
        const totalCost = project.expenseEntries?.reduce((sum: number, exp: any) => sum + (Number(exp.cost) || 0), 0) || 0
        
        // คำนวณ totalSales จาก salesEntry relations
        const totalSales = project.salesEntry?.reduce((sum: number, sale: any) => sum + (Number(sale.totalPrice) || 0), 0) || 0
        
        // คำนวณ profit
        const profit = totalSales - totalCost
        
        // คำนวณ profit percentage
        const profitPercentage = totalSales > 0 ? (profit / totalSales) * 100 : 0
        
        // คำนวณ budget usage percentage
        const budgetPercentage = budget > 0 ? (totalCost / budget) * 100 : 0
        
        // ตรวจสอบ budget status
        const budgetStatus = budget > 0 ? (totalCost > budget ? 'เกินงบประมาณ' : 'ปกติ') : 'ไม่ระบุ'
        
        return {
          id: project.id,
          projectName: project.projectName || project.name,
          description: project.description || '',
          type: project.type || 'ไม่ระบุ',
          status: project.status || 'ไม่ระบุ',
          startDate: project.startDate || null,
          endDate: project.endDate || null,
          budget: budget,
          totalCost: totalCost,
          totalSales: totalSales,
          profit: profit,
          profitPercentage: profitPercentage,
          budgetPercentage: budgetPercentage,
          budgetStatus: budgetStatus,
          createdBy: project.createdBy || 'ไม่ระบุ',
          createdAt: project.createdAt || null,
          updatedAt: project.updatedAt || null
        }
      })

      console.log('Processed projects:', processedProjects)
      setProjects(processedProjects)
      
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

  const handleAddProject = () => {
    console.log('Adding new project - resetting form')
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditProject = (project: Project) => {
    console.log('Editing project:', project)
    setEditingProject(project)
    
    // Check if project type is a custom type (not in predefined list)
    const predefinedTypes = ["Software Dev", "Outsource Service", "Other"]
    const isCustomType = !predefinedTypes.includes(project.type)
    
    setFormData({
      projectName: project.projectName,
      description: project.description,
      projectGroup: isCustomType ? "Other" : project.type,
      customProjectGroup: isCustomType ? project.type : "",
      projectStatus: project.status ?? "กำลังทำ",
      startDate: project.startDate || "",
      endDate: project.endDate || ""
    })
    setIsDialogOpen(true)
  }

  const handleSaveProject = async () => {
    if (!formData.projectName || !formData.projectGroup) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อโครงการและประเภทโครงการ",
        variant: "destructive"
      })
      return
    }

    // Check if "อื่นๆ" is selected but no custom type is provided
    if (formData.projectGroup === "อื่นๆ" && !formData.customProjectGroup.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกประเภทโครงการเพิ่มเติม",
        variant: "destructive"
      })
      return
    }

    try {
      const createdBy = user?.name || "system"
      let finalProjectGroup = formData.projectGroup
      
      // If "อื่นๆ" is selected, create new category and use custom type
      if (formData.projectGroup === "อื่นๆ") {
        try {
          const categoryResponse = await categoryService.createCategory({
            name: formData.customProjectGroup.trim(),
            type: 'sales',
            description: `ประเภทโครงการ: ${formData.customProjectGroup.trim()}`,
            createdBy: createdBy
          })
          
          if (categoryResponse.success) {
            finalProjectGroup = formData.customProjectGroup.trim()
            // Refresh project types
            await fetchProjectTypes()
            toast({
              title: "เพิ่มประเภทใหม่",
              description: `เพิ่มประเภท "${formData.customProjectGroup.trim()}" เรียบร้อยแล้ว`,
            })
          } else {
            console.error('Failed to create category:', categoryResponse)
          }
        } catch (error) {
          console.error('Error creating category:', error)
        }
      }
      
      const projectData = {
        projectName: formData.projectName,
        description: formData.description,
        projectGroup: finalProjectGroup,
        projectStatus: formData.projectStatus,
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdBy: createdBy
      }

      if (editingProject) {
        // อัพเดทโครงการ
        console.log('Updating project:', editingProject.id, projectData)
        const response = await projectService.updateProject({
          projectId: editingProject.id,
          projectName: formData.projectName,
          description: formData.description,
          projectGroup: finalProjectGroup,
          projectStatus: formData.projectStatus,
          createdBy
        })
        console.log('Update response:', response)
        
        if (Array.isArray(response) || 
            (response && typeof response === 'object' && (response as any).success) || 
            (typeof response === 'string' && (response as string).includes('success'))) {
          toast({
            title: "แก้ไขสำเร็จ",
            description: "แก้ไขโครงการเรียบร้อยแล้ว",
          })
          handleDialogChange(false)
          fetchProjects()
        } else {
          const errorMessage = (response as any)?.message || (response as any)?.error || "ไม่สามารถแก้ไขโครงการได้"
          console.error('Update failed:', errorMessage)
          toast({
            title: "แก้ไขไม่สำเร็จ",
            description: errorMessage,
            variant: "destructive"
          })
        }
      } else {
        // เพิ่มโครงการใหม่
        console.log('Creating project:', projectData)
        const response = await projectService.createProject(projectData)
        console.log('Create response:', response)
        
        if (Array.isArray(response) || 
            (response && typeof response === 'object' && (response as any).success) || 
            (typeof response === 'string' && (response as string).includes('success'))) {
          
          toast({
            title: "สร้างสำเร็จ",
            description: "สร้างโครงการเรียบร้อยแล้ว กรุณาไปตั้งงบประมาณในหน้า 'จัดการงบประมาณ'",
          })
          handleDialogChange(false)
          setTimeout(() => {
            fetchProjects()
          }, 1000)
        } else {
          const errorMessage = (response as any)?.message || (response as any)?.error || "ไม่สามารถสร้างโครงการได้"
          console.error('Create failed:', errorMessage)
          toast({
            title: "สร้างไม่สำเร็จ",
            description: errorMessage,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error saving project:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกโครงการได้",
        variant: "destructive"
      })
    }
  }

  const handleCancelProject = async (project: Project) => {
    if (!confirm(`คุณต้องการยกเลิกโครงการ "${project.projectName}" หรือไม่?`)) {
      return
    }

    try {
      const createdBy = user?.name || "system"
      console.log('Canceling project:', project.id)
      const response = await projectService.updateProject({
        projectId: project.id,
        projectName: project.projectName,
        description: project.description,
        projectStatus: "ยกเลิก",
        createdBy
      })
      console.log('Cancel response:', response)
      console.log('Response type:', typeof response)
      console.log('Response success:', response?.success)
      console.log('Response message:', response?.message)
      
      if (Array.isArray(response) || 
          (response && typeof response === 'object' && (response as any).success) || 
          (typeof response === 'string' && (response as string).includes('success'))) {
        toast({
          title: "ยกเลิกสำเร็จ",
          description: "ยกเลิกโครงการเรียบร้อยแล้ว",
        })
        fetchProjects()
      } else {
        const errorMessage = (response as any)?.message || (response as any)?.error || "ไม่สามารถยกเลิกโครงการได้"
        console.error('Cancel failed:', errorMessage)
        toast({
          title: "ยกเลิกไม่สำเร็จ",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error canceling project:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยกเลิกโครงการได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm("คุณต้องการลบโครงการนี้หรือไม่?")) {
      return
    }

    try {
      console.log('Deleting project:', id)
      const response = await projectService.deleteProject(id)
      console.log('Delete response:', response)
      console.log('Response type:', typeof response)
      console.log('Response success:', response?.success)
      console.log('Response message:', response?.message)
      
      // ถ้า response เป็น array (backend returns []) หรือ success response
      if (Array.isArray(response) || 
          (response && typeof response === 'object' && (response as any).success) || 
          (typeof response === 'string' && (response as string).includes('success'))) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบโครงการเรียบร้อยแล้ว",
        })
        fetchProjects()
      } else {
        // ถ้า response มี message ให้แสดง message นั้น
        const errorMessage = (response as any)?.message || (response as any)?.error || "ไม่สามารถลบโครงการได้"
        console.error('Delete failed:', errorMessage)
        
        // แม้จะ error ก็ให้ refresh เพื่อดูสถานะล่าสุด
        fetchProjects()
        
        toast({
          title: "ลบไม่สำเร็จ",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "กำลังทำ":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>กำลังทำ</span>
            </div>
          </Badge>
        )
      case "เสร็จแล้ว":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>เสร็จแล้ว</span>
            </div>
          </Badge>
        )
      case "ยกเลิก":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>ยกเลิก</span>
            </div>
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
            {status}
          </Badge>
        )
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Software Dev":
        return "bg-purple-100 text-purple-800"
      case "Outsource Service":
        return "bg-orange-100 text-orange-800"
      case "Other":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? "text-green-600" : "text-red-600"
  }

  const getBudgetUsageColor = (percentage: number) => {
    if (percentage > 100) return "text-red-600"
    if (percentage > 80) return "text-orange-600"
    return "text-green-600"
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

  // ตรวจสอบสิทธิ์
  const isAdmin = user?.role === "admin"
  const isEmployee = user?.role === "employee" || user?.role === "user"

  // กรองข้อมูล
  const filteredProjects = projects.filter(project => {
    if (!project) return false
    
    const matchesSearch = (project.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || project.type === filterType
    const matchesStatus = filterStatus === "all" || project.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  }).sort((a, b) => {
    // Sort projects: กำลังทำ first, then ยกเลิก, then เสร็จแล้ว last
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
    
    const priorityA = getPriority(a.status || '')
    const priorityB = getPriority(b.status || '')
    
    // If same priority, sort by project name
    if (priorityA === priorityB) {
      return (a.projectName || '').localeCompare(b.projectName || '', 'th')
    }
    
    return priorityA - priorityB
  })

  // คำนวณสถิติ
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === "กำลังทำ").length
  const completedProjects = projects.filter(p => p.status === "เสร็จแล้ว").length
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
  const totalCost = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0)
  const totalSales = projects.reduce((sum, p) => sum + (p.totalSales || 0), 0)
  const totalProfit = projects.reduce((sum, p) => sum + (p.profit || 0), 0)
  const averageProfitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Project Management</h1>
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 mb-1">จัดการโครงการ</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">
          {isAdmin ? "สร้างและจัดการโครงการ พร้อมติดตามงบประมาณและผลกำไร" : "ดูข้อมูลโครงการและติดตามสถานะ"}
        </p>

        {isEmployee && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>หมายเหตุ:</strong> คุณสามารถดูข้อมูลโครงการได้ แต่ไม่สามารถเพิ่ม แก้ไข หรือลบโครงการได้
            </p>
          </div>
        )}
      </div>

      {/* สถิติภาพรวม */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">Total Projects</h3>
                <p className="text-xs text-gray-600 mb-2 truncate">โครงการทั้งหมด</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{totalProjects}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">Active Projects</h3>
                <p className="text-xs text-gray-600 mb-2 truncate">โครงการที่กำลังดำเนินการ</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{activeProjects}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">Total Budget</h3>
                <p className="text-xs text-gray-600 mb-2 truncate">งบประมาณรวม</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{totalBudget.toLocaleString()} บาท</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">Total Profit</h3>
                <p className="text-xs text-gray-600 mb-2 truncate">กำไรรวม</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${getProfitColor(totalProfit)}`}>
                  {totalProfit.toLocaleString()} บาท
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ฟิลเตอร์และค้นหา */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ค้นหาโครงการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-xs sm:text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
              <SelectValue placeholder="ประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-types" value="all">ทุกประเภท</SelectItem>
              {projectTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-status" value="all">ทุกสถานะ</SelectItem>
              {projectStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs">
                  <Plus className="w-4 h-4 mr-1" />
                  เพิ่มโครงการ
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">
                  {editingProject ? "แก้ไขโครงการ" : "เพิ่มโครงการใหม่"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="projectName" className="text-xs sm:text-sm">ชื่อโครงการ</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-xs sm:text-sm">รายละเอียด</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-xs sm:text-sm">ประเภท</Label>
                  <Select value={formData.projectGroup || ""} onValueChange={(value) => setFormData({...formData, projectGroup: value, customProjectGroup: value === "อื่นๆ" ? formData.customProjectGroup : ""})}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.projectGroup === "อื่นๆ" && (
                  <div>
                    <Label htmlFor="customType" className="text-xs sm:text-sm">ประเภทเพิ่มเติม</Label>
                    <Input
                      id="customType"
                      value={formData.customProjectGroup}
                      onChange={(e) => setFormData({...formData, customProjectGroup: e.target.value})}
                      placeholder="กรุณาระบุประเภทโครงการ"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="status" className="text-xs sm:text-sm">สถานะ</Label>
                  <Select value={formData.projectStatus || ""} onValueChange={(value) => setFormData({...formData, projectStatus: value})}>
                    <SelectTrigger className="text-xs sm:text-sm">
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
                <div>
                  <Label htmlFor="startDate" className="text-xs sm:text-sm">วันที่เริ่มต้น</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs sm:text-sm">วันที่สิ้นสุด</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveProject} className="flex-1 text-xs">
                    {editingProject ? "แก้ไข" : "เพิ่ม"}
                  </Button>
                  <Button variant="outline" onClick={() => handleDialogChange(false)} className="text-xs">
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* รายการโครงการ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">{project.projectName}</h3>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                  <div className="flex gap-1">
                    {getStatusBadge(project.status ?? "")}
                    <Badge variant="outline" className={`text-xs ${getTypeColor(project.type)}`}>
                      {project.type}
                    </Badge>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                      className="p-1 h-6 w-6"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    {project.status !== "ยกเลิก" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelProject(project)}
                        className="p-1 h-6 w-6 text-orange-600 hover:text-orange-700"
                        title="ยกเลิกโครงการ"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {/* Project Dates */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">เริ่มต้น</p>
                  <p className="font-medium text-gray-900">{formatDate(project.startDate ?? "ไม่ระบุ")}</p>
                </div>
                <div>
                  <p className="text-gray-600">สิ้นสุด</p>
                  <p className="font-medium text-gray-900">{formatDate(project.endDate ?? "ไม่ระบุ")}</p>
                </div>
              </div>
              
              {/* Financial Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">งบประมาณ</p>
                  <p className="font-semibold text-gray-900">
                    {(project.budget || 0).toLocaleString()} บาท
                    {project.budget === 0 && <span className="text-gray-400 text-xs block">ยังไม่ได้ตั้งงบประมาณ</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">ใช้แล้ว</p>
                  <p className="font-semibold text-gray-900">
                    {(project.totalCost || 0).toLocaleString()} บาท
                    {project.totalCost === 0 && <span className="text-gray-400 text-xs block">ยังไม่มีค่าใช้จ่าย</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">รายได้</p>
                  <p className="font-semibold text-gray-900">
                    {(project.totalSales || 0).toLocaleString()} บาท
                    {project.totalSales === 0 && <span className="text-gray-400 text-xs block">ยังไม่มียอดขาย</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">กำไร/ขาดทุน</p>
                  <p className={`font-semibold ${getProfitColor(project.profit || 0)}`}>
                    {(project.profit || 0).toLocaleString()} บาท
                    {project.profit === 0 && project.totalSales === 0 && project.totalCost === 0 && 
                     <span className="text-gray-400 text-xs block">รอข้อมูลรายรับ-จ่าย</span>}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">การใช้งบประมาณ</span>
                  <span className={`font-medium ${getBudgetUsageColor(project.budgetPercentage || 0)}`}>
                    {(project.budgetPercentage || 0).toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(project.budgetPercentage || 0, 100)} className="h-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && !isLoading && (
        <div className="text-center py-8 sm:py-12">
          <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">ไม่พบข้อมูลโครงการ</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">ไม่มีโครงการที่ตรงกับเงื่อนไขการค้นหา</p>
          {isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-xs text-blue-800 mb-2">
                <strong>หมายเหตุ:</strong> ข้อมูลทางการเงิน (งบประมาณ, ค่าใช้จ่าย, รายได้) จะแสดงเมื่อ:
              </p>
              <ul className="text-xs text-blue-700 text-left space-y-1">
                <li>• ตั้งงบประมาณในหน้า "จัดการงบประมาณ"</li>
                <li>• บันทึกค่าใช้จ่ายในหน้า "บันทึกค่าใช้จ่าย"</li>
                <li>• บันทึกยอดขายในหน้า "บันทึกยอดขาย"</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
