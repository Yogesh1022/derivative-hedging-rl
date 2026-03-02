// ═══════════════════════════════════════════════════════════════
// POSITION SERVICE
// Position management API calls
// ═══════════════════════════════════════════════════════════════

import apiClient from './api';

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  assetType: 'STOCK' | 'OPTION' | 'FUTURE' | 'FOREX' | 'CRYPTO';
  optionType?: 'CALL' | 'PUT';
  strikePrice?: number;
  expiryDate?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  delta?: number;
  gamma?: number;
  vega?: number;
  theta?: number;
  isClosed: boolean;
  openedAt: string;
  closedAt?: string;
}

export interface CreatePositionData {
  portfolioId: string;
  symbol: string;
  assetType: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  optionType?: string;
  strikePrice?: number;
  expiryDate?: string;
  delta?: number;
  gamma?: number;
  vega?: number;
  theta?: number;
}

export interface UpdatePositionData {
  quantity?: number;
  currentPrice?: number;
  delta?: number;
  gamma?: number;
  vega?: number;
  theta?: number;
}

export const positionService = {
  /**
   * Get all positions
   */
  async getAllPositions(portfolioId?: string, isClosed?: boolean): Promise<Position[]> {
    const params: any = {};
    if (portfolioId) params.portfolioId = portfolioId;
    if (isClosed !== undefined) params.isClosed = isClosed;

    const response = await apiClient.get('/positions', { params });
    return response.data.data;
  },

  /**
   * Get position by ID
   */
  async getPositionById(id: string): Promise<Position> {
    const response = await apiClient.get(`/positions/${id}`);
    return response.data.data;
  },

  /**
   * Create new position
   */
  async createPosition(data: CreatePositionData): Promise<Position> {
    const response = await apiClient.post('/positions', data);
    return response.data.data;
  },

  /**
   * Update position
   */
  async updatePosition(id: string, data: UpdatePositionData): Promise<Position> {
    const response = await apiClient.put(`/positions/${id}`, data);
    return response.data.data;
  },

  /**
   * Partially update position (PATCH)
   */
  async patchPosition(id: string, data: Partial<UpdatePositionData>): Promise<Position> {
    const response = await apiClient.patch(`/positions/${id}`, data);
    return response.data.data;
  },

  /**
   * Close position
   */
  async closePosition(id: string, closePrice: number): Promise<Position> {
    const response = await apiClient.post(`/positions/${id}/close`, { closePrice });
    return response.data.data;
  },

  /**
   * Delete position
   */
  async deletePosition(id: string): Promise<void> {
    await apiClient.delete(`/positions/${id}`);
  },
};
