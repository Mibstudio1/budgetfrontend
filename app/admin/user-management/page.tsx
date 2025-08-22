"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Users, AlertCircle } from "lucide-react"
import { userService, User, UpdateUserRequest, CreateUserRequest } from "@/lib/services/userService"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-context"
import { TokenManager } from "@/lib/token-manager"

export default function UserManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "user"
  })

  // Fetch users on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      console.log('Current user:', user)
      console.log('User role:', user?.role)
      fetchUsers()
    }
  }, [user?.role])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log('Fetching users...')
      const response = await userService.getUsers()
      console.log('Response:', response)
      
      // Backend returns array of users directly
      if (Array.isArray(response)) {
        console.log('Users data as array:', response)
        setUsers(response)
      } else {
        console.log('No users found or response format incorrect')
        console.log('Response:', response)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
        variant: "destructive"
      })
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

    try {
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
        }
      } else {
        // Create new user
        const createData: CreateUserRequest = {
          name: formData.name.trim() || 'ผู้ใช้ใหม่',
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role || 'user'
        }
        
        const response = await userService.createUser(createData)
        if (response.success) {
          toast({
            title: "สร้างสำเร็จ",
            description: "สร้างผู้ใช้ใหม่เรียบร้อยแล้ว"
          })
          fetchUsers() // Refresh the list
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

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">User Management</h1>
          <h2 className="text-xl lg:text-2xl font-semibold text-gray-700 mb-2">จัดการผู้ใช้</h2>
          <p className="text-gray-600">Manage system users and their roles</p>
          <p className="text-sm text-gray-500">จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">User List</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddUser} className="bg-gray-800 hover:bg-gray-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-gray-300 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-900">
                  {editingUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700">
                    ชื่อ
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-white border-gray-300"
                    placeholder="กรอกชื่อ"
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-gray-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    className="bg-white border-gray-300"
                    placeholder="กรอก username"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700">
                    รหัสผ่าน {editingUser && "(เว้นว่างเพื่อไม่เปลี่ยนแปลง)"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="bg-white border-gray-300"
                    placeholder={editingUser ? "เว้นว่างเพื่อไม่เปลี่ยนแปลง" : "กรอกรหัสผ่าน"}
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-gray-700">
                    สิทธิ์
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="เลือกสิทธิ์" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSaveUser} className="bg-gray-800 hover:bg-gray-700 text-white">
                    บันทึก
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            ) : (
              <UserTable
                users={users}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            )}
          </CardContent>
        </Card>
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
