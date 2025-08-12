import { cacheManager } from './cacheManager'
import { eventBus } from './eventBus'

// Debug utilities for cache and event system
export const debugCache = {
  // Log current cache manager state
  logCacheManagerState: () => {
    console.group('🔍 Cache Manager Debug Info')
    const info = cacheManager.getDebugInfo()
    console.log('Registered callbacks:', info.callbacks)
    console.log('Pending invalidations:', info.pendingInvalidations)
    console.groupEnd()
  },

  // Log current event bus state
  logEventBusState: () => {
    console.group('🔍 Event Bus Debug Info')
    const info = eventBus.getDebugInfo()
    console.log('Registered listeners:', info)
    console.groupEnd()
  },

  // Test cache invalidation
  testCacheInvalidation: (key: string) => {
    console.log(`🧪 Testing cache invalidation for key: ${key}`)
    cacheManager.invalidate(key)
  },

  // Test event emission
  testEventEmission: (event: string, data?: any) => {
    console.log(`🧪 Testing event emission: ${event}`, data)
    eventBus.emit(event, data)
  },

  // Log all debug info
  logAll: () => {
    debugCache.logCacheManagerState()
    debugCache.logEventBusState()
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugCache = debugCache
}