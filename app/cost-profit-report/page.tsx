"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useNavbar } from "@/components/navbar-context"
import { useAuth } from "@/components/auth-context"
import { projectService } from "@/lib/services/projectService"
import { reportService } from "@/lib/services/reportService"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"
import { salesService } from "@/lib/services/salesService"
import { expenseService } from "@/lib/services/expenseService"
import { dashboardService } from "@/lib/services/dashboardService"

interface ProjectCostProfit {
  id: string
  projectName: string
  type: string
  status: string
  totalCost: number
  totalSales: number
  profit: number
  profitPercentage: number
}

export default function CostProfitReport() {
  const { isEmployeeView } = useNavbar()
  const { toast } = useToast()
  const [filterProjectType, setFilterProjectType] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const [loading, setLoading] = useState(true)
  const [projectReports, setProjectReports] = useState<ProjectCostProfit[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectCostProfit | null>(null)
  const [editFormData, setEditFormData] = useState({
    status: ""
  })

  const projectTypes = ["Software Dev", "Outsource Service", "Other"]
  const projectStatuses = ["กำลังทำ", "เสร็จแล้ว", "ยกเลิก"]

  // Fetch data on component mount and when component becomes visible
  useEffect(() => {
    fetchCostProfitData()
  }, [])

  // Refetch data when component becomes visible (to get latest data)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCostProfitData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchCostProfitData = async () => {
    try {
      setLoading(true)
      
      // ใช้ dashboard service ที่ดึงข้อมูลสัมพันธ์กัน
      const projectSummaries = await dashboardService.getProjectSummaries()
      
      // แปลงข้อมูลให้ตรงกับ interface
      const costProfitData: ProjectCostProfit[] = projectSummaries.map(summary => ({
        id: summary.id,
        projectName: summary.projectName,
        type: summary.type,
        status: summary.status,
        totalCost: summary.totalExpenses,
        totalSales: summary.totalRevenue,
        profit: summary.profit,
        profitPercentage: summary.profitPercentage
      }))
      
      setProjectReports(costProfitData)
      
    } catch (error) {
      console.error('Error fetching cost profit data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      })
      setProjectReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditProject = (project: ProjectCostProfit) => {
    setEditingProject(project)
    setEditFormData({ status: project.status })
    setIsEditDialogOpen(true)
  }

  const handleSaveProjectStatus = async () => {
    if (!editingProject) return

    try {
      const response = await projectService.updateProject({
        projectId: editingProject.id,
        projectName: editingProject.projectName,
        description: "", // We don't have description in this interface
        projectStatus: editFormData.status,
        createdBy: "system"
      })

      if (response.success) {
        toast({
          title: "อัพเดทสำเร็จ",
          description: "อัพเดทสถานะโครงการเรียบร้อยแล้ว",
        })

        // Update the project in the local state
        setProjectReports(prev => 
          prev.map(p => 
            p.id === editingProject.id 
              ? { ...p, status: editFormData.status }
              : p
          )
        )

        setIsEditDialogOpen(false)
        setEditingProject(null)
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

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={getStatusBadgeColor(status)}>
        {status}
      </Badge>
    )
  }

  // กรองข้อมูลตามเงื่อนไข
  const filteredProjects = projectReports.filter(project => {
    const matchesType = filterProjectType === "All" || project.type === filterProjectType
    const matchesStatus = filterStatus === "All" || project.status === filterStatus
    return matchesType && matchesStatus
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
    
    const priorityA = getPriority(a.status)
    const priorityB = getPriority(b.status)
    
    // If same priority, sort by project name
    if (priorityA === priorityB) {
      return a.projectName.localeCompare(b.projectName, 'th')
    }
    
    return priorityA - priorityB
  })

  // คำนวณสถิติรวม
  const totalRevenue = filteredProjects.reduce((sum, project) => sum + project.totalSales, 0)
  const totalCost = filteredProjects.reduce((sum, project) => sum + project.totalCost, 0)
  const totalProfit = filteredProjects.reduce((sum, project) => sum + project.profit, 0)
  const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // ตรวจสอบสิทธิ์
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const isEmployee = user?.role === "employee" || user?.role === "user"

  if (isEmployee && !isAdmin) {
    return (
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
        <div className="text-center py-8 sm:py-12">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-sm sm:text-base text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ในฐานะพนักงาน</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Project Cost & Profit Report</h1>
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 mb-1">รายงานต้นทุนและกำไรโครงการ</h2>
          <p className="text-xs sm:text-sm text-gray-600">Analyze profit and loss for each project</p>
          <p className="text-xs text-gray-500">วิเคราะห์ผลกำไรและขาดทุนของแต่ละโครงการ</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">รายได้รวม</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                {totalRevenue.toLocaleString("th-TH")} บาท
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">ต้นทุนรวม</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                {totalCost.toLocaleString("th-TH")} บาท
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">กำไร/ขาดทุน</p>
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString("th-TH")} บาท
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">อัตรากำไรเฉลี่ย</p>
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${averageProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {averageProfitMargin.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Cost Breakdown */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดรายรับและรายจ่าย</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-green-700">รายได้ (Revenue)</h4>
              <div className="space-y-3">
                {filteredProjects.map((project, index) => (
                  <div key={`revenue-${project.id}-${index}`} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.projectName}</p>
                      <p className="text-xs text-gray-600">{project.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {project.totalSales.toLocaleString()} บาท
                      </p>
                      <p className="text-xs text-gray-500">
                        {totalRevenue > 0 ? ((project.totalSales / totalRevenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
                {filteredProjects.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">ไม่มีข้อมูลรายได้</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-red-700">รายจ่าย (Cost)</h4>
              <div className="space-y-3">
                {filteredProjects.map((project, index) => (
                  <div key={`cost-${project.id}-${index}`} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.projectName}</p>
                      <p className="text-xs text-gray-600">{project.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">
                        {project.totalCost.toLocaleString()} บาท
                      </p>
                      <p className="text-xs text-gray-500">
                        {totalCost > 0 ? ((project.totalCost / totalCost) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
                {filteredProjects.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">ไม่มีข้อมูลรายจ่าย</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex-1">
          <Select value={filterProjectType} onValueChange={setFilterProjectType}>
            <SelectTrigger className="w-full text-xs sm:text-sm">
              <SelectValue placeholder="เลือกประเภทโครงการ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">ทุกประเภท</SelectItem>
              {projectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full text-xs sm:text-sm">
              <SelectValue placeholder="เลือกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">ทุกสถานะ</SelectItem>
              {projectStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    โครงการ
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    ต้นทุน
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    รายได้
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    กำไร/ขาดทุน
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    อัตรากำไร
                  </th>
                  {isAdmin && (
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {project.projectName}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
                        {project.type}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {project.totalCost.toLocaleString("th-TH")} บาท
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {project.totalSales.toLocaleString("th-TH")} บาท
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <span className={`font-medium ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {project.profit >= 0 ? "+" : ""}{project.profit.toLocaleString("th-TH")} บาท
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <span className={`font-medium ${project.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {project.profitPercentage.toFixed(1)}%
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProject(project)}
                          className="p-1 h-auto"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-gray-600">ไม่พบข้อมูลโครงการ</p>
            </div>
          )}
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
                  <p className="text-sm text-gray-900 mt-1">{editingProject.projectName}</p>
                </div>
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">สถานะ</Label>
                  <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ status: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
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
