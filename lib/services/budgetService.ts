import { backendApi } from '@/lib/backend-api'
import { invalidateDashboardCaches } from '@/lib/utils/cacheManager'
import { eventBus, EVENTS } from '@/lib/utils/eventBus'

// Helper function to invalidate budget related caches
const invalidateBudgetRelatedCaches = () => {
  console.log('🔄 Invalidating budget related caches...')
  invalidateDashboardCaches()
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'budget_updated' })
}

export interface Budget {
  id: string
  projectId: string
  projectName: string
  description: string
  type: string
  budget: number
  usedBudget: number
  remainingBudget: number
  status: "กำลังทำ" | "เสร็จแล้ว" | "ยกเลิก"
  createdAt: string
}

export interface CreateBudgetRequest {
  projectId: string
  description: string
  budget: number
  createdBy: string
}

export interface UpdateBudgetRequest {
  budgetId: string
  description: string
  budget: number
}

export interface GetBudgetRequest {
  month: number
  year: number
}

export interface BudgetResponse {
  success: boolean
  message: string
  result: {
    budget: Array<{
      budgetId: string
      projectName: string
      description: string
      projectStatus: string
      projectType: string
      budget: string
      usedBudget: number
      remainingBudget: number
    }>
  }
}

export interface AvailableProject {
  id: string
  name: string
  type: string
  status: string
  description: string
}

export interface AvailableProjectsResponse {
  success: boolean
  result: {
    projects: AvailableProject[]
  }
}

export const budgetService = {
  // Get all budgets
  getAllBudgets: async () => {
    return await backendApi.get<BudgetResponse>('/api/budget/get-budget')
  },

  // Get available projects for budget creation
  getAvailableProjects: async (): Promise<AvailableProjectsResponse> => {
    try {
      const response = await backendApi.get('/api/budget/available-projects')
      return response
    } catch (error) {
      throw new Error(`Failed to get available projects: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Create new budget
  createBudget: async (data: CreateBudgetRequest) => {
    try {
      const response = await backendApi.post('/api/budget/create', data)
      
      // Invalidate related caches after successful creation
      invalidateBudgetRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to create budget: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Update budget
  updateBudget: async (id: string, data: Omit<UpdateBudgetRequest, 'budgetId'>) => {
    try {
      const updateData = {
        budgetId: id,
        ...data
      }
      const response = await backendApi.patch('/api/budget/update', updateData)
      
      // Invalidate related caches after successful update
      invalidateBudgetRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to update budget: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Delete budget
  deleteBudget: async (id: string) => {
    try {
      const response = await backendApi.delete(`/api/budget?budgetId=${id}`)
      
      // Invalidate related caches after successful deletion
      invalidateBudgetRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to delete budget: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Get budget by month and year
  getBudgetByMonthYear: async (data: GetBudgetRequest) => {
    return await backendApi.get(`/api/budget/get-budget?month=${data.month}&year=${data.year}`)
  }
}

