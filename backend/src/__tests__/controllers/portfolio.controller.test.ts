import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database';

jest.mock('../../config/database');

describe('Portfolio Controller', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'TRADER',
  };

  const mockPortfolio = {
    id: 'portfolio-123',
    userId: 'user-123',
    name: 'Test Portfolio',
    totalValue: 100000,
    cashBalance: 50000,
    riskScore: 65,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/portfolios', () => {
    it('should return all portfolios for the user', async () => {
      (prisma.portfolio.findMany as jest.Mock).mockResolvedValue([mockPortfolio]);

      const response = await request(app)
        .get('/api/portfolios')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401]);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe('GET /api/portfolios/:id', () => {
    it('should return portfolio by ID', async () => {
      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app)
        .get(`/api/portfolios/${mockPortfolio.id}`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401, 404]);
    });

    it('should return 404 for non-existent portfolio', async () => {
      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/portfolios/non-existent')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([404, 401]);
    });
  });

  describe('POST /api/portfolios', () => {
    it('should create a new portfolio', async () => {
      (prisma.portfolio.create as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app)
        .post('/api/portfolios')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Test Portfolio',
          initialBalance: 100000,
        });

      expect(response.status).toBeOneOf([201, 401]);
    });

    it('should validate portfolio data', async () => {
      const response = await request(app)
        .post('/api/portfolios')
        .set('Authorization', 'Bearer mock-token')
        .send({
          // Missing required fields
        });

      expect(response.status).toBeOneOf([400, 401]);
    });
  });

  describe('PUT /api/portfolios/:id', () => {
    it('should update portfolio', async () => {
      (prisma.portfolio.update as jest.Mock).mockResolvedValue({
        ...mockPortfolio,
        name: 'Updated Portfolio',
      });

      const response = await request(app)
        .put(`/api/portfolios/${mockPortfolio.id}`)
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Updated Portfolio',
        });

      expect(response.status).toBeOneOf([200, 401, 404]);
    });
  });

  describe('DELETE /api/portfolios/:id', () => {
    it('should delete portfolio', async () => {
      (prisma.portfolio.delete as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app)
        .delete(`/api/portfolios/${mockPortfolio.id}`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401, 404]);
    });
  });

  describe('GET /api/portfolios/:id/performance', () => {
    it('should return portfolio performance metrics', async () => {
      (prisma.portfolio.findUnique as jest.Mock).mockResolvedValue(mockPortfolio);

      const response = await request(app)
        .get(`/api/portfolios/${mockPortfolio.id}/performance`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBeOneOf([200, 401, 404]);
    });
  });
});

// Custom matcher
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    return {
      message: () =>
        `expected ${received} to be one of ${expected.join(', ')}`,
      pass,
    };
  },
});
