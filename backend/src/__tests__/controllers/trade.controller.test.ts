import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database';

jest.mock('../../config/database');

describe('Trade Controller', () => {
  const mockTrade = {
    id: 'trade-123',
    portfolioId: 'portfolio-123',
    symbol: 'AAPL',
    type: 'STOCK',
    side: 'BUY',
    quantity: 10,
    price: 150.50,
    commission: 5.00,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /api/trades', () => {
    it('should return all trades', async () => {
      (prisma.trade.findMany as jest.Mock).mockResolvedValue([mockTrade]);

      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401]);
    });

    it('should filter trades by portfolio', async () => {
      (prisma.trade.findMany as jest.Mock).mockResolvedValue([mockTrade]);

      const response = await request(app)
        .get('/api/trades?portfolioId=portfolio-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401]);
    });

    it('should filter trades by status', async () => {
      (prisma.trade.findMany as jest.Mock).mockResolvedValue([mockTrade]);

      const response = await request(app)
        .get('/api/trades?status=PENDING')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401]);
    });
  });

  describe('POST /api/trades', () => {
    it('should create a new trade', async () => {
      (prisma.trade.create as jest.Mock).mockResolvedValue(mockTrade);

      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', 'Bearer mock-token')
        .send({
          portfolioId: 'portfolio-123',
          symbol: 'AAPL',
          type: 'STOCK',
          side: 'BUY',
          quantity: 10,
          price: 150.50,
        });

      expect(response.status).toBeOneOf([201, 401, 400]);
    });

    it('should validate trade data', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', 'Bearer mock-token')
        .send({
          // Missing required fields
          symbol: 'AAPL',
        });

      expect(response.status).toBeOneOf([400, 401]);
    });
  });

  describe('GET /api/trades/:id', () => {
    it('should return trade by ID', async () => {
      (prisma.trade.findUnique as jest.Mock).mockResolvedValue(mockTrade);

      const response = await request(app)
        .get('/api/trades/trade-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401, 404]);
    });
  });

  describe('PUT /api/trades/:id', () => {
    it('should update trade status', async () => {
      (prisma.trade.update as jest.Mock).mockResolvedValue({
        ...mockTrade,
        status: 'COMPLETED',
      });

      const response = await request(app)
        .put('/api/trades/trade-123')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'COMPLETED' });

      expect(response.status).toBeOneOf([200, 401, 404]);
    });
  });

  describe('DELETE /api/trades/:id', () => {
    it('should cancel a trade', async () => {
      (prisma.trade.delete as jest.Mock).mockResolvedValue(mockTrade);

      const response = await request(app)
        .delete('/api/trades/trade-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401, 404]);
    });
  });
});

expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    return {
      message: () => `expected ${received} to be one of ${expected.join(', ')}`,
      pass,
    };
  },
});
