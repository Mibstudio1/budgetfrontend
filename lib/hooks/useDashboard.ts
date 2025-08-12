import { useState, useEffect, useCallback } from 'react'
import { dashboardService, DashboardData, ProjectSummary } from '@/lib/services/dashboardService'
import { cacheManager, CACHE_KEYS } from '@/lib/utils/cacheManager'
import { eventBus, EVENTS } from '@/lib/utils/eventBus'
import { useAutoRefresh } from './useAutoRefresh'

interface UseDashboardOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export const useDashboard = (options: UseDashboardOptions = {}) => {
  const { autoRefresh = true, refreshInterval = 60000 } = options
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize dashboard service
  useEffect(() => {
    dashboardService.init()
  }, [])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const [data, summaries] = await Promise.all([
        dashboardService.getComprehensiveDashboard(!forceRefresh),
        dashboardService.getProjectSummaries(!forceRefresh)
      ])
      
      setDashboardData(data)
      setProjectSummaries(summaries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh data
  const refresh = useCallback(() => {
    return fetchDashboardData(true)
  }, [fetchDashboardData])

  // Setup auto refresh
  useAutoRefresh({
    onRefresh: refresh,
    interval: autoRefresh ? refreshInterval : 0,
    refreshOnFocus: autoRefresh,
    refreshOnVisibilityChange: autoRefresh
  })

  // Setup cache invalidation listeners and event bus listeners
  useEffect(() => {
    const handleCacheInvalidation = () => {
      console.log('🔄 Dashboard hook: Cache invalidated, refreshing data...')
      fetchDashboardData(true)
    }

    const handleDashboardRefreshNeeded = (data: any) => {
      console.log('🔄 Dashboard hook: Refresh needed via event bus:', data)
      fetchDashboardData(true)
    }

    // Cache manager listeners
    cacheManager.onInvalidate(CACHE_KEYS.DASHBOARD, handleCacheInvalidation)
    cacheManager.onInvalidate(CACHE_KEYS.PROJECTS, handleCacheInvalidation)

    // Event bus listeners
    eventBus.on(EVENTS.DASHBOARD_REFRESH_NEEDED, handleDashboardRefreshNeeded)
    eventBus.on(EVENTS.PROJECT_UPDATED, handleDashboardRefreshNeeded)
    eventBus.on(EVENTS.PROJECT_STATUS_CHANGED, handleDashboardRefreshNeeded)

    return () => {
      cacheManager.clearCallbacks(CACHE_KEYS.DASHBOARD)
      cacheManager.clearCallbacks(CACHE_KEYS.PROJECTS)
      eventBus.off(EVENTS.DASHBOARD_REFRESH_NEEDED, handleDashboardRefreshNeeded)
      eventBus.off(EVENTS.PROJECT_UPDATED, handleDashboardRefreshNeeded)
      eventBus.off(EVENTS.PROJECT_STATUS_CHANGED, handleDashboardRefreshNeeded)
    }
  }, [fetchDashboardData])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    dashboardData,
    projectSummaries,
    loading,
    error,
    refresh,
    refetch: fetchDashboardData
  }
}

export const useProjectSummaries = () => {
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjectSummaries = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const summaries = await dashboardService.getProjectSummaries(!forceRefresh)
      setProjectSummaries(summaries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    return fetchProjectSummaries(true)
  }, [fetchProjectSummaries])

  // Setup cache invalidation listeners
  useEffect(() => {
    const handleCacheInvalidation = () => {
      fetchProjectSummaries(true)
    }

    cacheManager.onInvalidate(CACHE_KEYS.PROJECTS, handleCacheInvalidation)
    cacheManager.onInvalidate(CACHE_KEYS.DASHBOARD, handleCacheInvalidation)

    return () => {
      cacheManager.clearCallbacks(CACHE_KEYS.PROJECTS)
      cacheManager.clearCallbacks(CACHE_KEYS.DASHBOARD)
    }
  }, [fetchProjectSummaries])

  // Initial data fetch
  useEffect(() => {
    fetchProjectSummaries()
  }, [fetchProjectSummaries])

  return {
    projectSummaries,
    loading,
    error,
    refresh,
    refetch: fetchProjectSummaries
  }
}