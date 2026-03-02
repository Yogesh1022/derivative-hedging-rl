// ═══════════════════════════════════════════════════════════════
// PORTFOLIO CONTROLLER
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import prisma from '../config/database';
import { AuditAction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const portfolioController = {
  /**
   * Get all portfolios for current user
   * GET /api/portfolios
   */
  getAllPortfolios: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        positions: {
          where: { isClosed: false },
        },
        _count: {
          select: {
            positions: true,
            trades: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: portfolios,
      message: `Found ${portfolios.length} portfolios`,
    });
  }),

  /**
   * Get portfolio by ID
   * GET /api/portfolios/:id
   */
  getPortfolioById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        positions: {
          where: { isClosed: false },
          orderBy: { openedAt: 'desc' },
        },
        trades: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found or access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: portfolio,
    });
  }),

  /**
   * Create new portfolio
   * POST /api/portfolios
   */
  createPortfolio: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name, description, cashBalance = 0 } = req.body;

    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name,
        description,
        totalValue: new Decimal(cashBalance),
        cashBalance: new Decimal(cashBalance),
        pnl: new Decimal(0),
        pnlPercent: new Decimal(0),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.PORTFOLIO_CREATED,
        resource: 'Portfolio',
        resourceId: portfolio.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { name, cashBalance },
      },
    });

    res.status(201).json({
      success: true,
      data: portfolio,
      message: 'Portfolio created successfully',
    });
  }),

  /**
   * Update portfolio
   * PUT /api/portfolios/:id
   */
  updatePortfolio: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const { name, description, cashBalance } = req.body;

    // Verify ownership
    const existing = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found or access denied',
      });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (cashBalance !== undefined) updateData.cashBalance = new Decimal(cashBalance);

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: updateData,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.PORTFOLIO_UPDATED,
        resource: 'Portfolio',
        resourceId: portfolio.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { changes: updateData },
      },
    });

    res.json({
      success: true,
      data: portfolio,
      message: 'Portfolio updated successfully',
    });
  }),

  /**
   * Delete portfolio
   * DELETE /api/portfolios/:id
   */
  deletePortfolio: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Verify ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found or access denied',
      });
      return;
    }

    await prisma.portfolio.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  }),

  /**
   * Get portfolio history
   * GET /api/portfolios/:id/history
   */
  getPortfolioHistory: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Verify ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId },
    });

    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found or access denied',
      });
      return;
    }

    const history = await prisma.portfolioHistory.findMany({
      where: { portfolioId: id },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json({
      success: true,
      data: history,
    });
  }),
};
