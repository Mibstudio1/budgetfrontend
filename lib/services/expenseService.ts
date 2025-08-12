import { backendApi } from '@/lib/backend-api'
import { invalidateDashboardCaches } from '@/lib/utils/cacheManager'
import { eventBus, EVENTS } from '@/lib/utils/eventBus'

// Helper function to invalidate expense related caches
const invalidateExpenseRelatedCaches = () => {
  console.log('🔄 Invalidating expense related caches...')
  invalidateDashboardCaches()
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'expense_updated' })
}

export interface ExpenseEntry {
  id: string
  name: string
  date: string
  cost: number
  isPaid: boolean
  createdBy: string
  category: string
  bGProjectId?: string
  createdAt: string
}

export interface CreateExpenseEntryRequest {
  date: string
  expenseItem: string
  cost: number
  projectId: string
  isPaid: boolean
  createdBy: string
  category: string
}

export interface UpdateExpenseEntryRequest {
  id: string
  name: string
  date: string
  cost: number
  isPaid: boolean
  category: string
  bGProjectId?: string
}

export interface SearchExpenseRequest {
  search: string
  startDate: string
  endDate: string
  category: string
  status: string
}

export interface ExpenseResponse {
  records: ExpenseEntry[]
}

export const expenseService = {
  // Get recently expenses
  getRecentlyExpenses: async (searchParams: SearchExpenseRequest) => {
    return await backendApi.post<ExpenseResponse>('/api/expense-entry/recently', searchParams)
  },

  // Create new expense
  createExpense: async (data: CreateExpenseEntryRequest) => {
    try {
      const response = await backendApi.post('/api/expense-entry/create', data)
      
      // Invalidate related caches after successful creation
      invalidateExpenseRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to create expense entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Update expense
  updateExpense: async (data: UpdateExpenseEntryRequest) => {
    try {
      const response = await backendApi.patch(`/api/expense-entry/${data.id}`, data)
      
      // Invalidate related caches after successful update
      invalidateExpenseRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to update expense entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Delete expense
  deleteExpense: async (id: string) => {
    try {
      const response = await backendApi.delete(`/api/expense-entry/${id}`)
      
      // Invalidate related caches after successful deletion
      invalidateExpenseRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to delete expense entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Update expense status
  updateExpenseStatus: async (id: string, isPaid: boolean) => {
    try {
      console.log(`🔄 Updating expense payment status: ${id} -> ${isPaid ? 'Paid' : 'Unpaid'}`)
      
      const response = await backendApi.patch(`/api/expense-entry/${id}/status`, {
        isPaid: isPaid
      })
      
      console.log('✅ Expense status update successful, invalidating caches...')
      
      // Invalidate related caches after successful status update
      invalidateExpenseRelatedCaches()
      
      return response
    } catch (error) {
      console.error('❌ Expense status update failed:', error)
      throw new Error(`Failed to update expense status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} 