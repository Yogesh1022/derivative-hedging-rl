// ═══════════════════════════════════════════════════════════════
// ML SERVICE CLIENT
// ═══════════════════════════════════════════════════════════════

import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from '../config/logger';
import { MLPredictionRequest, MLPredictionResponse } from '../types';

class MLServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.mlService.url,
      timeout: config.mlService.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`ML Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('ML Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`ML Service Response: ${response.status}`);
        return response;
      },
      (error) => {
        logger.error('ML Service Response Error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check for ML service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('ML Service health check failed:', error);
      return false;
    }
  }

  /**
   * Get risk prediction for portfolio
   */
  async predictRisk(request: MLPredictionRequest): Promise<MLPredictionResponse> {
    try {
      const response = await this.client.post<MLPredictionResponse>(
        '/predict-risk',
        request
      );

      logger.info(`ML Prediction completed for portfolio: ${request.portfolioId}`);
      return response.data;
    } catch (error: any) {
      logger.error('ML Prediction failed:', {
        portfolioId: request.portfolioId,
        error: error.message,
        response: error.response?.data,
      });

      // Throw user-friendly error
      if (error.response?.status === 503) {
        throw new Error('ML service is temporarily unavailable. Please try again later.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Invalid portfolio data');
      } else {
        throw new Error('Failed to get risk prediction. Please try again later.');
      }
    }
  }

  /**
   * Get hedging recommendation
   */
  async getHedgingRecommendation(portfolioData: any): Promise<{
    action: string;
    contracts: number;
    strategy: string;
    expectedReduction: number;
  }> {
    try {
      const response = await this.client.post('/recommend-hedge', {
        portfolio_data: portfolioData,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Hedging recommendation failed:', error);
      throw new Error('Failed to get hedging recommendation');
    }
  }

  /**
   * Batch risk prediction for multiple portfolios
   */
  async batchPredictRisk(
    requests: MLPredictionRequest[]
  ): Promise<MLPredictionResponse[]> {
    try {
      const response = await this.client.post<MLPredictionResponse[]>(
        '/batch-predict',
        { portfolios: requests }
      );

      logger.info(`Batch ML Prediction completed for ${requests.length} portfolios`);
      return response.data;
    } catch (error: any) {
      logger.error('Batch ML Prediction failed:', error);
      throw new Error('Failed to get batch risk predictions');
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<{
    name: string;
    version: string;
    trained_at: string;
    performance_metrics: {
      sharpe_ratio: number;
      max_drawdown: number;
      win_rate: number;
    };
  }> {
    try {
      const response = await this.client.get('/model-info');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get model info:', error);
      throw new Error('Failed to get model information');
    }
  }
}

// Export singleton instance
export const mlService = new MLServiceClient();
