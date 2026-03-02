// ═══════════════════════════════════════════════════════════════
// AUTH SERVICE
// Authentication API calls
// ═══════════════════════════════════════════════════════════════

import apiClient from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'TRADER' | 'ANALYST' | 'RISK_MANAGER' | 'ADMIN';
  status: string;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  /**
   * Register new user
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    
    // Store tokens
    localStorage.setItem('hedgeai_token', response.data.data.token);
    localStorage.setItem('hedgeai_refresh_token', response.data.data.refreshToken);
    localStorage.setItem('hedgeai_user', JSON.stringify(response.data.data.user));
    
    return response.data.data;
  },

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', { email, password });
    
    // Store tokens
    localStorage.setItem('hedgeai_token', response.data.data.token);
    localStorage.setItem('hedgeai_refresh_token', response.data.data.refreshToken);
    localStorage.setItem('hedgeai_user', JSON.stringify(response.data.data.user));
    
    return response.data.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear local storage
      localStorage.removeItem('hedgeai_token');
      localStorage.removeItem('hedgeai_refresh_token');
      localStorage.removeItem('hedgeai_user');
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('hedgeai_token');
  },

  /**
   * Get current user from storage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('hedgeai_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ token: string }> {
    const refreshToken = localStorage.getItem('hedgeai_refresh_token');
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    
    // Update access token
    localStorage.setItem('hedgeai_token', response.data.data.token);
    
    return response.data.data;
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};
