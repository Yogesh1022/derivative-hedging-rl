// ═══════════════════════════════════════════════════════════════
// ML SERVICE API
// Machine Learning prediction API calls
// ═══════════════════════════════════════════════════════════════

import apiClient from './api';

export interface MLPrediction {
  riskScore: number;
  volatility: number;
  var95: number;
  var99: number;
  sharpeRatio: number;
  recommendation: string;
  confidence: number;
  timestamp: string;
}

export interface HedgingRecommendation {
  action: string;
  contracts: number;
  strategy: string;
  expectedReduction: number;
}

export interface ModelInfo {
  name: string;
  version: string;
  trained_at: string;
  performance_metrics: {
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
  };
}

export const mlService = {
  /**
   * Check ML service health
   */
  async checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
    const response = await apiClient.get('/ml/health');
    return response.data.data;
  },

  /**
   * Get ML model information
   */
  async getModelInfo(): Promise<ModelInfo> {
    const response = await apiClient.get('/ml/model-info');
    return response.data.data;
  },

  /**
   * Predict risk for portfolio
   * Alias: predict-risk
   */
  async predictRisk(portfolioId: string): Promise<MLPrediction> {
    const response = await apiClient.post('/ml/predict', { portfolioId });
    return response.data.data;
  },

  /**
   * Optimize hedge strategy
   * Alias: optimize-hedge
   */
  async optimizeHedge(portfolioId: string): Promise<HedgingRecommendation> {
    const response = await apiClient.post('/ml/recommend-hedge', { portfolioId });
    return response.data.data;
  },

  /**
   * Get hedging recommendation (legacy method)
   */
  async getHedgingRecommendation(portfolioId: string): Promise<HedgingRecommendation> {
    return this.optimizeHedge(portfolioId);
  },

  /**
   * Analyze portfolio with ML
   * Alias: analyze-portfolio
   */
  async analyzePortfolio(portfolioIds: string[]): Promise<MLPrediction[]> {
    const response = await apiClient.post('/ml/batch-predict', { portfolioIds });
    return response.data.data;
  },

  /**
   * Batch risk prediction (legacy method)
   */
  async batchPredictRisk(portfolioIds: string[]): Promise<MLPrediction[]> {
    return this.analyzePortfolio(portfolioIds);
  },
};
