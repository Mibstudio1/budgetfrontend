import { backendApi } from '@/lib/backend-api'

export interface CostProfitReport {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
  projects: Array<{
    projectName: string
    revenue: number
    cost: number
    profit: number
    margin: number
  }>
}

export interface OutstandingReport {
  totalOutstanding: number
  unpaidCount: number
  items: Array<{
    id: string
    name: string
    amount: number
    dueDate: string
    projectName: string
  }>
}

export const reportService = {
  // Get cost profit report
  getCostProfitReport: async (params: any) => {
    const queryParams = new URLSearchParams(params).toString()
    return await backendApi.get<CostProfitReport>(`/api/report/cost-profit?${queryParams}`)
  },

  // Get outstanding report
  getOutstandingReport: async (params: any) => {
    return await backendApi.post<OutstandingReport>('/api/report/outstanding-expense', params)
  }
} 