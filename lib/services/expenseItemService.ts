import { backendApi } from '../backend-api'

export interface ExpenseItem {
  id: string
  name: string
  group: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  usageCount: number
}

export interface CreateExpenseItemRequest {
  name: string
  group: string
  description?: string
  createdBy: string
}

export interface UpdateExpenseItemRequest {
  name?: string
  group?: string
  description?: string
  isActive?: boolean
}

export const expenseItemService = {
  // Get all expense items
  getAllExpenseItems: async () => {
    return await backendApi.get('/api/expense-item')
  },

  // Get expense items by group
  getExpenseItemsByGroup: async (group: string) => {
    return await backendApi.get(`/api/expense-item/group/${group}`)
  },

  // Create new expense item
  createExpenseItem: async (data: CreateExpenseItemRequest) => {
    return await backendApi.post('/api/expense-item', data)
  },

  // Update expense item
  updateExpenseItem: async (id: string, data: UpdateExpenseItemRequest) => {
    return await backendApi.put(`/api/expense-item/${id}`, data)
  },

  // Delete expense item
  deleteExpenseItem: async (id: string) => {
    return await backendApi.delete(`/api/expense-item/${id}`)
  },

  // Initialize default expense items
  initializeDefaultExpenseItems: async (createdBy: string) => {
    return await backendApi.post('/api/expense-item/initialize', { createdBy })
  }
}
