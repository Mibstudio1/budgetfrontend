"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { categoryService, Category } from "@/lib/services"
import { expenseItemService, ExpenseItem } from "@/lib/services"
import { useAuth } from "@/hooks/useAuth"

export default function CategoryManagement() {
  const { user } = useAuth()
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [salesTypes, setSalesTypes] = useState<Category[]>([])
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [loading, setLoading] = useState(true)
  

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingExpenseItem, setEditingExpenseItem] = useState<ExpenseItem | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'sales'>('expense')
  const [newExpenseItemName, setNewExpenseItemName] = useState("")
  const [newExpenseItemGroup, setNewExpenseItemGroup] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddExpenseItemDialogOpen, setIsAddExpenseItemDialogOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {

  }, [expenseCategories])

  useEffect(() => {

  }, [salesTypes])

  useEffect(() => {

  }, [expenseItems])

  const fetchCategories = async () => {
    try {
      setLoading(true)
  
      
      // Fetch expense categories
      try {
        const expenseResponse = await categoryService.getExpenseCategories()
        if (expenseResponse.success && expenseResponse.result && expenseResponse.result.result && Array.isArray(expenseResponse.result.result)) {
          setExpenseCategories(expenseResponse.result.result || [])
        } else {
          // Invalid expense response format
        }
      } catch (error) {
        console.error('Error fetching expense categories:', error)
      }

      // Fetch sales types
      try {
        const salesResponse = await categoryService.getSalesCategories()
        if (salesResponse.success && salesResponse.result && salesResponse.result.result && Array.isArray(salesResponse.result.result)) {
          setSalesTypes(salesResponse.result.result || [])
        } else {
          // Invalid sales response format
        }
      } catch (error) {
        console.error('Error fetching sales types:', error)
      }

      // Fetch expense items
      if (expenseItemService) {
        try {
          const itemsResponse = await expenseItemService.getAllExpenseItems()
          if (itemsResponse.success && itemsResponse.result && itemsResponse.result.result && Array.isArray(itemsResponse.result.result)) {
            setExpenseItems(itemsResponse.result.result || [])
          } else {
            // Invalid expense items response format
          }
        } catch (error) {
          console.error('Error fetching expense items:', error)
        }
      } else {
        console.error('expenseItemService is not available')
      }
    } catch (error) {
      console.error('Error in fetchCategories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("กรุณากรอกชื่อหมวดหมู่/ประเภท")
      return
    }

    try {
      const response = await categoryService.createCategory({
        name: newCategoryName.trim(),
        type: newCategoryType,
        description: `หมวดหมู่/ประเภท: ${newCategoryName.trim()}`,
        createdBy: user?.name || 'system'
      })

      if (response.success) {
        setNewCategoryName("")
        setIsAddDialogOpen(false)
        fetchCategories() // Refresh data
        alert("เพิ่มหมวดหมู่/ประเภทเรียบร้อยแล้ว")
      } else {
        alert(response.message || "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่/ประเภท")
      }
    } catch (error) {
      console.error('Error adding category:', error)
      alert("เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่/ประเภท")
    }
  }

  const handleAddExpenseItem = async () => {
    if (!newExpenseItemName.trim()) {
      alert("กรุณากรอกชื่อรายการค่าใช้จ่าย")
      return
    }

    if (!newExpenseItemGroup) {
      alert("กรุณาเลือกหมวดหมู่")
      return
    }

    try {
      const response = await expenseItemService.createExpenseItem({
        name: newExpenseItemName.trim(),
        group: newExpenseItemGroup,
        description: `รายการค่าใช้จ่าย: ${newExpenseItemName.trim()}`,
        createdBy: user?.name || 'system'
      })

      if (response.success) {
        setNewExpenseItemName("")
        setNewExpenseItemGroup("")
        setIsAddExpenseItemDialogOpen(false)
        fetchCategories() // Refresh data
        alert("เพิ่มรายการค่าใช้จ่ายเรียบร้อยแล้ว")
      } else {
        alert(response.message || "เกิดข้อผิดพลาดในการเพิ่มรายการค่าใช้จ่าย")
      }
    } catch (error) {
      console.error('Error adding expense item:', error)
      alert("เกิดข้อผิดพลาดในการเพิ่มรายการค่าใช้จ่าย")
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      alert("กรุณากรอกชื่อหมวดหมู่/ประเภท")
      return
    }

    try {
      const response = await categoryService.updateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        description: `หมวดหมู่/ประเภท: ${newCategoryName.trim()}`
      })

      if (response.success) {
        setEditingCategory(null)
        setNewCategoryName("")
        fetchCategories() // Refresh data
        alert("แก้ไขหมวดหมู่/ประเภทเรียบร้อยแล้ว")
      } else {
        alert(response.message || "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่/ประเภท")
      }
    } catch (error) {
      console.error('Error editing category:', error)
      alert("เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่/ประเภท")
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`คุณต้องการลบ ${category.type === 'expense' ? 'หมวดหมู่' : 'ประเภท'} "${category.name}" ใช่หรือไม่?`)) {
      return
    }

    try {
      const response = await categoryService.deleteCategory(category.id)

      if (response.success) {
        fetchCategories() // Refresh data
        alert("ลบหมวดหมู่/ประเภทเรียบร้อยแล้ว")
      } else {
        alert(response.message || "เกิดข้อผิดพลาดในการลบหมวดหมู่/ประเภท")
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert("เกิดข้อผิดพลาดในการลบหมวดหมู่/ประเภท")
    }
  }

  const startEdit = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
  }

  const startEditExpenseItem = (item: ExpenseItem) => {
    setEditingExpenseItem(item)
    setNewExpenseItemName(item.name)
    setNewExpenseItemGroup(item.group)
  }

  const handleDeleteExpenseItem = async (item: ExpenseItem) => {
    if (!confirm(`คุณต้องการลบรายการค่าใช้จ่าย "${item.name}" ใช่หรือไม่?`)) {
      return
    }

    try {
      const response = await expenseItemService.deleteExpenseItem(item.id)

      if (response.success) {
        fetchCategories() // Refresh data
        alert("ลบรายการค่าใช้จ่ายเรียบร้อยแล้ว")
      } else {
        alert(response.message || "เกิดข้อผิดพลาดในการลบรายการค่าใช้จ่าย")
      }
    } catch (error) {
      console.error('Error deleting expense item:', error)
      alert("เกิดข้อผิดพลาดในการลบรายการค่าใช้จ่าย")
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Category Management</h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-2">จัดการหมวดหมู่และประเภท</h2>
          <p className="text-sm sm:text-base text-gray-600">จัดการหมวดหมู่ค่าใช้จ่ายและประเภทโครงการ</p>
        </div>
        
        {/* Add Category Button */}
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มหมวดหมู่/ประเภท
          </Button>
          <Button
            onClick={() => setIsAddExpenseItemDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มรายการค่าใช้จ่าย
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มหมวดหมู่/ประเภทใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryType" className="text-sm text-gray-700">ประเภท</Label>
                <select
                  id="categoryType"
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value as 'expense' | 'sales')}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="expense">หมวดหมู่ค่าใช้จ่าย</option>
                  <option value="sales">ประเภทโครงการ</option>
                </select>
              </div>
              <div>
                <Label htmlFor="categoryName" className="text-sm text-gray-700">ชื่อ</Label>
                <Input
                  id="categoryName"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="กรอกชื่อหมวดหมู่/ประเภท..."
                  className="bg-white border-gray-300 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleAddCategory}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  เพิ่ม
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Expense Item Dialog */}
        <Dialog open={isAddExpenseItemDialogOpen} onOpenChange={setIsAddExpenseItemDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มรายการค่าใช้จ่ายใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="expenseItemName" className="text-sm text-gray-700">ชื่อรายการ</Label>
                <Input
                  id="expenseItemName"
                  type="text"
                  value={newExpenseItemName}
                  onChange={(e) => setNewExpenseItemName(e.target.value)}
                  placeholder="กรอกชื่อรายการค่าใช้จ่าย..."
                  className="bg-white border-gray-300 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="expenseItemGroup" className="text-sm text-gray-700">หมวดหมู่</Label>
                <select
                  id="expenseItemGroup"
                  value={newExpenseItemGroup}
                  onChange={(e) => setNewExpenseItemGroup(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddExpenseItemDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleAddExpenseItem}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  เพิ่ม
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Items */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-gray-900 flex items-center justify-between">
              <span>รายการค่าใช้จ่าย</span>
              <Badge variant="outline" className="text-xs">
                {expenseItems.length} รายการ
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenseItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">ไม่มีรายการค่าใช้จ่าย</p>
              ) : (
                expenseItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({item.group})</span>
                      {item.usageCount > 0 && (
                        <span className="text-xs text-gray-500 ml-2">({item.usageCount} รายการ)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditExpenseItem(item)}
                        className="p-1 h-auto"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpenseItem(item)}
                        className="p-1 h-auto text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        {/* Expense Categories */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-gray-900 flex items-center justify-between">
              <span>หมวดหมู่ค่าใช้จ่าย</span>
              <Badge variant="outline" className="text-xs">
                {expenseCategories.length} รายการ
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenseCategories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">ไม่มีหมวดหมู่ค่าใช้จ่าย</p>
              ) : (
                expenseCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      {category.usageCount > 0 && (
                        <span className="text-xs text-gray-500 ml-2">({category.usageCount} รายการ)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(category)}
                        className="p-1 h-auto"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        className="p-1 h-auto text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Types */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-gray-900 flex items-center justify-between">
              <span>ประเภทโครงการ</span>
              <Badge variant="outline" className="text-xs">
                {salesTypes.length} รายการ
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {salesTypes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">ไม่มีประเภทโครงการ</p>
              ) : (
                salesTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{type.name}</span>
                      {type.usageCount > 0 && (
                        <span className="text-xs text-gray-500 ml-2">({type.usageCount} รายการ)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(type)}
                        className="p-1 h-auto"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(type)}
                        className="p-1 h-auto text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>แก้ไขหมวดหมู่/ประเภท</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCategoryName" className="text-sm text-gray-700">ชื่อ</Label>
                <Input
                  id="editCategoryName"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="กรอกชื่อหมวดหมู่/ประเภท..."
                  className="bg-white border-gray-300 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleEditCategory}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  บันทึก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
