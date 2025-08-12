"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, Calculator, DollarSign, Receipt } from "lucide-react"
import SalesEntryForm from "@/components/sales-entry-form"
import ExpenseEntryForm from "@/components/expense-entry-form"

export default function DataEntryPage() {
  const [activeTab, setActiveTab] = useState("sales")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับหน้าหลัก
                </Button>
              </Link>
              <Calculator className="h-8 w-8 text-gray-900 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">บันทึกข้อมูล</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              บันทึกยอดขาย
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center">
              <Receipt className="h-4 w-4 mr-2" />
              บันทึกค่าใช้จ่าย
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  บันทึกยอดขายรายเดือน
                </CardTitle>
                <CardDescription>บันทึกรายรับจากการขายสินค้าหรือบริการในแต่ละโปรเจกต์</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesEntryForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-red-600" />
                  บันทึกค่าใช้จ่าย
                </CardTitle>
                <CardDescription>บันทึกค่าใช้จ่ายต่างๆ ที่เกิดขึ้นในแต่ละโปรเจกต์</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseEntryForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
