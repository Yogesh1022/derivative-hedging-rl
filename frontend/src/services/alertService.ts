// ═══════════════════════════════════════════════════════════════
// ALERT SERVICE
// Risk alert management API calls
// ═══════════════════════════════════════════════════════════════

import apiClient from './api';

export interface RiskAlert {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  details?: any;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
}

export const alertService = {
  /**
   * Get all alerts for current user
   */
  async getAllAlerts(params?: {
    isRead?: boolean;
    severity?: string;
    limit?: number;
  }): Promise<RiskAlert[]> {
    const response = await apiClient.get('/alerts', { params });
    return response.data.data;
  },

  /**
   * Get alert by ID
   */
  async getAlertById(id: string): Promise<RiskAlert> {
    const response = await apiClient.get(`/alerts/${id}`);
    return response.data.data;
  },

  /**
   * Mark alert as read
   */
  async markAsRead(id: string): Promise<RiskAlert> {
    const response = await apiClient.put(`/alerts/${id}/read`);
    return response.data.data;
  },

  /**
   * Dismiss alert
   */
  async dismissAlert(id: string): Promise<RiskAlert> {
    const response = await apiClient.put(`/alerts/${id}/dismiss`);
    return response.data.data;
  },

  /**
   * Acknowledge alert (alias for dismiss)
   */
  async acknowledgeAlert(id: string): Promise<RiskAlert> {
    return this.dismissAlert(id);
  },

  /**
   * Mark all alerts as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.put('/alerts/read-all');
  },

  /**
   * Delete alert
   */
  async deleteAlert(id: string): Promise<void> {
    await apiClient.delete(`/alerts/${id}`);
  },
};
