"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

import { Plus, Edit, Trash2, DollarSign, BarChart3 } from "lucide-react"
import { projectService } from "@/lib/services/projectService"
import { budgetService, Budget } from "@/lib/services/budgetService"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-context"

// ข้อมูลโปรเจคจากระบบจัดการโปรเจค (สำหรับเลือกในฟอร์ม)
interface Project {
  id: string
  projectName: string
  description: string
  type: string
  status: string
  budget?: number
}

export default function BudgetManagement() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ข้อมูลงบประมาณ (สามารถจัดการได้)
  const [budgets, setBudgets] = useState<Budget[]>([])
  
  // ข้อมูลโปรเจคจากระบบจัดการโปรเจค (สำหรับเลือกในฟอร์ม)
  const [projects, setProjects] = useState<Project[]>([])

  // ฟอร์มสำหรับเพิ่ม/แก้ไขงบประมาณ
  const [formData, setFormData] = useState({
    projectId: "",
    projectName: "",
    description: "",
    type: "",
    budget: "",
    status: "กำลังทำ" as "กำลังทำ" | "เสร็จแล้ว" | "ยกเลิก",
    createdBy: "user" // Default value for createdBy
  })

  useEffect(() => {
    // ดึงข้อมูลโปรเจคและงบประมาณ
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // ดึงข้อมูลโปรเจค
        const projectResponse = await projectService.getAllProjects({
          projectName: "",
          type: "",
          status: ""
        })
        
        if (projectResponse.success && projectResponse.result?.projects) {
          setProjects(projectResponse.result.projects)
        }

        // ดึงข้อมูลงบประมาณ
        const budgetResponse = await budgetService.getAllBudgets()
        
        if (budgetResponse.success && (budgetResponse as any).result?.budget) {
          const budgetData = (budgetResponse as any).result.budget.map((item: any, index: number) => ({
            id: item.budgetId || `budget-${Date.now()}-${index}`, // Use budgetId from backend
            projectId: item.projectId || '',
            projectName: item.projectName,
            description: item.description,
            type: item.projectType,
            budget: Number(item.budget) || 0,
            usedBudget: Number(item.usedBudget) || 0, // Use data from backend
            remainingBudget: Number(item.remainingBudget) || 0, // Use data from backend
            status: item.projectStatus as "กำลังทำ" | "เสร็จแล้ว" | "ยกเลิก",
            createdAt: item.createdAt || new Date().toISOString()
          }))
          setBudgets(budgetData)
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

    fetchData()
  }, [toast])

  const handleAddBudget = () => {
    setEditingBudget(null)
    setFormData({
      projectId: "",
      projectName: "",
      description: "",
      type: "",
      budget: "",
      status: "กำลังทำ",
      createdBy: "user"
    })
    setIsDialogOpen(true)
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      projectId: budget.projectId,
      projectName: budget.projectName,
      description: budget.description,
      type: budget.type,
      budget: budget.budget.toString(),
      status: budget.status,
      createdBy: "user" // Default value for createdBy
    })
    setIsDialogOpen(true)
  }

  const handleProjectSelect = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId)
    if (selectedProject) {
      setFormData(prev => ({
        ...prev,
        projectId: selectedProject.id,
        projectName: selectedProject.projectName,
        description: selectedProject.description,
        type: selectedProject.type,
        status: (selectedProject.status as "กำลังทำ" | "เสร็จแล้ว" | "ยกเลิก") || "กำลังทำ",
        budget: selectedProject.budget?.toString() || "0",
        createdBy: "user" // Default value for createdBy
      }))
    }
  }

  const handleSaveBudget = async () => {
    if (!formData.projectId || !formData.budget) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingBudget) {
        // แก้ไขงบประมาณ
        const updateData = {
          description: formData.description,
          budget: parseFloat(formData.budget) || 0
        }
        const response = await budgetService.updateBudget(editingBudget.id, updateData)
        if (response.success) {
          toast({
            title: "แก้ไขสำเร็จ",
            description: "แก้ไขงบประมาณเรียบร้อยแล้ว",
          })
          // อัปเดตข้อมูลใน state
          setBudgets(prev => prev.map(b => 
            b.id === editingBudget.id ? { 
              ...b, 
              description: formData.description,
              budget: parseFloat(formData.budget)
            } : b
          ))
        } else {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถแก้ไขงบประมาณได้",
            variant: "destructive"
          })
        }
      } else {
        // เพิ่มงบประมาณใหม่
        const createData = {
          projectId: formData.projectId || '',
          description: formData.description.trim() || 'งบประมาณโครงการ',
          budget: parseFloat(formData.budget) || 0,
          createdBy: user?.name || "user" // Default value for createdBy
        }
        const response = await budgetService.createBudget(createData)
        if (response.success) {
          toast({
            title: "เพิ่มสำเร็จ",
            description: "เพิ่มงบประมาณเรียบร้อยแล้ว",
          })
          // เพิ่มข้อมูลใหม่ใน state
          const newBudget: Budget = {
            id: response.result?.[0] || Date.now().toString(),
            projectId: formData.projectId,
            projectName: formData.projectName,
            description: formData.description,
            type: formData.type,
            budget: parseFloat(formData.budget),
            usedBudget: 0,
            remainingBudget: parseFloat(formData.budget),
            status: formData.status,
            createdAt: new Date().toISOString()
          }
          setBudgets(prev => [...prev, newBudget])
        } else {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถเพิ่มงบประมาณได้",
            variant: "destructive"
          })
        }
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving budget:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      })
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("คุณต้องการลบงบประมาณนี้หรือไม่?")) {
      return
    }

    try {
      const response = await budgetService.deleteBudget(id)
      if (response.success) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบงบประมาณเรียบร้อยแล้ว",
        })
        // ลบข้อมูลออกจาก state
        setBudgets(prev => prev.filter(b => b.id !== id))
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบงบประมาณได้",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลได้",
        variant: "destructive"
      })
    }
  }

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
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "Outsource Service":
        return "text-green-600 bg-green-50 border-green-200"
      case "Other":
        return "text-gray-600 bg-gray-50 border-gray-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + " บาท"
  }

  const calculateBudgetUsage = (budget: number, actual: number) => {
    if (budget === 0) return 0
    return (actual / budget) * 100
  }



  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Budget Management</h1>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-2">จัดการงบประมาณ</h2>
        <p className="text-sm sm:text-base text-gray-600">ระบบจัดการงบประมาณ - เชื่อมโยงกับโปรเจคที่จัดการในระบบ</p>
      </div>



      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">กำลังโหลดข้อมูลงบประมาณ...</p>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">จัดการงบประมาณ</h3>
              <p className="text-sm text-gray-600 mt-1">
                จัดการข้อมูลงบประมาณทั้งหมด
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddBudget} className="bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มงบประมาณใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {editingBudget ? "แก้ไขงบประมาณ" : "เพิ่มงบประมาณใหม่"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="project" className="text-xs sm:text-sm text-gray-700">เลือกโปรเจค</Label>
                    <Select value={formData.projectId} onValueChange={handleProjectSelect}>
                      <SelectTrigger className="bg-white border-gray-300 text-xs sm:text-sm">
                        <SelectValue placeholder="เลือกโปรเจค" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{project.projectName}</span>
                              <span className="text-xs text-gray-500">{project.type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-xs sm:text-sm text-gray-700">คำอธิบาย</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="คำอธิบายงบประมาณ"
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-xs sm:text-sm text-gray-700">ประเภท</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      placeholder="ประเภทโครงการ"
                      className="text-xs sm:text-sm"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">ประเภทจะถูกกำหนดจากโปรเจคที่เลือก</p>
                  </div>

                  <div>
                    <Label htmlFor="budget" className="text-xs sm:text-sm text-gray-700">งบประมาณ (บาท)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="0"
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-xs sm:text-sm text-gray-700">สถานะ</Label>
                    <Select value={formData.status} onValueChange={(value: "กำลังทำ" | "เสร็จแล้ว" | "ยกเลิก") => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="bg-white border-gray-300 text-xs sm:text-sm">
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="กำลังทำ">กำลังทำ</SelectItem>
                        <SelectItem value="เสร็จแล้ว">เสร็จแล้ว</SelectItem>
                        <SelectItem value="ยกเลิก">ยกเลิก</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="text-xs sm:text-sm"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      onClick={handleSaveBudget}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm"
                    >
                      {editingBudget ? "แก้ไข" : "เพิ่ม"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-blue-700 mb-1">งบประมาณรวม</p>
                    <p className="text-lg lg:text-xl xl:text-2xl font-bold text-blue-900">
                      {budgets.reduce((sum, budget) => sum + budget.budget, 0).toLocaleString()} บาท
                    </p>
                  </div>
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-green-700 mb-1">งบประมาณที่ใช้แล้ว</p>
                    <p className="text-lg lg:text-xl xl:text-2xl font-bold text-green-900">
                      {budgets.reduce((sum, budget) => sum + budget.usedBudget, 0).toLocaleString()} บาท
                    </p>
                  </div>
                  <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm font-medium text-orange-700 mb-1">งบประมาณคงเหลือ</p>
                    <p className="text-lg lg:text-xl xl:text-2xl font-bold text-orange-900">
                      {budgets.reduce((sum, budget) => sum + budget.remainingBudget, 0).toLocaleString()} บาท
                    </p>
                  </div>
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {budgets.map((budget) => (
              <Card key={budget.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">{budget.projectName}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{budget.description}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(budget.status)}`}>
                          {budget.status}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getTypeColor(budget.type)}`}>
                          {budget.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        สร้างเมื่อ: {new Date(budget.createdAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      {budget.budget.toLocaleString()} บาท
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBudget(budget)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Budget Usage Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>การใช้งาน</span>
                      <span>{budget.usedBudget.toLocaleString()} / {budget.budget.toLocaleString()} บาท</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (budget.usedBudget / budget.budget) > 1 
                            ? 'bg-red-500' 
                            : (budget.usedBudget / budget.budget) > 0.8 
                              ? 'bg-orange-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((budget.usedBudget / budget.budget) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>คงเหลือ</span>
                      <span>{budget.remainingBudget.toLocaleString()} บาท</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {budgets.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">ไม่มีข้อมูลงบประมาณ</h3>
              <p className="text-sm sm:text-base text-gray-600">
                ยังไม่มีข้อมูลงบประมาณ
              </p>
            </div>
          )}
      </div>
    </div>
  )
}