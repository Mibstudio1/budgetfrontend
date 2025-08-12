import { useState, useEffect, useCallback, useRef } from 'react'
import { dashboardService, DashboardData, ProjectSummary } from '@/lib/services/dashboardService'
import { projectService } from '@/lib/services/projectService'
import { eventBus, EVENTS } from '@/lib/utils/eventBus'

interface UseProjectDashboardOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  enableEventListeners?: boolean
}

export const useProjectDashboard = (options: UseProjectDashboardOptions = {}) => {
  const { 
    autoRefresh = true, 
    refreshInterval = 30000, // 30 seconds
    enableEventListeners = true 
  } = options

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number>(0)
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize dashboard service
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🚀 Initializing dashboard service from useProjectDashboard')
      dashboardService.init()
      isInitializedRef.current = true
    }
  }, [])

  // Fetch dashboard data with retry mechanism
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔄 Fetching dashboard data (forceRefresh: ${forceRefresh})`)
      
      const [data, summaries] = await Promise.all([
        dashboardService.getComprehensiveDashboard(!forceRefresh),
        dashboardService.getProjectSummaries(!forceRefresh)
      ])
      
      setDashboardData(data)
      setProjectSummaries(summaries)
      setLastRefresh(Date.now())
      
      console.log('✅ Dashboard data fetched successfully')
    } catch (err) {
      console.error('❌ Failed to fetch dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      
      // Retry after 5 seconds on error
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Retrying dashboard data fetch after error...')
        fetchDashboardData(true)
      }, 5000)
    } finally {
      setLoading(false)
    }
  }, [])

  // Manual refresh function
  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered')
    await fetchDashboardData(true)
  }, [fetchDashboardData])

  // Auto refresh with interval - more aggressive for project updates
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return

    const interval = setInterval(() => {
      console.log('⏰ Auto refresh triggered by interval')
      // Force refresh every interval to ensure we get latest data
      fetchDashboardData(true) // Always force refresh for now
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchDashboardData, autoRefresh, refreshInterval])

  // Event listeners for real-time updates
  useEffect(() => {
    if (!enableEventListeners) return

    const handleProjectChange = (data: any) => {
      console.log('📢 Project change detected, refreshing dashboard:', data)
      fetchDashboardData(true) // Force refresh on project changes
    }

    const handleDashboardRefresh = (data: any) => {
      console.log('📢 Dashboard refresh requested:', data)
      fetchDashboardData(true)
    }

    // Listen to all project-related events
    eventBus.on(EVENTS.PROJECT_UPDATED, handleProjectChange)
    eventBus.on(EVENTS.PROJECT_STATUS_CHANGED, handleProjectChange)
    eventBus.on(EVENTS.PROJECT_CREATED, handleProjectChange)
    eventBus.on(EVENTS.PROJECT_DELETED, handleProjectChange)
    eventBus.on(EVENTS.DASHBOARD_REFRESH_NEEDED, handleDashboardRefresh)

    return () => {
      eventBus.off(EVENTS.PROJECT_UPDATED, handleProjectChange)
      eventBus.off(EVENTS.PROJECT_STATUS_CHANGED, handleProjectChange)
      eventBus.off(EVENTS.PROJECT_CREATED, handleProjectChange)
      eventBus.off(EVENTS.PROJECT_DELETED, handleProjectChange)
      eventBus.off(EVENTS.DASHBOARD_REFRESH_NEEDED, handleDashboardRefresh)
    }
  }, [fetchDashboardData, enableEventListeners])

  // Window focus refresh and custom events
  useEffect(() => {
    if (!autoRefresh) return

    const handleFocus = () => {
      const timeSinceLastRefresh = Date.now() - lastRefresh
      if (timeSinceLastRefresh > 30000) { // 30 seconds
        console.log('👁️ Window focused, refreshing dashboard')
        fetchDashboardData(false)
      }
    }

    const handleDashboardRefreshNeeded = (event: any) => {
      console.log('🔔 Window event: dashboard refresh needed', event.detail)
      fetchDashboardData(true) // Force refresh
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('dashboard-refresh-needed', handleDashboardRefreshNeeded)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('dashboard-refresh-needed', handleDashboardRefreshNeeded)
    }
  }, [fetchDashboardData, autoRefresh, lastRefresh])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  // Helper function to update project status with immediate UI feedback
  const updateProjectStatus = useCallback(async (projectId: string, newStatus: string) => {
    try {
      // Optimistic update - update UI immediately
      setProjectSummaries(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status: newStatus }
            : project
        )
      )

      // Update dashboard data optimistically
      if (dashboardData) {
        const oldActiveCount = dashboardData.activeProjects
        const newActiveCount = newStatus === "กำลังทำ" 
          ? oldActiveCount + 1 
          : oldActiveCount - 1

        setDashboardData(prev => prev ? {
          ...prev,
          activeProjects: Math.max(0, newActiveCount)
        } : null)
      }

      // Make API call
      await projectService.updateProjectStatus(projectId, newStatus)
      
      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchDashboardData(true)
      }, 1000)

    } catch (error) {
      console.error('Failed to update project status:', error)
      // Revert optimistic update on error
      fetchDashboardData(true)
      throw error
    }
  }, [projectService, dashboardData, fetchDashboardData])

  return {
    dashboardData,
    projectSummaries,
    loading,
    error,
    lastRefresh,
    refresh,
    updateProjectStatus,
    refetch: fetchDashboardData
  }
}