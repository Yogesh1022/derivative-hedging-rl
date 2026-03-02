// ═══════════════════════════════════════════════════════════════
// PORTFOLIO SERVICE
// Portfolio management API calls
// ═══════════════════════════════════════════════════════════════

import apiClient from './api';

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  cashBalance: number;
  pnl: number;
  pnlPercent: number;
  riskScore?: number;
  volatility?: number;
  sharpeRatio?: number;
  var95?: number;
  var99?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioData {
  name: string;
  description?: string;
  cashBalance?: number;
}

export interface UpdatePortfolioData {
  name?: string;
  description?: string;
  cashBalance?: number;
}

export const portfolioService = {
  /**
   * Get all portfolios for current user
   */
  async getAllPortfolios(): Promise<Portfolio[]> {
    const response = await apiClient.get('/portfolios');
    return response.data.data;
  },

  /**
   * Get portfolio by ID
   */
  async getPortfolioById(id: string): Promise<Portfolio> {
    const response = await apiClient.get(`/portfolios/${id}`);
    return response.data.data;
  },

  /**
   * Create new portfolio
   */
  async createPortfolio(data: CreatePortfolioData): Promise<Portfolio> {
    const response = await apiClient.post('/portfolios', data);
    return response.data.data;
  },

  /**
   * Update portfolio
   */
  async updatePortfolio(id: string, data: UpdatePortfolioData): Promise<Portfolio> {
    const response = await apiClient.put(`/portfolios/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete portfolio
   */
  async deletePortfolio(id: string): Promise<void> {
    await apiClient.delete(`/portfolios/${id}`);
  },

  /**
   * Get portfolio history
   */
  async getPortfolioHistory(id: string): Promise<any[]> {
    const response = await apiClient.get(`/portfolios/${id}/history`);
    return response.data.data;
  },
};
