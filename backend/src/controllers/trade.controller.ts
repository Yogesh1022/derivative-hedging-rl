// ═══════════════════════════════════════════════════════════════
// TRADE CONTROLLER
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import prisma from '../config/database';
import { AuditAction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const tradeController = {
  /**
   * Get all trades
   * GET /api/trades
   */
  getAllTrades: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { portfolioId, symbol, status, limit = '50' } = req.query;

    const whereClause: any = { userId };

    if (portfolioId) whereClause.portfolioId = portfolioId;
    if (symbol) whereClause.symbol = symbol;
    if (status) whereClause.status = status;

    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: trades,
      message: `Found ${trades.length} trades`,
    });
  }),

  /**
   * Get trade by ID
   * GET /api/trades/:id
   */
  getTradeById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const trade = await prisma.trade.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        portfolio: true,
      },
    });

    if (!trade) {
      res.status(404).json({
        success: false,
        error: 'Trade not found or access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: trade,
    });
  }),

  /**
   * Create new trade
   * POST /api/trades
   */
  createTrade: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { portfolioId, symbol, side, quantity, price, commission = 0 } = req.body;

    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
    });

    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: 'Portfolio not found or access denied',
      });
      return;
    }

    const quantityDec = new Decimal(quantity);
    const priceDec = new Decimal(price);
    const commissionDec = new Decimal(commission);
    const totalValue = quantityDec.times(priceDec).plus(commissionDec);

    const trade = await prisma.trade.create({
      data: {
        userId,
        portfolioId,
        symbol,
        side,
        quantity: quantityDec,
        price: priceDec,
        totalValue,
        commission: commissionDec,
        status: 'EXECUTED',
        executedAt: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.TRADE_EXECUTED,
        resource: 'Trade',
        resourceId: trade.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          symbol,
          side,
          quantity: quantity.toString(),
          price: price.toString(),
        },
      },
    });

    res.status(201).json({
      success: true,
      data: trade,
      message: 'Trade created successfully',
    });
  }),

  /**
   * Update trade status
   * PUT /api/trades/:id
   */
  updateTrade: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const { status, executedAt } = req.body;

    // Verify trade ownership
    const existing = await prisma.trade.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Trade not found or access denied',
      });
      return;
    }

    const updateData: any = { status };
    if (executedAt) updateData.executedAt = new Date(executedAt);

    const trade = await prisma.trade.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: trade,
      message: 'Trade updated successfully',
    });
  }),

  /**
   * Cancel trade
   * DELETE /api/trades/:id
   */
  cancelTrade: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Verify trade ownership
    const trade = await prisma.trade.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!trade) {
      res.status(404).json({
        success: false,
        error: 'Trade not found or access denied',
      });
      return;
    }

    if (trade.status === 'EXECUTED') {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel an executed trade',
      });
      return;
    }

    await prisma.trade.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      message: 'Trade cancelled successfully',
    });
  }),
};
