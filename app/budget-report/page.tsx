"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BarChart3, Loader2, Edit } from "lucide-react"
import { projectService } from "@/lib/services/projectService"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

interface Project {
  id: string
  projectName: string
  type: string
  status: string
  totalCost: number
  totalSales: number
  profit: number
}

interface BudgetData {
  totalBudget: number
  totalActual: number
  totalRemaining: number
  budgetUsage: number
  breakdown: Array<{
    projectName: string
    budget: number
    actual: number
    remaining: number
    usage: number
    id: string
    type: string
    status: string
  }>
}

export default function BudgetReport() {
  const { toast } = useToast()
  const [selectedProject, setSelectedProject] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editFormData, setEditFormData] = useState({
    status: ""
  })
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudget: 0,
    totalActual: 0,
    totalRemaining: 0,
    budgetUsage: 0,
    breakdown: []
  })

  const projectStatuses = [
    { value: "กำลังทำ", label: "กำลังทำ" },
    { value: "เสร็จแล้ว", label: "เสร็จแล้ว" },
    { value: "ยกเลิก", label: "ยกเลิก" }
  ]

  useEffect(() => {
    fetchData()
  }, [selectedProject])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch projects
      const projectsResponse = await projectService.getAllProjects({
        projectName: "",
        type: "",
        status: ""
      })
      
      if (projectsResponse.success && projectsResponse.result?.projects) {
        const allProjects = projectsResponse.result.projects.map((project: any) => ({
          id: project.id,
          projectName: project.projectName,
          type: project.type,
          status: project.status,
          totalCost: project.totalCost || 0,
          totalSales: project.totalSales || 0,
          profit: (project.totalSales || 0) - (project.totalCost || 0)
        }))
        
        setProjects(allProjects)

        // Filter projects based on selection
        const filteredProjects = selectedProject === "all" 
          ? allProjects 
          : allProjects.filter(p => p.id === selectedProject)

        // Calculate budget data
        const totalBudget = filteredProjects.reduce((sum, p) => sum + p.totalSales, 0)
        const totalActual = filteredProjects.reduce((sum, p) => sum + p.totalCost, 0)
        const totalRemaining = totalBudget - totalActual
        const budgetUsage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

        // Create breakdown
        const breakdown = filteredProjects.map(project => {
          const budget = project.totalSales
          const actual = project.totalCost
          const remaining = budget - actual
          const usage = budget > 0 ? (actual / budget) * 100 : 0

          return {
            projectName: project.projectName,
            budget,
            actual,
            remaining,
            usage,
            id: project.id,
            type: project.type,
            status: project.status
          }
        })

        setBudgetData({
          totalBudget,
          totalActual,
          totalRemaining,
          budgetUsage,
          breakdown
        })
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
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
      const response = await projectService.updateProject({
        id: editingProject.id,
        projectName: editingProject.projectName,
        description: "", // We don't have description in this interface
        type: editingProject.type,
        status: editFormData.status
      })

      if (response.success) {
        toast({
          title: "อัพเดทสำเร็จ",
          description: "อัพเดทสถานะโครงการเรียบร้อยแล้ว",
        })

        // Update the project in the local state
        setProjects(prev => 
          prev.map(p => 
            p.id === editingProject.id 
              ? { ...p, status: editFormData.status }
              : p
          )
        )

        // Refresh data to update breakdown
        fetchData()

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

  const getBudgetUsageColor = (usage: number) => {
    if (usage >= 90) return "text-red-600"
    if (usage >= 75) return "text-orange-600"
    return "text-green-600"
  }

  const getBudgetUsageBadgeColor = (usage: number) => {
    if (usage >= 90) return "bg-red-100 text-red-800"
    if (usage >= 75) return "bg-orange-100 text-orange-800"
    return "bg-green-100 text-green-800"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Budget Report</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">รายงานงบประมาณ</h2>
        <p className="text-gray-600">ติดตามและวิเคราะห์การใช้งบประมาณของโครงการ</p>
      </div>

      {/* Project Filter */}
      <div className="mb-8">
        <Label htmlFor="project">เลือกโครงการ</Label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="เลือกโครงการ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกโครงการ</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.projectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">งบประมาณรวม</p>
                <p className="text-2xl font-bold text-blue-600">
                  {budgetData.totalBudget.toLocaleString("th-TH")} บาท
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ใช้จริง</p>
                <p className="text-2xl font-bold text-red-600">
                  {budgetData.totalActual.toLocaleString("th-TH")} บาท
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">คงเหลือ</p>
                <p className={`text-2xl font-bold ${budgetData.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {budgetData.totalRemaining.toLocaleString("th-TH")} บาท
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">การใช้งบประมาณ</p>
                <p className={`text-2xl font-bold ${getBudgetUsageColor(budgetData.budgetUsage)}`}>
                  {budgetData.budgetUsage.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Usage Progress */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-8">
        <CardHeader>
          <CardTitle>การใช้งบประมาณรวม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">งบประมาณที่ใช้แล้ว</span>
              <span className="font-semibold">{budgetData.budgetUsage.toFixed(1)}%</span>
            </div>
            <Progress value={budgetData.budgetUsage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">งบประมาณรวม</p>
                <p className="font-semibold">{budgetData.totalBudget.toLocaleString("th-TH")} บาท</p>
              </div>
              <div>
                <p className="text-gray-600">ใช้จริง</p>
                <p className="font-semibold text-red-600">{budgetData.totalActual.toLocaleString("th-TH")} บาท</p>
              </div>
              <div>
                <p className="text-gray-600">คงเหลือ</p>
                <p className={`font-semibold ${budgetData.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {budgetData.totalRemaining.toLocaleString("th-TH")} บาท
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Breakdown */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>รายละเอียดโครงการ</CardTitle>
        </CardHeader>
        <CardContent>
          {budgetData.breakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      โครงการ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ประเภท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      งบประมาณ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ใช้จริง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คงเหลือ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การใช้
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgetData.breakdown.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.projectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge className={getStatusBadgeColor(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.budget.toLocaleString("th-TH")} บาท
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.actual.toLocaleString("th-TH")} บาท
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.remaining.toLocaleString("th-TH")} บาท
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge className={getBudgetUsageBadgeColor(item.usage)}>
                          {item.usage.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProject({
                            id: item.id,
                            projectName: item.projectName,
                            type: item.type,
                            status: item.status,
                            totalCost: item.actual,
                            totalSales: item.budget,
                            profit: item.remaining
                          })}
                          className="p-1 h-auto"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ไม่พบข้อมูลโครงการ</p>
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
