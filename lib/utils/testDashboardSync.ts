// Test utilities for dashboard synchronization
import { dashboardService } from '@/lib/services/dashboardService'
import { projectService } from '@/lib/services/projectService'
import { eventBus, EVENTS } from './eventBus'
import { cacheManager, CACHE_KEYS } from './cacheManager'

export const testDashboardSync = {
  // Test all cache invalidation methods
  testAllInvalidation: () => {
    console.group('🧪 Testing All Cache Invalidation Methods')
    
    console.log('1. Testing cache manager...')
    cacheManager.invalidate(CACHE_KEYS.DASHBOARD)
    cacheManager.invalidate(CACHE_KEYS.PROJECTS)
    
    console.log('2. Testing event bus...')
    eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'test' })
    eventBus.emit(EVENTS.PROJECT_UPDATED, { projectId: 'test' })
    
    console.log('3. Testing window events...')
    window.dispatchEvent(new CustomEvent('dashboard-refresh-needed', { 
      detail: { reason: 'test' } 
    }))
    
    console.log('4. Testing direct dashboard service...')
    dashboardService.clearCache()
    
    console.groupEnd()
  },

  // Test project update flow
  testProjectUpdateFlow: async (projectId: string, newStatus: string) => {
    console.group(`🧪 Testing Project Update Flow: ${projectId} -> ${newStatus}`)
    
    try {
      console.log('1. Before update - getting current data...')
      const beforeData = await dashboardService.getProjectSummaries(false)
      console.log('Current project summaries:', beforeData.length)
      
      console.log('2. Updating project status...')
      await projectService.updateProjectStatus(projectId, newStatus)
      
      console.log('3. Waiting 2 seconds for cache invalidation...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('4. After update - getting fresh data...')
      const afterData = await dashboardService.getProjectSummaries(false)
      console.log('Updated project summaries:', afterData.length)
      
      const updatedProject = afterData.find(p => p.id === projectId)
      if (updatedProject) {
        console.log(`✅ Project ${projectId} status updated to: ${updatedProject.status}`)
      } else {
        console.log(`❌ Project ${projectId} not found in updated data`)
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error)
    }
    
    console.groupEnd()
  },

  // Force refresh everything
  forceRefreshEverything: async () => {
    console.log('🚨 Force refreshing everything...')
    
    // Clear all caches
    dashboardService.clearCache()
    cacheManager.invalidate(CACHE_KEYS.DASHBOARD)
    cacheManager.invalidate(CACHE_KEYS.PROJECTS)
    
    // Emit all events
    eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'force_refresh' })
    window.dispatchEvent(new CustomEvent('dashboard-refresh-needed', { 
      detail: { reason: 'force_refresh' } 
    }))
    
    // Get fresh data
    const result = await dashboardService.forceRefresh()
    console.log('✅ Force refresh completed:', result)
    
    return result
  },

  // Check current cache state
  checkCacheState: () => {
    console.group('🔍 Current Cache State')
    
    // Check cache manager
    const cacheInfo = cacheManager.getDebugInfo()
    console.log('Cache Manager:', cacheInfo)
    
    // Check event bus
    const eventInfo = eventBus.getDebugInfo()
    console.log('Event Bus:', eventInfo)
    
    // Check dashboard cache
    console.log('Dashboard Cache Valid:', dashboardService.isCacheValid(Date.now()))
    
    console.groupEnd()
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testDashboardSync = testDashboardSync
}