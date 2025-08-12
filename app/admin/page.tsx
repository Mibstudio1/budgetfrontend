"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Users, AlertCircle, Loader2 } from "lucide-react"
import { userService, User, UpdateUserRequest, CreateUserRequest } from "@/lib/services/userService"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-context"
import { TokenManager } from "@/lib/token-manager"
import { PaginationControls, PaginationInfo } from "@/components/ui/pagination-controls"
import { Badge } from "@/components/ui/badge"

export default function AdminPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "user"
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Fetch users on component mount
  useEffect(() => {
    console.log('Current user:', user)
    console.log('User role:', user?.role)
    console.log('Token:', TokenManager.getToken())
    fetchUsers()
  }, [user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log('Fetching users...')
      const response = await userService.getUsers()
      console.log('Response:', response)
      if (response.success && response.result) {
        console.log('Users data:', response.result)
        setUsers(response.result)
      } else {
        console.log('No users found or response format incorrect')
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
        variant: "destructive"
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "user"
    })
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role
    })
    setIsDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!formData.name || !formData.username || (!editingUser && !formData.password)) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      })
      return
    }

    // Check if username already exists (for new users)
    if (!editingUser) {
      const existingUser = users.find(u => u.username === formData.username)
      if (existingUser) {
        toast({
          title: "ข้อมูลซ้ำ",
          description: "มี username นี้อยู่แล้ว",
          variant: "destructive"
        })
        return
      }
    }

    try {
      setSaving(true)
      if (editingUser) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          userId: editingUser.id,
          name: formData.name,
          username: formData.username,
          password: formData.password || "unchanged", // Backend should handle empty password
          role: formData.role
        }
        
        const response = await userService.updateUser(updateData)
        if (response.success) {
          toast({
            title: "อัปเดตสำเร็จ",
            description: "อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว"
          })
          fetchUsers() // Refresh the list
        } else {
          throw new Error("Failed to update user")
        }
      } else {
        // Create new user
        const createData: CreateUserRequest = {
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role
        }
        
        const response = await userService.createUser(createData)
        if (response.success) {
          toast({
            title: "สร้างสำเร็จ",
            description: "สร้างผู้ใช้ใหม่เรียบร้อยแล้ว"
          })
          fetchUsers() // Refresh the list
        } else {
          throw new Error("Failed to create user")
        }
      }

      setIsDialogOpen(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Error saving user:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?")) {
      return
    }

    try {
      const response = await userService.deleteUser(userId)
      if (response.success) {
        toast({
          title: "ลบสำเร็จ",
          description: "ลบผู้ใช้เรียบร้อยแล้ว"
        })
        fetchUsers() // Refresh the list
      } else {
        throw new Error("Failed to delete user")
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive"
      })
    }
  }

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = users.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 sm:mb-6 space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Admin Management</h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-700 mb-2">จัดการระบบ</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage system users and their roles</p>
          <p className="text-xs sm:text-sm text-gray-500">จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">User Management</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddUser} className="bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-300 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg text-gray-900">
                  {editingUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs sm:text-sm text-gray-700">
                    ชื่อ
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-white border-gray-300 text-xs sm:text-sm"
                    placeholder="กรอกชื่อ"
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-xs sm:text-sm text-gray-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    className="bg-white border-gray-300 text-xs sm:text-sm"
                    placeholder="กรอก username"
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-xs sm:text-sm text-gray-700">
                    รหัสผ่าน {editingUser && "(เว้นว่างเพื่อไม่เปลี่ยนแปลง)"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="bg-white border-gray-300 text-xs sm:text-sm"
                    placeholder={editingUser ? "เว้นว่างเพื่อไม่เปลี่ยนแปลง" : "กรอกรหัสผ่าน"}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-xs sm:text-sm text-gray-700">
                    สิทธิ์
                  </Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                    disabled={saving}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-xs sm:text-sm">
                      <SelectValue placeholder="เลือกสิทธิ์" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="text-xs sm:text-sm"
                    disabled={saving}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleSaveUser}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      editingUser ? "แก้ไข" : "เพิ่ม"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* User List */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm sm:text-base font-medium text-gray-900">รายการผู้ใช้</h4>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {users.length} Users
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {currentUsers.map((user) => (
              <Card key={user.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">{user.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{user.username}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">สถานะ</span>
                    <span className="text-xs sm:text-sm font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {currentUsers.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">ไม่มีข้อมูลผู้ใช้</h3>
              <p className="text-sm sm:text-base text-gray-600">ยังไม่มีข้อมูลผู้ใช้ในระบบ</p>
            </div>
          )}

          {/* Pagination */}
          {users.length > itemsPerPage && (
            <div className="mt-4 sm:mt-6">
              <PaginationInfo
                currentPage={currentPage}
                totalItems={users.length}
                itemsPerPage={itemsPerPage}
              />
              <PaginationControls
                currentPage={currentPage}
                totalItems={users.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
}

function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
        <p className="text-sm text-gray-400">เริ่มต้นด้วยการเพิ่มผู้ใช้ใหม่</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              ชื่อ
            </th>
            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Username
            </th>
            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              สิทธิ์
            </th>
            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              การดำเนินการ
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 lg:px-6 py-4 text-sm font-medium text-gray-900">
                {user.name}
              </td>
              <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                {user.username}
              </td>
              <td className="px-3 lg:px-6 py-4 text-sm text-gray-900">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 