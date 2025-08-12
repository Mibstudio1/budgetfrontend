import { backendApi } from '@/lib/backend-api'
import { projectService } from './projectService'
import { salesService } from './salesService'
import { expenseService } from './expenseService'
import { cacheManager, CACHE_KEYS } from '@/lib/utils/cacheManager'
import { eventBus, EVENTS } from '@/lib/utils/eventBus'
import '@/lib/utils/debugCache' // Import debug utilities
import '@/lib/utils/testDashboardSync' // Import test utilities

export interface DashboardData {
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  projectCount: number
  activeProjects: number
  outstandingExpenses: number
  monthlyTarget: number
  targetAchievement: number
}

export interface ProjectSummary {
  id: string
  projectName: string
  type: string
  status: string
  totalRevenue: number
  totalExpenses: number
  profit: number
  profitPercentage: number
}

// Cache for dashboard data
let dashboardCache: {
  data?: DashboardData
  summaries?: ProjectSummary[]
  timestamp?: number
} = {}

const CACHE_DURATION = 5000 // 5 seconds - more aggressive for testing

export const dashboardService = {
  // Initialize cache manager callbacks and event listeners
  init: () => {
    console.log('🚀 Initializing dashboard service cache callbacks and event listeners')
    
    // Cache manager callbacks
    cacheManager.onInvalidate(CACHE_KEYS.DASHBOARD, () => {
      console.log('📢 Dashboard cache invalidated via cache manager')
      dashboardCache = {}
    })
    
    cacheManager.onInvalidate(CACHE_KEYS.PROJECTS, () => {
      console.log('📢 Projects cache invalidated via cache manager')
      dashboardCache = {}
    })
    
    // Event bus listeners
    eventBus.on(EVENTS.DASHBOARD_REFRESH_NEEDED, (data) => {
      console.log('📢 Dashboard refresh needed via event bus:', data)
      dashboardCache = {}
    })
    
    eventBus.on(EVENTS.PROJECT_UPDATED, () => {
      console.log('📢 Project updated, clearing dashboard cache')
      dashboardCache = {}
    })
    
    eventBus.on(EVENTS.PROJECT_STATUS_CHANGED, () => {
      console.log('📢 Project status changed, clearing dashboard cache')
      dashboardCache = {}
    })
    
    console.log('✅ Dashboard service initialized with cache callbacks and event listeners')
  },

  // Clear cache when data is updated
  clearCache: () => {
    console.log('🗑️ Clearing dashboard cache directly')
    dashboardCache = {}
  },

  // Check if cache is valid
  isCacheValid: (timestamp?: number) => {
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_DURATION
  },

  // Get monthly dashboard data
  getMonthlyDashboard: async (month: string, year: string) => {
    const monthYear = `${year}-${month.padStart(2, '0')}`
    return await backendApi.get(`/api/dashboard/monthly-detail?month=${monthYear}&year=${year}`)
  },

  // Get dashboard data for main page
  getDashboardData: async () => {
    return await backendApi.get('/api/dashboard/all-projects')
  },

  // Get daily data
  getDailyData: async (month: string, year: string) => {
    const monthYear = `${year}-${month.padStart(2, '0')}`
    return await backendApi.get(`/api/dashboard/monthly-detail?month=${monthYear}&year=${year}`)
  },

  // Force refresh dashboard data
  refreshDashboardData: async (): Promise<DashboardData> => {
    dashboardService.clearCache()
    return await dashboardService.getComprehensiveDashboard()
  },

  // Force refresh project summaries
  refreshProjectSummaries: async (): Promise<ProjectSummary[]> => {
    dashboardService.clearCache()
    return await dashboardService.getProjectSummaries()
  },

  // Invalidate cache and get fresh data
  invalidateAndRefresh: async () => {
    dashboardService.clearCache()
    const [dashboardData, projectSummaries] = await Promise.all([
      dashboardService.getComprehensiveDashboard(false),
      dashboardService.getProjectSummaries(false)
    ])
    return { dashboardData, projectSummaries }
  },

  // Test function to verify cache invalidation works
  testCacheInvalidation: () => {
    console.log('🧪 Testing dashboard cache invalidation...')
    
    // Test cache manager
    cacheManager.invalidate(CACHE_KEYS.DASHBOARD)
    cacheManager.invalidate(CACHE_KEYS.PROJECTS)
    
    // Test event bus
    eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'test' })
    eventBus.emit(EVENTS.PROJECT_STATUS_CHANGED, { projectId: 'test', oldStatus: 'old', newStatus: 'new' })
    
    // Test window event
    window.dispatchEvent(new CustomEvent('dashboard-refresh-needed', { 
      detail: { reason: 'test' } 
    }))
    
    console.log('✅ Cache invalidation test completed - check console for callback logs')
  },

  // Force immediate refresh - bypass all caching
  forceRefresh: async () => {
    console.log('🚨 Force refresh - clearing all caches and fetching fresh data')
    dashboardCache = {}
    
    const [dashboardData, projectSummaries] = await Promise.all([
      dashboardService.getComprehensiveDashboard(false),
      dashboardService.getProjectSummaries(false)
    ])
    
    // Emit events to notify all listeners
    eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'force_refresh' })
    window.dispatchEvent(new CustomEvent('dashboard-refresh-needed', { 
      detail: { reason: 'force_refresh' } 
    }))
    
    return { dashboardData, projectSummaries }
  },

  // Get comprehensive dashboard data with real relationships
  getComprehensiveDashboard: async (useCache: boolean = true): Promise<DashboardData> => {
    // Check cache first
    if (useCache && dashboardCache.data && dashboardService.isCacheValid(dashboardCache.timestamp)) {
      return dashboardCache.data
    }

    try {
      const [projectResponse, salesResponse, expenseResponse] = await Promise.all([
        projectService.getAllProjects({ projectName: "", type: "", status: "" }),
        salesService.getRecentlySales({ projectName: "", startDate: "", endDate: "", type: "" }),
        expenseService.getRecentlyExpenses({ search: "", startDate: "", endDate: "", category: "", status: "" })
      ])

      if (!projectResponse.success || !projectResponse.result?.projects) {
        throw new Error("ไม่สามารถดึงข้อมูลโครงการได้")
      }

      const projects = projectResponse.result.projects
      const salesRecords = (salesResponse as any)?.result?.records || []
      const expenseRecords = expenseResponse?.result?.records || []

      const totalRevenue = dashboardService.calculateTotal(salesRecords, 'totalPrice')
      const totalExpenses = dashboardService.calculateTotal(expenseRecords, 'amount')
      const outstandingExpenses = dashboardService.calculateTotal(
        expenseRecords.filter((expense: any) => !expense.isPaid), 
        'amount'
      )

      const data: DashboardData = {
        totalRevenue,
        totalExpenses,
        totalProfit: totalRevenue - totalExpenses,
        projectCount: projects.length,
        activeProjects: projects.filter((p: any) => p.status === "กำลังทำ").length,
        outstandingExpenses,
        monthlyTarget: 0,
        targetAchievement: 0
      }

      // Cache the result
      dashboardCache.data = data
      dashboardCache.timestamp = Date.now()

      return data
    } catch (error) {
      throw new Error(`Failed to fetch comprehensive dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Helper method to calculate totals
  calculateTotal: (records: any[], field: string): number => {
    return records.reduce((sum: number, record: any) => 
      sum + (Number(record[field]) || 0), 0
    )
  },

  // Get project summaries with real data
  getProjectSummaries: async (useCache: boolean = true): Promise<ProjectSummary[]> => {
    // Check cache first
    if (useCache && dashboardCache.summaries && dashboardService.isCacheValid(dashboardCache.timestamp)) {
      return dashboardCache.summaries
    }

    try {
      const [projectResponse, salesResponse, expenseResponse] = await Promise.all([
        projectService.getAllProjects({ projectName: "", type: "", status: "" }),
        salesService.getRecentlySales({ projectName: "", startDate: "", endDate: "", type: "" }),
        expenseService.getRecentlyExpenses({ search: "", startDate: "", endDate: "", category: "", status: "" })
      ])

      if (!projectResponse.success || !projectResponse.result?.projects) {
        return []
      }

      const projects = projectResponse.result.projects
      const salesRecords = (salesResponse as any)?.result?.records || []
      const expenseRecords = expenseResponse?.result?.records || []

      const summaries = projects.map((project: any) => {
        const projectSales = salesRecords.filter((sale: any) => 
          sale.projectName === project.projectName
        )
        const projectExpenses = expenseRecords.filter((expense: any) => 
          expense.projectName === project.projectName
        )

        const totalRevenue = dashboardService.calculateTotal(projectSales, 'totalPrice')
        const totalExpenses = dashboardService.calculateTotal(projectExpenses, 'amount')
        const profit = totalRevenue - totalExpenses
        const profitPercentage = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

        return {
          id: project.id,
          projectName: project.projectName,
          type: project.type || 'ไม่ระบุ',
          status: project.status || 'ไม่ระบุ',
          totalRevenue,
          totalExpenses,
          profit,
          profitPercentage
        }
      })

      // Cache the result
      dashboardCache.summaries = summaries
      dashboardCache.timestamp = Date.now()

      return summaries
    } catch (error) {
      throw new Error(`Failed to fetch project summaries: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} 