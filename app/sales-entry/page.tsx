"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { salesService, CreateSalesEntryRequest } from "@/lib/services/salesService"
import { projectService } from "@/lib/services/projectService"
import { useAuth } from "@/hooks/useAuth"
import { PaginationControls, PaginationInfo } from "@/components/ui/pagination-controls"

interface SalesRecord {
  id: string
  date: string
  projectName: string
  description: string
  qty: string
  price: string
  totalPrice: string
  type: string
}

interface Project {
  id: string
  projectName: string
  type: string
}

export default function SalesEntry() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    date: "",
    projectName: "",
    description: "",
    quantity: "",
    sellingPrice: "",
    totalPrice: "",
    projectType: "",
    customType: "", // เพิ่มฟิลด์สำหรับกรอกประเภทอิสระ
  })

  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchDate, setSearchDate] = useState("")
  const [searchAmount, setSearchAmount] = useState("")
  const [searchProject, setSearchProject] = useState("all")
  const [searchType, setSearchType] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const [projects, setProjects] = useState<Project[]>([])

  // เพิ่ม state สำหรับเก็บประเภทที่ใช้จริง
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [categoryService] = useState(() => {
    try {
      const { categoryService } = require('@/lib/services')
      return categoryService
    } catch (error) {
      console.error('Error loading categoryService:', error)
      return null
    }
  })

  // Fetch data on component mount and when component becomes visible
  useEffect(() => {
    fetchData()
  }, [])

  // Refetch data when component becomes visible (to get latest data)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch projects
      const projectsResponse = await projectService.getAllProjects({
        projectName: "",
        type: "",
        status: ""
      })
      setProjects(projectsResponse.result?.projects || [])

      // Fetch recent sales
      const salesResponse = await salesService.getRecentlySales({
        projectName: "",
        startDate: "",
        endDate: "",
        type: ""
      })
      const records = (salesResponse as any)?.result?.records || []
      const mappedRecords = records.map((record: any) => {
        // Use project name directly from backend response
        const projectName = record.projectName || 'ไม่มีโครงการ'
        
        return {
          id: record.id || `record-${Date.now()}-${Math.random()}`,
          date: record.date,
          projectName: projectName,
          description: record.description,
          qty: record.quantity?.toString() || '1',
          price: record.selling?.toString() || record.totalPrice?.toString() || '0',
          totalPrice: record.totalPrice?.toString() || '0',
          type: record.type || 'ไม่ระบุ'
        }
      })
      setSalesHistory(mappedRecords)
      
      // ดึงประเภทที่ใช้จริงจากข้อมูล
      const types = [...new Set(mappedRecords.map((record: any) => record.type))].sort()
      setAvailableTypes(types as string[])

      // ดึงประเภทจาก API category
      if (categoryService) {
        try {
          const categoryResponse = await categoryService.getSalesCategories()
                  if (categoryResponse.success && categoryResponse.result && categoryResponse.result.result && Array.isArray(categoryResponse.result.result)) {
          const typeNames = categoryResponse.result.result.map((cat: any) => cat.name)
          setAvailableTypes(prev => [...new Set([...prev, ...typeNames])].sort())
        }
        } catch (error) {
          console.error('Error fetching types from API:', error)
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "projectName") {
      const selectedProject = projects.find((p) => p.projectName === value)
      if (selectedProject) {
        setFormData((prev) => ({ ...prev, projectType: selectedProject.type }))
      }
    }

    // Calculate total price
    if (field === "quantity" || field === "sellingPrice") {
      const quantity = field === "quantity" ? Number(value) : Number(formData.quantity)
      const sellingPrice = field === "sellingPrice" ? Number(value) : Number(formData.sellingPrice)
      const totalPrice = quantity * sellingPrice
      setFormData((prev) => ({ ...prev, totalPrice: totalPrice.toString() }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.projectName || (!formData.quantity && !formData.totalPrice) || (!formData.sellingPrice && !formData.totalPrice)) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    const totalPrice = Number(formData.totalPrice) || (Number(formData.quantity) * Number(formData.sellingPrice))
    if (!totalPrice || totalPrice <= 0) {
      alert("กรุณากรอกยอดขายที่ถูกต้อง")
      return
    }

    // ตรวจสอบว่าถ้าเลือก "เพิ่มประเภทใหม่" ต้องกรอกประเภทเพิ่มเติม
    if (formData.projectType === "เพิ่มประเภทใหม่" && !formData.customType.trim()) {
      alert("กรุณาระบุประเภทโครงการ")
      return
    }

    try {
      setSaving(true)

      const selectedProject = projects.find(p => p.projectName === formData.projectName)
      if (!selectedProject) {
        alert('ไม่พบโปรเจกต์ที่เลือก')
        return
      }

      // ใช้ประเภทที่กรอกเองถ้าเลือก "เพิ่มประเภทใหม่"
      let projectTypeName = formData.projectType
      
      if (formData.projectType === "เพิ่มประเภทใหม่") {
        try {
          const categoryResponse = await categoryService.createCategory({
            name: formData.customType.trim(),
            type: 'sales',
            description: `ประเภทโครงการ: ${formData.customType.trim()}`,
            createdBy: user?.name || 'system'
          })
          
          if (categoryResponse.success) {
            projectTypeName = formData.customType.trim()
            console.log('Created new category:', formData.customType.trim())
          } else {
            console.error('Failed to create category:', categoryResponse)
          }
        } catch (error) {
          console.error('Error creating category:', error)
        }
      }

      const salesData: CreateSalesEntryRequest = {
        date: formData.date,
        projectId: selectedProject.id,
        description: formData.description.trim() || 'รายการขาย',
        totalPrice: Number(formData.totalPrice) || (Number(formData.quantity) * Number(formData.sellingPrice)) || 0,
        type: projectTypeName || selectedProject.type || 'Other',
        createdBy: user?.name || 'system',
      }

      console.log('Sending sales data:', salesData)
      const response = await salesService.createSalesEntry(salesData)
      console.log('Sales response:', response)
      
      if (Array.isArray(response) || response.success) {
        alert("บันทึกยอดขายเรียบร้อย!")
      } else {
        alert("เกิดข้อผิดพลาด: " + (response.message || "ไม่สามารถบันทึกได้"))
        return
      }

      // Reset form
      setFormData({
        date: "",
        projectName: "",
        description: "",
        quantity: "",
        sellingPrice: "",
        totalPrice: "",
        projectType: "",
        customType: "",
      })

      // Close dialog
      setIsDialogOpen(false)

      // Refresh sales list
      fetchData()

    } catch (error) {
      console.error('Error saving sales:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกยอดขาย')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm('คุณต้องการลบรายการยอดขายนี้ใช่หรือไม่?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await salesService.deleteSales(saleId);
      if (response.success) {
        alert('ลบรายการยอดขายเรียบร้อย!');
        fetchData(); // Refresh the list after deletion
      } else {
        alert('เกิดข้อผิดพลาดในการลบรายการยอดขาย: ' + (response.message || 'ไม่สามารถลบได้'));
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('เกิดข้อผิดพลาดในการลบรายการยอดขาย');
    } finally {
      setSaving(false);
    }
  };


  const filteredSales = salesHistory.filter(sale => {
    // Name filter
    const matchesSearch = !searchTerm || 
      sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.qty?.toString().includes(searchTerm) ||
      sale.price?.toString().includes(searchTerm)
    
    // Date filter
    const matchesDate = !searchDate || sale.date === searchDate
    
    // Amount filter
    const matchesAmount = !searchAmount || sale.totalPrice.toString().includes(searchAmount)
    
    // Project filter
    const matchesProject = !searchProject || searchProject === "all" || sale.projectName === searchProject
    
    // Type filter
    const matchesType = !searchType || searchType === "all" || sale.type === searchType
    
    return matchesSearch && matchesDate && matchesAmount && matchesProject && matchesType
  })

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSales = filteredSales.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, searchDate, searchAmount, searchProject, searchType])

  // Calculate summary statistics
  const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.totalPrice), 0)
  const totalQuantity = filteredSales.reduce((sum, sale) => sum + Number(sale.qty || 0), 0)
  const averagePrice = totalQuantity > 0 ? totalSales / totalQuantity : 0

  // Group sales by project for relationship display
  const salesByProject = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.projectName]) {
      acc[sale.projectName] = {
        projectName: sale.projectName,
        totalSales: 0,
        totalQuantity: 0,
        count: 0
      }
    }
    acc[sale.projectName].totalSales += Number(sale.totalPrice)
    acc[sale.projectName].totalQuantity += Number(sale.qty || 0)
    acc[sale.projectName].count += 1
    return acc
  }, {} as Record<string, { projectName: string; totalSales: number; totalQuantity: number; count: number }>)

  const projectSalesData = Object.values(salesByProject)

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Sales Entry</h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-2">บันทึกยอดขาย</h2>
          <p className="text-sm sm:text-base text-gray-600">Sales management and tracking</p>
          <p className="text-xs sm:text-sm text-gray-500">บันทึกและติดตามยอดขายทั้งหมด</p>
        </div>
        
        {/* Add Sales Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มยอดขาย
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>เพิ่มยอดขายใหม่</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-sm text-gray-700">วันที่</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="bg-white border-gray-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="projectName" className="text-sm text-gray-700">โครงการ</Label>
                  <Select value={formData.projectName} onValueChange={(value) => handleInputChange("projectName", value)}>
                    <SelectTrigger className="bg-white border-gray-300 text-sm">
                      <SelectValue placeholder="เลือกโครงการ" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.projectName}>
                          {project.projectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm text-gray-700">รายละเอียด</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="รายละเอียดการขาย..."
                  className="bg-white border-gray-300 text-sm"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity" className="text-sm text-gray-700">จำนวน</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    placeholder="0"
                    className="bg-white border-gray-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sellingPrice" className="text-sm text-gray-700">ราคาต่อหน่วย</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-gray-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="totalPrice" className="text-sm text-gray-700">ราคารวม</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    value={formData.totalPrice}
                    onChange={(e) => handleInputChange("totalPrice", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-gray-300 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="projectType" className="text-sm text-gray-700">ประเภทโครงการ</Label>
                <Select value={formData.projectType} onValueChange={(value) => handleInputChange("projectType", value)}>
                  <SelectTrigger className="bg-white border-gray-300 text-sm">
                    <SelectValue placeholder="เลือกประเภทโครงการ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Mobile App">Mobile App</SelectItem>
                    <SelectItem value="Desktop App">Desktop App</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    {availableTypes.filter(type => !["Website", "Mobile App", "Desktop App", "API", "Database", "Consulting", "Training"].includes(type)).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                    <SelectItem value="เพิ่มประเภทใหม่">เพิ่มประเภทใหม่</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Type Input - แสดงเมื่อเลือก "เพิ่มประเภทใหม่" */}
              {formData.projectType === "เพิ่มประเภทใหม่" && (
                <div>
                  <Label htmlFor="customType" className="text-sm text-gray-700">ระบุประเภทโครงการ</Label>
                  <Input
                    id="customType"
                    type="text"
                    value={formData.customType}
                    onChange={(e) => handleInputChange("customType", e.target.value)}
                    placeholder="กรอกประเภทโครงการที่ต้องการ..."
                    className="bg-white border-gray-300 text-sm"
                    required={formData.projectType === "เพิ่มประเภทใหม่"}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{totalSales.toLocaleString("th-TH")}</div>
            <p className="text-xs text-gray-500">{filteredSales.length} รายการ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{totalQuantity.toLocaleString("th-TH")}</div>
            <p className="text-xs text-gray-500">หน่วย</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{averagePrice.toLocaleString("th-TH")}</div>
            <p className="text-xs text-gray-500">บาทต่อหน่วย</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Sales Relationship */}
      {projectSalesData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">ยอดขายตามโครงการ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectSalesData.map((projectData) => (
              <Card key={projectData.projectName} className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900">{projectData.projectName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ยอดขายรวม:</span>
                    <span className="font-semibold text-green-600">{projectData.totalSales.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">จำนวนรายการ:</span>
                    <span className="font-semibold text-blue-600">{projectData.count} รายการ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">จำนวนรวม:</span>
                    <span className="font-semibold text-purple-600">{projectData.totalQuantity}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-gray-900">ค้นหาและกรอง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              แสดง {filteredSales.length} จาก {salesHistory.length} รายการ
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setSearchDate("")
                setSearchAmount("")
                setSearchProject("all")
                setSearchType("all")
              }}
              className="text-xs"
            >
              ล้างตัวกรอง
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search" className="text-xs sm:text-sm text-gray-700">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="ค้นหาทุกข้อมูล: รายละเอียด, โครงการ, จำนวน, ราคา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-xs sm:text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="searchDate" className="text-xs sm:text-sm text-gray-700">วันที่</Label>
              <Input
                id="searchDate"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-white border-gray-300 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="searchAmount" className="text-xs sm:text-sm text-gray-700">จำนวนเงิน</Label>
              <Input
                id="searchAmount"
                type="text"
                placeholder="ค้นหาจำนวนเงิน..."
                value={searchAmount}
                onChange={(e) => setSearchAmount(e.target.value)}
                className="bg-white border-gray-300 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="searchProject" className="text-xs sm:text-sm text-gray-700">โครงการ</Label>
              <Select value={searchProject} onValueChange={setSearchProject}>
                <SelectTrigger className="bg-white border-gray-300 text-xs sm:text-sm">
                  <SelectValue placeholder="ทุกโครงการ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกโครงการ</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.projectName}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="searchType" className="text-xs sm:text-sm text-gray-700">ประเภท</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="bg-white border-gray-300 text-xs sm:text-sm">
                  <SelectValue placeholder="ทุกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-gray-900">รายการยอดขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {currentSales.map((sale, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate" title={sale.projectName}>
                          {sale.projectName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">{sale.date}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {sale.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full">
                      <p className="text-xs text-gray-500 line-clamp-2">{sale.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-600">จำนวน</p>
                      <p className="font-semibold text-gray-900">{sale.qty}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">ราคาต่อหน่วย</p>
                      <p className="font-semibold text-gray-900">{parseFloat(sale.price).toLocaleString()} บาท</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-green-600">
                      {parseFloat(sale.totalPrice).toLocaleString()} บาท
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSale(sale.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentSales.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-gray-600">ไม่พบรายการยอดขาย</p>
            </div>
          )}

          {/* Pagination */}
          {filteredSales.length > itemsPerPage && (
            <div className="mt-4 sm:mt-6">
              <PaginationInfo
                currentPage={currentPage}
                totalItems={filteredSales.length}
                itemsPerPage={itemsPerPage}
              />
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredSales.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  )
}

