"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, DollarSign, Clock, Calendar, Loader2, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { expenseService } from "@/lib/services/expenseService"
import { projectService } from "@/lib/services/projectService"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface OutstandingExpense {
  id: string
  date: string
  item: string
  value: number
  projectName: string
  daysOverdue: number
  status: string
  category: string
}

const CATEGORIES = ["Outsource", "Server", "Tool", "Utility", "Salary", "Rental", "Incentive", "Other"]

const getOverdueMetrics = (days: number) => {
  if (days >= 30) return { color: "text-red-600", text: "เกินกำหนดมาก", badge: "bg-red-100 text-red-800" }
  if (days >= 15) return { color: "text-orange-600", text: "เกินกำหนดปานกลาง", badge: "bg-orange-100 text-orange-800" }
  if (days >= 7) return { color: "text-yellow-600", text: "เกินกำหนดเล็กน้อย", badge: "bg-yellow-100 text-yellow-800" }
  return { color: "text-green-600", text: "ปกติ", badge: "bg-green-100 text-green-800" }
}

export default function OutstandingExpenses() {
  const { toast } = useToast()
  const [outstandingExpenses, setOutstandingExpenses] = useState<OutstandingExpense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchName, setSearchName] = useState("")
  const [searchStartDate, setSearchStartDate] = useState("")
  const [searchEndDate, setSearchEndDate] = useState("")
  const [searchProject, setSearchProject] = useState("all")
  const [searchCategory, setSearchCategory] = useState("all")
  const [overdueFilter, setOverdueFilter] = useState("all")
  const [projects, setProjects] = useState<any[]>([])

  const fetchOutstandingExpenses = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const [projectResponse, expenseResponse] = await Promise.all([
        projectService.getAllProjects({ projectName: "", type: "", status: "" }),
        expenseService.getRecentlyExpenses({ search: "", startDate: "", endDate: "", category: "", status: "" })
      ])
      
      setProjects(projectResponse.result?.projects || [])
      
      if (expenseResponse.success && expenseResponse.result?.records) {
        const today = new Date()
        const outstanding: OutstandingExpense[] = expenseResponse.result.records
          .filter((expense: any) => !expense.isPaid)
          .map((expense: any) => {
            const daysOverdue = Math.max(0, Math.floor((today.getTime() - new Date(expense.date).getTime()) / 86400000))
            
            return {
              id: expense.id,
              date: expense.date,
              item: expense.expense || expense.name,
              value: expense.amount || expense.cost,
              projectName: expense.projectName || "ไม่ระบุโปรเจกต์",
              daysOverdue,
              status: "ค้างชำระ",
              category: expense.category || "Other"
            }
          })
        
        setOutstandingExpenses(outstanding)
      } else {
        setOutstandingExpenses([])
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      })
      setOutstandingExpenses([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOutstandingExpenses()
  }, [fetchOutstandingExpenses])

  const filteredExpenses = useMemo(() => {
          return outstandingExpenses.filter(expense => {
        const matchesName = !searchName || expense.item.toLowerCase().includes(searchName.toLowerCase())
        
        // Date filter - รองรับช่วงวันที่
        let matchesDate = true
        if (searchStartDate && searchEndDate) {
          matchesDate = expense.date >= searchStartDate && expense.date <= searchEndDate
        } else if (searchStartDate) {
          matchesDate = expense.date === searchStartDate
        } else if (searchEndDate) {
          matchesDate = expense.date <= searchEndDate
        }
        
        const matchesProject = searchProject === "all" || expense.projectName === searchProject
        const matchesCategory = searchCategory === "all" || expense.category === searchCategory
        const matchesOverdue = overdueFilter === "all" ||
          (overdueFilter === "overdue" && expense.daysOverdue > 0) ||
          (overdueFilter === "recent" && expense.daysOverdue <= 7) ||
          (overdueFilter === "critical" && expense.daysOverdue >= 30)
        
        return matchesName && matchesDate && matchesProject && matchesCategory && matchesOverdue
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // เรียงตามวันที่ใหม่ไปเก่า
  }, [outstandingExpenses, searchName, searchStartDate, searchEndDate, searchProject, searchCategory, overdueFilter])

  const stats = useMemo(() => {
    const totalOutstanding = filteredExpenses.reduce((sum, expense) => sum + (Number(expense.value) || 0), 0)
    const overdueCount = outstandingExpenses.filter(e => e.daysOverdue > 0).length
    const criticalCount = outstandingExpenses.filter(e => e.daysOverdue >= 30).length
    
    return { totalOutstanding, overdueCount, criticalCount }
  }, [filteredExpenses, outstandingExpenses])

  const clearFilters = useCallback(() => {
    setSearchName("")
    setSearchStartDate("")
    setSearchEndDate("")
    setSearchProject("all")
    setSearchCategory("all")
    setOverdueFilter("all")
  }, [])

  // ฟังก์ชันสำหรับส่งออกข้อมูลเป็น Excel
  const exportToExcel = () => {
    if (filteredExpenses.length === 0) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่มีข้อมูลที่จะส่งออก",
        variant: "destructive"
      })
      return;
    }

    try {
      // เตรียมข้อมูลสำหรับ Excel
      const excelData = filteredExpenses.map((expense, index) => ({
        'ลำดับ': index + 1,
        'วันที่': expense.date,
        'รายการค่าใช้จ่าย': expense.item,
        'จำนวนเงิน (บาท)': expense.value,
        'โครงการ': expense.projectName,
        'หมวดหมู่': expense.category,
        'จำนวนวันที่เกินกำหนด': expense.daysOverdue,
        'สถานะ': expense.daysOverdue > 0 ? 'เกินกำหนด' : 'ปกติ',
        'ระดับความเร่งด่วน': expense.daysOverdue >= 30 ? 'วิกฤต' : 
                            expense.daysOverdue >= 15 ? 'ปานกลาง' : 
                            expense.daysOverdue >= 7 ? 'เล็กน้อย' : 'ปกติ'
      }));

      // สร้าง worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // กำหนดความกว้างของคอลัมน์
      const columnWidths = [
        { wch: 8 },   // ลำดับ
        { wch: 12 },  // วันที่
        { wch: 35 },  // รายการค่าใช้จ่าย
        { wch: 18 },  // จำนวนเงิน
        { wch: 30 },  // โครงการ
        { wch: 18 },  // หมวดหมู่
        { wch: 20 },  // จำนวนวันที่เกินกำหนด
        { wch: 15 },  // สถานะ
        { wch: 18 }   // ระดับความเร่งด่วน
      ];
      ws['!cols'] = columnWidths;

      // จัดรูปแบบหัวตาราง
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "C5504B" } },
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

      const statusStyle = {
        ...dataStyle,
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "FFE6E6" } }
      };

      const urgencyStyle = {
        ...dataStyle,
        alignment: { horizontal: "center", vertical: "center" },
        font: { bold: true }
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
            } else if (col === 3) { // จำนวนเงิน
              cellStyle = numberStyle;
            } else if (col === 6) { // จำนวนวันที่เกินกำหนด
              cellStyle = { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } };
            } else if (col === 7) { // สถานะ
              cellStyle = statusStyle;
            } else if (col === 8) { // ระดับความเร่งด่วน
              cellStyle = urgencyStyle;
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
      XLSX.utils.book_append_sheet(wb, ws, 'ค่าใช้จ่ายค้างชำระ');

      // ตรวจสอบว่ามีการกรองหรือไม่
      const hasFilters = searchName || searchStartDate || searchEndDate || searchProject !== "all" || searchCategory !== "all" || overdueFilter !== "all";

      // เพิ่มยอดสรุปตามตัวกรองที่เลือก
      const summaryData = [
        { 'รายการ': 'จำนวนรายการทั้งหมด', 'ค่า': filteredExpenses.length },
        { 'รายการ': 'ยอดค้างชำระรวม', 'ค่า': stats.totalOutstanding },
        { 'รายการ': 'รายการที่เกินกำหนด', 'ค่า': stats.overdueCount },
        { 'รายการ': 'รายการวิกฤต (30+ วัน)', 'ค่า': stats.criticalCount }
      ];

      // เพิ่มข้อมูลตัวกรองที่ใช้
      if (hasFilters) {
        const filterInfo = [];
        if (searchName) filterInfo.push(`ชื่อ: ${searchName}`);
        if (searchStartDate) filterInfo.push(`ตั้งแต่: ${searchStartDate}`);
        if (searchEndDate) filterInfo.push(`ถึง: ${searchEndDate}`);
        if (searchProject !== "all") filterInfo.push(`โครงการ: ${searchProject}`);
        if (searchCategory !== "all") filterInfo.push(`หมวดหมู่: ${searchCategory}`);
        if (overdueFilter !== "all") {
          const overdueText = overdueFilter === "overdue" ? "เกินกำหนด" : 
                             overdueFilter === "recent" ? "เร็วๆ นี้" : 
                             overdueFilter === "critical" ? "วิกฤต" : "ทั้งหมด";
          filterInfo.push(`สถานะ: ${overdueText}`);
        }
        
        if (filterInfo.length > 0) {
          summaryData.unshift({ 'รายการ': 'ตัวกรองที่ใช้', 'ค่า': filterInfo.join(', ') });
        }
      }

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      
      // จัดรูปแบบหัวตารางสรุป
      const summaryHeaderStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "C5504B" } },
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
        const dates = filteredExpenses.map(e => new Date(e.date)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        if (startDate && endDate) {
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          if (startDateStr === endDateStr) {
            fileName = `ค่าใช้จ่ายค้างชำระ_${startDateStr}.xlsx`;
          } else {
            fileName = `ค่าใช้จ่ายค้างชำระ_${startDateStr}_ถึง_${endDateStr}.xlsx`;
          }
        } else {
          fileName = `ค่าใช้จ่ายค้างชำระ_กรองแล้ว_${currentDate}.xlsx`;
        }
      } else {
        // ไม่มีการกรอง - ใช้ข้อมูลทั้งหมด
        fileName = `ค่าใช้จ่ายค้างชำระทั้งหมด_ณ_${currentDate}.xlsx`;
      }

      // ส่งออกไฟล์
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, fileName);

      // สร้างข้อความแจ้งเตือนตามประเภทการส่งออก
      let message = `ส่งออกข้อมูล ${filteredExpenses.length} รายการเรียบร้อยแล้ว`;
      
      if (hasFilters) {
        const dates = filteredExpenses.map(e => new Date(e.date)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        if (startDate && endDate) {
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          if (startDateStr === endDateStr) {
            message = `ส่งออกข้อมูล ${filteredExpenses.length} รายการ วันที่ ${startDateStr} เรียบร้อยแล้ว`;
          } else {
            message = `ส่งออกข้อมูล ${filteredExpenses.length} รายการ ตั้งแต่ ${startDateStr} ถึง ${endDateStr} เรียบร้อยแล้ว`;
          }
        } else {
          message = `ส่งออกข้อมูล ${filteredExpenses.length} รายการ (กรองแล้ว) เรียบร้อยแล้ว`;
        }
      } else {
        message = `ส่งออกข้อมูลทั้งหมด ${filteredExpenses.length} รายการ ณ วันที่ ${currentDate} เรียบร้อยแล้ว`;
      }
      
      toast({
        title: "ส่งออกสำเร็จ",
        description: message,
      })
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel",
        variant: "destructive"
      })
    }
  };

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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Outstanding Expenses</h1>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-2">ค่าใช้จ่ายที่ค้างชำระ</h2>
        <p className="text-sm sm:text-base text-gray-600">Track unpaid expenses and overdue payments</p>
        <p className="text-xs sm:text-sm text-gray-500">ติดตามค่าใช้จ่ายที่ยังไม่ได้ชำระและรายการที่เกินกำหนด</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">Total Outstanding</h3>
                <p className="text-xs text-gray-600 mb-2 truncate">ยอดค้างชำระรวม</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-red-600">{stats.totalOutstanding.toLocaleString("th-TH")} บาท</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">Overdue Items</h3>
                <p className="text-xs text-gray-600 mb-2 truncate">รายการที่เกินกำหนด</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-orange-600">{stats.overdueCount}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">Critical Overdue</h3>
                <p className="text-xs text-gray-600 mb-2 truncate">เกินกำหนดมาก (30+ วัน)</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-red-600">{stats.criticalCount}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">Total Items</h3>
                <p className="text-xs text-gray-600 mb-2 truncate">รายการทั้งหมด</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-600">{outstandingExpenses.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-gray-900">ค้นหาและกรอง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              แสดง {filteredExpenses.length} จาก {outstandingExpenses.length} รายการ
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                disabled={filteredExpenses.length === 0}
              >
                <Download className="w-3 h-3 mr-1" />
                ส่งออก Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
              <Label htmlFor="searchCategory" className="text-xs sm:text-sm text-gray-700">หมวดหมู่</Label>
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger id="searchCategory" className="bg-white border-gray-300 text-xs sm:text-sm">
                  <SelectValue placeholder="ทุกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="overdueFilter" className="text-xs sm:text-sm text-gray-700">สถานะการเกินกำหนด</Label>
              <Select value={overdueFilter} onValueChange={setOverdueFilter}>
                <SelectTrigger id="overdueFilter" className="bg-white border-gray-300 text-xs sm:text-sm">
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="recent">ล่าสุด (≤7 วัน)</SelectItem>
                  <SelectItem value="overdue">เกินกำหนด (>0 วัน)</SelectItem>
                  <SelectItem value="critical">วิกฤต (≥30 วัน)</SelectItem>
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

      {/* Outstanding Expenses List */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Outstanding Expenses List</h3>
          <Badge variant="outline" className="text-xs sm:text-sm">
            {filteredExpenses.length} รายการ
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredExpenses.map((expense, index) => {
            const metrics = getOverdueMetrics(expense.daysOverdue)
            return (
              <Card key={expense.id || `expense-${index}`} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">
                      {expense.item}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{expense.date}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 text-xs">
                        {expense.projectName}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${metrics.badge}`}>
                        {metrics.text}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-red-600">
                      {expense.value.toLocaleString()} บาท
                    </span>
                    <span className={`text-xs sm:text-sm font-medium ${metrics.color}`}>
                      {expense.daysOverdue} วัน
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-600">สถานะ</span>
                    <span className="font-medium text-red-600">{expense.status}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">ไม่มีค่าใช้จ่ายค้างชำระ</h3>
            <p className="text-sm sm:text-base text-gray-600">ยังไม่มีค่าใช้จ่ายที่ค้างชำระในระบบ</p>
          </div>
        )}
      </div>
    </div>
  )
}
