"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, ChevronDown, Download } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { expenseService, CreateExpenseEntryRequest } from "@/lib/services/expenseService"
import { optionsService } from "@/lib/services/optionsService"
import { projectService } from "@/lib/services/projectService"
import { useAuth } from "@/hooks/useAuth"
import { PaginationControls, PaginationInfo } from "@/components/ui/pagination-controls"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface LocalExpenseRecord {
  id: string
  date: string
  name: string
  amount: number
  projectName?: string
  status: boolean
  category: string
  note?: string
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
    note: "", // เพิ่มฟิลด์สำหรับหมายเหตุ
  })

  const [expenses, setExpenses] = useState<LocalExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchName, setSearchName] = useState("")
  const [searchAmount, setSearchAmount] = useState("")
  const [searchStartDate, setSearchStartDate] = useState("")
  const [searchEndDate, setSearchEndDate] = useState("")
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

  // เพิ่ม state สำหรับเก็บหมวดหมู่ค่าใช้จ่าย
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [filteredExpenseItems, setFilteredExpenseItems] = useState<ExpenseItem[]>([])
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [itemSearchValue, setItemSearchValue] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [categorySearchValue, setCategorySearchValue] = useState("")
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
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

  // Debug expense categories
  useEffect(() => {
    console.log('Expense categories updated:', expenseCategories)
  }, [expenseCategories])

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

  // Filter categories based on search
  useEffect(() => {
    if (categorySearchValue.trim() === "") {
      setFilteredCategories(expenseCategories)
    } else {
      const filtered = expenseCategories.filter(category => 
        category.name.toLowerCase().includes(categorySearchValue.toLowerCase())
      )
      setFilteredCategories(filtered)
    }
  }, [categorySearchValue, expenseCategories])

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
            const items = itemsResponse.result.result.filter((item: any) => item.isActive).map((item: any) => ({
              name: item.name,
              group: item.group
            }))
            // Add "เพิ่มรายการใหม่" option
            items.push({ name: "เพิ่มรายการใหม่", group: "Custom" })
            setExpenseItems(items)
            setFilteredExpenseItems(items)
          } else {
            // Fallback to default items if API fails
            const fallbackItems = [
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
            ]
            setExpenseItems(fallbackItems)
            setFilteredExpenseItems(fallbackItems)
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
            category: expense.category || "Other",
            note: expense.note
          }))
          setExpenses(expenseRecords)
          
          // ดึงหมวดหมู่ที่ใช้จริงจากข้อมูล
          const categories = [...new Set(expenseRecords.map(expense => expense.category))].sort()
          setAvailableCategories(categories)

          // ดึงหมวดหมู่จาก API category
          if (categoryService) {
            try {
              console.log('Fetching expense categories from API...')
              const categoryResponse = await categoryService.getExpenseCategories()
              console.log('Category response:', categoryResponse)
              
              if (categoryResponse.success && categoryResponse.result && categoryResponse.result.result && Array.isArray(categoryResponse.result.result)) {
                const categoryNames = categoryResponse.result.result.map((cat: any) => cat.name)
                console.log('Category names:', categoryNames)
                setAvailableCategories(prev => [...new Set([...prev, ...categoryNames])].sort())
                setExpenseCategories(categoryResponse.result.result)
                console.log('Expense categories set:', categoryResponse.result.result)
              } else {
                console.log('Category response structure:', categoryResponse)
              }
            } catch (error) {
              console.error('Error fetching categories from API:', error)
            }
          } else {
            console.log('Category service not available')
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

  // ฟังก์ชันสำหรับ export Excel
  const exportToExcel = () => {
    try {
      // ข้อมูลที่กรองแล้ว
      const filteredData = expenses.filter(expense => {
        const matchesName = !searchName || expense.name.toLowerCase().includes(searchName.toLowerCase())
        const matchesAmount = !searchAmount || expense.amount.toString().includes(searchAmount)
        const matchesDate = (!searchStartDate || expense.date >= searchStartDate) && 
                           (!searchEndDate || expense.date <= searchEndDate)
        const matchesProject = searchProject === "all" || expense.projectName === searchProject
        const matchesCategory = searchCategory === "all" || expense.category === searchCategory
        const matchesStatus = searchStatus === "all" || 
                             (searchStatus === "paid" && expense.status) || 
                             (searchStatus === "unpaid" && !expense.status)
        
        return matchesName && matchesAmount && matchesDate && matchesProject && matchesCategory && matchesStatus
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // เรียงตามวันที่ใหม่ไปเก่า

      if (filteredData.length === 0) {
        alert('ไม่มีข้อมูลสำหรับ export')
        return
      }

      // สร้างชื่อไฟล์
      let fileName = 'รายจ่าย'
      if (searchStartDate && searchEndDate) {
        if (searchStartDate === searchEndDate) {
          fileName += `_${searchStartDate}`
        } else {
          fileName += `_${searchStartDate}_ถึง_${searchEndDate}`
        }
      } else if (searchStartDate) {
        fileName += `_ตั้งแต่_${searchStartDate}`
      } else if (searchEndDate) {
        fileName += `_จนถึง_${searchEndDate}`
      } else {
        fileName += '_ทั้งหมด_' + new Date().toISOString().split('T')[0]
      }

      // สร้างข้อมูลสำหรับ Sheet รายการ
      const expenseData = filteredData.map((expense, index) => ({
        'ลำดับ': index + 1,
        'วันที่': expense.date,
        'รายการ': expense.name,
        'จำนวนเงิน (บาท)': Number(expense.amount).toLocaleString('th-TH'),
        'โครงการ': expense.projectName || 'ไม่มีโปรเจกต์',
        'หมวดหมู่': expense.category,
        'สถานะ': expense.status ? 'ชำระแล้ว' : 'ค้างจ่าย',
        'หมายเหตุ': expense.note || ''
      }))

      // สร้างข้อมูลสำหรับ Sheet สรุป
      const summaryData = []
      
      // เพิ่มข้อมูลสรุปทั่วไป
      summaryData.push({
        'สรุปค่าใช้จ่าย': `รายงานค่าใช้จ่าย ${fileName.replace('รายจ่าย_', '')}`,
        'จำนวนเงิน (บาท)': '',
        'จำนวนรายการ': ''
      })
      
      summaryData.push({
        'สรุปค่าใช้จ่าย': `วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`,
        'จำนวนเงิน (บาท)': '',
        'จำนวนรายการ': ''
      })
      
      summaryData.push({
        'สรุปค่าใช้จ่าย': `จำนวนรายการทั้งหมด: ${filteredData.length} รายการ`,
        'จำนวนเงิน (บาท)': `รวม: ${Number(filteredData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)).toLocaleString('th-TH')} บาท`,
        'จำนวนรายการ': ''
      })
      
      summaryData.push({
        'สรุปค่าใช้จ่าย': '',
        'จำนวนเงิน (บาท)': '',
        'จำนวนรายการ': ''
      })
      
      // สรุปตามหมวดหมู่
      summaryData.push({
        'สรุปค่าใช้จ่าย': '=== สรุปตามหมวดหมู่ ===',
        'จำนวนเงิน (บาท)': '',
        'จำนวนรายการ': ''
      })
      
      const categorySummary = filteredData.reduce((acc, expense) => {
        const amount = Number(expense.amount) || 0
        acc[expense.category] = (acc[expense.category] || 0) + amount
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(categorySummary)
        .sort(([,a], [,b]) => b - a) // เรียงตามจำนวนเงินมากไปน้อย
        .forEach(([category, amount]) => {
          summaryData.push({
            'สรุปค่าใช้จ่าย': category,
            'จำนวนเงิน (บาท)': Number(amount).toLocaleString('th-TH'),
            'จำนวนรายการ': filteredData.filter(e => e.category === category).length
          })
        })

      summaryData.push({
        'สรุปค่าใช้จ่าย': '',
        'จำนวนเงิน (บาท)': '',
        'จำนวนรายการ': ''
      })

      // สรุปตามโครงการ
      summaryData.push({
        'สรุปค่าใช้จ่าย': '=== สรุปตามโครงการ ===',
        'จำนวนเงิน (บาท)': '',
        'จำนวนรายการ': ''
      })
      
      const projectSummary = filteredData.reduce((acc, expense) => {
        const projectName = expense.projectName || 'ไม่มีโปรเจกต์'
        const amount = Number(expense.amount) || 0
        acc[projectName] = (acc[projectName] || 0) + amount
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(projectSummary)
        .sort(([,a], [,b]) => b - a) // เรียงตามจำนวนเงินมากไปน้อย
        .forEach(([project, amount]) => {
          summaryData.push({
            'สรุปค่าใช้จ่าย': project,
            'จำนวนเงิน (บาท)': Number(amount).toLocaleString('th-TH'),
            'จำนวนรายการ': filteredData.filter(e => (e.projectName || 'ไม่มีโปรเจกต์') === project).length
          })
        })

      summaryData.push({
        'สรุปค่าใช้จ่าย': '',
        'จำนวนเงิน (บาท)': '',
        'จำนวนรายการ': ''
      })

      // สรุปสถานะการชำระ
      summaryData.push({
        'สรุปค่าใช้จ่าย': '=== สรุปสถานะการชำระ ===',
        'จำนวนเงิน (บาท)': '',
        'จำนวนรายการ': ''
      })
      
      const paidAmount = filteredData.filter(e => e.status).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      const unpaidAmount = filteredData.filter(e => !e.status).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      
      summaryData.push({
        'สรุปค่าใช้จ่าย': 'ชำระแล้ว',
        'จำนวนเงิน (บาท)': Number(paidAmount).toLocaleString('th-TH'),
        'จำนวนรายการ': filteredData.filter(e => e.status).length
      })
      
      summaryData.push({
        'สรุปค่าใช้จ่าย': 'ค้างจ่าย',
        'จำนวนเงิน (บาท)': Number(unpaidAmount).toLocaleString('th-TH'),
        'จำนวนรายการ': filteredData.filter(e => !e.status).length
      })

      // สร้าง workbook
      const workbook = XLSX.utils.book_new()
      
      // Sheet รายการ
      const expenseWorksheet = XLSX.utils.json_to_sheet(expenseData)
      XLSX.utils.book_append_sheet(workbook, expenseWorksheet, 'รายการค่าใช้จ่าย')
      
      // Sheet สรุป
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'สรุปค่าใช้จ่าย')

      // ตั้งค่าความกว้างคอลัมน์
      const expenseCols = [
        { wch: 6 },   // ลำดับ
        { wch: 15 },  // วันที่
        { wch: 35 },  // รายการ
        { wch: 18 },  // จำนวนเงิน
        { wch: 30 },  // โครงการ
        { wch: 20 },  // หมวดหมู่
        { wch: 12 },  // สถานะ
        { wch: 40 }   // หมายเหตุ
      ]
      expenseWorksheet['!cols'] = expenseCols

      const summaryCols = [
        { wch: 25 },  // หมวดหมู่/โครงการ/สถานะ
        { wch: 18 },  // จำนวนเงิน
        { wch: 15 }   // จำนวนรายการ
      ]
      summaryWorksheet['!cols'] = summaryCols

      // จัดรูปแบบ Header ของ Sheet รายการ
      const expenseRange = XLSX.utils.decode_range(expenseWorksheet['!ref'] || 'A1')
      for (let col = expenseRange.s.c; col <= expenseRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (expenseWorksheet[cellAddress]) {
          expenseWorksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          }
        }
      }

      // จัดรูปแบบ Header ของ Sheet สรุป
      const summaryRange = XLSX.utils.decode_range(summaryWorksheet['!ref'] || 'A1')
      for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (summaryWorksheet[cellAddress]) {
          summaryWorksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "70AD47" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          }
        }
      }

      // จัดรูปแบบข้อมูลใน Sheet รายการ
      for (let row = expenseRange.s.r + 1; row <= expenseRange.e.r; row++) {
        for (let col = expenseRange.s.c; col <= expenseRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (expenseWorksheet[cellAddress]) {
            // จัดรูปแบบคอลัมน์จำนวนเงิน
            if (col === 3) { // คอลัมน์จำนวนเงิน
              expenseWorksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: "C00000" } },
                alignment: { horizontal: "right" },
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" }
                }
              }
            } else {
              expenseWorksheet[cellAddress].s = {
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" }
                }
              }
            }
          }
        }
      }

      // จัดรูปแบบข้อมูลใน Sheet สรุป
      for (let row = summaryRange.s.r + 1; row <= summaryRange.e.r; row++) {
        for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (summaryWorksheet[cellAddress]) {
            const cellValue = summaryWorksheet[cellAddress].v
            
            // จัดรูปแบบหัวข้อพิเศษ
            if (typeof cellValue === 'string' && cellValue.includes('===')) {
              summaryWorksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "FF6600" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" }
                }
              }
            }
            // จัดรูปแบบข้อมูลสรุปทั่วไป
            else if (typeof cellValue === 'string' && (cellValue.includes('รายงาน') || cellValue.includes('วันที่') || cellValue.includes('จำนวนรายการทั้งหมด'))) {
              summaryWorksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: "000000" } },
                fill: { fgColor: { rgb: "E6F3FF" } },
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" }
                }
              }
            }
            // จัดรูปแบบคอลัมน์จำนวนเงิน
            else if (col === 1 && cellValue && cellValue !== '') { // คอลัมน์จำนวนเงิน
              summaryWorksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: "C00000" } },
                alignment: { horizontal: "right" },
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" }
                }
              }
            }
            // จัดรูปแบบข้อมูลปกติ
            else {
              summaryWorksheet[cellAddress].s = {
                border: {
                  top: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                  right: { style: "thin" }
                }
              }
            }
          }
        }
      }

      // Export ไฟล์
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `${fileName}.xlsx`)

    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('เกิดข้อผิดพลาดในการ export ไฟล์')
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemSelect = (item: ExpenseItem) => {
    // ไม่ให้เลือก "เพิ่มรายการใหม่" เป็นรายการปกติ
    if (item.name === "เพิ่มรายการใหม่") {
      setFormData(prev => ({
        ...prev,
        item: "เพิ่มรายการใหม่"
      }))
      setItemSearchValue("เพิ่มรายการใหม่")
      setShowItemDropdown(false)
      return
    }
    
    // หาหมวดหมู่ที่ตรงกับ group ของ item
    const matchingCategory = expenseCategories.find(cat => cat.name === item.group)
    const categoryName = matchingCategory ? matchingCategory.name : item.group
    
    setFormData(prev => ({
      ...prev,
      item: item.name,
      group: categoryName
    }))
    setItemSearchValue(item.name)
    setShowItemDropdown(false)
  }

  const handleItemSearchChange = (value: string) => {
    setItemSearchValue(value)
    setShowItemDropdown(true)
    
    // If user clears the input, reset the form
    if (value === "") {
      setFormData(prev => ({
        ...prev,
        item: "",
        group: ""
      }))
    }
    
    // If user starts typing and had "เพิ่มรายการใหม่" selected, clear it
    if (formData.item === "เพิ่มรายการใหม่" && value !== "เพิ่มรายการใหม่") {
      setFormData(prev => ({
        ...prev,
        item: "",
        group: "",
        customItem: ""
      }))
    }
  }

  const handleCategorySelect = (category: any) => {
    // ไม่ให้เลือก "เพิ่มหมวดหมู่ใหม่" เป็นหมวดหมู่ปกติ
    if (category.name === "เพิ่มหมวดหมู่ใหม่") {
      setFormData(prev => ({
        ...prev,
        group: "เพิ่มหมวดหมู่ใหม่"
      }))
      setCategorySearchValue("เพิ่มหมวดหมู่ใหม่")
      setShowCategoryDropdown(false)
      return
    }
    
    setFormData(prev => ({
      ...prev,
      group: category.name
    }))
    setCategorySearchValue(category.name)
    setShowCategoryDropdown(false)
  }

  const handleCategorySearchChange = (value: string) => {
    setCategorySearchValue(value)
    setShowCategoryDropdown(true)
    
    // If user clears the input, reset the form
    if (value === "") {
      setFormData(prev => ({
        ...prev,
        group: ""
      }))
    }
    
    // If user starts typing and had "เพิ่มหมวดหมู่ใหม่" selected, clear it
    if (formData.group === "เพิ่มหมวดหมู่ใหม่" && value !== "เพิ่มหมวดหมู่ใหม่") {
      setFormData(prev => ({
        ...prev,
        group: "",
        customGroup: ""
      }))
    }
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
      alert("กรุณาระบุหมวดหมู่ค่าใช้จ่าย")
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

      // สร้างหมวดหมู่ใหม่ถ้าเลือก "เพิ่มหมวดหมู่ใหม่"
      if (formData.group === "เพิ่มหมวดหมู่ใหม่" && categoryService) {
        try {
          await categoryService.createCategory({
            name: formData.customGroup.trim(),
            type: 'expense',
            description: `หมวดหมู่ค่าใช้จ่าย: ${formData.customGroup.trim()}`,
            createdBy: user?.name || 'system'
          })
          console.log('Created new expense category:', formData.customGroup.trim())
        } catch (error) {
          console.error('Error creating expense category:', error)
        }
      }

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
        category: categoryName || 'อื่นๆ',
        note: formData.note || "ไม่มีหมายเหตุ"
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
          note: "",
        })
        setItemSearchValue("")
        
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
    const matchesDate = (!searchStartDate || expense.date >= searchStartDate) && 
                       (!searchEndDate || expense.date <= searchEndDate)
    
    // Project filter
    const matchesProject = !searchProject || searchProject === "all" || expense.projectName === searchProject
    
    // Category filter
    const matchesCategory = !searchCategory || searchCategory === "all" || expense.category === searchCategory
    
    // Status filter
    const matchesStatus = !searchStatus || searchStatus === "all" ||
      (searchStatus === "paid" && expense.status === true) ||
      (searchStatus === "unpaid" && expense.status === false)
    
    return matchesName && matchesAmount && matchesDate && matchesProject && matchesCategory && matchesStatus
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // เรียงตามวันที่ใหม่ไปเก่า

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
  }, [searchName, searchAmount, searchStartDate, searchEndDate, searchProject, searchCategory])

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
                <div className="relative">
                  <Label htmlFor="item" className="text-sm text-gray-700">รายการค่าใช้จ่าย</Label>
                  <div className="relative">
                    <Input
                      id="item"
                      type="text"
                      value={itemSearchValue}
                      onChange={(e) => handleItemSearchChange(e.target.value)}
                      placeholder="พิมพ์เพื่อค้นหารายการค่าใช้จ่าย..."
                      className="bg-white border-gray-300 text-sm"
                      required
                      onFocus={() => {
                        setShowItemDropdown(true)
                        // If "เพิ่มรายการใหม่" is selected, show all options
                        if (formData.item === "เพิ่มรายการใหม่") {
                          setFilteredExpenseItems(expenseItems.filter(item => item.name !== "เพิ่มรายการใหม่"))
                        }
                      }}
                      onClick={() => {
                        setShowItemDropdown(true)
                        // If "เพิ่มรายการใหม่" is selected, show all options
                        if (formData.item === "เพิ่มรายการใหม่") {
                          setFilteredExpenseItems(expenseItems.filter(item => item.name !== "เพิ่มรายการใหม่"))
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {/* Autocomplete Dropdown */}
                  {showItemDropdown && filteredExpenseItems.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredExpenseItems.filter(item => item.name !== "เพิ่มรายการใหม่").map((item) => (
                        <div
                          key={item.name}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleItemSelect(item)}
                        >
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.group}</div>
                        </div>
                      ))}
                      <div
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 bg-blue-50"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, item: "เพิ่มรายการใหม่" }))
                          setItemSearchValue("เพิ่มรายการใหม่")
                          setShowItemDropdown(false)
                          // Clear any existing custom item
                          setFormData(prev => ({ ...prev, customItem: "" }))
                        }}
                      >
                        <div className="font-medium text-sm text-blue-600">+ เพิ่มรายการใหม่</div>
                        <div className="text-xs text-blue-500">สร้างรายการค่าใช้จ่ายใหม่</div>
                      </div>
                    </div>
                  )}
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
                <div className="relative">
                  <Label htmlFor="group" className="text-sm text-gray-700">หมวดหมู่ค่าใช้จ่าย</Label>
                  <div className="relative">
                    <Input
                      id="group"
                      type="text"
                      value={categorySearchValue}
                      onChange={(e) => handleCategorySearchChange(e.target.value)}
                      placeholder="พิมพ์เพื่อค้นหาหมวดหมู่ค่าใช้จ่าย..."
                      className="bg-white border-gray-300 text-sm"
                      required
                      onFocus={() => {
                        setShowCategoryDropdown(true)
                        // If "เพิ่มหมวดหมู่ใหม่" is selected, show all options
                        if (formData.group === "เพิ่มหมวดหมู่ใหม่") {
                          setFilteredCategories(expenseCategories.filter(cat => cat.name !== "เพิ่มหมวดหมู่ใหม่"))
                        }
                      }}
                      onClick={() => {
                        setShowCategoryDropdown(true)
                        // If "เพิ่มหมวดหมู่ใหม่" is selected, show all options
                        if (formData.group === "เพิ่มหมวดหมู่ใหม่") {
                          setFilteredCategories(expenseCategories.filter(cat => cat.name !== "เพิ่มหมวดหมู่ใหม่"))
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {/* Category Autocomplete Dropdown */}
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCategories.filter(category => category.name !== "เพิ่มหมวดหมู่ใหม่").map((category) => (
                        <div
                          key={category.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleCategorySelect(category)}
                        >
                          <div className="font-medium text-sm truncate">{category.name}</div>
                        </div>
                      ))}
                      <div
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 bg-blue-50"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, group: "เพิ่มหมวดหมู่ใหม่" }))
                          setCategorySearchValue("เพิ่มหมวดหมู่ใหม่")
                          setShowCategoryDropdown(false)
                          // Clear any existing custom group
                          setFormData(prev => ({ ...prev, customGroup: "" }))
                        }}
                      >
                        <div className="font-medium text-sm text-blue-600">+ เพิ่มหมวดหมู่ค่าใช้จ่ายใหม่</div>
                        <div className="text-xs text-blue-500">สร้างหมวดหมู่ค่าใช้จ่ายใหม่</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Group Input - แสดงเมื่อเลือก "เพิ่มหมวดหมู่ใหม่" */}
              {formData.group === "เพิ่มหมวดหมู่ใหม่" && (
                <div>
                                      <Label htmlFor="customGroup" className="text-sm text-gray-700">ระบุหมวดหมู่ค่าใช้จ่าย</Label>
                  <Input
                    id="customGroup"
                    type="text"
                    value={formData.customGroup}
                    onChange={(e) => handleInputChange("customGroup", e.target.value)}
                                          placeholder="กรอกหมวดหมู่ค่าใช้จ่ายที่ต้องการ..."
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

              <div>
                <Label htmlFor="note" className="text-sm text-gray-700">หมายเหตุ</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  placeholder="เพิ่มหมายเหตุหรือรายละเอียดเพิ่มเติม..."
                  className="resize-none bg-white border-gray-300 text-sm"
                  rows={3}
                />
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
            <p className="text-xs text-gray-500">{filteredExpenses.length.toLocaleString("th-TH")} รายการ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Paid Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{paidExpenses.toLocaleString("th-TH")}</div>
            <p className="text-xs text-gray-500">{filteredExpenses.filter(e => e.status).length.toLocaleString("th-TH")} รายการ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Unpaid Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{unpaidExpenses.toLocaleString("th-TH")}</div>
            <p className="text-xs text-gray-500">{filteredExpenses.filter(e => !e.status).length.toLocaleString("th-TH")} รายการ</p>
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
                  <div className="text-lg font-bold text-red-600">{category.amount.toLocaleString("th-TH")} บาท</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {totalExpenses > 0 ? ((category.amount / totalExpenses) * 100).toFixed(1) : 0}% ของค่าใช้จ่ายที่แสดง
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {filteredExpenses.filter(e => e.category === category.category).length.toLocaleString("th-TH")} รายการ
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
              แสดง {filteredExpenses.length.toLocaleString("th-TH")} จาก {expenses.length.toLocaleString("th-TH")} รายการ
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Download className="h-3 w-3 mr-1" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchName("")
                  setSearchAmount("")
                  setSearchStartDate("")
                  setSearchEndDate("")
                  setSearchProject("all")
                  setSearchCategory("all")
                  setSearchStatus("all")
                }}
                className="text-xs"
              >
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
          {/* Row 1: Search and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="searchName" className="text-sm font-medium text-gray-700 mb-2 block">ค้นหาชื่อรายการ</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="searchName"
                  type="text"
                  placeholder="พิมพ์เพื่อค้นหาชื่อรายการ..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-sm h-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="searchAmount" className="text-sm font-medium text-gray-700 mb-2 block">จำนวนเงิน</Label>
              <Input
                id="searchAmount"
                type="text"
                placeholder="ค้นหาจำนวนเงิน..."
                value={searchAmount}
                onChange={(e) => setSearchAmount(e.target.value)}
                className="bg-white border-gray-300 text-sm h-10"
              />
            </div>
          </div>

          {/* Row 2: Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="searchProject" className="text-sm font-medium text-gray-700 mb-2 block">โครงการ</Label>
              <Select value={searchProject} onValueChange={setSearchProject}>
                <SelectTrigger className="bg-white border-gray-300 text-sm h-10">
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
              <Label htmlFor="searchCategory" className="text-sm font-medium text-gray-700 mb-2 block">หมวดหมู่ค่าใช้จ่าย</Label>
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="bg-white border-gray-300 text-sm h-10">
                  <SelectValue placeholder="ทุกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวดหมู่ค่าใช้จ่าย</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="searchStatus" className="text-sm font-medium text-gray-700 mb-2 block">สถานะการชำระ</Label>
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger className="bg-white border-gray-300 text-sm h-10">
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="paid">ชำระแล้ว</SelectItem>
                  <SelectItem value="unpaid">ค้างจ่าย</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Date Range */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">ช่วงวันที่</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="searchStartDate" className="text-xs text-gray-600 mb-1 block">วันที่เริ่มต้น</Label>
                <Input
                  id="searchStartDate"
                  type="date"
                  value={searchStartDate}
                  onChange={(e) => setSearchStartDate(e.target.value)}
                  className="bg-white border-gray-300 text-sm h-10"
                />
              </div>
              <div>
                <Label htmlFor="searchEndDate" className="text-xs text-gray-600 mb-1 block">วันที่สิ้นสุด</Label>
                <Input
                  id="searchEndDate"
                  type="date"
                  value={searchEndDate}
                  onChange={(e) => setSearchEndDate(e.target.value)}
                  className="bg-white border-gray-300 text-sm h-10"
                />
              </div>
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
            <div className="grid grid-cols-1 gap-4">
              {currentExpenses.map((expense, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-medium text-lg text-gray-900 truncate">{expense.name}</h3>
                          <Badge variant="outline" className="flex-shrink-0">{expense.category}</Badge>
                          {expense.status ? (
                            <Badge className="bg-green-100 text-green-800 flex-shrink-0">ชำระแล้ว</Badge>
                          ) : (
                            <Badge variant="destructive" className="flex-shrink-0">ค้างจ่าย</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1 truncate">{expense.projectName || "ไม่มีโปรเจกต์"}</p>
                        <p className="text-xs text-gray-500">{expense.date}</p>
                        {expense.note && (
                          <p className="text-sm text-gray-600 mt-2 italic break-words">"{expense.note}"</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-medium text-xl text-red-600">{Number(expense.amount).toLocaleString("th-TH")} บาท</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        แก้ไข
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        ลบ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                  <p className="text-sm text-gray-900 mt-1">{Number(editingExpense.amount).toLocaleString("th-TH")} บาท</p>
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

