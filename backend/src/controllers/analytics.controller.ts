// ═══════════════════════════════════════════════════════════════
// ANALYTICS CONTROLLER
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export const analyticsController = {
  /**
   * Get dashboard analytics
   * GET /api/analytics/dashboard
   */
  getDashboardStats: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const [portfolios, totalTrades, openPositions, unreadAlerts] = await Promise.all([
      prisma.portfolio.findMany({
        where: { userId, isActive: true },
        select: {
          totalValue: true,
          pnl: true,
          riskScore: true,
        },
      }),
      prisma.trade.count({
        where: { userId },
      }),
      prisma.position.count({
        where: {
          portfolio: { userId },
          isClosed: false,
        },
      }),
      prisma.riskAlert.count({
        where: { userId, isRead: false },
      }),
    ]);

    // Calculate aggregated metrics
    let totalValue = new Decimal(0);
    let totalPnL = new Decimal(0);
    let avgRiskScore = 0;

    portfolios.forEach((p) => {
      totalValue = totalValue.plus(p.totalValue);
      totalPnL = totalPnL.plus(p.pnl);
      if (p.riskScore) avgRiskScore += p.riskScore;
    });

    if (portfolios.length > 0) {
      avgRiskScore = Math.round(avgRiskScore / portfolios.length);
    }

    res.json({
      success: true,
      data: {
        portfolioCount: portfolios.length,
        totalValue: totalValue.toNumber(),
        totalPnL: totalPnL.toNumber(),
        avgRiskScore,
        openPositions,
        totalTrades,
        unreadAlerts,
      },
    });
  }),

  /**
   * Get portfolio analytics
   * GET /api/analytics/portfolio/:id
   */
  getPortfolioAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const { period = '30D' } = req.query;

    // Verify portfolio ownership
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

    // Calculate date range based on period
    const now = new Date();
    const dateMap: { [key: string]: Date } = {
      '1D': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7D': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30D': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '3M': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1Y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
    const startDate = dateMap[period as string] || dateMap['30D'];

    // Get historical data
    const history = await prisma.portfolioHistory.findMany({
      where: {
        portfolioId: id,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Get positions analytics
    const positions = await prisma.position.findMany({
      where: { portfolioId: id, isClosed: false },
      select: {
        symbol: true,
        assetType: true,
        marketValue: true,
        unrealizedPnL: true,
      },
    });

    // Group by asset type
    const byAssetType: { [key: string]: { value: number; count: number } } = {};
    positions.forEach((p) => {
      if (!byAssetType[p.assetType]) {
        byAssetType[p.assetType] = { value: 0, count: 0 };
      }
      byAssetType[p.assetType].value += Number(p.marketValue);
      byAssetType[p.assetType].count += 1;
    });

    res.json({
      success: true,
      data: {
        portfolio: {
          id: portfolio.id,
          name: portfolio.name,
          totalValue: portfolio.totalValue,
          pnl: portfolio.pnl,
          riskScore: portfolio.riskScore,
        },
        history: history.map((h) => ({
          timestamp: h.timestamp,
          totalValue: h.totalValue,
          pnl: h.pnl,
          riskScore: h.riskScore,
          volatility: h.volatility,
          var95: h.var95,
        })),
        positionBreakdown: byAssetType,
        positionCount: positions.length,
      },
    });
  }),

  /**
   * Get risk overview (Risk Manager/Admin)
   * GET /api/analytics/risk-overview
   */
  getRiskOverview: asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalPortfolios,
      highRiskPortfolios,
      criticalAlerts,
      recentTrades,
      avgRiskScore,
    ] = await Promise.all([
      prisma.portfolio.count({ where: { isActive: true } }),
      prisma.portfolio.count({
        where: {
          isActive: true,
          riskScore: { gte: 80 },
        },
      }),
      prisma.riskAlert.count({
        where: {
          severity: 'CRITICAL',
          isRead: false,
        },
      }),
      prisma.trade.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
      }),
      prisma.portfolio.aggregate({
        where: { isActive: true, riskScore: { not: null } },
        _avg: {
          riskScore: true,
        },
      }),
    ]);

    // Get top risky portfolios
    const riskyPortfolios = await prisma.portfolio.findMany({
      where: {
        isActive: true,
        riskScore: { not: null },
      },
      orderBy: { riskScore: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalPortfolios,
          highRiskPortfolios,
          avgRiskScore: Math.round(avgRiskScore._avg.riskScore || 0),
          criticalAlerts,
          recentTrades24h: recentTrades,
        },
        riskyPortfolios: riskyPortfolios.map((p) => ({
          id: p.id,
          name: p.name,
          riskScore: p.riskScore,
          totalValue: p.totalValue,
          var95: p.var95,
          user: p.user,
        })),
      },
    });
  }),

  /**
   * Get performance metrics
   * GET /api/analytics/performance
   */
  getPerformanceMetrics: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { period = '30D' } = req.query;

    // Calculate date range
    const now = new Date();
    const dateMap: { [key: string]: Date } = {
      '1D': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7D': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30D': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '3M': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1Y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
    const startDate = dateMap[period as string] || dateMap['30D'];

    // Get trades in period
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        status: 'EXECUTED',
      },
      select: {
        pnl: true,
        side: true,
      },
    });

    // Calculate metrics
    let totalPnL = new Decimal(0);
    let winningTrades = 0;
    let losingTrades = 0;

    trades.forEach((t) => {
      if (t.pnl) {
        totalPnL = totalPnL.plus(t.pnl);
        if (Number(t.pnl) > 0) winningTrades++;
        else if (Number(t.pnl) < 0) losingTrades++;
      }
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Get current portfolio metrics
    const portfolios = await prisma.portfolio.findMany({
      where: { userId, isActive: true },
      select: {
        sharpeRatio: true,
        maxDrawdown: true,
        volatility: true,
      },
    });

    let avgSharpe = new Decimal(0);
    let avgDrawdown = new Decimal(0);
    let avgVolatility = new Decimal(0);
    let count = 0;

    portfolios.forEach((p) => {
      if (p.sharpeRatio) {
        avgSharpe = avgSharpe.plus(p.sharpeRatio);
        count++;
      }
      if (p.maxDrawdown) avgDrawdown = avgDrawdown.plus(p.maxDrawdown);
      if (p.volatility) avgVolatility = avgVolatility.plus(p.volatility);
    });

    if (count > 0) {
      avgSharpe = avgSharpe.dividedBy(count);
      avgDrawdown = avgDrawdown.dividedBy(count);
      avgVolatility = avgVolatility.dividedBy(count);
    }

    res.json({
      success: true,
      data: {
        period,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: Number(winRate.toFixed(2)),
        totalPnL: totalPnL.toNumber(),
        sharpeRatio: avgSharpe.toNumber(),
        maxDrawdown: avgDrawdown.toNumber(),
        volatility: avgVolatility.toNumber(),
      },
    });
  }),
};
