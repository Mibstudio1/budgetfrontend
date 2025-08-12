"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { expenseService, CreateExpenseEntryRequest } from "@/lib/services/expenseService"
import { projectService } from "@/lib/services/projectService"
import { optionsService } from "@/lib/services/optionsService"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

interface ExpenseEntry {
  id: string
  date: string
  item: string
  amount: number
  category: string
  projectName: string
  isPaid: boolean
}

interface ExpenseItem {
  name: string
  category: string
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
  })

  const [expenseHistory, setExpenseHistory] = useState<ExpenseEntry[]>([])
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch expense items
      try {
        const expenseItemsResponse = await optionsService.getExpenseItems()
        if (Array.isArray(expenseItemsResponse)) {
          setExpenseItems(expenseItemsResponse.map(item => ({
            name: item,
            category: item // Use the item name as category for now
          })))
        } else {
          setExpenseItems([
            { name: "Server", category: "Technology" },
            { name: "Software", category: "Technology" },
            { name: "Office Supplies", category: "General" },
            { name: "Travel", category: "General" },
            { name: "Marketing", category: "Business" }
          ])
        }
      } catch (error) {
        console.error('Error fetching expense items:', error)
        setExpenseItems([
          { name: "Server", category: "Technology" },
          { name: "Software", category: "Technology" },
          { name: "Office Supplies", category: "General" },
          { name: "Travel", category: "General" },
          { name: "Marketing", category: "Business" }
        ])
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
        newFormData.category = selectedItem.category
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
        category: formData.category || "General"
      }

      const response = await expenseService.createExpenseEntry(expenseData)
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
        })

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
      expense.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.projectName.toLowerCase().includes(searchTerm.toLowerCase()),
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

        <div>
          <Label htmlFor="item">รายการค่าใช้จ่าย</Label>
          <Select 
            value={formData.item} 
            onValueChange={(value) => handleInputChange("item", value)}
            disabled={saving}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกรายการค่าใช้จ่าย" />
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
          <div className="space-y-4">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{expense.item}</h4>
                      <Badge variant="outline">{expense.category}</Badge>
                      {expense.isPaid ? (
                        <Badge className="bg-green-100 text-green-800">ชำระแล้ว</Badge>
                      ) : (
                        <Badge variant="destructive">ค้างจ่าย</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{expense.projectName}</p>
                    <p className="text-xs text-gray-500">{expense.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">{expense.amount.toLocaleString("th-TH")} บาท</p>
                  </div>
                </div>
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
