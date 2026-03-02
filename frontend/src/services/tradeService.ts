// ═══════════════════════════════════════════════════════════════
// TRADE SERVICE
// Trade management API calls
// ═══════════════════════════════════════════════════════════════

import apiClient from './api';

export interface Trade {
  id: string;
  portfolioId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalValue: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
  commission: number;
  pnl?: number;
  executedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradeData {
  portfolioId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  commission?: number;
}

export interface UpdateTradeData {
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
  executedAt?: string;
}

export const tradeService = {
  /**
   * Get all trades
   */
  async getAllTrades(params?: {
    portfolioId?: string;
    symbol?: string;
    status?: string;
    limit?: number;
  }): Promise<Trade[]> {
    const response = await apiClient.get('/trades', { params });
    return response.data.data;
  },

  /**
   * Get trade by ID
   */
  async getTradeById(id: string): Promise<Trade> {
    const response = await apiClient.get(`/trades/${id}`);
    return response.data.data;
  },

  /**
   * Create new trade
   */
  async createTrade(data: CreateTradeData): Promise<Trade> {
    const response = await apiClient.post('/trades', data);
    return response.data.data;
  },

  /**
   * Update trade
   */
  async updateTrade(id: string, data: UpdateTradeData): Promise<Trade> {
    const response = await apiClient.put(`/trades/${id}`, data);
    return response.data.data;
  },

  /**
   * Cancel trade
   */
  async cancelTrade(id: string): Promise<void> {
    await apiClient.delete(`/trades/${id}`);
  },
};
