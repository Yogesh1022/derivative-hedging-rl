// ═══════════════════════════════════════════════════════════════
// REALTIME CONTROLLER - Trigger real-time events
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import redisService, { CHANNELS } from '../services/redis.service';
import logger from '../config/logger';

/**
 * Publish price update
 */
export const publishPriceUpdate = async (req: Request, res: Response) => {
  try {
    const { symbol, price, change, volume, timestamp } = req.body;

    await redisService.publish(CHANNELS.PRICE_UPDATE, {
      symbol,
      price,
      change,
      volume,
      timestamp: timestamp || new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Price update published',
    });
  } catch (error: any) {
    logger.error('Error publishing price update:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Publish portfolio update
 */
export const publishPortfolioUpdate = async (req: Request, res: Response) => {
  try {
    const { portfolioId, totalValue, pnl, positions } = req.body;

    await redisService.publish(CHANNELS.PORTFOLIO_UPDATE, {
      portfolioId,
      totalValue,
      pnl,
      positions,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Portfolio update published',
    });
  } catch (error: any) {
    logger.error('Error publishing portfolio update:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Publish trade execution
 */
export const publishTradeExecuted = async (req: Request, res: Response) => {
  try {
    const { userId, tradeId, symbol, side, quantity, price, portfolioId } = req.body;

    await redisService.publish(CHANNELS.TRADE_EXECUTED, {
      userId,
      tradeId,
      symbol,
      side,
      quantity,
      price,
      portfolioId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Trade execution published',
    });
  } catch (error: any) {
    logger.error('Error publishing trade execution:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Publish risk breach alert
 */
export const publishRiskBreach = async (req: Request, res: Response) => {
  try {
    const { userId, portfolioId, breachType, threshold, currentValue, severity } = req.body;

    await redisService.publish(CHANNELS.RISK_BREACH, {
      userId,
      portfolioId,
      breachType,
      threshold,
      currentValue,
      severity,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Risk breach alert published',
    });
  } catch (error: any) {
    logger.error('Error publishing risk breach:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Publish new alert
 */
export const publishAlert = async (req: Request, res: Response) => {
  try {
    const { userId, alertId, type, message, severity, data } = req.body;

    await redisService.publish(CHANNELS.ALERT_NEW, {
      userId,
      alertId,
      type,
      message,
      severity,
      data,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Alert published',
    });
  } catch (error: any) {
    logger.error('Error publishing alert:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get WebSocket status
 */
export const getRealtimeStatus = async (req: Request, res: Response) => {
  try {
    const websocketService = require('../services/websocket.service').default;
    
    res.json({
      success: true,
      data: {
        redis: {
          connected: redisService.getStatus(),
        },
        websocket: {
          connected: websocketService.getConnectedCount(),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Error getting realtime status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
