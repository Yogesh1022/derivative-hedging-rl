// ═══════════════════════════════════════════════════════════════
// ANALYTICS SERVICE
// Analytics and statistics API calls
// ═══════════════════════════════════════════════════════════════

import apiClient from './api';

export interface DashboardStats {
  portfolioCount: number;
  totalValue: number;
  totalPnL: number;
  avgRiskScore: number;
  openPositions: number;
  totalTrades: number;
  unreadAlerts: number;
}

export interface PerformanceMetrics {
  period: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: string;
  totalPnL: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

export const analyticsService = {
  /**
   * Get dashboard stats (analytics summary)
   * Alias: dashboard-stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data.data;
  },

  /**
   * Get portfolio performance analytics
   * Alias: portfolio-performance
   */
  async getPortfolioPerformance(id: string, period?: string): Promise<any> {
    const params = period ? { period } : {};
    const response = await apiClient.get(`/analytics/portfolio/${id}`, { params });
    return response.data.data;
  },

  /**
   * Get portfolio analytics (legacy method)
   */
  async getPortfolioAnalytics(id: string, period?: string): Promise<any> {
    return this.getPortfolioPerformance(id, period);
  },

  /**
   * Get risk metrics (Risk Manager/Admin)
   * Alias: risk-metrics
   */
  async getRiskMetrics(): Promise<any> {
    const response = await apiClient.get('/analytics/risk-overview');
    return response.data.data;
  },

  /**
   * Get risk overview (legacy method)
   */
  async getRiskOverview(): Promise<any> {
    return this.getRiskMetrics();
  },

  /**
   * Get trade history/performance metrics
   * Alias: trade-history
   */
  async getTradeHistory(period?: string): Promise<PerformanceMetrics> {
    const params = period ? { period } : {};
    const response = await apiClient.get('/analytics/performance', { params });
    return response.data.data;
  },

  /**
   * Get performance metrics (legacy method)
   */
  async getPerformanceMetrics(period?: string): Promise<PerformanceMetrics> {
    return this.getTradeHistory(period);
  },
};
