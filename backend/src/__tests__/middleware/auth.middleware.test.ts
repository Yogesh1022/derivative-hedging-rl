import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { AuthService } from '../../services/auth.service';
import prisma from '../../config/database';

jest.mock('../../services/auth.service');
jest.mock('../../config/database');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      role: 'TRADER',
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    (AuthService.verifyToken as jest.Mock).mockReturnValue({
      userId: '123',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual(mockUser);
  });

  it('should reject request without token', async () => {
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    (AuthService.verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle malformed authorization header', async () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat',
    };

    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});
