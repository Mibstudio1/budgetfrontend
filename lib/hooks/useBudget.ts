import { useState, useEffect, useCallback } from 'react'
import { budgetService, Budget, AvailableProject } from '@/lib/services/budgetService'
import { eventBus, EVENTS } from '@/lib/utils/eventBus'

export const useBudget = () => {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch budgets
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await budgetService.getAllBudgets()
      
      if (response.success && response.result?.budget) {
        setBudgets(response.result.budget.map((budget: any) => ({
          id: budget.budgetId,
          projectId: '', // Will be filled from project data
          projectName: budget.projectName,
          description: budget.description,
          type: budget.projectType,
          budget: Number(budget.budget),
          usedBudget: budget.usedBudget,
          remainingBudget: budget.remainingBudget,
          status: budget.projectStatus as "กำลังทำ" | "เสร็จแล้ว" | "ยกเลิก",
          createdAt: new Date().toISOString(),
        })))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch available projects
  const fetchAvailableProjects = useCallback(async () => {
    try {
      const response = await budgetService.getAvailableProjects()
      
      if (response.success && response.result?.projects) {
        setAvailableProjects(response.result.projects)
      }
    } catch (err) {
      console.error('Failed to fetch available projects:', err)
    }
  }, [])

  // Create budget
  const createBudget = useCallback(async (data: {
    projectId: string
    description: string
    budget: number
    createdBy: string
  }) => {
    try {
      await budgetService.createBudget(data)
      await fetchBudgets() // Refresh budgets
      await fetchAvailableProjects() // Refresh available projects
    } catch (error) {
      throw error
    }
  }, [fetchBudgets, fetchAvailableProjects])

  // Update budget
  const updateBudget = useCallback(async (id: string, data: {
    description: string
    budget: number
  }) => {
    try {
      await budgetService.updateBudget(id, data)
      await fetchBudgets() // Refresh budgets
    } catch (error) {
      throw error
    }
  }, [fetchBudgets])

  // Delete budget
  const deleteBudget = useCallback(async (id: string) => {
    try {
      await budgetService.deleteBudget(id)
      await fetchBudgets() // Refresh budgets
      await fetchAvailableProjects() // Refresh available projects
    } catch (error) {
      throw error
    }
  }, [fetchBudgets, fetchAvailableProjects])

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchBudgets(),
      fetchAvailableProjects()
    ])
  }, [fetchBudgets, fetchAvailableProjects])

  // Setup event listeners for auto refresh
  useEffect(() => {
    const handleRefresh = () => {
      console.log('📢 Budget refresh needed via event bus')
      refresh()
    }

    eventBus.on(EVENTS.DASHBOARD_REFRESH_NEEDED, handleRefresh)

    return () => {
      eventBus.off(EVENTS.DASHBOARD_REFRESH_NEEDED, handleRefresh)
    }
  }, [refresh])

  // Initial data fetch
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    budgets,
    availableProjects,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    refresh,
    refetch: refresh
  }
}