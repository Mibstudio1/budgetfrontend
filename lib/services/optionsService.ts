import { backendApi } from '@/lib/backend-api'

export interface Option {
  value: string
  label: string
}

export const optionsService = {
  // Get project groups
  getProjectGroups: async () => {
    return await backendApi.get<{ options: Option[] }>('/api/options/project-group')
  },

  // Get project status
  getProjectStatus: async () => {
    return await backendApi.get<{ options: Option[] }>('/api/options/project-status')
  },

  // Get expense items
  getExpenseItems: async () => {
    return await backendApi.get<{ options: Option[] }>('/api/options/expense-items')
  }
} 