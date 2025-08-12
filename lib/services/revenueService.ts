import { backendApi } from '@/lib/backend-api'

export interface RevenueTarget {
  id: string
  month: string
  monthThai?: string
  target: number
  actual: number
  percentage: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CreateRevenueTargetRequest {
  date: string
  target: number
  createdBy: string
}

export interface UpdateRevenueTargetRequest {
  id: string
  month: string
  target: number
}

export interface RevenueTargetResponse {
  targets: RevenueTarget[]
}

export interface RevenueTargetApiResponse {
  success: boolean
  message?: string
  result?: any
}

export const revenueService = {
  // Create new revenue target
  createRevenueTarget: async (data: CreateRevenueTargetRequest): Promise<RevenueTargetApiResponse> => {
    try {
      const response = await backendApi.post('/api/revenue-target/create', data)
      return {
        success: true,
        result: response
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create revenue target: ${error instanceof Error ? error.message : 'Unknown error'}`,
        result: { targets: [] }
      }
    }
  },

  // Get all revenue targets
  getAllRevenueTargets: async (): Promise<RevenueTargetApiResponse> => {
    try {
      const response = await backendApi.get('/api/revenue-target/all')
      return response
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to get revenue targets: ${error instanceof Error ? error.message : 'Unknown error'}`,
        result: { targets: [] }
      }
    }
  },

  getRevenueTargets: async (): Promise<RevenueTargetApiResponse> => {
    return await revenueService.getAllRevenueTargets()
  },

  updateRevenueTarget: async (data: UpdateRevenueTargetRequest): Promise<RevenueTargetApiResponse> => {
    try {
      const isGeneratedId = data.id.startsWith('month-')
      
      if (isGeneratedId) {
        // Create new record for generated IDs
        const response = await backendApi.post('/api/revenue-target/create', {
          date: data.month,
          target: data.target,
          createdBy: 'system'
        })
        return { success: true, result: response }
      }
      
      // Update existing record
      const response = await backendApi.put(`/api/revenue-target/${data.id}`, {
        date: data.month,
        target: data.target
      })
      return { success: true, result: response }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to update revenue target: ${error instanceof Error ? error.message : 'Unknown error'}`,
        result: { targets: [] }
      }
    }
  },

  deleteRevenueTarget: async (id: string): Promise<RevenueTargetApiResponse> => {
    try {
      const response = await backendApi.delete(`/api/revenue-target/${id}`)
      return {
        success: true,
        result: response
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to delete revenue target: ${error instanceof Error ? error.message : 'Unknown error'}`,
        result: { targets: [] }
      }
    }
  }
} 