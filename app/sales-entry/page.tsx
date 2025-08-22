"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Trash2, ChevronDown, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { salesService, CreateSalesEntryRequest } from "@/lib/services/salesService"
import { projectService } from "@/lib/services/projectService"
import { useAuth } from "@/hooks/useAuth"
import { PaginationControls, PaginationInfo } from "@/components/ui/pagination-controls"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

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
    note: "", // เพิ่มฟิลด์สำหรับหมายเหตุ
  })

  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchStartDate, setSearchStartDate] = useState("")
  const [searchEndDate, setSearchEndDate] = useState("")
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
  const [salesTypes, setSalesTypes] = useState<any[]>([])
  const [filteredSalesTypes, setFilteredSalesTypes] = useState<any[]>([])
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [typeSearchValue, setTypeSearchValue] = useState("")
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
      setLoading(true)
      
      // Fetch sales types
      if (categoryService) {
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
      }

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
          type: record.type || 'ไม่ระบุ',
          note: record.note
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

  const handleTypeSelect = (type: any) => {
    // ไม่ให้เลือก "เพิ่มประเภทใหม่" เป็นประเภทปกติ
    if (type.name === "เพิ่มประเภทใหม่") {
      setFormData(prev => ({
        ...prev,
        description: "เพิ่มประเภทใหม่"
      }))
      setTypeSearchValue("เพิ่มประเภทใหม่")
      setShowTypeDropdown(false)
      return
    }
    
    setFormData(prev => ({
      ...prev,
      description: type.name,
      projectType: type.category
    }))
    setTypeSearchValue(type.name)
    setShowTypeDropdown(false)
  }

  const handleTypeSearchChange = (value: string) => {
    setTypeSearchValue(value)
    setShowTypeDropdown(true)
    
    // If user clears the input, reset the form
    if (value === "") {
      setFormData(prev => ({
        ...prev,
        description: "",
        projectType: ""
      }))
    }
    
    // If user starts typing and had "เพิ่มประเภทใหม่" selected, clear it
    if (formData.description === "เพิ่มประเภทใหม่" && value !== "เพิ่มประเภทใหม่") {
      setFormData(prev => ({
        ...prev,
        description: "",
        projectType: "",
        customType: ""
      }))
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
    if (formData.description === "เพิ่มประเภทใหม่" && !formData.customType.trim()) {
      alert("กรุณาระบุประเภทการขาย")
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
      
      if (formData.description === "เพิ่มประเภทใหม่") {
        try {
          const categoryResponse = await categoryService.createCategory({
            name: formData.customType.trim(),
            type: 'sales',
            description: `ประเภทการขาย: ${formData.customType.trim()}`,
            createdBy: user?.name || 'system'
          })
          
          if (categoryResponse.success) {
            projectTypeName = formData.customType.trim()
            // Created new category
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
        description: formData.description === "เพิ่มประเภทใหม่" ? formData.customType.trim() : formData.description.trim() || 'รายการขาย',
        totalPrice: Number(formData.totalPrice) || (Number(formData.quantity) * Number(formData.sellingPrice)) || 0,
        type: projectTypeName || selectedProject.type || 'Other',
        createdBy: user?.name || 'system',
        note: formData.note || ""
      }

      const response = await salesService.createSalesEntry(salesData)
      
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
        note: "",
      })
      setTypeSearchValue("")

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

  // ฟังก์ชันสำหรับส่งออกข้อมูลเป็น Excel
  const exportToExcel = () => {
    if (filteredSales.length === 0) {
      alert("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    try {
      // เตรียมข้อมูลสำหรับ Excel
      const excelData = filteredSales.map((sale, index) => ({
        'ลำดับ': index + 1,
        'วันที่': sale.date,
        'รายการขาย': sale.description,
        'จำนวน': sale.qty || 0,
        'ราคาต่อหน่วย (บาท)': sale.price || 0,
        'ยอดขายรวม (บาท)': sale.totalPrice,
        'โครงการ': sale.projectName,
        'ประเภท': sale.type
      }));

      // สร้าง worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // กำหนดความกว้างของคอลัมน์
      const columnWidths = [
        { wch: 8 },   // ลำดับ
        { wch: 12 },  // วันที่
        { wch: 35 },  // รายการขาย
        { wch: 12 },  // จำนวน
        { wch: 18 },  // ราคาต่อหน่วย
        { wch: 18 },  // ยอดขายรวม
        { wch: 30 },  // โครงการ
        { wch: 18 }   // ประเภท
      ];
      ws['!cols'] = columnWidths;

      // จัดรูปแบบหัวตาราง
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "70AD47" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };

      // จัดรูปแบบข้อมูล
      const dataStyle = {
        font: { color: { rgb: "000000" } },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        }
      };

      // จัดรูปแบบเฉพาะคอลัมน์
      const numberStyle = {
        ...dataStyle,
        alignment: { horizontal: "right", vertical: "center" },
        numFmt: "#,##0.00"
      };

      const quantityStyle = {
        ...dataStyle,
        alignment: { horizontal: "center", vertical: "center" },
        numFmt: "#,##0"
      };

      const typeStyle = {
        ...dataStyle,
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "E8F4E8" } }
      };

      // ใช้รูปแบบกับเซลล์
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[headerCell]) {
          ws[headerCell].s = headerStyle;
        }
        
        // จัดรูปแบบข้อมูลในแต่ละคอลัมน์
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const cell = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cell]) {
            let cellStyle;
            
            if (col === 0) { // ลำดับ
              cellStyle = { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } };
            } else if (col === 3) { // จำนวน
              cellStyle = quantityStyle;
            } else if (col === 4 || col === 5) { // ราคาต่อหน่วย, ยอดขายรวม
              cellStyle = numberStyle;
            } else if (col === 7) { // ประเภท
              cellStyle = typeStyle;
            } else {
              cellStyle = dataStyle;
            }
            
            // เพิ่มสีพื้นหลังสลับแถว
            if (row % 2 === 0) {
              cellStyle = { ...cellStyle, fill: { fgColor: { rgb: "F8F9FA" } } };
            }
            
            ws[cell].s = cellStyle;
          }
        }
      }

      // กำหนดความสูงของแถวหัวตาราง
      ws['!rows'] = [{ hpt: 25 }];

      // สร้าง workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'รายการยอดขาย');

      // ตรวจสอบว่ามีการกรองหรือไม่
      const hasFilters = searchTerm || searchStartDate || searchEndDate || searchAmount || searchProject !== "all" || searchType !== "all";

      // เพิ่มยอดสรุปตามตัวกรองที่เลือก
      const summaryData = [
        { 'รายการ': 'จำนวนรายการทั้งหมด', 'ค่า': filteredSales.length },
        { 'รายการ': 'ยอดขายรวม', 'ค่า': totalSales },
        { 'รายการ': 'จำนวนรวม', 'ค่า': totalQuantity },
        { 'รายการ': 'ราคาเฉลี่ยต่อหน่วย', 'ค่า': averagePrice.toFixed(2) }
      ];

      // เพิ่มข้อมูลตัวกรองที่ใช้
      if (hasFilters) {
        const filterInfo = [];
        if (searchTerm) filterInfo.push(`ค้นหา: ${searchTerm}`);
        if (searchStartDate) filterInfo.push(`ตั้งแต่: ${searchStartDate}`);
        if (searchEndDate) filterInfo.push(`ถึง: ${searchEndDate}`);
        if (searchAmount) filterInfo.push(`จำนวนเงิน: ${searchAmount}`);
        if (searchProject !== "all") filterInfo.push(`โครงการ: ${searchProject}`);
        if (searchType !== "all") filterInfo.push(`ประเภท: ${searchType}`);
        
        if (filterInfo.length > 0) {
          summaryData.unshift({ 'รายการ': 'ตัวกรองที่ใช้', 'ค่า': filterInfo.join(', ') });
        }
      }

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      
      // จัดรูปแบบหัวตารางสรุป
      const summaryHeaderStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "70AD47" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };

      // จัดรูปแบบข้อมูลสรุป
      const summaryDataStyle = {
        font: { color: { rgb: "000000" } },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        }
      };

      // ใช้รูปแบบกับเซลล์สรุป
      const summaryRange = XLSX.utils.decode_range(summaryWs['!ref'] || 'A1');
      
      for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
        if (summaryWs[headerCell]) {
          summaryWs[headerCell].s = summaryHeaderStyle;
        }
        
        for (let row = summaryRange.s.r + 1; row <= summaryRange.e.r; row++) {
          const cell = XLSX.utils.encode_cell({ r: row, c: col });
          if (summaryWs[cell]) {
            summaryWs[cell].s = summaryDataStyle;
          }
        }
      }

      // กำหนดความกว้างของคอลัมน์สรุป
      summaryWs['!cols'] = [
        { wch: 25 },   // รายการ
        { wch: 20 }    // ค่า
      ];

      XLSX.utils.book_append_sheet(wb, summaryWs, 'ยอดสรุป');

      // สร้างชื่อไฟล์ตามตัวกรอง
      let fileName = '';
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (hasFilters) {
        // มีการกรอง - หาช่วงวันที่
        const dates = filteredSales.map(s => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        if (startDate && endDate) {
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          if (startDateStr === endDateStr) {
            fileName = `รายการยอดขาย_${startDateStr}.xlsx`;
          } else {
            fileName = `รายการยอดขาย_${startDateStr}_ถึง_${endDateStr}.xlsx`;
          }
        } else {
          fileName = `รายการยอดขาย_กรองแล้ว_${currentDate}.xlsx`;
        }
      } else {
        // ไม่มีการกรอง - ใช้ข้อมูลทั้งหมด
        fileName = `รายการยอดขายทั้งหมด_ณ_${currentDate}.xlsx`;
      }

      // ส่งออกไฟล์
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, fileName);

      // สร้างข้อความแจ้งเตือนตามประเภทการส่งออก
      let message = `ส่งออกข้อมูล ${filteredSales.length} รายการเรียบร้อยแล้ว`;
      
      if (hasFilters) {
        const dates = filteredSales.map(s => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        if (startDate && endDate) {
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          if (startDateStr === endDateStr) {
            message = `ส่งออกข้อมูล ${filteredSales.length} รายการ วันที่ ${startDateStr} เรียบร้อยแล้ว`;
          } else {
            message = `ส่งออกข้อมูล ${filteredSales.length} รายการ ตั้งแต่ ${startDateStr} ถึง ${endDateStr} เรียบร้อยแล้ว`;
          }
        } else {
          message = `ส่งออกข้อมูล ${filteredSales.length} รายการ (กรองแล้ว) เรียบร้อยแล้ว`;
        }
      } else {
        message = `ส่งออกข้อมูลทั้งหมด ${filteredSales.length} รายการ ณ วันที่ ${currentDate} เรียบร้อยแล้ว`;
      }
      
      alert(message);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert("เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel");
    }
  };


  const filteredSales = salesHistory.filter(sale => {
    // Name filter
    const matchesSearch = !searchTerm || 
      sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.qty?.toString().includes(searchTerm) ||
      sale.price?.toString().includes(searchTerm)
    
    // Date filter - รองรับช่วงวันที่
    let matchesDate = true
    if (searchStartDate && searchEndDate) {
      matchesDate = sale.date >= searchStartDate && sale.date <= searchEndDate
    } else if (searchStartDate) {
      matchesDate = sale.date === searchStartDate
    } else if (searchEndDate) {
      matchesDate = sale.date <= searchEndDate
    }
    
    // Amount filter
    const matchesAmount = !searchAmount || sale.totalPrice.toString().includes(searchAmount)
    
    // Project filter
    const matchesProject = !searchProject || searchProject === "all" || sale.projectName === searchProject
    
    // Type filter
    const matchesType = !searchType || searchType === "all" || sale.type === searchType
    
    return matchesSearch && matchesDate && matchesAmount && matchesProject && matchesType
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // เรียงตามวันที่ใหม่ไปเก่า

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
  }, [searchTerm, searchStartDate, searchEndDate, searchAmount, searchProject, searchType])

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
                    <SelectTrigger id="projectName" className="bg-white border-gray-300 text-sm">
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

              <div className="relative">
                <Label htmlFor="description" className="text-sm text-gray-700">รายละเอียดการขาย</Label>
                <div className="relative">
                  <Input
                    id="description"
                    type="text"
                    value={typeSearchValue}
                    onChange={(e) => handleTypeSearchChange(e.target.value)}
                    placeholder="พิมพ์เพื่อค้นหารายการขาย..."
                    className="bg-white border-gray-300 text-sm"
                    required
                                          onFocus={() => {
                        setShowTypeDropdown(true)
                        // If "เพิ่มประเภทใหม่" is selected, show all options
                        if (formData.description === "เพิ่มประเภทใหม่") {
                          setFilteredSalesTypes(salesTypes.filter(type => type.name !== "เพิ่มประเภทใหม่"))
                        }
                      }}
                      onClick={() => {
                        setShowTypeDropdown(true)
                        // If "เพิ่มประเภทใหม่" is selected, show all options
                        if (formData.description === "เพิ่มประเภทใหม่") {
                          setFilteredSalesTypes(salesTypes.filter(type => type.name !== "เพิ่มประเภทใหม่"))
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Autocomplete Dropdown */}
                {showTypeDropdown && filteredSalesTypes.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredSalesTypes.filter(type => type.name !== "เพิ่มประเภทใหม่").map((type) => (
                      <div
                        key={type.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleTypeSelect(type)}
                      >
                        <div className="font-medium text-sm">{type.name}</div>
                        <div className="text-xs text-gray-500">{type.category}</div>
                      </div>
                    ))}
                                          <div
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 bg-blue-50"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, description: "เพิ่มประเภทใหม่" }))
                          setTypeSearchValue("เพิ่มประเภทใหม่")
                          setShowTypeDropdown(false)
                          // Clear any existing custom type
                          setFormData(prev => ({ ...prev, customType: "" }))
                        }}
                      >
                        <div className="font-medium text-sm text-blue-600">+ เพิ่มประเภทใหม่</div>
                        <div className="text-xs text-blue-500">สร้างประเภทการขายใหม่</div>
                      </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="salesType" className="text-sm text-gray-700">ประเภทการขาย</Label>
                  <Input
                    id="salesType"
                    value={formData.projectType}
                    readOnly
                    className="bg-gray-50 border-gray-300 text-sm"
                    placeholder="จะแสดงอัตโนมัติเมื่อเลือกรายการ"
                  />
                </div>
              </div>

              {/* Custom Type Input - แสดงเมื่อเลือก "เพิ่มประเภทใหม่" */}
              {formData.description === "เพิ่มประเภทใหม่" && (
                <div>
                  <Label htmlFor="customSalesType" className="text-sm text-gray-700">ระบุประเภทการขาย</Label>
                  <Input
                    id="customSalesType"
                    type="text"
                    value={formData.customType}
                    onChange={(e) => handleInputChange("customType", e.target.value)}
                    placeholder="กรอกประเภทการขายที่ต้องการ..."
                    className="bg-white border-gray-300 text-sm"
                    required={formData.description === "เพิ่มประเภทใหม่"}
                  />
                </div>
              )}

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

              <div>
                <Label htmlFor="projectType" className="text-sm text-gray-700">ประเภทโครงการ</Label>
                <Select value={formData.projectType} onValueChange={(value) => handleInputChange("projectType", value)}>
                  <SelectTrigger id="projectType" className="bg-white border-gray-300 text-sm">
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
                  <Label htmlFor="customProjectType" className="text-sm text-gray-700">ระบุประเภทโครงการ</Label>
                  <Input
                    id="customProjectType"
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                disabled={filteredSales.length === 0}
              >
                <Download className="w-3 h-3 mr-1" />
                ส่งออก Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setSearchStartDate("")
                  setSearchEndDate("")
                  setSearchAmount("")
                  setSearchProject("all")
                  setSearchType("all")
                }}
                className="text-xs"
              >
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                <SelectTrigger id="searchProject" className="bg-white border-gray-300 text-xs sm:text-sm">
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
                <SelectTrigger id="searchType" className="bg-white border-gray-300 text-xs sm:text-sm">
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
            <div>
              <Label htmlFor="searchStartDate" className="text-xs sm:text-sm text-gray-700">ตั้งแต่</Label>
              <Input
                id="searchStartDate"
                type="date"
                value={searchStartDate}
                onChange={(e) => setSearchStartDate(e.target.value)}
                className="bg-white border-gray-300 text-xs sm:text-sm"
                placeholder="เลือกวันที่เริ่มต้น"
              />
            </div>
            <div>
              <Label htmlFor="searchEndDate" className="text-xs sm:text-sm text-gray-700">ถึง</Label>
              <Input
                id="searchEndDate"
                type="date"
                value={searchEndDate}
                onChange={(e) => setSearchEndDate(e.target.value)}
                className="bg-white border-gray-300 text-xs sm:text-sm"
                placeholder="เลือกวันที่สิ้นสุด"
              />
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
            <div className="grid grid-cols-1 gap-4">
              {currentSales.map((sale, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-lg text-gray-900">{sale.description}</h3>
                          <Badge variant="outline">{sale.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{sale.projectName}</p>
                        <p className="text-xs text-gray-500">{sale.date}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          จำนวน: {sale.qty} | ราคาต่อหน่วย: {parseFloat(sale.price).toLocaleString("th-TH")} บาท
                        </p>
                        {sale.note && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{sale.note}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-xl text-green-600">
                          {parseFloat(sale.totalPrice).toLocaleString("th-TH")} บาท
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSale(sale.id)}
                        disabled={saving}
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

