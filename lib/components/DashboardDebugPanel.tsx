import React from 'react'
import { dashboardService } from '@/lib/services/dashboardService'

// Debug panel component for testing dashboard sync
export const DashboardDebugPanel: React.FC = () => {
  const handleTestCacheInvalidation = () => {
    dashboardService.testCacheInvalidation()
  }

  const handleForceRefresh = async () => {
    try {
      await dashboardService.forceRefresh()
      alert('Force refresh completed! Check console for details.')
    } catch (error) {
      alert(`Force refresh failed: ${error}`)
    }
  }

  const handleTestAllMethods = () => {
    if ((window as any).testDashboardSync) {
      (window as any).testDashboardSync.testAllInvalidation()
    } else {
      alert('Test utilities not loaded')
    }
  }

  const handleCheckCacheState = () => {
    if ((window as any).testDashboardSync) {
      (window as any).testDashboardSync.checkCacheState()
    } else {
      alert('Test utilities not loaded')
    }
  }

  const handleForceRefreshEverything = async () => {
    if ((window as any).testDashboardSync) {
      try {
        await (window as any).testDashboardSync.forceRefreshEverything()
        alert('Everything refreshed! Check console for details.')
      } catch (error) {
        alert(`Refresh failed: ${error}`)
      }
    } else {
      alert('Test utilities not loaded')
    }
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      background: '#f0f0f0', 
      padding: '15px', 
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🔧 Dashboard Debug Panel</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <button onClick={handleTestCacheInvalidation} style={{ padding: '5px 10px', fontSize: '11px' }}>
          Test Cache Invalidation
        </button>
        <button onClick={handleForceRefresh} style={{ padding: '5px 10px', fontSize: '11px' }}>
          Force Refresh
        </button>
        <button onClick={handleTestAllMethods} style={{ padding: '5px 10px', fontSize: '11px' }}>
          Test All Methods
        </button>
        <button onClick={handleCheckCacheState} style={{ padding: '5px 10px', fontSize: '11px' }}>
          Check Cache State
        </button>
        <button onClick={handleForceRefreshEverything} style={{ padding: '5px 10px', fontSize: '11px' }}>
          🚨 Force Refresh Everything
        </button>
      </div>
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        Open console to see debug logs
      </div>
    </div>
  )
}

export default DashboardDebugPanel