// Simple event bus for cross-component communication
type EventCallback = (...args: any[]) => void

class EventBus {
  private events: Map<string, EventCallback[]> = new Map()

  // Subscribe to an event
  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  // Unsubscribe from an event
  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // Emit an event
  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Event callback error for ${event}:`, error)
        }
      })
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event: string) {
    this.events.delete(event)
  }

  // Clear all events
  clear() {
    this.events.clear()
  }

  // Get debug info
  getDebugInfo() {
    return Array.from(this.events.entries()).map(([event, callbacks]) => ({
      event,
      listenerCount: callbacks.length
    }))
  }
}

// Global event bus instance
export const eventBus = new EventBus()

// Event names
export const EVENTS = {
  PROJECT_UPDATED: 'project:updated',
  PROJECT_CREATED: 'project:created',
  PROJECT_DELETED: 'project:deleted',
  PROJECT_STATUS_CHANGED: 'project:status_changed',
  DASHBOARD_REFRESH_NEEDED: 'dashboard:refresh_needed'
} as const

// Helper functions
export const emitProjectUpdated = (projectId: string, changes: any) => {
  console.log('📡 Emitting PROJECT_UPDATED event:', { projectId, changes })
  eventBus.emit(EVENTS.PROJECT_UPDATED, { projectId, changes })
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'project_updated', projectId })
  
  // Also trigger immediate dashboard cache clear
  setTimeout(() => {
    try {
      // Force dashboard refresh via window event
      window.dispatchEvent(new CustomEvent('dashboard-refresh-needed', { 
        detail: { reason: 'project_updated', projectId } 
      }))
    } catch (error) {
      console.warn('Failed to dispatch window event:', error)
    }
  }, 100)
}

export const emitProjectStatusChanged = (projectId: string, oldStatus: string, newStatus: string) => {
  console.log('📡 Emitting PROJECT_STATUS_CHANGED event:', { projectId, oldStatus, newStatus })
  eventBus.emit(EVENTS.PROJECT_STATUS_CHANGED, { projectId, oldStatus, newStatus })
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'status_changed', projectId })
  
  // Also trigger immediate dashboard cache clear
  setTimeout(() => {
    try {
      // Force dashboard refresh via window event
      window.dispatchEvent(new CustomEvent('dashboard-refresh-needed', { 
        detail: { reason: 'status_changed', projectId, oldStatus, newStatus } 
      }))
    } catch (error) {
      console.warn('Failed to dispatch window event:', error)
    }
  }, 100)
}

export const emitProjectCreated = (projectId: string) => {
  console.log('📡 Emitting PROJECT_CREATED event:', { projectId })
  eventBus.emit(EVENTS.PROJECT_CREATED, { projectId })
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'project_created', projectId })
}

export const emitProjectDeleted = (projectId: string) => {
  console.log('📡 Emitting PROJECT_DELETED event:', { projectId })
  eventBus.emit(EVENTS.PROJECT_DELETED, { projectId })
  eventBus.emit(EVENTS.DASHBOARD_REFRESH_NEEDED, { reason: 'project_deleted', projectId })
}