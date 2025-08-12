"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { authService } from "@/lib/services/authService"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "employee"
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.name || !formData.username || !formData.password || !formData.confirmPassword) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      return
    }

    if (formData.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return
    }

    try {
      setIsLoading(true)
      
      // Call the backend registration API
      const response = await authService.register({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role
      })
      
      if (response.success) {
        // Auto-login after successful registration
        const loginSuccess = await login(formData.username, formData.password)
        
        if (loginSuccess) {
          router.push('/')
        } else {
          setError("ลงทะเบียนสำเร็จ แต่ไม่สามารถเข้าสู่ระบบได้ กรุณาลองเข้าสู่ระบบใหม่")
        }
      } else {
        setError(response.message || "เกิดข้อผิดพลาดในการลงทะเบียน")
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || "เกิดข้อผิดพลาดในการลงทะเบียน")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ลงทะเบียน</h1>
          <p className="text-gray-600">สร้างบัญชีใหม่เพื่อเข้าสู่ระบบ</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">สร้างบัญชี</CardTitle>
            <CardDescription className="text-center">
              กรอกข้อมูลเพื่อสร้างบัญชีใหม่
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700">ชื่อ-นามสกุล</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white border-gray-300"
                  placeholder="กรอกชื่อ-นามสกุล"
                  required
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-gray-700">ชื่อผู้ใช้</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-white border-gray-300"
                  placeholder="กรอกชื่อผู้ใช้"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-gray-700">ตำแหน่ง</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">พนักงาน</SelectItem>
                    <SelectItem value="manager">ผู้จัดการ</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700">รหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-white border-gray-300 pr-10"
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700">ยืนยันรหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-white border-gray-300 pr-10"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังลงทะเบียน...
                  </>
                ) : (
                  "ลงทะเบียน"
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  มีบัญชีอยู่แล้ว?{" "}
                  <Link href="/login" className="text-gray-800 hover:text-gray-600 font-medium">
                    เข้าสู่ระบบ
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 