import { backendApi } from '@/lib/backend-api'
import { invalidateProjectRelatedCaches } from '@/lib/utils/cacheManager'
import { emitProjectUpdated, emitProjectStatusChanged, emitProjectCreated, emitProjectDeleted } from '@/lib/utils/eventBus'

export interface Project {
  id: string
  projectName: string
  description: string
  type: string
  status: string
  budget?: number
  totalCost?: number
  totalSales?: number
  profit?: number
  profitPercentage?: number
  budgetPercentage?: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CreateProjectRequest {
  projectName: string
  description: string
  projectGroup: string
  projectStatus: string
  createdBy: string
}

export interface UpdateProjectRequest {
  projectId: string
  projectName?: string
  description?: string
  projectGroup?: string
  projectStatus?: string
  startDate?: string
  endDate?: string
  createdBy?: string
}

export interface SearchProjectRequest {
  projectName: string
  type: string
  status: string
}

export interface ProjectResponse {
  projects: Project[]
}

export const projectService = {
  // Get all projects
  getAllProjects: async (searchParams: SearchProjectRequest) => {
    return await backendApi.post<ProjectResponse>('/api/project/all-projects', searchParams)
  },

  // Create new project
  createProject: async (data: CreateProjectRequest) => {
    try {
      const response = await backendApi.post('/api/project/create', data)

      // Emit events and invalidate caches after successful creation
      if (response.success && response.result?.id) {
        emitProjectCreated(response.result.id)
      }
      invalidateProjectRelatedCaches()

      return response
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Update project
  updateProject: async (data: UpdateProjectRequest) => {
    try {
      console.log('🔄 Updating project:', data.projectId)

      const response = await backendApi.patch('/api/project/update', data)

      console.log('✅ Project update successful!')

      return response
    } catch (error) {
      console.error('❌ Project update failed:', error)
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Update project status only
  updateProjectStatus: async (projectId: string, status: string, oldStatus?: string) => {
    try {
      console.log(`🔄 Updating project status: ${projectId} -> ${status}`)

      const response = await backendApi.patch('/api/project/update', {
        projectId,
        projectStatus: status
      })

      console.log('✅ Project status update successful, invalidating caches...')

      // Immediate cache clearing
      try {
        const { dashboardService } = await import('./dashboardService')
        dashboardService.clearCache()
      } catch (importError) {
        console.warn('Failed to import dashboard service:', importError)
      }

      // Emit events and invalidate caches after successful update
      emitProjectStatusChanged(projectId, oldStatus || 'unknown', status)
      invalidateProjectRelatedCaches()

      return response
    } catch (error) {
      console.error('❌ Project status update failed:', error)
      throw new Error(`Failed to update project status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Delete project
  deleteProject: async (id: string) => {
    try {
      const response = await backendApi.delete(`/api/project/delete?projectId=${id}`)

      // Emit events and invalidate caches after successful deletion
      emitProjectDeleted(id)
      invalidateProjectRelatedCaches()

      return response
    } catch (error) {
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} 