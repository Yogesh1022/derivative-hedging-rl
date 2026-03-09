import { describe, it, expect, vi, beforeEach } from 'vitest';
import { portfolioService } from '../../../services/portfolioService';
import apiClient from '../../../services/api';

vi.mock('../../../services/api');

describe('PortfolioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPortfolios', () => {
    it('should fetch all portfolios', async () => {
      const mockPortfolios = [
        {
          id: '1',
          name: 'Test Portfolio 1',
          totalValue: 100000,
          riskScore: 65,
        },
        {
          id: '2',
          name: 'Test Portfolio 2',
          totalValue: 200000,
          riskScore: 45,
        },
      ];

      apiClient.get.mockResolvedValue({
        data: { data: mockPortfolios },
      });

      const result = await portfolioService.getPortfolios();

      expect(result).toEqual(mockPortfolios);
      expect(apiClient.get).toHaveBeenCalledWith('/portfolios');
    });

    it('should handle errors', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(portfolioService.getPortfolios()).rejects.toThrow('Network error');
    });
  });

  describe('getPortfolio', () => {
    it('should fetch portfolio by ID', async () => {
      const mockPortfolio = {
        id: '123',
        name: 'Test Portfolio',
        totalValue: 100000,
        riskScore: 65,
      };

      apiClient.get.mockResolvedValue({
        data: { data: mockPortfolio },
      });

      const result = await portfolioService.getPortfolio('123');

      expect(result).toEqual(mockPortfolio);
      expect(apiClient.get).toHaveBeenCalledWith('/portfolios/123');
    });
  });

  describe('createPortfolio', () => {
    it('should create a new portfolio', async () => {
      const newPortfolio = {
        name: 'New Portfolio',
        initialBalance: 100000,
      };

      const mockResponse = {
        id: '123',
        name: 'New Portfolio',
        totalValue: 100000,
        cashBalance: 100000,
      };

      apiClient.post.mockResolvedValue({
        data: { data: mockResponse },
      });

      const result = await portfolioService.createPortfolio(newPortfolio);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/portfolios', newPortfolio);
    });
  });

  describe('updatePortfolio', () => {
    it('should update portfolio', async () => {
      const updates = { name: 'Updated Portfolio' };
      const mockResponse = {
        id: '123',
        name: 'Updated Portfolio',
        totalValue: 100000,
      };

      apiClient.put.mockResolvedValue({
        data: { data: mockResponse },
      });

      const result = await portfolioService.updatePortfolio('123', updates);

      expect(result).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/portfolios/123', updates);
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio', async () => {
      apiClient.delete.mockResolvedValue({
        data: { success: true },
      });

      await portfolioService.deletePortfolio('123');

      expect(apiClient.delete).toHaveBeenCalledWith('/portfolios/123');
    });
  });

  describe('getPerformance', () => {
    it('should fetch portfolio performance', async () => {
      const mockPerformance = {
        returns: 15.5,
        sharpeRatio: 1.2,
        maxDrawdown: -8.5,
      };

      apiClient.get.mockResolvedValue({
        data: { data: mockPerformance },
      });

      const result = await portfolioService.getPerformance('123');

      expect(result).toEqual(mockPerformance);
      expect(apiClient.get).toHaveBeenCalledWith('/portfolios/123/performance');
    });
  });
});
