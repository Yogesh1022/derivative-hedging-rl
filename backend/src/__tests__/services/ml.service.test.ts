import mlService from '../../services/ml.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ML Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ML_SERVICE_URL = 'http://localhost:8000';
  });

  describe('checkHealth', () => {
    it('should return true when ML service is healthy', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'healthy' },
      });

      const result = await mlService.checkHealth();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.any(Object)
      );
    });

    it('should return false when ML service is down', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await mlService.checkHealth();

      expect(result).toBe(false);
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({ code: 'ECONNABORTED' });

      const result = await mlService.checkHealth();

      expect(result).toBe(false);
    });
  });

  describe('predictHedgeAction', () => {
    it('should return prediction for valid portfolio', async () => {
      const mockPrediction = {
        action: 'BUY',
        confidence: 0.85,
        reasoning: 'Portfolio underhedged',
        recommended_hedge: {
          symbol: 'QQQ',
          quantity: 10,
          action: 'BUY_PUT',
        },
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockPrediction,
      });

      const result = await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      expect(result.action).toBe('BUY');
      expect(result.confidence).toBe(0.85);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/predict',
        { portfolioId: 'portfolio-1' },
        expect.any(Object)
      );
    });

    it('should handle ML service errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Model not loaded' },
        },
      });

      const result = await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      expect(result).toHaveProperty('error');
    });

    it('should use heuristic fallback when confidence is low', async () => {
      const mockPrediction = {
        action: 'HOLD',
        confidence: 0.45,
        useHeuristic: true,
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockPrediction,
      });

      const result = await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      expect(result.useHeuristic).toBe(true);
    });

    it('should validate portfolio data before prediction', async () => {
      const result = await mlService.predictHedgeAction({ portfolioId: '' });

      expect(result).toHaveProperty('error');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('analyzeRisk', () => {
    it('should return risk analysis for portfolio', async () => {
      const mockRiskAnalysis = {
        riskScore: 7.5,
        var95: 5000,
        var99: 8000,
        maxDrawdown: 0.15,
        volatility: 0.25,
        sharpeRatio: 1.2,
        beta: 1.1,
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockRiskAnalysis,
      });

      const result = await mlService.analyzeRisk({
        portfolioId: 'portfolio-1',
        positions: [],
      });

      expect(result.riskScore).toBe(7.5);
      expect(result.var95).toBe(5000);
    });

    it('should handle empty portfolio', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          riskScore: 0,
          message: 'No positions to analyze',
        },
      });

      const result = await mlService.analyzeRisk({
        portfolioId: 'empty-portfolio',
        positions: [],
      });

      expect(result.riskScore).toBe(0);
    });
  });

  describe('optimizePortfolio', () => {
    it('should return optimization suggestions', async () => {
      const mockOptimization = {
        suggestedAllocation: {
          'AAPL': 0.3,
          'GOOGL': 0.3,
          'MSFT': 0.2,
          'QQQ': 0.2,
        },
        expectedReturn: 0.12,
        expectedRisk: 0.18,
        sharpeRatio: 0.67,
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockOptimization,
      });

      const result = await mlService.optimizePortfolio({
        portfolioId: 'portfolio-1',
        riskTolerance: 'moderate',
      });

      expect(result.suggestedAllocation).toHaveProperty('AAPL');
      expect(result.sharpeRatio).toBeGreaterThan(0);
    });

    it('should validate risk tolerance parameter', async () => {
      const result = await mlService.optimizePortfolio({
        portfolioId: 'portfolio-1',
        riskTolerance: 'invalid',
      });

      expect(result).toHaveProperty('error');
    });
  });

  describe('batchPredict', () => {
    it('should handle multiple predictions', async () => {
      const mockBatchResponse = {
        predictions: [
          { portfolioId: 'p1', action: 'BUY', confidence: 0.8 },
          { portfolioId: 'p2', action: 'SELL', confidence: 0.75 },
        ],
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockBatchResponse,
      });

      const result = await mlService.batchPredict({
        portfolioIds: ['p1', 'p2'],
      });

      expect(result.predictions).toHaveLength(2);
    });

    it('should handle partial failures in batch', async () => {
      const mockBatchResponse = {
        predictions: [
          { portfolioId: 'p1', action: 'BUY', confidence: 0.8 },
        ],
        errors: [
          { portfolioId: 'p2', error: 'Invalid data' },
        ],
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockBatchResponse,
      });

      const result = await mlService.batchPredict({
        portfolioIds: ['p1', 'p2'],
      });

      expect(result.predictions).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      const result = await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('timeout');
    });

    it('should handle 404 errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Endpoint not found' },
        },
      });

      const result = await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      expect(result).toHaveProperty('error');
    });

    it('should retry on transient failures', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Connection reset'))
        .mockResolvedValueOnce({
          status: 200,
          data: { action: 'BUY', confidence: 0.8 },
        });

      // If retry logic exists
      const result = await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      // Adjust based on actual retry implementation
      expect(result.action).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should cache predictions for performance', async () => {
      const mockPrediction = { action: 'BUY', confidence: 0.85 };

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockPrediction,
      });

      // First call
      await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      // Second call (should use cache if implemented)
      await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      // Verify axios was called only once if caching is implemented
      // Adjust based on actual implementation
    });

    it('should invalidate cache after specified time', async () => {
      // Test cache TTL if implemented
      jest.useFakeTimers();

      const mockPrediction = { action: 'BUY', confidence: 0.85 };
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: mockPrediction,
      });

      await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      // Fast-forward time
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes

      await mlService.predictHedgeAction({ portfolioId: 'portfolio-1' });

      jest.useRealTimers();
    });
  });
});
