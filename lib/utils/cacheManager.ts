// Cache Manager for handling cross-service cache invalidation
type CacheInvalidationCallback = () => void

class CacheManager {
  private callbacks: Map<string, CacheInvalidationCallback[]> = new Map()
  private pendingInvalidations: Set<string> = new Set()

  // Register a callback for cache invalidation
  onInvalidate(key: string, callback: CacheInvalidationCallback) {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, [])
    }
    this.callbacks.get(key)!.push(callback)
    
    // If there was a pending invalidation for this key, trigger it now
    if (this.pendingInvalidations.has(key)) {
      this.pendingInvalidations.delete(key)
      setTimeout(() => callback(), 0)
    }
  }

  // Trigger cache invalidation for a specific key
  invalidate(key: string) {
    const callbacks = this.callbacks.get(key)
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.warn(`Cache invalidation callback failed for key ${key}:`, error)
        }
      })
    } else {
      // No callbacks registered yet, mark as pending
      this.pendingInvalidations.add(key)
    }
  }

  // Trigger cache invalidation for multiple keys
  invalidateMultiple(keys: string[]) {
    keys.forEach(key => this.invalidate(key))
  }

  // Clear all callbacks for a key
  clearCallbacks(key: string) {
    this.callbacks.delete(key)
    this.pendingInvalidations.delete(key)
  }

  // Clear all callbacks
  clearAllCallbacks() {
    this.callbacks.clear()
    this.pendingInvalidations.clear()
  }

  // Debug method to check current state
  getDebugInfo() {
    return {
      callbacks: Array.from(this.callbacks.entries()).map(([key, callbacks]) => ({
        key,
        callbackCount: callbacks.length
      })),
      pendingInvalidations: Array.from(this.pendingInvalidations)
    }
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager()

// Cache keys
export const CACHE_KEYS = {
  DASHBOARD: 'dashboard',
  PROJECTS: 'projects',
  SALES: 'sales',
  EXPENSES: 'expenses',
  REVENUE_TARGETS: 'revenue_targets'
} as const

// Helper function to invalidate related caches when project data changes
export const invalidateProjectRelatedCaches = () => {
  console.log('🔄 Invalidating project related caches...')
  cacheManager.invalidateMultiple([
    CACHE_KEYS.DASHBOARD,
    CACHE_KEYS.PROJECTS
  ])
  
  // Also trigger direct dashboard service cache clear as fallback
  try {
    // Dynamic import to avoid circular dependency
    import('../services/dashboardService').then(({ dashboardService }) => {
      dashboardService.clearCache()
    })
  } catch (error) {
    console.warn('Failed to clear dashboard cache directly:', error)
  }
}

// Helper function to invalidate all dashboard related caches
export const invalidateDashboardCaches = () => {
  cacheManager.invalidateMultiple([
    CACHE_KEYS.DASHBOARD,
    CACHE_KEYS.PROJECTS,
    CACHE_KEYS.SALES,
    CACHE_KEYS.EXPENSES
  ])
}