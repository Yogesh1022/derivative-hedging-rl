import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../../../services/authService';
import apiClient from '../../../services/api';

vi.mock('../../../services/api');

describe('AuthService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('register', () => {
    it('should register user and store tokens', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            user: {
              id: '123',
              email: 'test@example.com',
              name: 'Test User',
              role: 'TRADER',
            },
          },
        },
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(localStorage.getItem('hedgeai_token')).toBe('test-token');
      expect(localStorage.getItem('hedgeai_refresh_token')).toBe('test-refresh-token');
      expect(JSON.parse(localStorage.getItem('hedgeai_user'))).toEqual(mockResponse.data.data.user);
    });

    it('should handle registration errors', async () => {
      apiClient.post.mockRejectedValue(new Error('Registration failed'));

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
      ).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    it('should login user and store tokens', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            user: {
              id: '123',
              email: 'test@example.com',
              name: 'Test User',
              role: 'TRADER',
            },
          },
        },
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'Password123!');

      expect(result.user.email).toBe('test@example.com');
      expect(localStorage.getItem('hedgeai_token')).toBe('test-token');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'Password123!',
      });
    });

    it('should handle login errors', async () => {
      apiClient.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', async () => {
      localStorage.setItem('hedgeai_token', 'test-token');
      localStorage.setItem('hedgeai_refresh_token', 'test-refresh-token');
      localStorage.setItem('hedgeai_user', JSON.stringify({ id: '123' }));

      apiClient.post.mockResolvedValue({});

      await authService.logout();

      expect(localStorage.getItem('hedgeai_token')).toBeNull();
      expect(localStorage.getItem('hedgeai_refresh_token')).toBeNull();
      expect(localStorage.getItem('hedgeai_user')).toBeNull();
    });

    it('should clear tokens even if API call fails', async () => {
      localStorage.setItem('hedgeai_token', 'test-token');
      apiClient.post.mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(localStorage.getItem('hedgeai_token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('hedgeai_token', 'test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'TRADER',
      };

      localStorage.setItem('hedgeai_user', JSON.stringify(mockUser));

      const user = authService.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null when no user in localStorage', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should fetch user profile', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'TRADER',
      };

      apiClient.get.mockResolvedValue({
        data: { data: mockUser },
      });

      const user = await authService.getProfile();
      expect(user).toEqual(mockUser);
      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    });
  });
});
