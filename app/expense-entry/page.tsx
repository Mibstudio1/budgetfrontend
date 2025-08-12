"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { expenseService, CreateExpenseEntryRequest } from "@/lib/services/expenseService"
import { optionsService } from "@/lib/services/optionsService"
import { projectService } from "@/lib/services/projectService"
import { useAuth } from "@/hooks/useAuth"
import { PaginationControls, PaginationInfo } from "@/components/ui/pagination-controls"

interface LocalExpenseRecord {
  id: string
  date: string
  name: string
  amount: number
  projectName?: string
  status: boolean
  category: string
}

interface ExpenseItem {
  name: string
  group: string
}

interface Project {
  id: string
  projectName: string
  type: string
}

export default function ExpenseEntry() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    date: "",
    item: "",
    value: "",
    group: "",
    projectName: "",
    isPaid: false,
    customItem: "", // เพิ่มฟิลด์สำหรับกรอกข้อมูลอิสระ
    customGroup: "", // เพิ่มฟิลด์สำหรับกรอกหมวดหมู่อิสระ
  })

  const [expenses, setExpenses] = useState<LocalExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchName, setSearchName] = useState("")
  const [searchAmount, setSearchAmount] = useState("")
  const [searchDate, setSearchDate] = useState("")
  const [searchProject, setSearchProject] = useState("all")
  const [searchCategory, setSearchCategory] = useState("all")
  const [searchStatus, setSearchStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<LocalExpenseRecord | null>(null)
  const [editFormData, setEditFormData] = useState({
    status: false
  })

  // เพิ่ม state สำหรับเก็บหมวดหมู่ที่ใช้จริง
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [categoryService] = useState(() => {
    try {
      const { categoryService } = require('@/lib/services')
      return categoryService
    } catch (error) {
      console.error('Error loading categoryService:', error)
      return null
    }
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [expenseItemService] = useState(() => {
    try {
      const { expenseItemService } = require('@/lib/services')
      return expenseItemService
    } catch (error) {
      console.error('Error loading expenseItemService:', error)
      return null
    }
  })
  const [projects, setProjects] = useState<Project[]>([])

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
      
      // Fetch expense items from API
      if (expenseItemService) {
        try {
          const itemsResponse = await expenseItemService.getAllExpenseItems()
          if (itemsResponse.success && itemsResponse.result && itemsResponse.result.result && Array.isArray(itemsResponse.result.result)) {
            const items = itemsResponse.result.result.map((item: any) => ({
              name: item.name,
              group: item.group
            }))
            // Add "เพิ่มรายการใหม่" option
            items.push({ name: "เพิ่มรายการใหม่", group: "Custom" })
            setExpenseItems(items)
          } else {
            // Fallback to default items if API fails
            setExpenseItems([
              { name: "ค่าจ้าง Outsource", group: "Outsource" },
              { name: "ค่า Server", group: "Server" },
              { name: "ค่า Subscription", group: "Tool" },
              { name: "ค่าน้ำ", group: "Utility" },
              { name: "ค่าไฟ", group: "Utility" },
              { name: "ค่า Internet", group: "Utility" },
              { name: "ค่าเลี้ยงอาหาร", group: "Salary" },
              { name: "ค่าเช่าออฟฟิส", group: "Rental" },
              { name: "ค่าจ้างพนักงาน", group: "Salary" },
              { name: "ค่า incentive การขาย", group: "Incentive" },
              { name: "เพิ่มรายการใหม่", group: "Custom" }
            ])
          }
        } catch (error) {
          console.error('Error fetching expense items:', error)
          // Fallback to default items
          setExpenseItems([
            { name: "ค่าจ้าง Outsource", group: "Outsource" },
            { name: "ค่า Server", group: "Server" },
            { name: "ค่า Subscription", group: "Tool" },
            { name: "ค่าน้ำ", group: "Utility" },
            { name: "ค่าไฟ", group: "Utility" },
            { name: "ค่า Internet", group: "Utility" },
            { name: "ค่าเลี้ยงอาหาร", group: "Salary" },
            { name: "ค่าเช่าออฟฟิส", group: "Rental" },
            { name: "ค่าจ้างพนักงาน", group: "Salary" },
            { name: "ค่า incentive การขาย", group: "Incentive" },
            { name: "เพิ่มรายการใหม่", group: "Custom" }
          ])
        }
      } else {
        // Fallback to default items if service not available
        setExpenseItems([
          { name: "ค่าจ้าง Outsource", group: "Outsource" },
          { name: "ค่า Server", group: "Server" },
          { name: "ค่า Subscription", group: "Tool" },
          { name: "ค่าน้ำ", group: "Utility" },
          { name: "ค่าไฟ", group: "Utility" },
          { name: "ค่า Internet", group: "Utility" },
          { name: "ค่าเลี้ยงอาหาร", group: "Salary" },
          { name: "ค่าเช่าออฟฟิส", group: "Rental" },
          { name: "ค่าจ้างพนักงาน", group: "Salary" },
          { name: "ค่า incentive การขาย", group: "Incentive" },
          { name: "เพิ่มรายการใหม่", group: "Custom" }
        ])
      }

      // Fetch projects
      try {
        const projectsResponse = await projectService.getAllProjects({
          projectName: "",
          type: "",
          status: ""
        })
        setProjects(projectsResponse.result?.projects || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
        setProjects([])
      }

      // Fetch expenses
      try {
        const response = await expenseService.getRecentlyExpenses({
          search: "",
          startDate: "",
          endDate: "",
          category: "",
          status: ""
        })
        
        if (response.success && response.result?.records) {
          const expenseRecords: LocalExpenseRecord[] = response.result.records.map((expense: any) => ({
            id: expense.id,
            date: expense.date,
            name: expense.expense || expense.name,
            amount: expense.amount || expense.cost,
            projectName: expense.projectName,
            status: expense.status === true || expense.isPaid === true, // ตรวจสอบทั้ง status และ isPaid
            category: expense.category || "Other"
          }))
          setExpenses(expenseRecords)
          
          // ดึงหมวดหมู่ที่ใช้จริงจากข้อมูล
          const categories = [...new Set(expenseRecords.map(expense => expense.category))].sort()
          setAvailableCategories(categories)

          // ดึงหมวดหมู่จาก API category
          if (categoryService) {
            try {
              const categoryResponse = await categoryService.getExpenseCategories()
                        if (categoryResponse.success && categoryResponse.result && Array.isArray(categoryResponse.result)) {
            const categoryNames = categoryResponse.result.map((cat: any) => cat.name)
            setAvailableCategories(prev => [...new Set([...prev, ...categoryNames])].sort())
          }
            } catch (error) {
              console.error('Error fetching categories from API:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching expenses:', error)
        setExpenses([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.date || !formData.item.trim() || !formData.value || !formData.group) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    if (!formData.projectName) {
      alert("กรุณาเลือกโครงการ")
      return
    }

    // ตรวจสอบว่าถ้าเลือก "เพิ่มรายการใหม่" ต้องกรอกข้อมูลเพิ่มเติม
    if (formData.item === "เพิ่มรายการใหม่" && !formData.customItem.trim()) {
      alert("กรุณาระบุรายการค่าใช้จ่าย")
      return
    }

    // ตรวจสอบว่าถ้าเลือก "เพิ่มหมวดหมู่ใหม่" ต้องกรอกหมวดหมู่เพิ่มเติม
    if (formData.group === "เพิ่มหมวดหมู่ใหม่" && !formData.customGroup.trim()) {
      alert("กรุณาระบุหมวดหมู่")
      return
    }

    try {
      setSaving(true)
      
      const selectedProject = projects.find(p => p.projectName === formData.projectName)
      
      if (!selectedProject?.id) {
        alert("ไม่พบโครงการที่เลือก")
        return
      }
      
      // ใช้ข้อมูลที่กรอกเองถ้าเลือก "เพิ่มรายการใหม่"
      const expenseItemName = formData.item === "เพิ่มรายการใหม่" 
        ? formData.customItem.trim() 
        : formData.item.trim()

      // ใช้หมวดหมู่ที่กรอกเองถ้าเลือก "เพิ่มหมวดหมู่ใหม่"
      const categoryName = formData.group === "เพิ่มหมวดหมู่ใหม่" 
        ? formData.customGroup.trim() 
        : formData.group

      // สร้างรายการค่าใช้จ่ายใหม่ถ้าเลือก "เพิ่มรายการใหม่"
      if (formData.item === "เพิ่มรายการใหม่" && expenseItemService) {
        try {
          await expenseItemService.createExpenseItem({
            name: formData.customItem.trim(),
            group: categoryName,
            description: `รายการค่าใช้จ่าย: ${formData.customItem.trim()}`,
            createdBy: user?.name || 'system'
          })
        } catch (error) {
          console.error('Error creating expense item:', error)
        }
      }

      const expenseData: CreateExpenseEntryRequest = {
        date: formData.date,
        expenseItem: expenseItemName || 'รายการค่าใช้จ่าย',
        cost: parseFloat(formData.value) || 0,
        projectId: selectedProject.id,
        isPaid: formData.isPaid,
        createdBy: user?.name || 'system',
        category: categoryName || 'อื่นๆ'
      }

      console.log('Sending expense data:', expenseData)
      const response = await expenseService.createExpense(expenseData)
      console.log('Expense response:', response)
      
      if (Array.isArray(response) || response.success) {
        // Reset form
        setFormData({
          date: "",
          item: "",
          value: "",
          group: "",
          projectName: "",
          isPaid: false,
          customItem: "",
          customGroup: "",
        })
        
        // Close dialog
        setIsDialogOpen(false)
        
        // Refresh data
        fetchData()
        
        alert("บันทึกค่าใช้จ่ายเรียบร้อยแล้ว")
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก")
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      alert("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  const handleEditExpense = (expense: LocalExpenseRecord) => {
    setEditingExpense(expense)
    setEditFormData({ status: expense.status })
    setIsEditDialogOpen(true)
  }

  const handleSaveExpenseStatus = async () => {
    if (!editingExpense) return

    // ตรวจสอบว่า ID มีค่าหรือไม่
    if (!editingExpense.id) {
      alert("ไม่พบ ID ของรายการค่าใช้จ่าย")
      return
    }

    try {
      console.log('Updating expense status:', editingExpense.id, editFormData.status)
      
      // Update expense status in backend
      const response = await expenseService.updateExpenseStatus(editingExpense.id, editFormData.status)

      if (response.success) {
        // Close dialog first
        setIsEditDialogOpen(false)
        setEditingExpense(null)
        
        // Refresh data from server to get the latest status
        await fetchData()
        
        alert("อัพเดทสถานะเรียบร้อยแล้ว")
      } else {
        throw new Error(response.message || "Failed to update expense status")
      }
    } catch (error) {
      console.error('Error updating expense status:', error)
      alert("เกิดข้อผิดพลาดในการอัพเดท: " + (error as Error).message)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm("คุณต้องการลบรายการค่าใช้จ่ายนี้หรือไม่?")) {
      return;
    }

    try {
      setSaving(true);
      const response = await expenseService.deleteExpense(expenseId);
      if (response.success) {
        alert("ลบรายการค่าใช้จ่ายเรียบร้อยแล้ว");
        fetchData();
      } else {
        alert("เกิดข้อผิดพลาดในการลบรายการค่าใช้จ่าย: " + response.message);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert("เกิดข้อผิดพลาดในการลบรายการค่าใช้จ่าย: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    // Name filter
    const matchesName = !searchName || expense.name.toLowerCase().includes(searchName.toLowerCase())
    
    // Amount filter
    const matchesAmount = !searchAmount || expense.amount.toString().includes(searchAmount)
    
    // Date filter
    const matchesDate = !searchDate || expense.date === searchDate
    
    // Project filter
    const matchesProject = !searchProject || searchProject === "all" || expense.projectName === searchProject
    
    // Category filter
    const matchesCategory = !searchCategory || searchCategory === "all" || expense.category === searchCategory
    
    // Status filter
    const matchesStatus = !searchStatus || searchStatus === "all" ||
      (searchStatus === "paid" && expense.status === true) ||
      (searchStatus === "unpaid" && expense.status === false)
    
    return matchesName && matchesAmount && matchesDate && matchesProject && matchesCategory && matchesStatus
  })

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to first page when search terms change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchName, searchAmount, searchDate, searchProject, searchCategory])

  // คำนวณสถิติค่าใช้จ่าย (ใช้ข้อมูลที่กรองแล้ว)
  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
    const amount = Number(expense.amount) || 0
    return sum + amount
  }, 0)
  
  const paidExpenses = filteredExpenses.filter(expense => expense.status).reduce((sum, expense) => {
    const amount = Number(expense.amount) || 0
    return sum + amount
  }, 0)
  
  const unpaidExpenses = Math.max(0, totalExpenses - paidExpenses)
  const paidPercentage = totalExpenses > 0 ? (paidExpenses / totalExpenses) * 100 : 0

  // จัดกลุ่มค่าใช้จ่ายตามประเภท (ใช้ข้อมูลที่กรองแล้ว)
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    const amount = Number(expense.amount) || 0
    if (!acc[expense.category]) {
      acc[expense.category] = 0
    }
    acc[expense.category] += amount
    return acc
  }, {} as Record<string, number>)

  const categoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount: Math.max(0, amount) // ป้องกันค่าติดลบ
  }))

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Expense Entry</h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-2">บันทึกค่าใช้จ่าย</h2>
          <p className="text-sm sm:text-base text-gray-600">Expense management and tracking</p>
          <p className="text-xs sm:text-sm text-gray-500">บันทึกและติดตามค่าใช้จ่ายทางธุรกิจทั้งหมด</p>
        </div>
        
        {/* Add Expense Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มค่าใช้จ่าย
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มค่าใช้จ่ายใหม่</DialogTitle>
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
                  <Label htmlFor="item" className="text-sm text-gray-700">รายการค่าใช้จ่าย</Label>
                  <Select value={formData.item} onValueChange={(value) => handleInputChange("item", value)}>
                    <SelectTrigger className="bg-white border-gray-300 text-sm">
                      <SelectValue placeholder="เลือกรายการ" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseItems.map((item) => (
                        <SelectItem key={item.name} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Item Input - แสดงเมื่อเลือก "เพิ่มรายการใหม่" */}
              {formData.item === "เพิ่มรายการใหม่" && (
                <div>
                  <Label htmlFor="customItem" className="text-sm text-gray-700">ระบุรายการค่าใช้จ่าย</Label>
                  <Input
                    id="customItem"
                    type="text"
                    value={formData.customItem}
                    onChange={(e) => handleInputChange("customItem", e.target.value)}
                    placeholder="กรอกรายการค่าใช้จ่ายที่ต้องการ..."
                    className="bg-white border-gray-300 text-sm"
                    required={formData.item === "เพิ่มรายการใหม่"}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value" className="text-sm text-gray-700">จำนวนเงิน</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleInputChange("value", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-gray-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="group" className="text-sm text-gray-700">หมวดหมู่</Label>
                  <Select value={formData.group} onValueChange={(value) => handleInputChange("group", value)}>
                    <SelectTrigger className="bg-white border-gray-300 text-sm">
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outsource">Outsource</SelectItem>
                      <SelectItem value="Server">Server</SelectItem>
                      <SelectItem value="Tool">Tool</SelectItem>
                      <SelectItem value="Utility">Utility</SelectItem>
                      <SelectItem value="Salary">Salary</SelectItem>
                      <SelectItem value="Rental">Rental</SelectItem>
                      <SelectItem value="Incentive">Incentive</SelectItem>
                      {availableCategories.filter(cat => !["Outsource", "Server", "Tool", "Utility", "Salary", "Rental", "Incentive"].includes(cat)).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="เพิ่มหมวดหมู่ใหม่">เพิ่มหมวดหมู่ใหม่</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Group Input - แสดงเมื่อเลือก "เพิ่มหมวดหมู่ใหม่" */}
              {formData.group === "เพิ่มหมวดหมู่ใหม่" && (
                <div>
                  <Label htmlFor="customGroup" className="text-sm text-gray-700">ระบุหมวดหมู่</Label>
                  <Input
                    id="customGroup"
                    type="text"
                    value={formData.customGroup}
                    onChange={(e) => handleInputChange("customGroup", e.target.value)}
                    placeholder="กรอกหมวดหมู่ที่ต้องการ..."
                    className="bg-white border-gray-300 text-sm"
                    required={formData.group === "เพิ่มหมวดหมู่ใหม่"}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="isPaid"
                    checked={formData.isPaid}
                    onCheckedChange={(checked) => handleInputChange("isPaid", checked)}
                  />
                  <Label htmlFor="isPaid" className="text-sm text-gray-700">ชำระแล้ว</Label>
                </div>
              </div>

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
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{totalExpenses.toLocaleString("th-TH")}</div>
            <p className="text-xs text-gray-500">{filteredExpenses.length} รายการ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Paid Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{paidExpenses.toLocaleString("th-TH")}</div>
            <p className="text-xs text-gray-500">{filteredExpenses.filter(e => e.status).length} รายการ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Unpaid Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{unpaidExpenses.toLocaleString("th-TH")}</div>
            <p className="text-xs text-gray-500">{filteredExpenses.filter(e => !e.status).length} รายการ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Payment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{paidPercentage.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">จ่ายแล้ว</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense by Category */}
      {categoryData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">ค่าใช้จ่ายตามหมวดหมู่</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryData.map((category) => (
              <Card key={category.category} className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-red-600">{category.amount.toLocaleString()} บาท</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {totalExpenses > 0 ? ((category.amount / totalExpenses) * 100).toFixed(1) : 0}% ของค่าใช้จ่ายที่แสดง
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {filteredExpenses.filter(e => e.category === category.category).length} รายการ
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
              แสดง {filteredExpenses.length} จาก {expenses.length} รายการ
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchName("")
                setSearchAmount("")
                setSearchDate("")
                setSearchProject("all")
                setSearchCategory("all")
                setSearchStatus("all")
              }}
              className="text-xs"
            >
              ล้างตัวกรอง
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="searchName" className="text-xs sm:text-sm text-gray-700">ชื่อรายการ</Label>
              <Input
                id="searchName"
                type="text"
                placeholder="ค้นหาชื่อรายการ..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
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
              <Label htmlFor="searchCategory" className="text-xs sm:text-sm text-gray-700">หมวดหมู่</Label>
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="bg-white border-gray-300 text-xs sm:text-sm">
                  <SelectValue placeholder="ทุกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-gray-900">รายการค่าใช้จ่าย</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {currentExpenses.map((expense, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{expense.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{expense.date}</p>
                      {expense.projectName && (
                        <p className="text-xs text-blue-600">{expense.projectName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditExpense(expense)}
                        className="p-1 h-auto"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-1 h-auto text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Badge
                        variant={expense.status ? "default" : "secondary"}
                        className={`text-xs ${expense.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {expense.status ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      {expense.amount.toLocaleString("th-TH")} บาท
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {expense.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentExpenses.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-gray-600">ไม่พบรายการค่าใช้จ่าย</p>
            </div>
          )}

          {/* Pagination */}
          {filteredExpenses.length > itemsPerPage && (
            <div className="mt-4 sm:mt-6">
              <PaginationInfo
                currentPage={currentPage}
                totalItems={filteredExpenses.length}
                itemsPerPage={itemsPerPage}
              />
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredExpenses.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Expense Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขสถานะค่าใช้จ่าย</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingExpense && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-700">รายการค่าใช้จ่าย</Label>
                  <p className="text-sm text-gray-900 mt-1">{editingExpense.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">จำนวนเงิน</Label>
                  <p className="text-sm text-gray-900 mt-1">{editingExpense.amount.toLocaleString("th-TH")} บาท</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">วันที่</Label>
                  <p className="text-sm text-gray-900 mt-1">{editingExpense.date}</p>
                </div>
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">สถานะการชำระ</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="status"
                      checked={editFormData.status}
                      onCheckedChange={(checked) => setEditFormData({ status: checked as boolean })}
                    />
                    <Label htmlFor="status" className="text-sm text-gray-700">ชำระแล้ว</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleSaveExpenseStatus}
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
