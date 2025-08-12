import { backendApi } from '../backend-api'

export interface Category {
  id: string
  name: string
  type: 'expense' | 'sales'
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  usageCount: number
}

export interface CreateCategoryRequest {
  name: string
  type: 'expense' | 'sales'
  description?: string
  createdBy: string
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  isActive?: boolean
}

export const categoryService = {
  // Get all categories
  getAllCategories: async () => {
    return await backendApi.get('/api/category')
  },

  // Get expense categories
  getExpenseCategories: async () => {
    return await backendApi.get('/api/category/expense')
  },

  // Get sales categories
  getSalesCategories: async () => {
    return await backendApi.get('/api/category/sales')
  },

  // Get category usage statistics
  getCategoryUsageStats: async () => {
    return await backendApi.get('/api/category/usage-stats')
  },

  // Create new category
  createCategory: async (data: CreateCategoryRequest) => {
    return await backendApi.post('/api/category', data)
  },

  // Update category
  updateCategory: async (id: string, data: UpdateCategoryRequest) => {
    return await backendApi.put(`/api/category/${id}`, data)
  },

  // Delete category
  deleteCategory: async (id: string) => {
    return await backendApi.delete(`/api/category/${id}`)
  },

  // Initialize default categories
  initializeDefaultCategories: async (createdBy: string) => {
    return await backendApi.post('/api/category/initialize', { createdBy })
  }
}
