// ═══════════════════════════════════════════════════════════════
// USER SERVICE
// User management API calls (Admin)
// ═══════════════════════════════════════════════════════════════

import apiClient from './api';

export interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: 'TRADER' | 'ANALYST' | 'RISK_MANAGER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'TRADER' | 'ANALYST' | 'RISK_MANAGER' | 'ADMIN';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'TRADER' | 'ANALYST' | 'RISK_MANAGER' | 'ADMIN';
}

export const userService = {
  /**
   * Create new user (Admin only - uses auth/register endpoint)
   */
  async createUser(data: CreateUserData): Promise<UserDetails> {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<UserDetails[]> {
    const response = await apiClient.get('/users', { params });
    return response.data.data;
  },

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(id: string): Promise<UserDetails> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  /**
   * Update user (Admin only)
   */
  async updateUser(id: string, data: UpdateUserData): Promise<UserDetails> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  /**
   * Update user status (Admin only)
   * PATCH /:id/status
   */
  async updateUserStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ): Promise<UserDetails> {
    const response = await apiClient.patch(`/users/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  /**
   * Get user statistics (Admin only)
   */
  async getUserStats(): Promise<any> {
    const response = await apiClient.get('/users/stats/overview');
    return response.data.data;
  },
};
