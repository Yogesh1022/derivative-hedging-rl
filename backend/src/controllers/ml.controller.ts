// ═══════════════════════════════════════════════════════════════
// ML CONTROLLER
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { mlService } from '../services/ml.service';
import prisma from '../config/database';
import { AuditAction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const mlController = {
  /**
   * Get ML service health status
   * GET /api/ml/health
   */
  healthCheck: asyncHandler(async (_req: Request, res: Response) => {
    const isHealthy = await mlService.healthCheck();

    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      },
    });
  }),

  /**
   * Get model information
   * GET /api/ml/model-info
   */
  getModelInfo: asyncHandler(async (_req: Request, res: Response) => {
    const modelInfo = await mlService.getModelInfo();

    res.json({
      success: true,
      data: modelInfo,
    });
  }),

  /**
   * Predict risk for a portfolio
   * POST /api/ml/predict
   */
  predictRisk: asyncHandler(async (req: Request, res: Response) => {
    const { portfolioId } = req.body;
    const userId = req.user!.id;

    // Get portfolio with positions
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
      include: {
        positions: {
          where: { isClosed: false },
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

    // Prepare ML request
    const mlRequest = {
      portfolioId: portfolio.id,
      portfolioData: {
        totalValue: Number(portfolio.totalValue),
        positions: portfolio.positions.map((pos) => ({
          symbol: pos.symbol,
          quantity: Number(pos.quantity),
          price: Number(pos.currentPrice),
          delta: pos.delta ? Number(pos.delta) : undefined,
          gamma: pos.gamma ? Number(pos.gamma) : undefined,
          vega: pos.vega ? Number(pos.vega) : undefined,
          theta: pos.theta ? Number(pos.theta) : undefined,
        })),
      },
    };

    // Get ML prediction
    const prediction = await mlService.predictRisk(mlRequest);

    // Update portfolio with prediction results
    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: {
        riskScore: prediction.riskScore,
        volatility: new Decimal(prediction.volatility),
        var95: new Decimal(prediction.var95),
        var99: new Decimal(prediction.var99),
        sharpeRatio: new Decimal(prediction.sharpeRatio),
        mlRecommendation: prediction.recommendation,
        lastPrediction: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.ML_PREDICTION_REQUESTED,
        resource: 'Portfolio',
        resourceId: portfolio.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          riskScore: prediction.riskScore,
          confidence: prediction.confidence,
        },
      },
    });

    res.json({
      success: true,
      data: prediction,
      message: 'Risk prediction completed',
    });
  }),

  /**
   * Get hedging recommendation
   * POST /api/ml/recommend-hedge
   */
  getHedgingRecommendation: asyncHandler(async (req: Request, res: Response) => {
    const { portfolioId } = req.body;
    const userId = req.user!.id;

    // Get portfolio
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
      include: {
        positions: {
          where: { isClosed: false },
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

    // Prepare portfolio data
    const portfolioData = {
      totalValue: Number(portfolio.totalValue),
      delta: Number(portfolio.totalDelta || 0),
      gamma: Number(portfolio.totalGamma || 0),
      vega: Number(portfolio.totalVega || 0),
      positions: portfolio.positions.map((pos) => ({
        symbol: pos.symbol,
        quantity: Number(pos.quantity),
        delta: Number(pos.delta || 0),
      })),
    };

    // Get recommendation
    const recommendation = await mlService.getHedgingRecommendation(portfolioData);

    res.json({
      success: true,
      data: recommendation,
      message: 'Hedging recommendation generated',
    });
  }),

  /**
   * Batch predict for multiple portfolios (Risk Manager / Admin)
   * POST /api/ml/batch-predict
   */
  batchPredict: asyncHandler(async (req: Request, res: Response) => {
    const { portfolioIds } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Risk managers can predict for all portfolios, others only their own
    const whereClause =
      userRole === 'RISK_MANAGER' || userRole === 'ADMIN'
        ? { id: { in: portfolioIds } }
        : { id: { in: portfolioIds }, userId };

    // Get portfolios
    const portfolios = await prisma.portfolio.findMany({
      where: whereClause,
      include: {
        positions: {
          where: { isClosed: false },
        },
      },
    });

    if (portfolios.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No portfolios found',
      });
      return;
    }

    // Prepare ML requests
    const mlRequests = portfolios.map((portfolio) => ({
      portfolioId: portfolio.id,
      portfolioData: {
        totalValue: Number(portfolio.totalValue),
        positions: portfolio.positions.map((pos) => ({
          symbol: pos.symbol,
          quantity: Number(pos.quantity),
          price: Number(pos.currentPrice),
          delta: pos.delta ? Number(pos.delta) : undefined,
          gamma: pos.gamma ? Number(pos.gamma) : undefined,
          vega: pos.vega ? Number(pos.vega) : undefined,
          theta: pos.theta ? Number(pos.theta) : undefined,
        })),
      },
    }));

    // Get batch predictions
    const predictions = await mlService.batchPredictRisk(mlRequests);

    // Update portfolios
    await Promise.all(
      predictions.map((pred, index) =>
        prisma.portfolio.update({
          where: { id: portfolios[index].id },
          data: {
            riskScore: pred.riskScore,
            volatility: new Decimal(pred.volatility),
            var95: new Decimal(pred.var95),
            var99: new Decimal(pred.var99),
            sharpeRatio: new Decimal(pred.sharpeRatio),
            mlRecommendation: pred.recommendation,
            lastPrediction: new Date(),
          },
        })
      )
    );

    res.json({
      success: true,
      data: predictions,
      message: `Batch prediction completed for ${predictions.length} portfolios`,
    });
  }),
};
