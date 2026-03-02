// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import logger from '../config/logger';
import { UserRole } from '@prisma/client';
import { JWTPayload } from '../types';

/**
 * Middleware to protect routes requiring authentication
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let payload: JWTPayload;
    try {
      payload = AuthService.verifyAccessToken(token);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    // Verify user still exists and is active
    try {
      await AuthService.verifyUser(payload.id);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'User not authorized',
      });
      return;
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Middleware to require specific role(s)
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Middleware to require risk manager or admin
 */
export const requireRiskManager = requireRole(
  UserRole.RISK_MANAGER,
  UserRole.ADMIN
);

/**
 * Middleware to allow trader, analyst, risk manager, or admin
 */
export const requireTrader = requireRole(
  UserRole.TRADER,
  UserRole.ANALYST,
  UserRole.RISK_MANAGER,
  UserRole.ADMIN
);
