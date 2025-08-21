"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Search, ChevronDown } from "lucide-react"
import { salesService, CreateSalesEntryRequest } from "@/lib/services/salesService"
import { projectService } from "@/lib/services/projectService"
import { categoryService } from "@/lib/services/categoryService"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

interface SalesEntry {
  id: string
  date: string
  description: string
  quantity: number
  sellingPrice: number
  totalPrice: number
  projectName: string
  type: string
  note?: string
}

interface SalesType {
  id: string
  name: string
  category: string
  isActive: boolean
}

interface Project {
  id: string
  projectName: string
  type: string
}

export default function SalesEntryForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    quantity: 1,
    sellingPrice: 0,
    totalPrice: 0,
    projectId: "",
    projectName: "",
    type: "",
    note: "",
  })

  const [salesHistory, setSalesHistory] = useState<SalesEntry[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [filteredSalesTypes, setFilteredSalesTypes] = useState<SalesType[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [typeSearchValue, setTypeSearchValue] = useState("")

  // Load data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Filter sales types based on search
  useEffect(() => {
    if (typeSearchValue.trim() === "") {
      setFilteredSalesTypes(salesTypes)
    } else {
      const filtered = salesTypes.filter(type => 
        type.name.toLowerCase().includes(typeSearchValue.toLowerCase()) ||
        type.category.toLowerCase().includes(typeSearchValue.toLowerCase())
      )
      setFilteredSalesTypes(filtered)
    }
  }, [typeSearchValue, salesTypes])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch sales types
      try {
        const salesTypesResponse = await categoryService.getSalesCategories()
        
        if (salesTypesResponse.success && salesTypesResponse.result && salesTypesResponse.result.result && Array.isArray(salesTypesResponse.result.result)) {
          const types = salesTypesResponse.result.result.filter((type: any) => type.isActive)
          setSalesTypes(types)
          setFilteredSalesTypes(types)
        } else if (salesTypesResponse.success && salesTypesResponse.result && Array.isArray(salesTypesResponse.result)) {
          // Handle single-level nesting
          const types = salesTypesResponse.result.filter((type: any) => type.isActive)
          setSalesTypes(types)
          setFilteredSalesTypes(types)
        } else {
          // Fallback data
          const fallbackTypes = [
            { id: "1", name: "การขายระบบ ERP", category: "Software", isActive: true },
            { id: "2", name: "การดูแลระบบ Database", category: "Service", isActive: true },
            { id: "3", name: "การพัฒนาระบบ Web", category: "Development", isActive: true },
            { id: "4", name: "การให้คำปรึกษา IT", category: "Consulting", isActive: true },
            { id: "5", name: "การฝึกอบรม", category: "Training", isActive: true },
            { id: "6", name: "การบำรุงรักษาระบบ", category: "Maintenance", isActive: true }
          ]
          setSalesTypes(fallbackTypes)
          setFilteredSalesTypes(fallbackTypes)
        }
      } catch (error) {
        console.error('Error fetching sales types:', error)
        // Fallback data
        const fallbackTypes = [
          { id: "1", name: "การขายระบบ ERP", category: "Software", isActive: true },
          { id: "2", name: "การดูแลระบบ Database", category: "Service", isActive: true },
          { id: "3", name: "การพัฒนาระบบ Web", category: "Development", isActive: true },
          { id: "4", name: "การให้คำปรึกษา IT", category: "Consulting", isActive: true },
          { id: "5", name: "การฝึกอบรม", category: "Training", isActive: true },
          { id: "6", name: "การบำรุงรักษาระบบ", category: "Maintenance", isActive: true }
        ]
        setSalesTypes(fallbackTypes)
        setFilteredSalesTypes(fallbackTypes)
      }

      // Fetch projects
      const projectsResponse = await projectService.getAllProjects({
        projectName: "",
        type: "",
        status: ""
      })
      setProjects(projectsResponse.result?.projects || [])

      // Fetch sales history
      const salesResponse = await salesService.getRecentlySales({
        projectName: "",
        startDate: "",
        endDate: "",
        type: ""
      })
      setSalesHistory(salesResponse.result?.records || [])
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

  const handleInputChange = (field: string, value: string | number) => {
    const newFormData = { ...formData, [field]: value }

    // Auto-calculate total price
    if (field === "quantity" || field === "sellingPrice") {
      const quantity = field === "quantity" ? value : formData.quantity
      const price = field === "sellingPrice" ? value : formData.sellingPrice
      newFormData.totalPrice = Number(quantity) * Number(price)
    }

    // Update project name when project is selected
    if (field === "projectId") {
      const selectedProject = projects.find(p => p.id === value)
      if (selectedProject) {
        newFormData.projectName = selectedProject.projectName
      }
    }

    setFormData(newFormData)
  }

  const handleTypeSelect = (type: SalesType) => {
    setFormData({
      ...formData,
      description: type.name,
      type: type.category
    })
    setTypeSearchValue(type.name)
    setShowTypeDropdown(false)
  }

  const handleTypeSearchChange = (value: string) => {
    setTypeSearchValue(value)
    setShowTypeDropdown(true)
    
    // If user clears the input, reset the form
    if (value === "") {
      setFormData({
        ...formData,
        description: "",
        type: ""
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || formData.sellingPrice <= 0 || !formData.projectId || !formData.date) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลการขายให้ครบถ้วนและถูกต้อง",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)

      const selectedProject = projects.find(p => p.id === formData.projectId)
      if (!selectedProject) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่พบโปรเจกต์ที่เลือก",
          variant: "destructive"
        })
        return
      }

      const salesData: CreateSalesEntryRequest = {
        date: formData.date,
        projectId: formData.projectId,
        description: formData.description,
        totalPrice: formData.totalPrice,
        type: formData.type || selectedProject.type,
        createdBy: user?.name || "unknown",
        note: formData.note || ""
      }

      const response = await salesService.createSalesEntry(salesData)
      if (response.success) {
        toast({
          title: "บันทึกสำเร็จ",
          description: "บันทึกยอดขายเรียบร้อยแล้ว"
        })

        // Reset form
        setFormData({
          date: new Date().toISOString().split("T")[0],
          description: "",
          quantity: 1,
          sellingPrice: 0,
          totalPrice: 0,
          projectId: "",
          projectName: "",
          type: "",
          note: "",
        })
        setTypeSearchValue("")

        // Reload sales history
        await fetchData()
      } else {
        throw new Error(response.message || "Failed to create sales entry")
      }
    } catch (error) {
      console.error('Error saving sales:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredSales = salesHistory.filter(
    (sale) =>
      sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.projectName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">วันที่</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            required
            disabled={saving}
          />
        </div>

        <div className="relative">
          <Label htmlFor="description">รายละเอียดการขาย</Label>
          <div className="relative">
            <Input
              id="description"
              type="text"
              value={typeSearchValue}
              onChange={(e) => handleTypeSearchChange(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหารายการขาย..."
              required
              disabled={saving}
              onFocus={() => setShowTypeDropdown(true)}
              onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
            />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Autocomplete Dropdown */}
          {showTypeDropdown && filteredSalesTypes.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredSalesTypes.map((type) => (
                <div
                  key={type.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleTypeSelect(type)}
                >
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-gray-500">{type.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="quantity">จำนวน</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleInputChange("quantity", Number(e.target.value))}
            min="1"
            required
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="sellingPrice">ราคาต่อหน่วย (บาท)</Label>
          <Input
            id="sellingPrice"
            type="number"
            value={formData.sellingPrice}
            onChange={(e) => handleInputChange("sellingPrice", Number(e.target.value))}
            min="0"
            required
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="totalPrice">ราคารวม (บาท)</Label>
          <Input
            id="totalPrice"
            type="number"
            value={formData.totalPrice}
            readOnly
            className="bg-gray-50"
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="type">ประเภทการขาย</Label>
          <Input
            id="type"
            value={formData.type}
            readOnly
            className="bg-gray-50"
            placeholder="จะแสดงอัตโนมัติเมื่อเลือกรายการ"
            disabled={saving}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="projectId">ชื่อโปรเจกต์</Label>
          <Select 
            value={formData.projectId} 
            onValueChange={(value) => handleInputChange("projectId", value)}
            disabled={saving}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกโปรเจกต์" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="note">หมายเหตุ</Label>
          <Textarea
            id="note"
            value={formData.note}
            onChange={(e) => handleInputChange("note", e.target.value)}
            placeholder="เพิ่มหมายเหตุหรือรายละเอียดเพิ่มเติม..."
            className="resize-none"
            rows={3}
            disabled={saving}
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" className="w-full md:w-auto" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกยอดขาย"}
          </Button>
        </div>
      </form>

      {/* Sales History */}
      <Card>
        <CardHeader>
          <CardTitle>รายการยอดขายล่าสุด</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหารายการขาย หรือชื่อโปรเจกต์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <Card key={sale.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{sale.description}</h4>
                          <Badge variant="outline">{sale.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{sale.projectName}</p>
                        <p className="text-xs text-gray-500">{sale.date}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          จำนวน: {sale.quantity} | ราคาต่อหน่วย: {sale.sellingPrice.toLocaleString("th-TH")} บาท
                        </p>
                        {sale.note && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{sale.note}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-xl text-green-600">
                          {sale.totalPrice.toLocaleString("th-TH")} บาท
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>ไม่มีรายการยอดขาย</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
