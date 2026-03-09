import { AuthService } from '../../services/auth.service';
import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        role: 'TRADER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await AuthService.register(
        'test@example.com',
        'password123',
        'Test User',
        'TRADER'
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('mock-jwt-token');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw error if user already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      });

      await expect(
        AuthService.register('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        role: 'TRADER',
        status: 'ACTIVE',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('mock-jwt-token');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    it('should throw error for invalid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });

    it('should throw error for incorrect password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const mockPayload = { userId: '123', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = AuthService.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalled();
    });

    it('should throw error for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => AuthService.verifyToken('invalid-token')).toThrow();
    });
  });
});
