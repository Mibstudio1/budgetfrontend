import { backendApi } from '@/lib/backend-api'

export interface User {
  id: string
  name: string
  username: string
  role: string
  isActive: boolean
}

export interface CreateUserRequest {
  name: string
  username: string
  password: string
  role: string
}

export interface UpdateUserRequest {
  userId: string
  name: string
  username: string
  password: string
  role: string
}

export interface UserResponse {
  users: User[]
}

export const userService = {
  // Get all users
  getAllUsers: async () => {
    return await backendApi.get<UserResponse>('/api/user/get-user')
  },

  // Get users
  getUsers: async () => {
    return await backendApi.get<User[]>('/api/user/get-user')
  },

  // Create user
  createUser: async (data: CreateUserRequest) => {
    return await backendApi.post('/api/authen/register', data)
  },

  // Update user
  updateUser: async (data: UpdateUserRequest) => {
    return await backendApi.patch('/api/user/update', data)
  },

  // Delete user
  deleteUser: async (userId: string) => {
    return await backendApi.delete(`/api/user/delete?userId=${userId}`)
  }
}
