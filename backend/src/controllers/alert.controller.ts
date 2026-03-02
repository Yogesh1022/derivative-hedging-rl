// ═══════════════════════════════════════════════════════════════
// ALERT CONTROLLER
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import prisma from '../config/database';

export const alertController = {
  /**
   * Get all alerts for current user
   * GET /api/alerts
   */
  getAllAlerts: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { isRead, severity, limit = '50' } = req.query;

    const whereClause: any = { userId };

    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }
    if (severity) {
      whereClause.severity = severity;
    }

    const alerts = await prisma.riskAlert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: alerts,
      message: `Found ${alerts.length} alerts`,
    });
  }),

  /**
   * Get alert by ID
   * GET /api/alerts/:id
   */
  getAlertById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const alert = await prisma.riskAlert.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found or access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: alert,
    });
  }),

  /**
   * Mark alert as read
   * PUT /api/alerts/:id/read
   */
  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Verify alert ownership
    const existing = await prisma.riskAlert.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Alert not found or access denied',
      });
      return;
    }

    const alert = await prisma.riskAlert.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: alert,
      message: 'Alert marked as read',
    });
  }),

  /**
   * Dismiss alert
   * PUT /api/alerts/:id/dismiss
   */
  dismissAlert: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Verify alert ownership
    const existing = await prisma.riskAlert.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Alert not found or access denied',
      });
      return;
    }

    const alert = await prisma.riskAlert.update({
      where: { id },
      data: {
        isDismissed: true,
        dismissedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: alert,
      message: 'Alert dismissed',
    });
  }),

  /**
   * Mark all alerts as read
   * PUT /api/alerts/read-all
   */
  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await prisma.riskAlert.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'All alerts marked as read',
    });
  }),

  /**
   * Delete alert
   * DELETE /api/alerts/:id
   */
  deleteAlert: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Verify alert ownership
    const alert = await prisma.riskAlert.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found or access denied',
      });
      return;
    }

    await prisma.riskAlert.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  }),
};
