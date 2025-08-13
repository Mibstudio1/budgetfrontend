"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Search, ChevronDown } from "lucide-react"
import { expenseService, CreateExpenseEntryRequest } from "@/lib/services/expenseService"
import { projectService } from "@/lib/services/projectService"
import { expenseItemService } from "@/lib/services/expenseItemService"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

interface ExpenseEntry {
  id: string
  date: string
  name: string
  cost: number
  category: string
  projectName?: string
  isPaid: boolean
  note?: string
}

interface ExpenseItem {
  id: string
  name: string
  group: string
  description?: string
  isActive: boolean
  usageCount: number
}

interface Project {
  id: string
  projectName: string
  type: string
}

export default function ExpenseEntryForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    item: "",
    amount: 0,
    category: "",
    projectId: "",
    projectName: "",
    isPaid: false,
    note: "",
  })

  const [expenseHistory, setExpenseHistory] = useState<ExpenseEntry[]>([])
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [filteredExpenseItems, setFilteredExpenseItems] = useState<ExpenseItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [itemSearchValue, setItemSearchValue] = useState("")

  // Load data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Filter expense items based on search
  useEffect(() => {
    if (itemSearchValue.trim() === "") {
      setFilteredExpenseItems(expenseItems)
    } else {
      const filtered = expenseItems.filter(item => 
        item.name.toLowerCase().includes(itemSearchValue.toLowerCase()) ||
        item.group.toLowerCase().includes(itemSearchValue.toLowerCase())
      )
      setFilteredExpenseItems(filtered)
    }
  }, [itemSearchValue, expenseItems])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch expense items
      try {
        const expenseItemsResponse = await expenseItemService.getAllExpenseItems()
        if (expenseItemsResponse.success && expenseItemsResponse.result?.result) {
          const items = expenseItemsResponse.result.result.filter((item: any) => item.isActive)
          setExpenseItems(items)
          setFilteredExpenseItems(items)
        } else {
          // Fallback data
          const fallbackItems = [
            { id: "1", name: "ค่าจ้าง Outsource", group: "Outsource", isActive: true, usageCount: 0 },
            { id: "2", name: "ค่า Server", group: "Server", isActive: true, usageCount: 0 },
            { id: "3", name: "ค่า Subscription", group: "Tool", isActive: true, usageCount: 0 },
            { id: "4", name: "ค่าน้ำ", group: "Utility", isActive: true, usageCount: 0 },
            { id: "5", name: "ค่าไฟ", group: "Utility", isActive: true, usageCount: 0 },
            { id: "6", name: "ค่า Internet", group: "Utility", isActive: true, usageCount: 0 },
            { id: "7", name: "ค่าเลี้ยงอาหาร", group: "Salary", isActive: true, usageCount: 0 },
            { id: "8", name: "ค่าเช่าออฟฟิส", group: "Rental", isActive: true, usageCount: 0 },
            { id: "9", name: "ค่าจ้างพนักงาน", group: "Salary", isActive: true, usageCount: 0 },
            { id: "10", name: "ค่า incentive การขาย", group: "Incentive", isActive: true, usageCount: 0 }
          ]
          setExpenseItems(fallbackItems)
          setFilteredExpenseItems(fallbackItems)
        }
      } catch (error) {
        console.error('Error fetching expense items:', error)
        // Fallback data
        const fallbackItems = [
          { id: "1", name: "ค่าจ้าง Outsource", group: "Outsource", isActive: true, usageCount: 0 },
          { id: "2", name: "ค่า Server", group: "Server", isActive: true, usageCount: 0 },
          { id: "3", name: "ค่า Subscription", group: "Tool", isActive: true, usageCount: 0 },
          { id: "4", name: "ค่าน้ำ", group: "Utility", isActive: true, usageCount: 0 },
          { id: "5", name: "ค่าไฟ", group: "Utility", isActive: true, usageCount: 0 },
          { id: "6", name: "ค่า Internet", group: "Utility", isActive: true, usageCount: 0 },
          { id: "7", name: "ค่าเลี้ยงอาหาร", group: "Salary", isActive: true, usageCount: 0 },
          { id: "8", name: "ค่าเช่าออฟฟิส", group: "Rental", isActive: true, usageCount: 0 },
          { id: "9", name: "ค่าจ้างพนักงาน", group: "Salary", isActive: true, usageCount: 0 },
          { id: "10", name: "ค่า incentive การขาย", group: "Incentive", isActive: true, usageCount: 0 }
        ]
        setExpenseItems(fallbackItems)
        setFilteredExpenseItems(fallbackItems)
      }

      // Fetch projects
      const projectsResponse = await projectService.getAllProjects({
        projectName: "",
        type: "",
        status: ""
      })
      setProjects(projectsResponse.result?.projects || [])

      // Fetch expense history
      const expensesResponse = await expenseService.getRecentlyExpenses({
        search: "",
        startDate: "",
        endDate: "",
        category: "",
        status: ""
      })
      setExpenseHistory(expensesResponse.result?.records || [])
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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    const newFormData = { ...formData, [field]: value }

    // Auto-set category when item is selected
    if (field === "item") {
      const selectedItem = expenseItems.find((item) => item.name === value)
      if (selectedItem) {
        newFormData.category = selectedItem.group
      }
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

  const handleItemSelect = (item: ExpenseItem) => {
    setFormData({
      ...formData,
      item: item.name,
      category: item.group
    })
    setItemSearchValue(item.name)
    setShowItemDropdown(false)
  }

  const handleItemSearchChange = (value: string) => {
    setItemSearchValue(value)
    setShowItemDropdown(true)
    
    // If user clears the input, reset the form
    if (value === "") {
      setFormData({
        ...formData,
        item: "",
        category: ""
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.item || formData.amount <= 0 || !formData.projectId || !formData.date) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลค่าใช้จ่ายให้ครบถ้วนและถูกต้อง",
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

      const expenseData: CreateExpenseEntryRequest = {
        date: formData.date,
        expenseItem: formData.item,
        cost: formData.amount,
        projectId: formData.projectId,
        isPaid: formData.isPaid,
        createdBy: user?.name || "unknown",
        category: formData.category || "General",
        note: formData.note || ""
      }

      const response = await expenseService.createExpense(expenseData)
      if (response.success) {
        toast({
          title: "บันทึกสำเร็จ",
          description: "บันทึกค่าใช้จ่ายเรียบร้อยแล้ว"
        })

        // Reset form
        setFormData({
          date: new Date().toISOString().split("T")[0],
          item: "",
          amount: 0,
          category: "",
          projectId: "",
          projectName: "",
          isPaid: false,
          note: "",
        })
        setItemSearchValue("")

        // Reload expense history
        await fetchData()
      } else {
        throw new Error(response.message || "Failed to create expense entry")
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredExpenses = expenseHistory.filter(
    (expense) =>
      expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.projectName?.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <Label htmlFor="item">รายการค่าใช้จ่าย</Label>
          <div className="relative">
            <Input
              id="item"
              type="text"
              value={itemSearchValue}
              onChange={(e) => handleItemSearchChange(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหารายการค่าใช้จ่าย..."
              required
              disabled={saving}
              onFocus={() => setShowItemDropdown(true)}
              onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
            />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Autocomplete Dropdown */}
          {showItemDropdown && filteredExpenseItems.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredExpenseItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.group}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="amount">มูลค่า (บาท)</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", Number(e.target.value))}
            min="0"
            required
            disabled={saving}
          />
        </div>

        <div>
          <Label htmlFor="category">กลุ่มค่าใช้จ่าย</Label>
          <Input
            id="category"
            value={formData.category}
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

        <div className="md:col-span-2 flex items-center space-x-2">
          <Checkbox
            id="isPaid"
            checked={formData.isPaid}
            onCheckedChange={(checked) => handleInputChange("isPaid", checked)}
            disabled={saving}
          />
          <Label htmlFor="isPaid">ชำระเงินแล้ว</Label>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" className="w-full md:w-auto" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกค่าใช้จ่าย"}
          </Button>
        </div>
      </form>

      {/* Expense History */}
      <Card>
        <CardHeader>
          <CardTitle>รายการค่าใช้จ่ายล่าสุด</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหารายการค่าใช้จ่าย หรือชื่อโปรเจกต์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <Card key={expense.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{expense.name}</h4>
                          <Badge variant="outline">{expense.category}</Badge>
                          {expense.isPaid ? (
                            <Badge className="bg-green-100 text-green-800">ชำระแล้ว</Badge>
                          ) : (
                            <Badge variant="destructive">ค้างจ่าย</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{expense.projectName || "ไม่มีโปรเจกต์"}</p>
                        <p className="text-xs text-gray-500">{expense.date}</p>
                        {expense.note && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{expense.note}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-xl text-red-600">{expense.cost.toLocaleString("th-TH")} บาท</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>ไม่มีรายการค่าใช้จ่าย</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
