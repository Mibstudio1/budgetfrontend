import { backendApi } from '@/lib/backend-api'
import { invalidateDashboardCaches } from '@/lib/utils/cacheManager'
import { eventBus, EVENTS } from '@/lib/utils/eventBus'

// Helper function to invalidate sales related caches
const invalidateSalesRelatedCaches = () => {
  console.log('🔄 Invalidating sales related caches...')
  invalidateDashboardCaches()
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'sales_updated' })
}

export interface SalesEntry {
  id: string
  date: string
  description: string
  quantity: number
  selling: number
  totalPrice: number
  createdBy: string
  type: string
  bG_projectId?: string
  createdAt: string
}

export interface CreateSalesEntryRequest {
  date: string
  projectId: string
  description: string
  totalPrice: number
  type: string
  createdBy: string
}

export interface UpdateSalesEntryRequest {
  id: string
  date: string
  description: string
  quantity: number
  selling: number
  type: string
  bG_projectId?: string
}

export interface SearchSalesRequest {
  search: string
  startDate: string
  endDate: string
  type: string
}

export interface SalesResponse {
  sales: SalesEntry[]
}

export const salesService = {
  // Get all sales (use recently endpoint)
  getAllSales: async (searchParams: SearchSalesRequest) => {
    return await backendApi.post<SalesResponse>('/api/sales-entry/recently', searchParams)
  },

  // Get recently sales
  getRecentlySales: async (searchParams: any) => {
    return await backendApi.post<SalesResponse>('/api/sales-entry/recently', searchParams)
  },

  // Create new sales
  createSales: async (data: CreateSalesEntryRequest) => {
    try {
      const response = await backendApi.post('/api/sales-entry/create', data)
      
      // Invalidate related caches after successful creation
      invalidateSalesRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to create sales entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Create sales entry
  createSalesEntry: async (data: any) => {
    try {
      const response = await backendApi.post('/api/sales-entry/create', data)
      
      // Invalidate related caches after successful creation
      invalidateSalesRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to create sales entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Update sales
  updateSales: async (data: UpdateSalesEntryRequest) => {
    try {
      const response = await backendApi.patch(`/api/sales-entry/${data.id}`, data)
      
      // Invalidate related caches after successful update
      invalidateSalesRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to update sales entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Delete sales
  deleteSales: async (id: string) => {
    try {
      const response = await backendApi.delete(`/api/sales-entry/${id}`)
      
      // Invalidate related caches after successful deletion
      invalidateSalesRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to delete sales entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Update sale status
  updateSaleStatus: async (id: string, status: string) => {
    try {
      const response = await backendApi.patch(`/api/sales-entry/${id}/status`, {
        status: status
      })
      
      // Invalidate related caches after successful status update
      invalidateSalesRelatedCaches()
      
      return response
    } catch (error) {
      throw new Error(`Failed to update sale status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} 