// ═══════════════════════════════════════════════════════════════
// AUTH CONTROLLER
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/error.middleware';
import prisma from '../config/database';
import { AuditAction } from '@prisma/client';
import logger from '../config/logger';

export const authController = {
  /**
   * Register new user
   * POST /api/auth/register
   */
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;

    const result = await AuthService.register(email, password, name, role);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: result.user.id,
        action: AuditAction.USER_CREATED,
        resource: 'User',
        resourceId: result.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // Log success message
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info(`✅ USER REGISTERED SUCCESSFULLY`);
    logger.info(`   Email: ${email}`);
    logger.info(`   Name: ${name}`);
    logger.info(`   Role: ${result.user.role}`);
    logger.info(`   User ID: ${result.user.id}`);
    logger.info('═══════════════════════════════════════════════════════════════');

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
    });
  }),

  /**
   * Login user
   * POST /api/auth/login
   */
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: result.user.id,
        action: AuditAction.USER_LOGIN,
        resource: 'User',
        resourceId: result.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // Log success message
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info(`✅ USER LOGGED IN SUCCESSFULLY`);
    logger.info(`   Email: ${email}`);
    logger.info(`   Name: ${result.user.name}`);
    logger.info(`   Role: ${result.user.role}`);
    logger.info(`   User ID: ${result.user.id}`);
    logger.info('═══════════════════════════════════════════════════════════════');

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  }),

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token required',
      });
      return;
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    });
  }),

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await AuthService.logout(userId);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.USER_LOGOUT,
        resource: 'User',
        resourceId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // Log success message
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info(`✅ USER LOGGED OUT`);
    logger.info(`   User ID: ${userId}`);
    logger.info('═══════════════════════════════════════════════════════════════');

    res.json({
      success: true,
      message: 'Logout successful',
    });
  }),

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  }),

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(userId, currentPassword, newPassword);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.USER_UPDATED,
        resource: 'User',
        resourceId: userId,
        metadata: { action: 'password_changed' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info(`Password changed for user ${userId}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }),

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Note: In production, this should send an email with reset token
    // For now, we'll just return success
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
      });
      return;
    }

    // Generate reset token (simplified - in production use crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // TODO: Uncomment after running migration
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     resetToken,
    //     resetTokenExpiry,
    //   },
    // });

    logger.info(`Password reset requested for ${email}`);

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent',
      // In dev mode, return token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  }),

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    // TODO: Uncomment after running migration
    // const user = await prisma.user.findFirst({
    //   where: {
    //     resetToken: token,
    //     resetTokenExpiry: {
    //       gt: new Date(),
    //     },
    //   },
    // });
    
    const user = null; // Temporary

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
      return;
    }

    // Hash new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // TODO: Uncomment after running migration
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     password: hashedPassword,
    //     resetToken: null,
    //     resetTokenExpiry: null,
    //   },
    // });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.USER_UPDATED,
        resource: 'User',
        resourceId: user.id,
        metadata: { action: 'password_reset' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info(`Password reset completed for user ${user.id}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  }),
};
