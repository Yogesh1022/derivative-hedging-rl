// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT CONTROLLER (Admin)
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import prisma from '../config/database';
import { AuditAction } from '@prisma/client';

export const userController = {
  /**
   * Get all users (Admin only)
   * GET /api/users
   */
  getAllUsers: asyncHandler(async (req: Request, res: Response) => {
    const { role, status, search } = req.query;

    const whereClause: any = {};

    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            portfolios: true,
            trades: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
      message: `Found ${users.length} users`,
    });
  }),

  /**
   * Get user by ID (Admin only)
   * GET /api/users/:id
   */
  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        portfolios: {
          select: {
            id: true,
            name: true,
            totalValue: true,
            pnl: true,
            riskScore: true,
          },
        },
        _count: {
          select: {
            trades: true,
            riskAlerts: true,
          },
        },
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
   * Update user (Admin only)
   * PUT /api/users/:id
   */
  updateUser: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const { name, email, role, status } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: AuditAction.USER_UPDATED,
        resource: 'User',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { changes: updateData },
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  }),

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const adminId = req.user!.id;

    // Prevent self-deletion
    if (id === adminId) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: AuditAction.USER_DELETED,
        resource: 'User',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { deletedUserEmail: user.email },
      },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  }),

  /**
   * Get user statistics (Admin only)
   * GET /api/users/stats/overview
   */
  getUserStats: asyncHandler(async (_req: Request, res: Response) => {
    const [totalUsers, activeUsers, traderCount, analystCount, riskManagerCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'TRADER' } }),
        prisma.user.count({ where: { role: 'ANALYST' } }),
        prisma.user.count({ where: { role: 'RISK_MANAGER' } }),
      ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        byRole: {
          traders: traderCount,
          analysts: analystCount,
          riskManagers: riskManagerCount,
        },
      },
    });
  }),
};
