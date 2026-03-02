// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

import { UserRole, UserStatus } from '@prisma/client';

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date | null;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: UserResponse;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface MLPredictionRequest {
  portfolioId: string;
  portfolioData: {
    totalValue: number;
    positions: Array<{
      symbol: string;
      quantity: number;
      price: number;
      delta?: number;
      gamma?: number;
      vega?: number;
      theta?: number;
    }>;
    historicalReturns?: number[];
  };
}

export interface MLPredictionResponse {
  riskScore: number;
  volatility: number;
  var95: number;
  var99: number;
  sharpeRatio: number;
  recommendation: string;
  confidence: number;
  timestamp: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      clientIp?: string;
    }
  }
}
