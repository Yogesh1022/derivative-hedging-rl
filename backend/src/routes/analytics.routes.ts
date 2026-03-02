// ═══════════════════════════════════════════════════════════════
// ANALYTICS & STATISTICS ROUTES
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { param, query } from 'express-validator';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate, requireRiskManager } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics for current user
 * @access  Private
 */
router.get('/dashboard', authenticate, analyticsController.getDashboardStats);

/**
 * @route   GET /api/analytics/portfolio/:id
 * @desc    Get portfolio analytics
 * @access  Private
 */
router.get(
  '/portfolio/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid portfolio ID required'),
    query('period').optional().isIn(['1D', '7D', '30D', '3M', '1Y']),
  ]),
  analyticsController.getPortfolioAnalytics
);

/**
 * @route   GET /api/analytics/risk-overview
 * @desc    Get risk overview (Risk Manager/Admin)
 * @access  Private (Risk Manager/Admin)
 */
router.get(
  '/risk-overview',
  authenticate,
  requireRiskManager,
  analyticsController.getRiskOverview
);

/**
 * @route   GET /api/analytics/performance
 * @desc    Get performance metrics
 * @access  Private
 */
router.get(
  '/performance',
  authenticate,
  validate([query('period').optional().isIn(['1D', '7D', '30D', '3M', '1Y'])]),
  analyticsController.getPerformanceMetrics
);

export default router;
