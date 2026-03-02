// ═══════════════════════════════════════════════════════════════
// POSITION CONTROLLER
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export const positionController = {
  /**
   * Get all positions
   * GET /api/positions
   */
  getAllPositions: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { portfolioId, isClosed } = req.query;

    const whereClause: any = {
      portfolio: {
        userId,
      },
    };

    if (portfolioId) {
      whereClause.portfolioId = portfolioId;
    }

    if (isClosed !== undefined) {
      whereClause.isClosed = isClosed === 'true';
    }

    const positions = await prisma.position.findMany({
      where: whereClause,
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    res.json({
      success: true,
      data: positions,
      message: `Found ${positions.length} positions`,
    });
  }),

  /**
   * Get position by ID
   * GET /api/positions/:id
   */
  getPositionById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const position = await prisma.position.findFirst({
      where: {
        id,
        portfolio: {
          userId,
        },
      },
      include: {
        portfolio: true,
      },
    });

    if (!position) {
      res.status(404).json({
        success: false,
        error: 'Position not found or access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: position,
    });
  }),

  /**
   * Create new position
   * POST /api/positions
   */
  createPosition: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const {
      portfolioId,
      symbol,
      assetType,
      quantity,
      avgPrice,
      currentPrice,
      optionType,
      strikePrice,
      expiryDate,
      delta,
      gamma,
      vega,
      theta,
    } = req.body;

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
    const avgPriceDec = new Decimal(avgPrice);
    const currentPriceDec = new Decimal(currentPrice);
    const marketValue = quantityDec.times(currentPriceDec);
    const unrealizedPnL = quantityDec.times(currentPriceDec.minus(avgPriceDec));

    const position = await prisma.position.create({
      data: {
        portfolioId,
        symbol,
        assetType,
        quantity: quantityDec,
        avgPrice: avgPriceDec,
        currentPrice: currentPriceDec,
        marketValue,
        unrealizedPnL,
        realizedPnL: new Decimal(0),
        optionType,
        strikePrice: strikePrice ? new Decimal(strikePrice) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        delta: delta ? new Decimal(delta) : null,
        gamma: gamma ? new Decimal(gamma) : null,
        vega: vega ? new Decimal(vega) : null,
        theta: theta ? new Decimal(theta) : null,
      },
    });

    // Update portfolio totals
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        totalValue: {
          increment: marketValue,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: position,
      message: 'Position created successfully',
    });
  }),

  /**
   * Update position
   * PUT /api/positions/:id
   */
  updatePosition: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const { quantity, currentPrice, delta, gamma, vega, theta } = req.body;

    // Verify position ownership
    const existing = await prisma.position.findFirst({
      where: {
        id,
        portfolio: {
          userId,
        },
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Position not found or access denied',
      });
      return;
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = new Decimal(quantity);
    if (currentPrice !== undefined) {
      const currentPriceDec = new Decimal(currentPrice);
      updateData.currentPrice = currentPriceDec;
      const qty = quantity !== undefined ? new Decimal(quantity) : existing.quantity;
      updateData.marketValue = qty.times(currentPriceDec);
      updateData.unrealizedPnL = qty.times(currentPriceDec.minus(existing.avgPrice));
    }
    if (delta !== undefined) updateData.delta = new Decimal(delta);
    if (gamma !== undefined) updateData.gamma = new Decimal(gamma);
    if (vega !== undefined) updateData.vega = new Decimal(vega);
    if (theta !== undefined) updateData.theta = new Decimal(theta);

    const position = await prisma.position.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: position,
      message: 'Position updated successfully',
    });
  }),

  /**
   * Close position
   * POST /api/positions/:id/close
   */
  closePosition: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const { closePrice } = req.body;

    // Verify position ownership
    const position = await prisma.position.findFirst({
      where: {
        id,
        portfolio: {
          userId,
        },
      },
    });

    if (!position) {
      res.status(404).json({
        success: false,
        error: 'Position not found or access denied',
      });
      return;
    }

    if (position.isClosed) {
      res.status(400).json({
        success: false,
        error: 'Position is already closed',
      });
      return;
    }

    const closePriceDec = new Decimal(closePrice);
    const realizedPnL = position.quantity.times(closePriceDec.minus(position.avgPrice));

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: {
        isClosed: true,
        closedAt: new Date(),
        currentPrice: closePriceDec,
        realizedPnL,
        unrealizedPnL: new Decimal(0),
      },
    });

    // Update portfolio P&L
    await prisma.portfolio.update({
      where: { id: position.portfolioId },
      data: {
        pnl: {
          increment: realizedPnL,
        },
      },
    });

    res.json({
      success: true,
      data: updatedPosition,
      message: 'Position closed successfully',
    });
  }),

  /**
   * Delete position
   * DELETE /api/positions/:id
   */
  deletePosition: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Verify position ownership
    const position = await prisma.position.findFirst({
      where: {
        id,
        portfolio: {
          userId,
        },
      },
    });

    if (!position) {
      res.status(404).json({
        success: false,
        error: 'Position not found or access denied',
      });
      return;
    }

    await prisma.position.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Position deleted successfully',
    });
  }),
};
