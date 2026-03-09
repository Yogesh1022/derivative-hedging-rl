import request from 'supertest';
import express from 'express';
import portfol

ioRoutes from '../../routes/portfolio.routes';
import { prisma } from '../../config/database';
import authMiddleware from '../../middleware/auth.middleware';

const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    req.user = { id: 'user-123', email: 'test@example.com', role: 'TRADER' };
    next();
  },
}));

app.use('/api/portfolios', authMiddleware, portfolioRoutes);

jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Portfolio Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/portfolios', () => {
    it('should get all user portfolios', async () => {
      const mockPortfolios = [
        {
          id: 'portfolio-1',
          userId: 'user-123',
          name: 'Tech Portfolio',
          totalValue: '100000.00',
          cashBalance: '20000.00',
          pnl: '5000.00',
          pnlPercent: '5.00',
          isActive: true,
        },
        {
          id: 'portfolio-2',
          userId: 'user-123',
          name: 'Options Portfolio',
          totalValue: '50000.00',
          cashBalance: '10000.00',
          pnl: '-2000.00',
          pnlPercent: '-4.00',
          isActive: true,
        },
      ];

      (prisma.portfolio.findMany as jest.Mock).mockResolvedValue(mockPortfolios);

      const response = await request(app).get('/api/portfolios');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Tech Portfolio');
    });

    it('should filter by active status', async () => {
      (prisma.portfolio.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/portfolios')
        .query({ isActive: 'false' });

      expect(response.status).toBe(200);
      expect(prisma.portfolio.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        })
      );
    });
  });

  describe('GET /api/portfolios/:id', () => {
    it('should get portfolio by ID', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'user-123',
        name: 'Tech Portfolio',
        totalValue: '100000.00',
        positions: [],
      };

      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app).get('/api/portfolios/portfolio-1');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('portfolio-1');
    });

    it('should handle non-existent portfolio', async () => {
      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/portfolios/non-existent');

      expect(response.status).toBe(404);
    });

    it('should reject unauthorized access', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'other-user',
      };

      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app).get('/api/portfolios/portfolio-1');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/portfolios', () => {
    it('should create new portfolio', async () => {
      const mockPortfolio = {
        id: 'new-portfolio',
        userId: 'user-123',
        name: 'New Portfolio',
        description: 'Test portfolio',
        totalValue: '10000.00',
        cashBalance: '10000.00',
        pnl: '0.00',
        pnlPercent: '0.00',
      };

      (prisma.portfolio.create as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app)
        .post('/api/portfolios')
        .send({
          name: 'New Portfolio',
          description: 'Test portfolio',
          cashBalance: 10000,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('New Portfolio');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/portfolios')
        .send({
          description: 'Missing name',
        });

      expect(response.status).toBe(400);
    });

    it('should validate minimum cash balance', async () => {
      const response = await request(app)
        .post('/api/portfolios')
        .send({
          name: 'Test Portfolio',
          cashBalance: -1000,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/portfolios/:id', () => {
    it('should update portfolio', async () => {
      const existingPortfolio = {
        id: 'portfolio-1',
        userId: 'user-123',
        name: 'Old Name',
      };

      const updatedPortfolio = {
        ...existingPortfolio,
        name: 'New Name',
        description: 'Updated description',
      };

      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(existingPortfolio);
      (prisma.portfolio.update as jest.Mock).mockResolvedValue(updatedPortfolio);

      const response = await request(app)
        .put('/api/portfolios/portfolio-1')
        .send({
          name: 'New Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
    });

    it('should prevent unauthorized updates', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'other-user',
      };

      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app)
        .put('/api/portfolios/portfolio-1')
        .send({ name: 'New Name' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/portfolios/:id', () => {
    it('should soft delete portfolio', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'user-123',
        isActive: true,
      };

      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(mockPortfolio);
      (prisma.portfolio.update as jest.Mock).mockResolvedValue({
        ...mockPortfolio,
        isActive: false,
      });

      const response = await request(app).delete('/api/portfolios/portfolio-1');

      expect(response.status).toBe(200);
      expect(prisma.portfolio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
          }),
        })
      );
    });

    it('should prevent deleting non-owned portfolio', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'other-user',
      };

      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app).delete('/api/portfolios/portfolio-1');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/portfolios/:id/risk-metrics', () => {
    it('should calculate and return risk metrics', async () => {
      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'user-123',
        positions: [
          {
            symbol: 'AAPL',
            quantity: '100',
            currentPrice: '150.00',
            delta: '1.0',
          },
        ],
      };

      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app).get('/api/portfolios/portfolio-1/risk-metrics');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('var95');
      expect(response.body.data).toHaveProperty('volatility');
      expect(response.body.data).toHaveProperty('sharpeRatio');
    });
  });

  describe('GET /api/portfolios/:id/performance', () => {
    it('should return performance history', async () => {
      const mockHistory = [
        {
          timestamp: new Date('2026-03-01'),
          totalValue: '100000.00',
          pnl: '5000.00',
        },
        {
          timestamp: new Date('2026-03-02'),
          totalValue: '102000.00',
          pnl: '7000.00',
        },
      ];

      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue({ id: 'portfolio-1', userId: 'user-123' });
      (prisma.portfolioHistory.findMany as jest.Mock).mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/portfolios/portfolio-1/performance')
        .query({ period: '7d' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });
});
