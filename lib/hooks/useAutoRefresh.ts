import { useEffect, useRef, useCallback } from 'react'

interface UseAutoRefreshOptions {
  onRefresh: () => void | Promise<void>
  interval?: number // in milliseconds
  refreshOnFocus?: boolean
  refreshOnVisibilityChange?: boolean
}

export const useAutoRefresh = ({
  onRefresh,
  interval = 60000, // 1 minute default
  refreshOnFocus = true,
  refreshOnVisibilityChange = true
}: UseAutoRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<number>(Date.now())

  const refresh = useCallback(async () => {
    try {
      await onRefresh()
      lastRefreshRef.current = Date.now()
    } catch (error) {
      console.warn('Auto refresh failed:', error)
    }
  }, [onRefresh])

  // Setup interval refresh
  useEffect(() => {
    if (interval > 0) {
      intervalRef.current = setInterval(refresh, interval)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [refresh, interval])

  // Setup focus refresh
  useEffect(() => {
    if (!refreshOnFocus) return

    const handleFocus = () => {
      // Only refresh if it's been more than 30 seconds since last refresh
      if (Date.now() - lastRefreshRef.current > 30000) {
        refresh()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh, refreshOnFocus])

  // Setup visibility change refresh
  useEffect(() => {
    if (!refreshOnVisibilityChange) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Only refresh if it's been more than 30 seconds since last refresh
        if (Date.now() - lastRefreshRef.current > 30000) {
          refresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refresh, refreshOnVisibilityChange])

  return {
    refresh,
    lastRefresh: lastRefreshRef.current
  }
}