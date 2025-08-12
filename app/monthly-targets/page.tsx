"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Check, X, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { revenueService, RevenueTarget, UpdateRevenueTargetRequest } from "@/lib/services/revenueService"
import { useToast } from "@/hooks/use-toast"

export default function MonthlyTargets() {
  const { toast } = useToast()
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [monthlyTargets, setMonthlyTargets] = useState<RevenueTarget[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [backendTargets, setBackendTargets] = useState<any[]>([])

  // สร้างรายการปีให้เลือก (ปีปัจจุบัน - 5 ปี และ + 5 ปี)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i.toString())
    }
    return years
  }

  const yearOptions = generateYearOptions()

  // Generate monthly targets for all months with 0 value
  const generateMonthlyTargets = (year: string): RevenueTarget[] => {
    const monthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ]
    
    return monthNames.map((month, index) => {
      const monthNumber = (index + 1).toString().padStart(2, '0')
      const standardFormat = `${year}-${monthNumber}` // 2025-08 format
      const thaiFormat = `${month} ${year}` // สิงหาคม 2025 format
      
      return {
        id: `month-${index + 1}`,
        month: standardFormat, // ใช้รูปแบบมาตรฐาน
        monthThai: thaiFormat, // เก็บรูปแบบไทยไว้แสดงผล
        target: 0,
        actual: 0,
        percentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system"
      }
    })
  }

  // Load data from backend
  const loadBackendData = async () => {
    try {
      console.log('Attempting to load backend data...')
      const response = await revenueService.getAllRevenueTargets()
      console.log('Full response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', Object.keys(response || {}))
      
      if (response?.success && response?.result?.targets && Array.isArray(response.result.targets)) {
        const targets = response.result.targets
        console.log('Backend targets loaded:', targets)
        setBackendTargets(targets)
        return targets
      }
      console.log('No valid targets found in response')
      console.log('Response success:', response?.success)
      console.log('Response result:', response?.result)
      return []
    } catch (error: any) {
      console.error('Error loading backend data:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      return []
    }
  }

  // Initialize monthly targets with generated data
  const initializeMonthlyTargets = async (year: string) => {
    try {
      setIsLoading(true)
      
      // Load backend data first
      const backendData = await loadBackendData()
      console.log('Backend data loaded:', backendData)
      
      // Generate base monthly targets
      const generatedTargets = generateMonthlyTargets(year)
      console.log('Generated targets:', generatedTargets)
      
      // Merge backend data with generated months for selected year
      const mergedTargets = generatedTargets.map(generated => {
        // Find backend target for this specific month
        const backendTarget = backendData.find((b: any) => {
          // Check if month matches exactly
          return b.month === generated.month;
        });
        
        console.log(`Checking month ${generated.month}:`, backendTarget);
        
        if (backendTarget) {
          return { 
            ...generated, 
            id: backendTarget.id, // Use the actual backend ID
            target: Number(backendTarget.target) || 0,
            createdAt: backendTarget.createdAt,
            updatedAt: backendTarget.updatedAt,
            createdBy: backendTarget.createdBy || "system"
          }
        }
        return generated
      })
      
      console.log('Final merged targets:', mergedTargets)
      setMonthlyTargets(mergedTargets)
      
      // Save to localStorage as backup
      localStorage.setItem(`monthlyTargets_${year}`, JSON.stringify(mergedTargets))
      
    } catch (error) {
      console.error('Error initializing monthly targets:', error)
      
      // Fallback to localStorage
      const savedTargets = localStorage.getItem(`monthlyTargets_${year}`)
      if (savedTargets) {
        try {
          const parsed = JSON.parse(savedTargets)
          setMonthlyTargets(parsed)
        } catch (parseError) {
          console.error('Error parsing saved targets:', parseError)
          setMonthlyTargets(generateMonthlyTargets(year))
        }
      } else {
        setMonthlyTargets(generateMonthlyTargets(year))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize monthly targets on component mount
  useEffect(() => {
    initializeMonthlyTargets(selectedYear)
  }, [selectedYear])

  const handleYearChange = async (year: string) => {
    setSelectedYear(year)
    await initializeMonthlyTargets(year)
  }

  const handleEditClick = (id: string, currentTarget: number) => {
    setEditingTarget(id)
    setEditValue(currentTarget)
  }

  const handleSaveTarget = async () => {
    if (!editingTarget) return

    try {
      setSaving(true)
      const target = monthlyTargets.find(t => t.id === editingTarget)
      if (!target) return

      const updateData: UpdateRevenueTargetRequest = {
        id: editingTarget,
        month: target.month,
        target: editValue
      }

      const response = await revenueService.updateRevenueTarget(updateData)

      if (response?.success) {
        // Update the local state with the new target value
        let updatedTargets = monthlyTargets.map(t => 
          t.id === editingTarget 
            ? { ...t, target: editValue, updatedAt: new Date().toISOString() }
            : t
        )
        
        // If we created a new record, update the ID
        if (editingTarget.startsWith('month-') && response.result?.id) {
          updatedTargets = updatedTargets.map(t => 
            t.id === editingTarget 
              ? { ...t, id: response.result.id, target: editValue, updatedAt: new Date().toISOString() }
              : t
          )
        }
        
        setMonthlyTargets(updatedTargets)
        
        // Save to localStorage
        localStorage.setItem(`monthlyTargets_${selectedYear}`, JSON.stringify(updatedTargets))
        
        // Refresh backend data
        await loadBackendData()
        
        toast({
          title: "อัปเดตสำเร็จ",
          description: "อัปเดตเป้าหมายรายได้เรียบร้อยแล้ว"
        })
      } else {
        throw new Error("Failed to update target")
      }
    } catch (error) {
      console.error('Error updating target:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตเป้าหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
      setEditingTarget(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingTarget(null)
    setEditValue(0)
  }

  const handleRefreshData = async () => {
    await initializeMonthlyTargets(selectedYear)
    toast({
      title: "รีเฟรชข้อมูล",
      description: "โหลดข้อมูลใหม่เรียบร้อยแล้ว"
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Monthly Revenue Targets</h1>
        <p className="text-xs sm:text-sm text-gray-600">Set and modify monthly revenue targets for year {selectedYear}</p>
        <p className="text-xs text-gray-500">กำหนดและแก้ไขเป้าหมายรายได้ประจำเดือน ปี {selectedYear}</p>
      </div>

      {/* Main Content Card */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span>เป้าหมายปัจจุบัน</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                className="mt-2 sm:mt-0"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                รีเฟรช
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          
          {/* Year Selector */}
          <div className="flex justify-center mb-4">
            <Select onValueChange={handleYearChange} defaultValue={selectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Month • เดือน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Target (THB) • เป้าหมาย (บาท)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions • การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyTargets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {target.monthThai || target.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingTarget === target.id ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-32 bg-white border-gray-300 text-sm"
                          min="0"
                          disabled={saving}
                          placeholder="0"
                        />
                      ) : (
                        <div>
                          <span className="font-medium">{formatCurrency(target.target)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingTarget === target.id ? (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={handleSaveTarget}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(target.id, target.target)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {monthlyTargets.map((target) => (
              <Card key={target.id} className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-gray-900">{target.monthThai || target.month}</h3>
                    </div>
                    <div>
                      {editingTarget === target.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                              Target (THB) • เป้าหมาย (บาท)
                            </label>
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(Number(e.target.value))}
                              className="w-full bg-white border-gray-300 text-sm"
                              min="0"
                              disabled={saving}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={handleSaveTarget}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              <span className="ml-1 text-xs">บันทึก</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="flex-1"
                            >
                              <X className="w-4 h-4" />
                              <span className="ml-1 text-xs">ยกเลิก</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">Target (THB) • เป้าหมาย (บาท)</p>
                            <p className="text-sm sm:text-base font-medium text-gray-900">
                              {formatCurrency(target.target)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(target.id, target.target)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">สรุปข้อมูล</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">จำนวนเดือนที่มีเป้าหมาย:</p>
                <p className="font-medium">{monthlyTargets.filter(t => t.target > 0).length} / 12 เดือน</p>
              </div>
              <div>
                <p className="text-gray-600">เป้าหมายรวมทั้งปี:</p>
                <p className="font-medium">{formatCurrency(monthlyTargets.reduce((sum, t) => sum + t.target, 0))}</p>
              </div>
              <div>
                <p className="text-gray-600">เป้าหมายเฉลี่ยต่อเดือน:</p>
                <p className="font-medium">{formatCurrency(Math.round(monthlyTargets.reduce((sum, t) => sum + t.target, 0) / 12))}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
