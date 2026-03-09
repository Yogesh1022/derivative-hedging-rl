// ═══════════════════════════════════════════════════════════════
// REALTIME ROUTES - WebSocket and SSE management endpoints
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as realtimeController from '../controllers/realtime.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/realtime/price-update
 * @desc    Publish price update (for testing/admin)
 * @access  Private
 */
router.post('/price-update', realtimeController.publishPriceUpdate);

/**
 * @route   POST /api/realtime/portfolio-update
 * @desc    Publish portfolio update
 * @access  Private
 */
router.post('/portfolio-update', realtimeController.publishPortfolioUpdate);

/**
 * @route   POST /api/realtime/trade-executed
 * @desc    Publish trade execution notification
 * @access  Private
 */
router.post('/trade-executed', realtimeController.publishTradeExecuted);

/**
 * @route   POST /api/realtime/risk-breach
 * @desc    Publish risk breach alert
 * @access  Private
 */
router.post('/risk-breach', realtimeController.publishRiskBreach);

/**
 * @route   POST /api/realtime/alert
 * @desc    Publish generic alert
 * @access  Private
 */
router.post('/alert', realtimeController.publishAlert);

/**
 * @route   GET /api/realtime/status
 * @desc    Get real-time service status
 * @access  Private
 */
router.get('/status', realtimeController.getRealtimeStatus);

export default router;
